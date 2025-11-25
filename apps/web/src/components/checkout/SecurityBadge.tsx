import { Shield, Lock, CheckCircle } from "lucide-react";

export const SecurityBadge = () => {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30">
      <Shield className="h-4 w-4 text-green-400" />
      <span className="text-xs font-medium text-green-400">Sicher</span>
    </div>
  );
};

