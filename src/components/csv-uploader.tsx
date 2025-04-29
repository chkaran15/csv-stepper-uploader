import React, { JSX, useState, useRef } from "react";
import {
  Check,
  Upload,
  LayoutGrid,
  Eye,
  FileCheck2,
  CheckCircle,
  Info,
  HelpCircle,
  X,
  AlertCircle,
} from "lucide-react";
import Papa from "papaparse";

// Type definitions
type StepKey = "upload" | "mapping" | "preview" | "confirmation";

interface Step {
  key: StepKey;
  icon: React.ReactNode;
  label: string;
  title: string;
}

interface CsvColumn {
  csvColumn: string;
  crmField: string;
  confidence?: number;
}

// Sample data and records
interface SampleData {
  [key: string]: string;
}

// Define Papa parse results type to fix the type error
interface PapaParseResult {
  data: SampleData[];
  errors: unknown[];
  meta: {
    delimiter: string;
    linebreak: string;
    aborted: boolean;
    truncated: boolean;
    cursor: number;
    fields?: string[];
  };
}

const CSVUploadStepper: React.FC = () => {
  // Required fields
  const requiredFields: string[] = ["name", "phoneNumber"];

  // All fields for selection
  const allFields: string[] = [
    // Required fields
    "name",
    "phoneNumber",
    // Optional fields
    "email",
    "secondaryPhoneNumber",
    "dateOfBirth",
    "gender",
    "address1",
    "guardianName",
    "guardianPhoneNumber",
    "guardianEmail",
    "guardianRelation",
    "guardianAddress",
    "qualification",
    "percentage",
    "schoolOrCollegeName",
    "interestedCourseId",
    "faculty",
    "shiftId",
    "courseLevelId",
    "courseIntakeId",
    "intake",
    "address2",
    "city",
    "street",
    "state",
    "zipCode",
    "country",
    "leadType",
    "leadSourceType",
    "details",
    "discoverySource",
  ];

  // State management
  const [currentStep, setCurrentStep] = useState<StepKey>("upload");
  const [showOptionalFields, setShowOptionalFields] = useState<boolean>(false);
  const [fieldSearchTerm, setFieldSearchTerm] = useState<string>("");
  const [selectedFields, setSelectedFields] =
    useState<string[]>(requiredFields);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // CSV file data states
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<SampleData[]>([]);
  const [mappings, setMappings] = useState<CsvColumn[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Steps configuration
  const steps: Step[] = [
    {
      key: "upload",
      icon: <Upload size={16} />,
      label: "Upload CSV",
      title: "Upload CSV File",
    },
    {
      key: "mapping",
      icon: <LayoutGrid size={16} />,
      label: "Map Columns",
      title: "Map CSV Columns to CRM Fields",
    },
    {
      key: "preview",
      icon: <Eye size={16} />,
      label: "Preview Data",
      title: "Preview Data",
    },
    {
      key: "confirmation",
      icon: <FileCheck2 size={16} />,
      label: "Confirmation",
      title: "Confirmation",
    },
  ];

  // Get numeric step index
  const getStepIndex = (stepKey: StepKey): number => {
    const index = steps.findIndex((step) => step.key === stepKey);
    return index !== -1 ? index + 1 : 1;
  };

  // Toggle field selection
  const toggleFieldSelection = (field: string): void => {
    if (selectedFields.includes(field)) {
      // Don't allow deselecting required fields
      if (requiredFields.includes(field)) {
        return;
      }
      setSelectedFields(selectedFields.filter((f) => f !== field));
    } else {
      setSelectedFields([...selectedFields, field]);
    }
  };

  // Filtered fields based on search term
  const filteredFields = allFields.filter(
    (field) =>
      !requiredFields.includes(field) &&
      field.toLowerCase().includes(fieldSearchTerm.toLowerCase()),
  );

  // Navigation functions
  const goToNextStep = (): void => {
    const currentIndex = steps.findIndex((step) => step.key === currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].key);
      setSuccessMessage(null);
      setErrorMessage(null);
    }
  };

  const goToPreviousStep = (): void => {
    const currentIndex = steps.findIndex((step) => step.key === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].key);
      setSuccessMessage(null);
      setErrorMessage(null);
    }
  };

  // Fuzzy match function to find best matching field
  const fuzzyMatch = (
    csvColumn: string,
    crmFields: string[],
  ): { field: string; confidence: number } => {
    // Normalize strings for comparison
    const normalizeString = (str: string) =>
      str
        .toLowerCase()
        .replace(/[_-\s]/g, "") // Remove underscores, hyphens, spaces
        .replace(/[^a-z0-9]/gi, ""); // Remove non-alphanumeric chars

    const normalizedCsvColumn = normalizeString(csvColumn);

    let bestMatch = { field: "", confidence: 0 };

    for (const field of crmFields) {
      const normalizedField = normalizeString(field);

      // Direct match gets highest confidence
      if (normalizedCsvColumn === normalizedField) {
        return { field, confidence: 1.0 };
      }

      // Check if CSV column contains the field or vice versa
      if (
        normalizedCsvColumn.includes(normalizedField) ||
        normalizedField.includes(normalizedCsvColumn)
      ) {
        const longerLength = Math.max(
          normalizedCsvColumn.length,
          normalizedField.length,
        );
        const shorterLength = Math.min(
          normalizedCsvColumn.length,
          normalizedField.length,
        );
        const confidence = shorterLength / longerLength;

        if (confidence > bestMatch.confidence) {
          bestMatch = { field, confidence };
        }
      }

      // Check for partial matches
      let matchCount = 0;
      for (let i = 0; i < normalizedField.length; i++) {
        if (normalizedCsvColumn.includes(normalizedField[i])) {
          matchCount++;
        }
      }

      const partialConfidence = matchCount / normalizedField.length;
      if (partialConfidence > bestMatch.confidence) {
        bestMatch = { field, confidence: partialConfidence };
      }
    }

    // Only return matches above a certain threshold
    return bestMatch.confidence > 0.4
      ? bestMatch
      : { field: "", confidence: 0 };
  };

  // Auto map CSV columns to CRM fields using fuzzy matching
  const autoMapFields = (): void => {
    if (csvHeaders.length === 0) {
      setErrorMessage("No CSV headers found. Please upload a valid CSV file.");
      return;
    }

    const newMappings: CsvColumn[] = [];
    let mappedCount = 0;

    // First try to map required fields
    for (const field of requiredFields) {
      for (const csvColumn of csvHeaders) {
        const match = fuzzyMatch(csvColumn, [field]);

        if (match.confidence > 0.5) {
          newMappings.push({
            csvColumn: csvColumn,
            crmField: field,
            confidence: match.confidence,
          });
          mappedCount++;
          break;
        }
      }
    }

    // Then try to map optional fields that are selected
    const optionalSelectedFields = selectedFields.filter(
      (field) => !requiredFields.includes(field),
    );

    for (const csvColumn of csvHeaders) {
      // Skip already mapped columns
      if (newMappings.some((m) => m.csvColumn === csvColumn)) continue;

      const match = fuzzyMatch(csvColumn, optionalSelectedFields);
      if (match.confidence > 0) {
        newMappings.push({
          csvColumn: csvColumn,
          crmField: match.field,
          confidence: match.confidence,
        });
        mappedCount++;
      }
    }

    setMappings(newMappings);
    setSuccessMessage(`Auto-mapped ${mappedCount} fields`);
  };

  // Handle CSV file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    setErrorMessage(null);

    if (!files || files.length === 0) {
      setErrorMessage("No file selected");
      return;
    }

    const file = files[0];
    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      setErrorMessage("Please upload a valid CSV file");
      return;
    }

    setCsvFile(file);

    // Parse CSV headers and sample data
    Papa.parse(file, {
      header: true,
      preview: 5, // Parse just a few rows for preview
      skipEmptyLines: true,
      complete: (results: PapaParseResult) => {
        if (results.data && results.data.length > 0) {
          // Get headers safely with proper type checking
          let headers: string[] = [];
          if (results.meta.fields && results.meta.fields.length > 0) {
            headers = results.meta.fields;
          } else if (results.data.length > 0) {
            headers = Object.keys(results.data[0]);
          }

          setCsvHeaders(headers);
          setCsvData(results.data as SampleData[]);

          // Move to mapping step
          setCurrentStep("mapping");

          // Auto map after a short delay
          setTimeout(autoMapFields, 500);
        } else {
          setErrorMessage("The CSV file appears to be empty or invalid");
        }
      },
      error: (error) => {
        setErrorMessage(`Error parsing CSV: ${error.message}`);
      },
    });
  };

  // Handle mapping update
  const updateMapping = (csvColumn: string, crmField: string) => {
    const updatedMappings = [...mappings];
    const existingIndex = updatedMappings.findIndex(
      (m) => m.csvColumn === csvColumn,
    );

    if (existingIndex >= 0) {
      // Update existing mapping
      updatedMappings[existingIndex].crmField = crmField;
    } else {
      // Add new mapping
      updatedMappings.push({ csvColumn, crmField });
    }

    setMappings(updatedMappings);
  };

  // Handle final submission
  const handleSubmit = (): void => {
    // In a real app, you would process the CSV data with mappings here
    // For demo purposes, we'll just show the confirmation screen
    setCurrentStep("confirmation");
    setSuccessMessage(`Successfully imported ${csvData.length} records!`);
  };

  // Check if all required fields are mapped
  const areRequiredFieldsMapped = (): boolean => {
    return requiredFields.every((field) =>
      mappings.some((mapping) => mapping.crmField === field),
    );
  };

  // Render stepper header
  const renderStepperHeader = (): JSX.Element => {
    return (
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">
            {steps.find((step) => step.key === currentStep)?.title}
          </h2>
          <div className="flex items-center">
            {steps.map((step, index) => (
              <React.Fragment key={step.key}>
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    currentStep === step.key
                      ? "bg-blue-600 text-white"
                      : getStepIndex(currentStep) > index + 1
                        ? "bg-green-600 text-white"
                        : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {getStepIndex(currentStep) > index + 1 ? (
                    <Check size={16} />
                  ) : (
                    step.icon
                  )}
                </div>
                <div className="text-sm mx-2">{step.label}</div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-8 h-0.5 mx-2 ${
                      getStepIndex(currentStep) > index + 1
                        ? "bg-green-600"
                        : "bg-gray-200"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {successMessage && (
          <div className="mb-4 p-3 rounded bg-green-50 border border-green-200 text-green-700 flex items-start">
            <CheckCircle size={20} className="mr-2 mt-0.5 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-700 flex items-start">
            <AlertCircle size={20} className="mr-2 mt-0.5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    );
  };

  // Render upload step
  const renderUploadStep = (): JSX.Element => {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center w-full">
          <label
            htmlFor="csv-upload"
            className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 border-gray-300"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload size={40} className="text-gray-400 mb-4" />
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Click to upload</span> or drag
                and drop
              </p>
              <p className="text-xs text-gray-500">CSV files only</p>
              {csvFile && (
                <div className="mt-3 text-sm text-blue-600">
                  Selected: {csvFile.name}
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              id="csv-upload"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </div>

        <div className="mt-6 flex items-start">
          <Info size={20} className="text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-gray-600">
            <p className="mb-2">
              Your CSV file should contain the following required fields:
            </p>
            <ul className="list-disc list-inside mb-2">
              {requiredFields.map((field) => (
                <li key={field}>{field}</li>
              ))}
            </ul>
            <p>
              Don't worry if the column names don't match exactly - our system
              will suggest mappings using fuzzy matching technology.
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Render mapping step with updated display (CSV columns on left, CRM fields in dropdown)
  const renderMappingStep = (): JSX.Element => {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-medium">Field Mapping</h3>
            <div className="flex items-center">
              <button
                onClick={autoMapFields}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                Auto-map Fields
              </button>
              <button
                onClick={() => {
                  setCurrentStep("upload");
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                  setCsvFile(null);
                  setCsvHeaders([]);
                  setCsvData([]);
                  setMappings([]);
                }}
                className="ml-2 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
              >
                Upload Different File
              </button>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Map your CSV columns to CRM fields. Required fields are marked
              with an asterisk (*).
            </p>
            <div className="flex items-center mb-4">
              <button
                onClick={() => setShowOptionalFields(!showOptionalFields)}
                className="px-3 py-1 text-xs border rounded-full flex items-center mr-2"
              >
                {showOptionalFields ? (
                  <>
                    <X size={12} className="mr-1" />
                    Hide Optional Fields
                  </>
                ) : (
                  <>
                    <Check size={12} className="mr-1" />
                    Show Optional Fields
                  </>
                )}
              </button>

              {showOptionalFields && (
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search fields..."
                    value={fieldSearchTerm}
                    onChange={(e) => setFieldSearchTerm(e.target.value)}
                    className="w-full px-3 py-1 border rounded-full text-sm"
                  />
                </div>
              )}
            </div>

            {/* Optional fields selection */}
            {showOptionalFields && (
              <div className="mb-4 flex flex-wrap gap-2">
                {filteredFields.slice(0, 10).map((field) => (
                  <button
                    key={field}
                    onClick={() => toggleFieldSelection(field)}
                    className={`px-3 py-1 text-xs rounded-full flex items-center ${
                      selectedFields.includes(field)
                        ? "bg-blue-100 text-blue-700 border border-blue-300"
                        : "bg-gray-100 text-gray-700 border border-gray-300"
                    }`}
                  >
                    {selectedFields.includes(field) && (
                      <Check size={12} className="mr-1" />
                    )}
                    {field}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Required fields mapping - Updated to show CSV columns on left */}
          <div className="mb-6">
            <h4 className="text-md font-medium mb-2">Required Fields</h4>
            <div className="space-y-3">
              {csvHeaders.map((csvColumn) => {
                // Find if this CSV column is mapped to a required field
                const mapping = mappings.find(
                  (m) =>
                    m.csvColumn === csvColumn &&
                    requiredFields.includes(m.crmField),
                );
                const confidence = mapping?.confidence || 0;
                const isRequiredForMapping =
                  !mappings.some(
                    (m) =>
                      requiredFields.includes(m.crmField) &&
                      m.crmField === mapping?.crmField,
                  ) && !mapping;

                return (
                  <div key={csvColumn} className="flex items-center">
                    <div className="w-1/3 text-sm font-medium">{csvColumn}</div>
                    <div className="w-2/3 flex items-center">
                      <select
                        value={mapping?.crmField || ""}
                        onChange={(e) =>
                          updateMapping(csvColumn, e.target.value)
                        }
                        className={`w-full p-2 border rounded ${isRequiredForMapping && "border-yellow-300 bg-yellow-50"}`}
                      >
                        <option value="">-- Select CRM Field --</option>
                        {requiredFields.map((field) => (
                          <option key={field} value={field}>
                            {field} {requiredFields.includes(field) ? "*" : ""}
                          </option>
                        ))}
                      </select>

                      {mapping && confidence > 0 && (
                        <div className="ml-2 px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                          {Math.round(confidence * 100)}% match
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Display warning if any required fields are not mapped */}
            {!areRequiredFieldsMapped() && (
              <div className="mt-4 p-3 rounded bg-yellow-50 border border-yellow-200 text-yellow-700 flex items-start">
                <AlertCircle size={20} className="mr-2 mt-0.5 flex-shrink-0" />
                <span>Please map all required fields (*) to continue.</span>
              </div>
            )}
          </div>

          {/* Optional fields mapping */}
          {selectedFields.filter((field) => !requiredFields.includes(field))
            .length > 0 && (
            <div>
              <h4 className="text-md font-medium mb-2">Optional Fields</h4>
              <div className="space-y-3">
                {csvHeaders
                  .filter(
                    (csvColumn) =>
                      !mappings.some(
                        (m) =>
                          m.csvColumn === csvColumn &&
                          requiredFields.includes(m.crmField),
                      ),
                  )
                  .map((csvColumn) => {
                    const mapping = mappings.find(
                      (m) =>
                        m.csvColumn === csvColumn &&
                        !requiredFields.includes(m.crmField),
                    );
                    const confidence = mapping?.confidence || 0;
                    const optionalFields = selectedFields.filter(
                      (field) => !requiredFields.includes(field),
                    );

                    return (
                      <div key={csvColumn} className="flex items-center">
                        <div className="w-1/3 text-sm font-medium">
                          {csvColumn}
                        </div>
                        <div className="w-2/3 flex items-center">
                          <select
                            value={mapping?.crmField || ""}
                            onChange={(e) =>
                              updateMapping(csvColumn, e.target.value)
                            }
                            className="w-full p-2 border rounded"
                          >
                            <option value="">-- Select CRM Field --</option>
                            {optionalFields.map((field) => (
                              <option key={field} value={field}>
                                {field}
                              </option>
                            ))}
                          </select>

                          {mapping && confidence > 0 && (
                            <div className="ml-2 px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                              {Math.round(confidence * 100)}% match
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-50 rounded-b-lg flex justify-between">
          <button
            onClick={goToPreviousStep}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Back
          </button>
          <button
            onClick={goToNextStep}
            disabled={!areRequiredFieldsMapped()}
            className={`px-4 py-2 rounded ${
              areRequiredFieldsMapped()
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Next: Preview Data
          </button>
        </div>
      </div>
    );
  };

  // Render preview step
  const renderPreviewStep = (): JSX.Element => {
    const mappedFields = mappings.map((m) => m.crmField);

    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="mb-4 flex justify-between items-center">
            <h3 className="text-lg font-medium">Preview Import Data</h3>
            <div className="text-sm text-gray-500">
              Showing {Math.min(csvData.length, 5)} of {csvData.length} records
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {mappedFields.map((field) => (
                    <th
                      key={field}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {field}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {csvData.slice(0, 5).map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {mappedFields.map((field) => {
                      const mapping = mappings.find(
                        (m) => m.crmField === field,
                      );
                      const value =
                        mapping && mapping.csvColumn
                          ? row[mapping.csvColumn]
                          : "";

                      return (
                        <td
                          key={field}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                        >
                          {value}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex items-start bg-yellow-50 p-4 rounded border border-yellow-200">
            <HelpCircle
              size={20}
              className="text-yellow-500 mr-2 mt-0.5 flex-shrink-0"
            />
            <div className="text-sm text-gray-700">
              <p>
                Please review the sample data above to ensure your mappings are
                correct. Only the columns you've mapped will be imported.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-b-lg flex justify-between">
          <button
            onClick={goToPreviousStep}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Back to Mapping
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Import Data
          </button>
        </div>
      </div>
    );
  };

  // Render confirmation step
  const renderConfirmationStep = (): JSX.Element => {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-green-600" />
        </div>
        <h3 className="text-xl font-medium mb-2">Import Successful!</h3>
        <p className="text-gray-600 mb-6">
          {csvData.length} records have been imported successfully.
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => {
              setCurrentStep("upload");
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
              setCsvFile(null);
              setCsvHeaders([]);
              setCsvData([]);
              setMappings([]);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Import Another File
          </button>
          <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
            View Records
          </button>
        </div>
      </div>
    );
  };

  // Render step content based on current step
  const renderStepContent = (): JSX.Element => {
    switch (currentStep) {
      case "upload":
        return renderUploadStep();
      case "mapping":
        return renderMappingStep();
      case "preview":
        return renderPreviewStep();
      case "confirmation":
        return renderConfirmationStep();
      default:
        return renderUploadStep();
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {renderStepperHeader()}
      {renderStepContent()}
    </div>
  );
};

export default CSVUploadStepper;
