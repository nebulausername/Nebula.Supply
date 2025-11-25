import { motion } from "framer-motion";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { cn } from "../../utils/cn";

interface TimelineStep {
  id: string;
  label: string;
  status: 'completed' | 'current' | 'pending';
  timestamp?: string;
}

interface StatusTimelineProps {
  steps: TimelineStep[];
  className?: string;
}

export const StatusTimeline = ({ steps, className }: StatusTimelineProps) => {
  return (
    <div className={cn("space-y-4", className)}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        
        return (
          <div key={step.id} className="relative">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="relative flex-shrink-0">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center relative z-10",
                    step.status === 'completed' && "bg-[#34D399]/20 border-2 border-[#34D399]",
                    step.status === 'current' && "bg-[#0BF7BC]/20 border-2 border-[#0BF7BC]",
                    step.status === 'pending' && "bg-white/5 border-2 border-white/20"
                  )}
                >
                  {step.status === 'completed' && (
                    <CheckCircle2 className="w-5 h-5 text-[#34D399]" />
                  )}
                  {step.status === 'current' && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Clock className="w-5 h-5 text-[#0BF7BC]" />
                    </motion.div>
                  )}
                  {step.status === 'pending' && (
                    <Circle className="w-5 h-5 text-white/30" />
                  )}
                  
                  {/* Pulse Effect for Current */}
                  {step.status === 'current' && (
                    <motion.div
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 0, 0.5]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="absolute inset-0 rounded-full bg-[#0BF7BC]"
                    />
                  )}
                </motion.div>
                
                {/* Connecting Line */}
                {!isLast && (
                  <div className="absolute top-10 left-5 w-0.5 h-full -ml-px">
                    <div className={cn(
                      "w-full h-full",
                      step.status === 'completed' 
                        ? "bg-gradient-to-b from-[#34D399] to-[#0BF7BC]" 
                        : "bg-white/10"
                    )} />
                  </div>
                )}
              </div>
              
              {/* Content */}
              <div className="flex-1 pb-8">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 + 0.1 }}
                >
                  <h4 className={cn(
                    "font-semibold mb-1",
                    step.status === 'completed' && "text-[#34D399]",
                    step.status === 'current' && "text-[#0BF7BC]",
                    step.status === 'pending' && "text-white/40"
                  )}>
                    {step.label}
                  </h4>
                  {step.timestamp && (
                    <p className="text-xs text-white/40">
                      {new Date(step.timestamp).toLocaleString('de-DE')}
                    </p>
                  )}
                </motion.div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};


