interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
  stepTitles: string[]
}

export default function StepIndicator({ currentStep, totalSteps, stepTitles }: StepIndicatorProps) {
  return (
    <div className="nss-step-indicator">
      {Array.from({ length: totalSteps }, (_, index) => {
        const stepNumber = index + 1
        const isActive = stepNumber === currentStep
        const isCompleted = stepNumber < currentStep

        return (
          <div key={stepNumber} className="flex items-center">
            <div className={`nss-step ${isActive ? "active" : isCompleted ? "completed" : "inactive"}`}>
              {isCompleted ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
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
              <div className={`w-12 h-0.5 mx-2 ${stepNumber < currentStep ? "bg-secondary" : "bg-border"}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
