import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { SmartCartConfirmation } from './SmartCartConfirmation';

const mockRecommendedProducts = [
  {
    id: 'prod-1',
    name: 'Test Product 1',
    price: 29.99,
    image: 'https://example.com/image1.jpg',
    badge: 'Neu'
  },
  {
    id: 'prod-2',
    name: 'Test Product 2',
    price: 49.99,
    image: 'https://example.com/image2.jpg',
    badge: 'Sale'
  }
];

describe('SmartCartConfirmation', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onContinueShopping: vi.fn(),
    onGoToCheckout: vi.fn(),
    onAddRecommendedProduct: vi.fn(),
    productName: 'Test Product',
    productPrice: 99.99,
    productImage: 'https://example.com/product.jpg',
    cartTotal: 149.98,
    freeShippingThreshold: 50,
    recommendedProducts: mockRecommendedProducts
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders successfully when open', () => {
    render(<SmartCartConfirmation {...defaultProps} />);
    expect(screen.getByText('🎉 Erfolgreich hinzugefügt!')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<SmartCartConfirmation {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('🎉 Erfolgreich hinzugefügt!')).not.toBeInTheDocument();
  });

  it('shows choice phase after success animation', async () => {
    render(<SmartCartConfirmation {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Was möchtest du tun?')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('shows recommendations phase after choice phase', async () => {
    render(<SmartCartConfirmation {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Perfekt ergänzen')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('displays recommended products', async () => {
    render(<SmartCartConfirmation {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
      expect(screen.getByText('Test Product 2')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('calls onGoToCheckout when Zur Kasse button is clicked', async () => {
    render(<SmartCartConfirmation {...defaultProps} />);
    await waitFor(() => {
      const checkoutButton = screen.getByText(/Zur Kasse/);
      fireEvent.click(checkoutButton);
      expect(defaultProps.onGoToCheckout).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('calls onContinueShopping when Weiter shoppen button is clicked', async () => {
    render(<SmartCartConfirmation {...defaultProps} />);
    await waitFor(() => {
      const continueButton = screen.getByText('Weiter shoppen');
      fireEvent.click(continueButton);
      expect(defaultProps.onContinueShopping).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('calls onAddRecommendedProduct when recommendation add button is clicked', async () => {
    render(<SmartCartConfirmation {...defaultProps} />);
    await waitFor(() => {
      const addButtons = screen.getAllByLabelText(/zum Warenkorb hinzufügen/);
      fireEvent.click(addButtons[0]);
      expect(defaultProps.onAddRecommendedProduct).toHaveBeenCalledWith('prod-1');
    }, { timeout: 3000 });
  });

  it('calls onClose when close button is clicked', () => {
    render(<SmartCartConfirmation {...defaultProps} />);
    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('displays fallback message when no recommendations available', async () => {
    render(<SmartCartConfirmation {...defaultProps} recommendedProducts={[]} />);
    await waitFor(() => {
      expect(screen.getByText('Keine Empfehlungen verfügbar')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
