import { CheckCircle, Circle } from "lucide-react";
import { cn } from "../../utils/cn";

interface CheckoutStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  completed: boolean;
}

interface CheckoutProgressProps {
  steps: CheckoutStep[];
  currentStep: string;
}

export const CheckoutProgress = ({ steps, currentStep }: CheckoutProgressProps) => {
  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.completed;
          const isPast = index < currentStepIndex;
          
          return (
            <div key={step.id} className="flex flex-col items-center flex-1">
              {/* Step Circle */}
              <div className="relative">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                    isCompleted && "bg-green-500 border-green-500",
                    isActive && !isCompleted && "bg-orange-500 border-orange-500",
                    !isActive && !isCompleted && "bg-slate-700 border-slate-600",
                    isPast && !isCompleted && "bg-slate-600 border-slate-500"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5 text-white" />
                  ) : (
                    <Circle className="h-5 w-5 text-white" />
                  )}
                </div>
                
                {/* Connection Line */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "absolute top-5 left-10 w-full h-0.5 transition-all duration-300",
                      isCompleted || isPast ? "bg-green-500" : "bg-slate-600"
                    )}
                    style={{ width: "calc(100% - 2.5rem)" }}
                  />
                )}
              </div>
              
              {/* Step Info */}
              <div className="mt-3 text-center">
                <div
                  className={cn(
                    "text-sm font-medium transition-colors",
                    isActive ? "text-white" : isCompleted ? "text-green-400" : "text-slate-400"
                  )}
                >
                  {step.title}
                </div>
                <div className="text-xs text-slate-500 mt-1 hidden sm:block">
                  {step.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

