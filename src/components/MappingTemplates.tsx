import { CircleCheckBig, List, Save } from "lucide-react";
import { useState } from "react";
import { MappingTemplate } from "../hooks/use-csv-upload";

type MappingTemplatesProps = {
  templates: MappingTemplate[];
  currentTemplate: string | null;
  onSaveTemplate: (name: string) => void;
  onLoadTemplate: (templateId: string) => void;
};

const MappingTemplates = ({
  templates,
  currentTemplate,
  onSaveTemplate,
  onLoadTemplate,
}: MappingTemplatesProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [isSaveMode, setIsSaveMode] = useState(false);

  const handleSaveClick = () => {
    setIsSaveMode(true);
    setIsModalOpen(true);
  };

  const handleLoadClick = () => {
    setIsSaveMode(false);
    setIsModalOpen(true);
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (templateName.trim()) {
      onSaveTemplate(templateName.trim());
      setTemplateName("");
      setIsModalOpen(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleSaveClick}
          className="px-3 py-1.5 bg-background border border-border rounded flex items-center gap-1.5 text-sm hover:bg-primary/5 transition-colors"
        >
          <Save size={14} /> Save Template
        </button>

        <button
          type="button"
          onClick={handleLoadClick}
          disabled={templates.length === 0}
          className={`
            px-3 py-1.5 border rounded flex items-center gap-1.5 text-sm transition-colors
            ${
              templates.length === 0
                ? "bg-primary/10 border-gray-200 text-primary/50 cursor-not-allowed"
                : "bg-background border-border hover:bg-primary/5"
            }
          `}
        >
          <List size={14} /> Load Template
        </button>

        {currentTemplate && (
          <div className="px-3 py-1.5 bg-green-50 border border-green-200 rounded flex items-center gap-1.5 text-sm text-green-700">
            <CircleCheckBig size={14} />
            <span>
              Template applied:{" "}
              {templates.find((t) => t.id === currentTemplate)?.name}
            </span>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-md overflow-hidden">
            <div className="p-4 bg-primary/5 border-b">
              <h3 className="font-medium text-lg">
                {isSaveMode ? "Save Mapping Template" : "Load Mapping Template"}
              </h3>
            </div>

            <div className="p-4">
              {isSaveMode ? (
                <form onSubmit={handleSaveSubmit}>
                  <label className="block mb-2 font-medium text-gray-700">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter template name"
                    required
                  />

                  <div className="mt-6 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 border rounded hover:bg-primary/5"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Save Template
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  {templates.length === 0 ? (
                    <p className="text-gray-500">No templates saved yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {templates.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => {
                            onLoadTemplate(template.id);
                            setIsModalOpen(false);
                          }}
                          className={`
                            w-full text-left p-3 rounded border transition-colors
                            ${
                              currentTemplate === template.id
                                ? "bg-blue-50 border-blue-300"
                                : "hover:bg-primary/5 border-gray-200"
                            }
                          `}
                        >
                          <span className="font-medium">{template.name}</span>
                          <div className="text-xs text-gray-500 mt-1">
                            {Object.keys(template.mappings).length} mappings,
                            {Object.keys(template.defaultValues).length} default
                            values
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 border rounded hover:bg-primary/5"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MappingTemplates;
