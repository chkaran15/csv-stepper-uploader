import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

type DefaultValuesSetterProps = {
  crmFields: string[];
  columnMappings: Array<{ csvHeader: string; crmField: string | null }>;
  defaultValues: Record<string, string>;
  onUpdateDefaultValue: (field: string, value: string) => void;
};

const DefaultValuesSetter = ({
  crmFields,
  columnMappings,
  defaultValues,
  onUpdateDefaultValue,
}: DefaultValuesSetterProps) => {
  const [selectedField, setSelectedField] = useState<string>("");

  // Get unmapped fields that don't have default values yet
  const getAvailableFields = () => {
    const mappedFields = columnMappings
      .filter((mapping) => mapping.crmField)
      .map((mapping) => mapping.crmField!);

    return crmFields.filter(
      (field) =>
        !mappedFields.includes(field) &&
        !Object.keys(defaultValues).includes(field),
    );
  };

  const availableFields = getAvailableFields();

  const handleAddDefaultValue = () => {
    if (selectedField) {
      onUpdateDefaultValue(selectedField, "");
      setSelectedField("");
    }
  };

  const handleRemoveDefaultValue = (field: string) => {
    // Create a new object without the removed field
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [field]: _, ...rest } = defaultValues;

    // This is a bit of a hack since our interface doesn't support removal directly
    Object.entries(rest).forEach(([key, value]) => {
      onUpdateDefaultValue(key, value);
    });

    // Set the removed field to an empty string to trigger removal
    onUpdateDefaultValue(field, "");
  };

  return (
    <div className="bg0-background border rounded-lg p-4">
      <h3 className="font-medium text-lg mb-4">Set Default Values</h3>

      <div className="space-y-4">
        {/* Default values list */}
        {Object.keys(defaultValues).length > 0 ? (
          <div className="space-y-3">
            {Object.entries(defaultValues).map(([field, value]) => (
              <div key={field} className="flex items-center gap-3">
                <div className="w-1/3">
                  <div className="bg-primary/10 p-2 rounded text-gray-700">
                    {field}
                  </div>
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={value}
                    onChange={(e) =>
                      onUpdateDefaultValue(field, e.target.value)
                    }
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={`Default value for ${field}`}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveDefaultValue(field)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded"
                >
                  <Trash2 />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm py-2">
            No default values set. Add default values for fields that are not in
            your CSV.
          </p>
        )}

        {/* Add new default value */}
        {availableFields.length > 0 && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t">
            <div className="flex-1">
              <select
                value={selectedField}
                onChange={(e) => setSelectedField(e.target.value)}
                className="w-full p-2 border rounded bg-background focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- Select a field --</option>
                {availableFields.map((field) => (
                  <option key={field} value={field}>
                    {field}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleAddDefaultValue}
              disabled={!selectedField}
              className={`
                px-4 py-2 rounded flex items-center gap-1
                ${
                  selectedField
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-primary/10 text-primary/60 cursor-not-allowed"
                }
              `}
            >
              <Plus /> Add
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DefaultValuesSetter;
