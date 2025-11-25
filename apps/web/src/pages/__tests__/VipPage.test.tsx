import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { VipPage } from '../VipPage';
import { useVipStore } from '../../store/vip';

// Mock the VIP store
vi.mock('../../store/vip');
const mockUseVipStore = useVipStore as any;

const mockVipData = {
  currentTier: 'Nova' as const,
  vipScore: 2340,
  tierProgress: {
    current: 2340,
    next: 3000,
    requirements: [
      { invitesNeeded: 8, purchasesNeeded: 3, communityPoints: 200, minSpend: 100 }
    ]
  },
  benefits: [
    {
      id: 'priority-access',
      category: 'shopping' as const,
      title: 'Priority Access',
      description: 'Erhalte frühzeitigen Zugang zu limitierten Drops',
      icon: '⚡',
      available: 5,
      used: 2,
      maxPerMonth: 10,
      tier: 'Nova' as const
    }
  ],
  analytics: {
    totalDrops: 12,
    totalSpent: 485.50,
    vipScoreHistory: [
      { date: '2024-01-01', score: 1200 },
      { date: '2024-02-01', score: 1680 },
      { date: '2024-03-01', score: 2340 }
    ],
    tierProgression: [
      { date: '2023-12-01', tier: 'Comet' as const },
      { date: '2024-01-15', tier: 'Nova' as const }
    ],
    communityActivity: {
      challengesCompleted: 8,
      forumPosts: 23,
      helpTickets: 3,
      referralCount: 12
    },
    comparison: {
      percentileRank: 78,
      dropsAboveAverage: 3,
      scoreAboveAverage: 340
    }
  },
  community: {
    featuredMembers: [
      { id: '1', handle: 'NebulaPioneer', tier: 'Galaxy' as const, achievement: 'Erster Galaxy-Tier Member' }
    ],
    activeChallenges: [
      {
        id: 'vip-referral-challenge',
        title: 'VIP Referral Sprint',
        description: 'Lade 3 neue Member ein',
        reward: 'Priority Access +500 VIP Points',
        participants: 47,
        endsAt: '2024-03-31'
      }
    ],
    recentAchievements: [
      { id: '1', member: 'NebulaPioneer', achievement: 'Galaxy Tier erreicht', earnedAt: '2024-03-01' }
    ]
  },
  isLoading: false,
  lastUpdated: new Date().toISOString(),
  updateVipScore: vi.fn(),
  useBenefit: vi.fn(),
  refreshData: vi.fn()
};

describe('VipPage', () => {
  beforeEach(() => {
    mockUseVipStore.mockReturnValue(mockVipData as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the VIP page with correct title', () => {
    render(<VipPage />);
    expect(screen.getByText('VIP Control Center')).toBeInTheDocument();
  });

  it('displays current tier information', () => {
    render(<VipPage />);
    expect(screen.getByText('Nova VIP')).toBeInTheDocument();
    expect(screen.getByText('2.340')).toBeInTheDocument(); // VIP Points
  });

  it('shows section navigation buttons', () => {
    render(<VipPage />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('VIP Tiers')).toBeInTheDocument();
    expect(screen.getByText('Benefits')).toBeInTheDocument();
    expect(screen.getByText('Community')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('VIP Drops')).toBeInTheDocument();
  });

  it('switches between sections when navigation buttons are clicked', () => {
    render(<VipPage />);

    // Dashboard should be visible by default
    expect(screen.getByText('Nova VIP')).toBeInTheDocument();

    // Click on Benefits section
    fireEvent.click(screen.getByText('Benefits'));
    expect(screen.getByText('VIP Benefits Center')).toBeInTheDocument();

    // Click on Community section
    fireEvent.click(screen.getByText('Community'));
    expect(screen.getByText('VIP Community Hub')).toBeInTheDocument();
  });

  it('displays benefits in benefits section', () => {
    render(<VipPage />);

    // Navigate to benefits section
    fireEvent.click(screen.getByText('Benefits'));

    expect(screen.getByText('Priority Access')).toBeInTheDocument();
    expect(screen.getByText('Erhalte frühzeitigen Zugang zu limitierten Drops')).toBeInTheDocument();
  });

  it('shows loading state when data is loading', () => {
    mockUseVipStore.mockReturnValue({ ...mockVipData, isLoading: true } as any);

    render(<VipPage />);
    expect(screen.getByText('Lade VIP-Daten...')).toBeInTheDocument();
  });

  it('displays tier progression information', () => {
    render(<VipPage />);

    // Should show progress to next tier
    expect(screen.getByText('Fortschritt zu Supernova')).toBeInTheDocument();
    expect(screen.getByText('78%')).toBeInTheDocument(); // Progress percentage
  });

  it('displays VIP score increase button in demo mode', () => {
    render(<VipPage />);

    const scoreButton = screen.getByText('+100 VIP Points (Demo)');
    expect(scoreButton).toBeInTheDocument();

    fireEvent.click(scoreButton);
    expect(mockVipData.updateVipScore).toHaveBeenCalledWith(2440);
  });

  it('displays community challenges when available', () => {
    render(<VipPage />);

    // Should show active challenges in dashboard
    expect(screen.getByText('Aktive Challenges')).toBeInTheDocument();
    expect(screen.getByText('VIP Referral Sprint')).toBeInTheDocument();
  });

  it('shows VIP drops section with enhanced highlights', () => {
    render(<VipPage />);

    // Navigate to drops section
    fireEvent.click(screen.getByText('VIP Drops'));

    expect(screen.getByText('VIP Control Room')).toBeInTheDocument();
    expect(screen.getByText('VIP Drops')).toBeInTheDocument();
    expect(screen.getByText('Als Nova-Mitglied hast du priorisierten Zugang zu limitierten Releases.')).toBeInTheDocument();
  });

  it('displays analytics data in analytics section', () => {
    render(<VipPage />);

    // Navigate to analytics section
    fireEvent.click(screen.getByText('Analytics'));

    expect(screen.getByText('VIP Analytics')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument(); // Total drops
    expect(screen.getByText('485,50 €')).toBeInTheDocument(); // Total spent
  });
});




