import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface CheckoutStepProps {
  title: string;
  description: string;
  icon: LucideIcon;
  children: ReactNode;
}

export const CheckoutStep = ({ title, description, icon: Icon, children }: CheckoutStepProps) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-full bg-gradient-to-r from-orange-500 to-orange-600">
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <p className="text-slate-400">{description}</p>
        </div>
      </div>

      {/* Content */}
      <div className="pt-4">
        {children}
      </div>
    </div>
  );
};

