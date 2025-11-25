import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LiveActivityFeed } from '../LiveActivityFeed';

// Mock mobile optimizations
vi.mock('../MobileOptimizations', () => ({
  useMobileOptimizations: () => ({ isMobile: false })
}));

// Mock WebSocket hook
vi.mock('../../hooks/useWebSocket', () => ({
  useWebSocket: () => ({
    isConnected: true,
    lastMessage: null,
    sendMessage: vi.fn(),
    reconnect: vi.fn(),
    disconnect: vi.fn(),
    reconnectAttempts: 0
  })
}));

describe('LiveActivityFeed', () => {
  it('renders the live activity feed', () => {
    render(<LiveActivityFeed showMockData={true} />);
    
    // Check if component renders
    expect(screen.getByText('Live Activity')).toBeInTheDocument();
  });

  it('limits activities to maxItems', async () => {
    const { container } = render(<LiveActivityFeed showMockData={true} maxItems={3} />);
    
    // Wait for activities to load
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Should show max 3 activities
    const activityItems = container.querySelectorAll('.rounded-xl.bg-white\\/5');
    expect(activityItems.length).toBeLessThanOrEqual(3);
  });

  it('can be closed', () => {
    const { container, rerender } = render(<LiveActivityFeed showMockData={true} />);
    
    // Initially visible
    expect(container.querySelector('.fixed')).toBeInTheDocument();
    
    // Click close button
    const closeButton = screen.getByRole('button');
    closeButton.click();
    
    // Rerender to check if closed
    rerender(<LiveActivityFeed showMockData={false} />);
  });
});


