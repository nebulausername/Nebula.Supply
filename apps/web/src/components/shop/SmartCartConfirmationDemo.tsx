import { useState } from 'react';
import { SmartCartConfirmation } from './SmartCartConfirmation';

// Demo component to showcase SmartCartConfirmation functionality
export const SmartCartConfirmationDemo = () => {
  const [isOpen, setIsOpen] = useState(false);

  const sampleRecommendedProducts = [
    {
      id: 'demo-galaxy-runner',
      name: 'Galaxy Runner V2',
      price: 159,
      image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop&crop=center',
      badge: 'Neu'
    },
    {
      id: 'demo-hyperwave-tee',
      name: 'Hyperwave Tee',
      price: 59,
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop&crop=center',
      badge: 'Coins +50'
    }
  ];

  return (
    <div className="p-8 bg-black min-h-screen flex items-center justify-center">
      <div className="text-center space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-4">SmartCartConfirmation Demo</h1>
          <p className="text-muted mb-8">
            Diese Demo zeigt die SmartCartConfirmation Komponente, die nach dem Hinzufügen eines Produkts zum Warenkorb erscheint.
          </p>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="px-8 py-4 bg-gradient-to-r from-accent to-emerald-400 text-black font-bold rounded-xl hover:scale-105 transition-all duration-300 shadow-lg shadow-accent/30"
        >
          Demo starten - Produkt hinzufügen
        </button>

        <SmartCartConfirmation
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onContinueShopping={() => {
            setIsOpen(false);
            alert('Weiter shoppen wurde geklickt!');
          }}
          onGoToCheckout={() => {
            setIsOpen(false);
            alert('Zur Kasse wurde geklickt!');
          }}
          onAddRecommendedProduct={(productId) => {
            alert(`Empfohlenes Produkt hinzugefügt: ${productId}`);
          }}
          productName="Galaxy Runner V2"
          productPrice={159}
          productImage="https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop&crop=center"
          cartTotal={218}
          freeShippingThreshold={50}
          recommendedProducts={sampleRecommendedProducts}
        />
      </div>
    </div>
  );
};
