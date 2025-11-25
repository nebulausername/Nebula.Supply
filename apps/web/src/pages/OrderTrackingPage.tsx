import { useParams } from "react-router-dom";
import { useEffect } from "react";
import { OrderTracking } from "../components/checkout/OrderTracking";
import { useBotCommandHandler } from "../utils/botCommandHandler";

export const OrderTrackingPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { executeCommand } = useBotCommandHandler();

  useEffect(() => {
    // Check for bot commands in URL
    const urlParams = new URLSearchParams(window.location.search);
    const command = urlParams.get('command');
    if (command) {
      const result = executeCommand(command);
      if (result.success) {
        console.log('Bot command executed:', result.message);
      }
    }
  }, [executeCommand]);

  if (!orderId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="p-8 rounded-2xl bg-slate-800/50 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-2">Bestellung nicht gefunden</h2>
            <p className="text-slate-400 mb-6">Die Bestellnummer ist ungültig oder nicht vorhanden.</p>
            <button
              onClick={() => window.location.href = "/shop"}
              className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold hover:from-orange-600 hover:to-orange-700 transition-all duration-300"
            >
              Zum Shop
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          <OrderTracking orderId={orderId} />
        </div>
      </div>
    </div>
  );
};

