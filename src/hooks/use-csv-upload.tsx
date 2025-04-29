import { useState } from "react";
import { toast } from "react-toastify";
import fuzzyMatchFields from "../utils/fuzzy-column-mapping";

export type MappingTemplate = {
  id: string;
  name: string;
  mappings: Record<string, string>;
  defaultValues: Record<string, string>;
};

export type ColumnMapping = {
  csvHeader: string;
  crmField: string | null;
};

export type UploadStep = "upload" | "mapping" | "preview" | "confirmation";

export type ValidationError = {
  row: number;
  column: string;
  message: string;
};

export type CSVRow = Record<string, string>;

export type TransformationType = "none" | "trim" | "uppercase" | "lowercase";

export type FieldTransformation = {
  field: string;
  type: TransformationType;
};

const useCSVUpload = () => {
  const [currentStep, setCurrentStep] = useState<UploadStep>("upload");
  const [csvData, setCSVData] = useState<CSVRow[]>([]);
  const [csvHeaders, setCSVHeaders] = useState<string[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [defaultValues, setDefaultValues] = useState<Record<string, string>>(
    {},
  );
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    [],
  );
  const [savedTemplates, setSavedTemplates] = useState<MappingTemplate[]>([]);
  const [currentTemplate, setCurrentTemplate] = useState<string | null>(null);
  const [transformations, setTransformations] = useState<FieldTransformation[]>(
    [],
  );
  const [duplicates, setDuplicates] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(30);

  // CRM fields that can be mapped to
  const [crmFields] = useState<string[]>([
    "FullName",
    "Email",
    "Contact",
    "Gender",
    "Qualification",
    "SchoolOrCollegeName",
    "LeadSource",
    "InterestedCourse",
    "Address",
    "City",
    "Street",
    "State",
    "ZipCode",
    "Country",
    "Notes",
  ]);

  // Required fields for validation
  const [requiredFields] = useState<string[]>(["FullName", "Contact"]);

  const handleFileSelect = (data: CSVRow[], headers: string[]) => {
    setCSVData(data);
    setCSVHeaders(headers);

    // Generate initial column mappings
    const initialMappings = headers.map((header) => {
      // Try to auto-match headers to CRM fields based on similarity
      const normalizedHeader = header.toLowerCase().replace(/[\s_-]/g, "");

      const matchedField = crmFields.find(
        (field) =>
          field.toLowerCase() === normalizedHeader ||
          normalizedHeader.includes(field.toLowerCase()),
      );

      return {
        csvHeader: header,
        crmField: matchedField || null,
      };
    });

    setColumnMappings(initialMappings);
    setCurrentStep("mapping");
  };

  const updateMapping = (csvHeader: string, crmField: string | null) => {
    setColumnMappings((prev) =>
      prev.map((mapping) =>
        mapping.csvHeader === csvHeader ? { ...mapping, crmField } : mapping,
      ),
    );
  };

  // Auto-mapping function to suggest mappings based on CSV headers
  const autoMappings = (
    csvHeaders: Array<string>,
    crmFields: Array<string>,
  ) => {
    // console.log("csv Headers", csvHeaders);
    // console.log("crm Fields", crmFields);
    const updatedMappings = csvHeaders?.map((header) => {
      // console.log("header", header,"crmfields", crmFields);
      const match = fuzzyMatchFields(header, crmFields);
      // console.log("match", match);
      return {
        csvHeader: header,
        crmField: match.field,
      };
    });

    // console.log("updatedMappings", updatedMappings);

    setColumnMappings(updatedMappings);

    toast.success("Auto-mapping completed successfully!");
    setCurrentStep("mapping");
  };

  const updateDefaultValue = (field: string, value: string) => {
    setDefaultValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addTransformation = (field: string, type: TransformationType) => {
    // Remove any existing transformation for this field
    const filteredTransformations = transformations.filter(
      (t) => t.field !== field,
    );

    // Add new transformation if it's not 'none'
    if (type !== "none") {
      setTransformations([...filteredTransformations, { field, type }]);
    } else {
      setTransformations(filteredTransformations);
    }
  };

  const saveTemplate = (name: string) => {
    const newTemplate: MappingTemplate = {
      id: Date.now().toString(),
      name,
      mappings: columnMappings.reduce(
        (acc, { csvHeader, crmField }) => {
          if (crmField) {
            acc[csvHeader] = crmField;
          }
          return acc;
        },
        {} as Record<string, string>,
      ),
      defaultValues,
    };

    setSavedTemplates([...savedTemplates, newTemplate]);
    setCurrentTemplate(newTemplate.id);
  };

  const loadTemplate = (templateId: string) => {
    const template = savedTemplates.find((t) => t.id === templateId);
    if (!template) return;

    // Apply template mappings
    const updatedMappings = columnMappings.map((mapping) => ({
      csvHeader: mapping.csvHeader,
      crmField: template.mappings[mapping.csvHeader] || null,
    }));

    setColumnMappings(updatedMappings);
    setDefaultValues(template.defaultValues);
    setCurrentTemplate(templateId);
  };

  const validateData = () => {
    setLoading(true);
    const errors: ValidationError[] = [];
    const potentialDuplicates = new Set<number>();

    // Create a map for email uniqueness check
    const emailMap = new Map<string, number>();

    csvData.forEach((row, rowIndex) => {
      // Map the data using current mappings
      const mappedRow: Record<string, string> = {};

      columnMappings.forEach(({ csvHeader, crmField }) => {
        if (crmField) {
          let value = row[csvHeader] || "";

          // Apply transformations
          const transformation = transformations.find(
            (t) => t.field === crmField,
          );
          if (transformation) {
            switch (transformation.type) {
              case "trim":
                value = value.trim();
                break;
              case "uppercase":
                value = value.toUpperCase();
                break;
              case "lowercase":
                value = value.toLowerCase();
                break;
            }
          }

          mappedRow[crmField] = value;
        }
      });

      // Add default values for unmapped fields
      Object.entries(defaultValues).forEach(([field, value]) => {
        if (!mappedRow[field]) {
          mappedRow[field] = value;
        }
      });

      // Check for required fields
      requiredFields.forEach((field) => {
        if (!mappedRow[field]) {
          errors.push({
            row: rowIndex,
            column: field,
            message: `${field} is required`,
          });
        }
      });

      // Check for email duplicates
      if (mappedRow.email) {
        const email = mappedRow.email.toLowerCase();
        if (emailMap.has(email)) {
          potentialDuplicates.add(rowIndex);
          potentialDuplicates.add(emailMap.get(email)!);
        } else {
          emailMap.set(email, rowIndex);
        }
      }
    });

    setValidationErrors(errors);
    setDuplicates(Array.from(potentialDuplicates));
    setLoading(false);

    if (errors.length === 0) {
      setCurrentStep("preview");
    }

    // console.log("Validation errors:", errors);

    return errors.length === 0;
  };

  const processImport = async () => {
    setLoading(true);
    try {
      // In a real application, you would send the data to your backend
      // This is a mock implementation
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setCurrentStep("confirmation");
      return true;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // console.error("Import failed:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setCurrentStep("upload");
    setCSVData([]);
    setCSVHeaders([]);
    setColumnMappings([]);
    setDefaultValues({});
    setValidationErrors([]);
    setDuplicates([]);
    setCurrentTemplate(null);
    setCurrentPage(1);
  };

  const goToStep = (step: UploadStep) => {
    setCurrentStep(step);
  };

  // Pagination helpers
  const paginatedData = () => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return csvData.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(csvData.length / rowsPerPage);

  return {
    currentStep,
    csvData,
    csvHeaders,
    columnMappings,
    defaultValues,
    validationErrors,
    savedTemplates,
    currentTemplate,
    transformations,
    duplicates,
    loading,
    crmFields,
    requiredFields,
    currentPage,
    rowsPerPage,
    totalPages,
    paginatedData,
    handleFileSelect,
    updateMapping,
    updateDefaultValue,
    addTransformation,
    saveTemplate,
    loadTemplate,
    validateData,
    processImport,
    reset,
    goToStep,
    setCurrentPage,
    setRowsPerPage,
    autoMappings,
  };
};

export default useCSVUpload;
