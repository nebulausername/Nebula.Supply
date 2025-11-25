import React, { useEffect } from 'react';
import { useGlobalCartStore } from '../../store/globalCart';
import { useBotCommandHandler } from '../../utils/botCommandHandler';

export const CartDebug: React.FC = () => {
  const { items, totalItems, totalPrice, isOpen } = useGlobalCartStore();
  const { executeCommand } = useBotCommandHandler();

  // Check for bot commands in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const command = urlParams.get('command');
    if (command) {
      const result = executeCommand(command);
      if (result.success) {
        console.log('Bot command executed:', result.message);
      }
    }
  }, [executeCommand]);

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg border border-white/20 max-w-sm">
      <h3 className="font-bold mb-2">🛒 Cart Debug</h3>
      <div className="space-y-1 text-sm">
        <div>Items: {items.length}</div>
        <div>Total Items: {totalItems}</div>
        <div>Total Price: €{totalPrice.toFixed(2)}</div>
        <div>Is Open: {isOpen ? 'Yes' : 'No'}</div>

        {items.length > 0 && (
          <div className="mt-2">
            <div className="font-semibold">Items:</div>
            {items.map((item, index) => (
              <div key={index} className="ml-2 text-xs">
                • {item.name} ({item.type}) - {item.quantity}x €{item.price}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};




