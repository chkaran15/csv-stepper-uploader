import { useEffect } from "react";

import { Check, Loader } from "lucide-react";
import confetti from "../utils/confetti";

type ImportProgressProps = {
  isComplete: boolean;
  totalRows: number;
};

const ImportProgress = ({ isComplete, totalRows }: ImportProgressProps) => {
  useEffect(() => {
    if (isComplete) {
      confetti();
    }
  }, [isComplete]);

  return (
    <div className="text-center">
      {isComplete ? (
        <div className="space-y-6">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-4">
            <Check className="text-5xl text-green-500" />
          </div>

          <h2 className="text-2xl font-bold text-primary/80">
            Import Successful!
          </h2>

          <p className="text-primary/60 max-w-md mx-auto">
            {totalRows} {totalRows === 1 ? "record has" : "records have"} been
            successfully imported into your CRM system.
          </p>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
            <h3 className="font-medium text-green-800 mb-2">What's Next?</h3>
            <ul className="text-sm text-green-700 space-y-2">
              <li>✓ View imported contacts in your CRM</li>
              <li>✓ Set up follow-up tasks for new contacts</li>
              <li>✓ Create email campaigns for your imported data</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="inline-flex items-center justify-center w-24 h-24 mb-4">
            <Loader className="text-5xl text-blue-500 animate-spin" />
          </div>

          <h2 className="text-2xl font-bold text-gray-800">
            Importing Your Data
          </h2>

          <p className="text-gray-600 max-w-md mx-auto">
            Please wait while we import your data into the CRM system. This may
            take a moment for larger files.
          </p>

          <div className="max-w-md mx-auto bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-blue-800">
                <span>Importing records...</span>
                <span>Please wait</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2.5">
                <div className="bg-blue-500 h-2.5 rounded-full w-3/4 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportProgress;
