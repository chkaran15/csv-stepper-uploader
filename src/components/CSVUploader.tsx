import { JSX, useState } from "react";
import FileDropzone from "./FileDropzone";
import ColumnMapper from "./ColumnMapper";
import MappingTemplates from "./MappingTemplates";
import DataPreview from "./DataPreview";
import ImportProgress from "./ImportProgress";
import {
  Check,
  Eye,
  FileCheck2,
  Info,
  LayoutGrid,
  MoveLeft,
  Upload,
} from "lucide-react";
import DefaultValuesSetter from "./DefaultValuesSetter";
import React from "react";
import useCSVUpload, { UploadStep } from "../hooks/use-csv-upload";

const CSVUploader = () => {
  const [showDefaultValues, setShowDefaultValues] = useState(false);
  const csvUpload = useCSVUpload();

  // Step configuration
  const steps: {
    key: UploadStep;
    icon: JSX.Element;
    label: string;
    title: string;
  }[] = [
    {
      key: "upload",
      icon: <Upload />,
      label: "Upload CSV",
      title: "Upload CSV File",
    },
    {
      key: "mapping",
      icon: <LayoutGrid />,
      label: "Map Columns",
      title: "Map CSV Columns to CRM Fields",
    },
    {
      key: "preview",
      icon: <Eye />,
      label: "Preview Data",
      title: "Preview Data",
    },
    {
      key: "confirmation",
      icon: <FileCheck2 />,
      label: "Confirmation",
      title: "Confirmation",
    },
  ];

  // Generate mock CSV template for download
  // const downloadTemplate = () => {
  //   const headers = csvUpload.crmFields.join(",");
  //   const sampleData = [
  //     "John,Doe,john.doe@example.com,+1234567890,Acme Inc,CEO,Website,123 Main St,New York,NY,10001,USA,First contact via website",
  //     "Jane,Smith,jane.smith@example.com,+0987654321,XYZ Corp,CTO,Referral,456 Oak Ave,San Francisco,CA,94102,USA,Referred by John Doe",
  //   ];

  //   const csvContent = [headers, ...sampleData].join("\n");
  //   const blob = new Blob([csvContent], { type: "text/csv" });
  //   const url = URL.createObjectURL(blob);

  //   const a = document.createElement("a");
  //   a.href = url;
  //   a.download = "crm_contacts_template.csv";
  //   document.body.appendChild(a);
  //   a.click();
  //   document.body.removeChild(a);
  //   URL.revokeObjectURL(url);
  // };

  // Render step content based on current step
  const renderStepContent = () => {
    switch (csvUpload.currentStep) {
      case "upload":
        return (
          <div className="space-y-8 ">
            <FileDropzone onFileAccepted={csvUpload.handleFileSelect} />

            <div className="mt-6 flex items-start">
              <Info
                size={20}
                className="text-primary_blue mr-2 mt-0.5 flex-shrink-0"
              />
              <div className="text-sm text-primary/60">
                <p className="mb-2">
                  Your CSV file should contain the following required fields:
                </p>
                <ul className="list-disc list-inside mb-2">
                  {csvUpload.requiredFields.map((field) => (
                    <li key={field}>{field}</li>
                  ))}
                </ul>
                <p>
                  Don't worry if the column names don't match exactly - our
                  system makes it simple to match them correctly.
                </p>
              </div>
            </div>

            {/* <div className="flex justify-center">
							<button
								type="button"
								onClick={downloadTemplate}
								className="text-blue-600 flex items-center gap-2 text-sm font-medium transition-all hover:text-blue-800 hover:underline group"
							>
								<FileDown
									className="group-hover:scale-110 transition-transform"
									size={16}
								/>{" "}
								Download sample CSV template
							</button>
						</div> */}
          </div>
        );

      case "mapping":
        return (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-2">
              <MappingTemplates
                templates={csvUpload.savedTemplates}
                currentTemplate={csvUpload.currentTemplate}
                onSaveTemplate={csvUpload.saveTemplate}
                onLoadTemplate={csvUpload.loadTemplate}
              />

              <button
                type="button"
                onClick={() => setShowDefaultValues(!showDefaultValues)}
                className="text-blue-600 text-sm font-medium hover:text-blue-800 transition-colors flex items-center gap-2 self-start"
              >
                {showDefaultValues
                  ? "Hide default values"
                  : "Set default values"}
              </button>
            </div>

            {showDefaultValues && (
              <DefaultValuesSetter
                crmFields={csvUpload.crmFields}
                columnMappings={csvUpload.columnMappings}
                defaultValues={csvUpload.defaultValues}
                onUpdateDefaultValue={csvUpload.updateDefaultValue}
              />
            )}

            <ColumnMapper
              csvHeaders={csvUpload.csvHeaders}
              crmFields={csvUpload.crmFields}
              autoMappings={csvUpload.autoMappings}
              columnMappings={csvUpload.columnMappings}
              requiredFields={csvUpload.requiredFields}
              onUpdateMapping={csvUpload.updateMapping}
              onAddTransformation={csvUpload.addTransformation}
            />

            <div className="flex justify-between pt-6">
              <button
                type="button"
                onClick={() => csvUpload.goToStep("upload")}
                className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors shadow-sm"
              >
                <MoveLeft size={16} /> Back
              </button>

              <button
                type="button"
                onClick={csvUpload.validateData}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium shadow-md hover:bg-blue-700 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        );

      case "preview":
        return (
          <div className="space-y-8">
            <DataPreview
              data={csvUpload.paginatedData()}
              columnMappings={csvUpload.columnMappings}
              validationErrors={csvUpload.validationErrors}
              duplicates={csvUpload.duplicates}
              currentPage={csvUpload.currentPage}
              totalPages={csvUpload.totalPages}
              onPageChange={csvUpload.setCurrentPage}
            />

            <div className="flex justify-between pt-6">
              <button
                type="button"
                onClick={() => csvUpload.goToStep("mapping")}
                className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors shadow-sm"
              >
                <MoveLeft size={16} /> Back
              </button>

              <button
                type="button"
                onClick={csvUpload.processImport}
                disabled={csvUpload.loading}
                className={`
                  px-6 py-2.5 rounded-lg font-medium shadow-md transition-colors
                  ${
                    csvUpload.loading
                      ? "bg-blue-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }
                  text-white
                `}
              >
                {csvUpload.loading ? "Processing..." : "Import Data"}
              </button>
            </div>
          </div>
        );

      case "confirmation":
        return (
          <div className="space-y-8">
            <ImportProgress
              isComplete={true}
              totalRows={csvUpload.csvData.length}
            />

            <div className="flex justify-center pt-6">
              <button
                type="button"
                onClick={csvUpload.reset}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium shadow-md hover:bg-blue-700 transition-all hover:scale-105"
              >
                Import More Data
              </button>
            </div>
          </div>
        );
    }
  };

  // const areRequiredFieldsMapped = csvUpload?.requiredFields?.every((field) =>
  //   csvUpload.columnMappings?.some((mapping) => mapping.crmField === field),
  // );

  return (
    <>
      {/* Step indicator */}
      {/* <div className="border-b bg-background flex flex-col gap-4 ">
				<div className="flex ">
					{steps.map((step, index) => {
						const isCurrent = csvUpload.currentStep === step.key;
						const isCompleted =
							steps.findIndex((s) => s.key === csvUpload.currentStep) > index;

						return (
							<div
								key={step.key}
								className={`
                    flex-1 text-center py-5 px-2 text-sm font-medium transition-colors
                    ${isCurrent ? "text-blue-700" : ""}
                    ${isCompleted ? "text-green-600" : ""}
                    ${!isCurrent && !isCompleted ? "text-gray-500" : ""}
                  `}
							>
								<div className="flex flex-col items-center">
									<div
										className={`
                      w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all
                      ${isCurrent ? "bg-blue-100 text-blue-700 scale-110" : ""}
                      ${isCompleted ? "bg-green-100 text-green-600" : ""}
                      ${
												!isCurrent && !isCompleted
													? "bg-gray-100 text-gray-500"
													: ""
											}
                    `}
									>
										{step.icon}
									</div>
									<span className="hidden sm:block">{step.label}</span>
								</div>
							</div>
						);
					})}
				</div>
			</div> */}

      <div className="w-full flex items-center border-b p-6 border-border flex-wrap gap-4">
        {steps.map((step, index) => {
          // Determine if step is active, completed, or upcoming
          const stepNumber = index + 1;
          const isActive =
            stepNumber ===
            steps.findIndex((s) => s.key === csvUpload.currentStep) + 1;
          const isCompleted =
            stepNumber <
            steps.findIndex((s) => s.key === csvUpload.currentStep) + 1;

          return (
            <React.Fragment key={step.key}>
              <div className="flex items-center gap-2">
                {/* Step Number Circle */}
                <span
                  className={`rounded-full w-6 h-6 flex items-center justify-center text-accent font-semibold text-sm
                    ${
                      isActive
                        ? "bg-primary_blue "
                        : isCompleted
                          ? "bg-green-500"
                          : "bg-primary/20"
                    }`}
                >
                  {isCompleted ? <Check size={14} /> : stepNumber}
                </span>

                {/* Step Label */}
                <span
                  className={`text-sm font-medium text-nowrap ${isActive ? "text-primary_blue" : "text-primary/40"}`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line (except after last step) */}
              {index < steps.length - 1 && (
                <div className="h-px rounded-full bg-primary/20 flex-1 mx-2"></div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step title */}

      {csvUpload.currentStep === "mapping" ? null : (
        <div className="flex items-center justify-between mb-2 px-6">
          <h3 className="text-primary/70">
            {steps.find((step) => step.key === csvUpload.currentStep)?.title}
          </h3>
        </div>
      )}

      <div className="px-6 pt-2 pb-6 ">{renderStepContent()}</div>
    </>
  );
};

export default CSVUploader;
