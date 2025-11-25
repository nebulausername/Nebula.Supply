import { Info, Users, Clock, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { cn } from "../../utils/cn";
import type { PreorderStatus } from "@nebula/shared";

interface PreorderInfoProps {
  minimumOrders: number;
  currentOrders: number;
  preorderStatus: PreorderStatus;
  preorderDeadline?: string;
  className?: string;
}

const statusConfig: Record<PreorderStatus, {
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  pending: {
    label: "Startet bald",
    icon: <Clock className="h-4 w-4" />,
    color: "text-blue-300",
    bgColor: "bg-blue-500/20",
    borderColor: "border-blue-400/40"
  },
  collecting: {
    label: "Sammelt Bestellungen",
    icon: <Users className="h-4 w-4" />,
    color: "text-orange-300",
    bgColor: "bg-orange-500/20",
    borderColor: "border-orange-400/40"
  },
  reached: {
    label: "Mindestmenge erreicht",
    icon: <CheckCircle className="h-4 w-4" />,
    color: "text-green-300",
    bgColor: "bg-green-500/20",
    borderColor: "border-green-400/40"
  },
  ordered: {
    label: "Bestellt",
    icon: <CheckCircle className="h-4 w-4" />,
    color: "text-green-400",
    bgColor: "bg-green-500/25",
    borderColor: "border-green-400/50"
  },
  failed: {
    label: "Gescheitert",
    icon: <XCircle className="h-4 w-4" />,
    color: "text-red-300",
    bgColor: "bg-red-500/20",
    borderColor: "border-red-400/40"
  }
};

export const PreorderInfo = ({
  minimumOrders,
  currentOrders,
  preorderStatus,
  preorderDeadline,
  className
}: PreorderInfoProps) => {
  const progress = Math.min((currentOrders / minimumOrders) * 100, 100);
  const remaining = Math.max(minimumOrders - currentOrders, 0);
  const config = statusConfig[preorderStatus];

  const getStatusMessage = () => {
    switch (preorderStatus) {
      case "pending":
        return "Die Preorder-Sammlung startet bald. Sei der Erste!";
      case "collecting":
        return remaining > 0
          ? `Noch ${remaining} Bestellung${remaining !== 1 ? 'en' : ''} benötigt`
          : "Mindestmenge erreicht!";
      case "reached":
        return "Die Mindestmenge wurde erreicht. Bestellung wird vorbereitet.";
      case "ordered":
        return "Der Drop wurde bestellt. Du erhältst bald eine Zahlungsaufforderung.";
      case "failed":
        return "Die Mindestmenge wurde nicht erreicht. Dieser Drop wird nicht bestellt.";
      default:
        return "";
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Status Badge */}
      <div className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2 border",
        config.bgColor,
        config.borderColor
      )}>
        <div className={config.color}>
          {config.icon}
        </div>
        <span className={cn("font-semibold text-sm", config.color)}>
          {config.label}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-blue-200">
            {currentOrders} von {minimumOrders} bestellt
          </span>
          <span className="text-blue-300 font-semibold">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              progress === 100 ? "bg-green-500" : "bg-blue-500"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Info Box */}
      <div className={cn(
        "rounded-lg border p-3 space-y-2",
        "bg-blue-500/10 border-blue-400/20"
      )}>
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-blue-300 mt-0.5 flex-shrink-0" />
          <div className="space-y-1 text-xs text-blue-200">
            <p className="font-semibold">Wie funktioniert Preorder?</p>
            <p>
              Dieser Drop benötigt mindestens <strong>{minimumOrders} Bestellungen</strong>, 
              um produziert zu werden. Je mehr Leute bestellen, desto günstiger wird der Preis.
            </p>
            <ul className="list-disc list-inside space-y-0.5 ml-2">
              <li>Bestelle jetzt und sichere dir den günstigen Preis</li>
              <li>Wenn {minimumOrders} Bestellungen erreicht werden, wird automatisch bestellt</li>
              <li>Du erhältst dann eine Zahlungsaufforderung</li>
              <li>Bei Nicht-Erreichen wird der Drop nicht bestellt und du bekommst dein Geld zurück</li>
            </ul>
            {preorderDeadline && (
              <p className="pt-1 text-blue-300">
                Frist: {new Date(preorderDeadline).toLocaleDateString('de-DE', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Status Message */}
      {preorderStatus === "collecting" && remaining > 0 && (
        <div className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 border",
          "bg-orange-500/10 border-orange-400/30"
        )}>
          <AlertCircle className="h-4 w-4 text-orange-300" />
          <span className="text-orange-200 text-sm font-medium">
            {getStatusMessage()}
          </span>
        </div>
      )}
    </div>
  );
};

