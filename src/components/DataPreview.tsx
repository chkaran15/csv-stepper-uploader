import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CircleAlert,
} from "lucide-react";
import { useState } from "react";
import { ColumnMapping, ValidationError } from "../hooks/use-csv-upload";

type DataPreviewProps = {
  data: Array<Record<string, string>>;
  columnMappings: ColumnMapping[];
  validationErrors: ValidationError[];
  duplicates: number[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

const DataPreview = ({
  data,
  columnMappings,
  validationErrors,
  duplicates,
  currentPage,
  totalPages,
  onPageChange,
}: DataPreviewProps) => {
  // Only show mapped columns
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "ascending" | "descending";
  } | null>(null);

  // Get all mapped CRM fields
  const mappedFields = columnMappings
    .filter((mapping) => mapping.crmField)
    .map((mapping) => mapping.crmField!);

  // Check if a row has validation errors
  const getRowErrors = (rowIndex: number): ValidationError[] => {
    return validationErrors.filter((error) => error.row === rowIndex);
  };

  // Sort function
  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig) return 0;

    // Find the original CSV header for this CRM field
    const mapping = columnMappings.find((m) => m.crmField === sortConfig.key);
    if (!mapping) return 0;

    const aValue = a[mapping.csvHeader] || "";
    const bValue = b[mapping.csvHeader] || "";

    if (aValue < bValue) {
      return sortConfig.direction === "ascending" ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === "ascending" ? 1 : -1;
    }
    return 0;
  });

  const requestSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "ascending"
    ) {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  // Get sort direction icon
  const getSortDirectionIcon = (field: string) => {
    if (!sortConfig || sortConfig.key !== field) {
      return null;
    }
    return sortConfig.direction === "ascending" ? "↑" : "↓";
  };

  return (
    <div className="overflow-hidden border rounded-lg bg-background">
      <div className="p-4 bg-primary/5 border-b border-primary/10">
        <h3 className="font-medium text-lg">Data Preview</h3>
        <p className="text-sm text-primary/50 mt-1">
          Preview your data before import. Rows with validation issues are
          highlighted.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-primary/15">
          <thead className="bg-primary/5">
            <tr>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-primary/50 uppercase tracking-wider"
              >
                Row
              </th>
              {mappedFields.map((field) => (
                <th
                  key={field}
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-primary/50 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => requestSort(field)}
                >
                  <div className="flex items-center justify-between">
                    <span>{field}</span>
                    <span>{getSortDirectionIcon(field)}</span>
                  </div>
                </th>
              ))}
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-primary/50 uppercase tracking-wider"
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-background divide-y divide-primary/15">
            {sortedData.map((row, rowIndex) => {
              const actualRowIndex = data.indexOf(row);
              const errors = getRowErrors(actualRowIndex);
              const isDuplicate = duplicates.includes(actualRowIndex);

              return (
                <tr
                  key={rowIndex}
                  className={`
                    ${errors.length > 0 ? "bg-red-50" : ""}
                    ${isDuplicate ? "bg-amber-50" : ""}
                    hover:bg-primary/5
                  `}
                >
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-primary/50">
                    {Number(currentPage - 1) * 0 + rowIndex + 1}
                  </td>

                  {mappedFields.map((field) => {
                    // Find the original CSV header for this CRM field
                    const mapping = columnMappings.find(
                      (m) => m.crmField === field,
                    );
                    if (!mapping) return null;

                    const hasError = errors.some(
                      (error) => error.column === field,
                    );

                    return (
                      <td
                        key={field}
                        className={`
                          px-4 py-3 whitespace-nowrap text-sm
                          ${hasError ? "text-red-700" : "text-primary/70"}
                        `}
                      >
                        {row[mapping.csvHeader] || "-"}
                        {hasError && (
                          <CircleAlert className="inline ml-1 text-red-500" />
                        )}
                      </td>
                    );
                  })}

                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {errors.length > 0 ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                        {errors.length} error{errors.length > 1 ? "s" : ""}
                      </span>
                    ) : isDuplicate ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800">
                        Potential duplicate
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                        Valid
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="p-4 bg-primary/5 border-t flex items-center justify-between">
          <div className="text-sm text-primary/50">
            Page {currentPage} of {totalPages}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
              className={`
                p-1 rounded-md border
                ${
                  currentPage === 1
                    ? "text-gray-300 border-gray-200 cursor-not-allowed"
                    : "text-primary/50 hover:bg-gray-100 border-gray-300"
                }
              `}
            >
              <ChevronsLeft size={16} />
            </button>

            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`
                p-1 rounded-md border
                ${
                  currentPage === 1
                    ? "text-gray-300 border-gray-200 cursor-not-allowed"
                    : "text-primary/50 hover:bg-gray-100 border-gray-300"
                }
              `}
            >
              <ChevronLeft size={16} />
            </button>

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`
                p-1 rounded-md border
                ${
                  currentPage === totalPages
                    ? "text-gray-300 border-gray-200 cursor-not-allowed"
                    : "text-primary/50 hover:bg-gray-100 border-gray-300"
                }
              `}
            >
              <ChevronRight size={16} />
            </button>

            <button
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
              className={`
                p-1 rounded-md border
                ${
                  currentPage === totalPages
                    ? "text-gray-300 border-gray-200 cursor-not-allowed"
                    : "text-primary/50 hover:bg-gray-100 border-gray-300"
                }
              `}
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataPreview;
