import { useState } from "react";

import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  CircleHelp,
  RefreshCcw,
} from "lucide-react";
import { ColumnMapping, TransformationType } from "../hooks/use-csv-upload";

type ColumnMapperProps = {
  csvHeaders: string[];
  crmFields: string[];
  columnMappings: ColumnMapping[];
  requiredFields: string[];
  onUpdateMapping: (csvHeader: string, crmField: string | null) => void;
  onAddTransformation: (field: string, type: TransformationType) => void;
  autoMappings: (csvHeaders: string[], crmFields: string[]) => void;
};

const ColumnMapper = ({
  csvHeaders,
  crmFields,
  columnMappings,
  requiredFields,
  onUpdateMapping,
  onAddTransformation,
  autoMappings,
}: ColumnMapperProps) => {
  const [expandedHeader, setExpandedHeader] = useState<string | null>(null);

  // Check if a CRM field is already mapped
  const isFieldMapped = (field: string): boolean => {
    return columnMappings.some((mapping) => mapping.crmField === field);
  };

  const [isAutoMapping, setIsAutoMapping] = useState<boolean>(false);

  // Check if all required fields are mapped
  const areRequiredFieldsMapped = requiredFields.every((field) =>
    columnMappings.some((mapping) => mapping.crmField === field),
  );

  // Count of mapped fields
  const mappedFieldsCount = columnMappings.filter(
    (m) => m.crmField !== null,
  ).length;

  // Handle auto-mapping with loading state
  const handleAutoMap = () => {
    setIsAutoMapping(true);

    setTimeout(() => {
      autoMappings(csvHeaders, crmFields);
      setIsAutoMapping(false);
    }, 500);
  };

  return (
    <>
      <div className="">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-primary/70">Map CSV Columns to CRM Fields</h3>
          <div className="flex items-center gap-3">
            {areRequiredFieldsMapped ? (
              <span className="text-green-500 flex items-center gap-1 text-xs">
                <CheckCircle2 size={16} /> All required fields mapped
              </span>
            ) : (
              <span className="text-amber-500 flex items-center gap-1 text-xs">
                <CircleAlert size={16} /> Some required fields not mapped
              </span>
            )}
            <button
              onClick={handleAutoMap}
              disabled={isAutoMapping}
              className={`px-4 py-2 text-nowrap bg-blue-600 text-white rounded hover:bg-blue-700 text-sm flex items-center gap-2 ${
                isAutoMapping ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {isAutoMapping ? (
                <>
                  <RefreshCcw size={14} className="animate-spin" />
                  Mapping...
                </>
              ) : (
                <>Auto-map Fields</>
              )}
            </button>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 text-blue-800">
            <CircleHelp size={16} className="text-blue-500" />
            <span className="text-xs">
              <strong>Auto-mapping:</strong> {mappedFieldsCount} of{" "}
              {csvHeaders.length} fields are mapped.
              {!areRequiredFieldsMapped && (
                <span className="text-amber-600 ml-1">
                  Required fields still need mapping.
                </span>
              )}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-t border-b">
            <label className="sm:w-1/3 text-sm font-medium text-gray-600">
              CSV Columns
            </label>
            <div className="w-8 flex justify-center">
              <ArrowRight size={14} className="text-gray-400" />
            </div>
            <p className="sm:w-1/2 text-sm font-medium text-gray-600">
              CRM Fields
            </p>
          </div>

          {csvHeaders.map((header) => {
            const mapping = columnMappings.find((m) => m.csvHeader === header);
            const isExpanded = expandedHeader === header;
            const isMapped = mapping?.crmField !== null;
            const isRequiredField =
              mapping?.crmField && requiredFields.includes(mapping.crmField);

            return (
              <div
                key={header}
                className={`border rounded p-3 bg-background transition-shadow hover:shadow-sm ${
                  isMapped
                    ? "border-green-200 bg-green-50/30"
                    : "border-gray-200"
                } ${isRequiredField ? "border-l-4 border-l-amber-500" : ""}`}
              >
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <div className="w-full sm:w-1/3">
                    <div className="text-sm font-medium truncate text-primary/70">
                      {header}
                    </div>
                  </div>

                  <div className="hidden sm:flex w-8 justify-center text-primary/40">
                    <ArrowRight size={14} />
                  </div>

                  <div className="w-full sm:w-1/2">
                    <select
                      value={mapping?.crmField || ""}
                      onChange={(e) =>
                        onUpdateMapping(header, e.target.value || null)
                      }
                      className={`w-full p-1.5 text-sm border rounded focus:ring-1 focus:ring-blue-400 ${
                        isMapped
                          ? "bg-green-50 border-green-200"
                          : "bg-accent text-primary/60"
                      } ${isRequiredField ? "border-amber-300" : ""}`}
                    >
                      <option value="">-- Skip --</option>
                      {crmFields.map((field) => (
                        <option
                          key={field}
                          value={field}
                          disabled={
                            isFieldMapped(field) && mapping?.crmField !== field
                          }
                        >
                          {field}
                          {requiredFields.includes(field) ? " *" : ""}
                          {isFieldMapped(field) && mapping?.crmField !== field
                            ? " (mapped)"
                            : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {mapping?.crmField && (
                    <button
                      onClick={() =>
                        setExpandedHeader(isExpanded ? null : header)
                      }
                      className="text-blue-500 text-xs hover:underline ml-auto"
                    >
                      {isExpanded ? "Hide" : "Options"}
                    </button>
                  )}
                </div>

                {isExpanded && mapping?.crmField && (
                  <div className="mt-3 pt-2 border-t text-sm">
                    <label className="text-xs text-primary/50 mb-1 flex items-center gap-1">
                      <CircleHelp className="text-primary/40" size={12} />
                      Transform data
                    </label>
                    <div className="flex flex-wrap gap-3 mt-1">
                      {(
                        [
                          "none",
                          "trim",
                          "uppercase",
                          "lowercase",
                        ] as TransformationType[]
                      ).map((type) => (
                        <label
                          key={type}
                          className="flex items-center gap-1 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name={`transform-${header}`}
                            value={type}
                            onChange={() =>
                              onAddTransformation(mapping.crmField!, type)
                            }
                            className="text-blue-400 focus:ring-blue-400 h-3 w-3"
                          />
                          <span className="text-xs">
                            {type === "none" ? "None" : type}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default ColumnMapper;
