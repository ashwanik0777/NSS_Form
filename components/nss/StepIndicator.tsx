type StepIndicatorProps = {
  currentStep: number;
  totalSteps: number;
  stepTitles?: string[];
};

export default function StepIndicator({ currentStep, totalSteps, stepTitles }: StepIndicatorProps) {
  return (
    <div className="nss-step-indicator flex flex-row space-x-2 sm:space-x-4 py-2">
      {Array.from({ length: totalSteps }, (_, index) => {
        const stepNumber = index + 1
        const isActive = stepNumber === currentStep
        const isCompleted = stepNumber < currentStep

        return (
          <div key={stepNumber} className="flex items-center flex-shrink-0">
            <div
              className={`nss-step w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full text-xs sm:text-sm font-bold ${
                isActive
                  ? "bg-primary text-white"
                  : isCompleted
                  ? "bg-secondary text-white"
                  : "bg-border text-gray-500"
              }`}
            >
              {isCompleted ? (
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                stepNumber
              )}
            </div>
            {stepNumber < totalSteps && (
              <div
                className={`h-0.5 mx-1 sm:mx-2 ${stepNumber < currentStep ? "bg-secondary" : "bg-border"}`}
                style={{ width: '20px' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
