import React from "react";
import { SignUp } from "@clerk/clerk-react";

const SignUpPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">CT</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Join CarbonTwin
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Start managing your carbon footprint with AI
          </p>
        </div>
        <div className="flex justify-center">
          <SignUp
            appearance={{
              elements: {
                formButtonPrimary:
                  "bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700",
                card: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
                headerTitle: "text-gray-900 dark:text-white",
                headerSubtitle: "text-gray-600 dark:text-gray-400",
                socialButtonsBlockButton:
                  "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700",
                formFieldLabel: "text-gray-700 dark:text-gray-300",
                formFieldInput:
                  "border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white",
                dividerLine: "bg-gray-300 dark:bg-gray-600",
                dividerText: "text-gray-500 dark:text-gray-400",
                footerActionLink:
                  "text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300",
                identityPreviewText: "text-gray-600 dark:text-gray-400",
                identityPreviewEditButton:
                  "text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300",
              },
            }}
            redirectUrl="/"
          />
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
