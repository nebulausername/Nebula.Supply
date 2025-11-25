import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DailyRewardPopup } from '../DailyRewardPopup';

// Mock stores
vi.mock('../../store/shop', () => ({
  useShopStore: () => ({
    addCoins: vi.fn()
  })
}));

vi.mock('../../store/toast', () => ({
  useToastStore: () => ({
    showToast: vi.fn()
  })
}));

describe('DailyRewardPopup', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('shows popup if not claimed today', async () => {
    render(<DailyRewardPopup />);
    
    // Wait for popup to appear
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    // Check if popup is visible
    const heading = await screen.findByText(/Daily Login Reward/i);
    expect(heading).toBeInTheDocument();
  });

  it('does not show if already claimed today', () => {
    // Set last claim to today
    localStorage.setItem('lastDailyClaim', new Date().toDateString());
    
    render(<DailyRewardPopup />);
    
    // Should not show popup
    expect(screen.queryByText(/Daily Login Reward/i)).not.toBeInTheDocument();
  });

  it('calculates streak correctly', async () => {
    // Set yesterday as last claim
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    localStorage.setItem('dailyStreak', JSON.stringify({
      count: 5,
      lastDate: yesterday.toDateString()
    }));
    
    render(<DailyRewardPopup />);
    
    // Wait for popup
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    // Should show day 6 (5 + 1)
    const streakText = await screen.findByText(/Day 6/i);
    expect(streakText).toBeInTheDocument();
  });

  it('allows claiming reward', async () => {
    render(<DailyRewardPopup />);
    
    // Wait for popup
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    // Find and click claim button
    const claimButton = await screen.findByRole('button', { name: /Claim/i });
    fireEvent.click(claimButton);
    
    // Should show claimed message
    await screen.findByText(/Claimed!/i);
  });
});


