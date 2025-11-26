import { useState, useMemo, Suspense, lazy, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "../layout/Header";
import { useShopStore } from "../store/shop";
import { useDropsStore } from "../store/drops";
import { useAchievementStore } from "../store/achievementStore";
import { LoyaltyCard } from "../components/profile/LoyaltyCard";
import { LoyaltyRewards } from "../components/profile/LoyaltyRewards";
import { useBotCommandHandler } from "../utils/botCommandHandler";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  ShoppingBag,
  Star,
  TrendingUp,
  Edit2,
  Save,
  X,
  Crown,
  Coins,
  Package,
  Gift,
  Users,
  Share2,
  Settings,
  Camera,
  Trophy,
  Target,
  Zap,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Smartphone,
  Monitor,
  Tablet,
  Palette,
  Image,
  Upload,
  Heart,
  MessageCircle,
  Eye,
  ThumbsUp,
  Flame,
  Sparkles,
  Gem,
  Zap as ZapIcon,
  TrendingUp as TrendingIcon,
  BarChart3,
  PieChart,
  Circle,
  Plus,
  Minus,
  RotateCcw,
  Maximize2,
  Minimize2,
  Filter,
  Search,
  Bell,
  Shield,
  Lock,
  Unlock,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Download,
  RefreshCw,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Star as StarIcon,
  Lightbulb
} from "lucide-react";
import { cn } from "../utils/cn";
import { EnhancedInviteProfile } from "../components/profile/EnhancedInviteProfile";
import { InviteShareModal } from "../components/profile/InviteShareModal";
import { PageErrorBoundary } from "../components/PageErrorBoundary";
import { TabNavigation } from "../components/profile/TabNavigation";
import { useMobileOptimizations } from "../components/MobileOptimizations";
import { useEnhancedTouch } from "../hooks/useEnhancedTouch";
import { useProfileRealtime } from "../hooks/useProfileRealtime";
import { REALTIME_CONFIG } from "../config/realtime";
import { useProfile } from "../hooks/useProfile";
import { useCookieClickerStore } from "../store/cookieClicker";
import { useIsVip } from "../hooks/useIsVip";
import { checkNicknameSet, setNickname } from "../api/cookieClicker";
import { useToastStore } from "../store/toast";
import { useNavigate } from "react-router-dom";
import { useTelegramProfile } from "../hooks/useTelegramProfile";
import { useDisplayName } from "../hooks/useDisplayName";
import { NotificationSettings } from "../components/profile/NotificationSettings";

// Lazy load components for better performance
const ProfileSkeleton = lazy(() => import("../components/skeletons/HomePageSkeleton").then(module => ({ default: module.HomePageSkeleton })));
const TicketsSectionLazy = lazy(() => import("../components/profile/TicketsSection").then(module => ({ default: module.TicketsSection })));
const OrdersSectionLazy = lazy(() => import("../components/profile/OrdersSection").then(module => ({ default: module.OrdersSection })));
const InterestsSectionLazy = lazy(() => import("../components/profile/InterestsSection").then(module => ({ default: module.InterestsSection })));
const ProfileHeaderLazy = lazy(() => import("../components/profile/ProfileHeader").then(module => ({ default: module.ProfileHeader })));
const StatsDashboardLazy = lazy(() => import("../components/profile/StatsDashboard").then(module => ({ default: module.StatsDashboard })));
const ActivityTimelineLazy = lazy(() => import("../components/profile/ActivityTimeline").then(module => ({ default: module.ActivityTimeline })));
const OverviewDashboardLazy = lazy(() => import("../components/profile/OverviewDashboard").then(module => ({ default: module.OverviewDashboard })));

export const ProfilePage = () => {
  const { profile, isLoading: isProfileLoading, updateProfile, isUpdating } = useProfile();
  const coinsBalance = useShopStore((state) => state.coinsBalance);
  const invite = useShopStore((state) => state.invite);
  const { isMobile } = useMobileOptimizations();
  const { triggerHaptic } = useEnhancedTouch();
  const { executeCommand } = useBotCommandHandler();

  // Get additional data from stores
  const drops = useDropsStore((state: any) => state.drops);
  const achievements = useAchievementStore((state: any) => state.achievements);

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

  // Load Cookie Clicker nickname
  useEffect(() => {
    const loadCookieNickname = async () => {
      try {
        const result = await checkNicknameSet();
        setCookieNickname(result.nickname);
        if (result.nickname) {
          setCookieNicknameInput(result.nickname);
        }
      } catch (error) {
        // Silently fail
        if (import.meta.env.DEV) {
          console.warn('Failed to load cookie nickname:', error);
        }
      }
    };
    loadCookieNickname();
  }, []);

  // Realtime profile updates (optional - graceful degradation if WebSocket unavailable)
  const {
    coins: liveCoins,
    inviteCount: liveInviteCount,
    recentActivity: liveActivity,
    isConnected: realtimeConnected,
    lastUpdate: realtimeLastUpdate,
    error: realtimeError,
    isLoading: realtimeLoading,
    clearError: clearRealtimeError
  } = useProfileRealtime({
    enabled: REALTIME_CONFIG.ENABLE_REALTIME,
    autoRefresh: REALTIME_CONFIG.ENABLE_AUTO_REFRESH,
    refreshInterval: REALTIME_CONFIG.AUTO_REFRESH_INTERVAL
  });

  // Use live coins if available, otherwise fallback to store
  const displayCoins = liveCoins || coinsBalance;
  
  // Telegram profile integration
  const {
    telegramData,
    displayName: telegramDisplayName,
    avatar: telegramAvatar,
    isLoading: isLoadingTelegram,
    syncTelegramData,
  } = useTelegramProfile({
    enabled: true,
    autoSync: true,
    syncInterval: 60000, // 1 minute
  });

  // Display name logic (Cookie Nickname vs Telegram Name) - Profile context
  const {
    displayName: profileDisplayName,
    profileName,
    needsNicknameForLeaderboard,
    hasNickname,
  } = useDisplayName({
    context: 'profile',
    showFallback: true,
  });

  // Display name for leaderboard context
  const {
    displayName: rankDisplayName,
    leaderboardName,
    needsNicknameForLeaderboard: needsRankNickname,
    hasNickname: hasRankNickname,
  } = useDisplayName({
    context: 'leaderboard',
    showFallback: true,
  });
  
  const [isEditing, setIsEditing] = useState(false);
  // New hierarchical tab system: main tabs with sub-tabs
  type MainTabId = 'dashboard' | 'orders' | 'tickets' | 'achievements' | 'invite' | 'loyalty';
  type SubTabId = 'overview' | 'stats' | 'activity' | 'orders-list' | 'interests' | 'achievements-list' | 'rank';
  
  const [activeMainTab, setActiveMainTab] = useState<MainTabId>('dashboard');
  const [activeSubTab, setActiveSubTab] = useState<SubTabId>('overview');
  
  // Legacy activeTab for backward compatibility during transition
  // Initialize to match the default main/sub tab
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'interests' | 'invite' | 'rank' | 'tickets' | 'stats' | 'achievements' | 'activity' | 'gallery' | 'loyalty'>('overview');
  
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<'dark' | 'neon' | 'cosmic'>('dark');
  const [showInsights, setShowInsights] = useState(true);
  
  // Collapsible sections state for better organization
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    stats: false,
    achievements: false,
    activity: false,
    loyalty: false,
    cookieClicker: false,
  });
  
  const toggleSection = useCallback((section: string) => {
    triggerHaptic('light');
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, [triggerHaptic]);
  
  // Cookie Clicker state
  const [cookieNickname, setCookieNickname] = useState<string | null>(null);
  const [isEditingCookieNickname, setIsEditingCookieNickname] = useState(false);
  const [cookieNicknameInput, setCookieNicknameInput] = useState('');
  const [isUpdatingCookieNickname, setIsUpdatingCookieNickname] = useState(false);
  
  const { isVip, userRank } = useIsVip();
  const isStammkunde = userRank === 'Stammkunde';
  const canChangeNickname = isVip || isStammkunde;
  const navigate = useNavigate();
  const addToast = useToastStore(state => state.addToast);
  
  // Cookie Clicker stats
  const totalCookies = useCookieClickerStore(state => state.totalCookies);
  const cookiesPerSecond = useCookieClickerStore(state => state.cookiesPerSecond);
  const timePlayed = useCookieClickerStore(state => state.timePlayed);

  // Initialize profile data with Telegram data if available - optimized dependencies
  const initialProfileData = useMemo(() => ({
    name: profileDisplayName || profile?.name || telegramDisplayName || "Nebula User",
    email: profile?.email || "user@nebulasupply.com",
    phone: "+49 123 456789",
    location: "Berlin, Deutschland",
    joinDate: "Januar 2025",
    bio: profile?.bio || "Leidenschaftlicher Sneaker-Sammler und Drop-Jäger 🔥",
    avatar: (telegramAvatar || (profile?.avatar as string | null)) ?? null,
    theme: 'dark' as 'dark' | 'neon' | 'cosmic',
    preferences: {
      notifications: true,
      sounds: true,
      animations: true,
      autoRefresh: false,
    },
    social: {
      followers: 47,
      following: 23,
      likes: 156,
      shares: 28,
    },
    stats: {
      totalDrops: 24,
      wonDrops: 7,
      totalCoins: coinsBalance,
      rank: 47,
      streak: 12,
      favoriteBrand: 'Nike',
    }
  }), [
    profileDisplayName, 
    profile?.name, 
    telegramDisplayName, 
    telegramAvatar, 
    profile?.email, 
    profile?.bio, 
    profile?.avatar, 
    coinsBalance
  ]);

  const [profileData, setProfileData] = useState(initialProfileData);
  
  // Update profile data when Telegram data changes
  useEffect(() => {
    if (telegramDisplayName || telegramAvatar) {
      setProfileData(prev => ({
        ...prev,
        name: profileDisplayName || prev.name,
        avatar: telegramAvatar || prev.avatar,
      }));
    }
  }, [telegramDisplayName, telegramAvatar, profileDisplayName]);

  const [editedData, setEditedData] = useState(profileData);

  // Pre-calculate expensive values outside useMemo
  const participatedDrops = useMemo(() => 
    drops.filter((drop: any) => drop.interest && drop.interest > 0).length,
    [drops]
  );
  const wonDrops = useMemo(() => 
    drops.filter((drop: any) => drop.status === 'locked' && drop.progress >= 1).length,
    [drops]
  );

  // Enhanced stats calculation with real data - optimized with memoization
  const stats = useMemo(() => {
    const totalInvites = liveInviteCount ?? (invite?.totalReferrals ?? 0);

    return [
      {
        label: "Gesammelte Coins",
        value: String(displayCoins),
        icon: Coins,
        color: "from-yellow-400 to-orange-500",
        change: "+127",
        changeType: "positive" as const,
        live: true
      },
      {
        label: "Einladungen",
        value: String(totalInvites),
        icon: Users,
        color: "from-purple-400 to-pink-500",
        change: totalInvites > 0 ? "+3" : "+0",
        changeType: "positive" as const,
        live: true
      },
      {
        label: "Drops teilgenommen",
        value: String(participatedDrops),
        icon: Package,
        color: "from-blue-400 to-cyan-500",
        change: participatedDrops > 0 ? "+2" : "+0",
        changeType: "positive" as const,
        live: false
      },
      {
        label: "Gewonnene Drops",
        value: String(wonDrops),
        icon: Award,
        color: "from-emerald-400 to-teal-500",
        change: wonDrops > 0 ? "+1" : "+0",
        changeType: "positive" as const,
        live: false
      },
    ];
  }, [displayCoins, liveInviteCount, invite, participatedDrops, wonDrops]);

  // Enhanced achievements with real data
  const userAchievements = useMemo(() => [
    {
      name: "Early Adopter",
      description: "Zu den ersten 100 Mitgliedern",
      icon: Crown,
      color: "text-yellow-400",
      unlocked: true,
      progress: 100,
      maxProgress: 100
    },
    {
      name: "Drop Master",
      description: "5+ Drops gewonnen",
      icon: Award,
      color: "text-purple-400",
      unlocked: stats[3].value !== "0",
      progress: Math.min(parseInt(stats[3].value) * 20, 100),
      maxProgress: 100
    },
    {
      name: "Social Star",
      description: "10+ Freunde eingeladen",
      icon: Star,
      color: "text-pink-400",
      unlocked: parseInt(stats[1].value) >= 10,
      progress: Math.min(parseInt(stats[1].value) * 10, 100),
      maxProgress: 100
    },
    {
      name: "Shopping Pro",
      description: "20+ Produkte gekauft",
      icon: ShoppingBag,
      color: "text-blue-400",
      unlocked: false,
      progress: 0,
      maxProgress: 100
    },
  ], [stats]);

  // Recent activity with more variety
  const recentActivity = useMemo(() => [
    {
      action: "Drop gewonnen",
      item: "Nike Dunk Low Panda",
      date: "Vor 2 Tagen",
      icon: Gift,
      type: "success" as const,
      points: 500
    },
    {
      action: "Coins gesammelt",
      item: "+500 Coins",
      date: "Vor 3 Tagen",
      icon: Coins,
      type: "coins" as const,
      points: 500
    },
    {
      action: "Freund eingeladen",
      item: "Max M.",
      date: "Vor 5 Tagen",
      icon: Users,
      type: "invite" as const,
      points: 100
    },
    {
      action: "Profil aktualisiert",
      item: "Neues Profilbild",
      date: "Vor 1 Woche",
      icon: Camera,
      type: "update" as const,
      points: 0
    },
  ], []);

  // Neue hierarchische Tab-Struktur mit Haupt- und Sub-Tabs
  const mainTabs = [
    {
      id: 'dashboard' as const,
      label: 'Dashboard',
      icon: BarChart3,
      subTabs: [
        { id: 'overview' as const, label: 'Übersicht', icon: User },
        { id: 'stats' as const, label: 'Statistiken', icon: BarChart3 },
        { id: 'activity' as const, label: 'Aktivität', icon: Activity },
      ]
    },
    {
      id: 'orders' as const,
      label: 'Bestellungen',
      icon: Package,
      subTabs: [
        { id: 'orders-list' as const, label: 'Bestellungen', icon: Package },
        { id: 'interests' as const, label: 'Interessen', icon: Heart },
      ]
    },
    {
      id: 'tickets' as const,
      label: 'Tickets',
      icon: MessageCircle,
      subTabs: [] // Tickets ist jetzt ein eigenständiger Haupt-Tab
    },
    {
      id: 'achievements' as const,
      label: 'Erfolge',
      icon: Award,
      subTabs: [
        { id: 'achievements-list' as const, label: 'Erfolge', icon: Award },
        { id: 'rank' as const, label: 'Rang', icon: Trophy },
      ]
    },
    {
      id: 'invite' as const,
      label: 'InviteSystem',
      icon: Share2,
      subTabs: [] // InviteSystem ist jetzt ein eigenständiger Haupt-Tab
    },
    {
      id: 'loyalty' as const,
      label: 'Treueprogramm',
      icon: Crown,
      subTabs: [] // No sub-tabs for loyalty
    },
  ];

  // Legacy tabs for backward compatibility
  const tabs = [
    { id: 'overview' as const, label: 'Übersicht', icon: User },
    { id: 'orders' as const, label: 'Bestellungen', icon: Package },
    { id: 'interests' as const, label: 'Interessen', icon: Heart },
    { id: 'tickets' as const, label: 'Tickets', icon: MessageCircle },
    { id: 'invite' as const, label: 'InviteSystem', icon: Share2 },
    { id: 'rank' as const, label: 'Rang', icon: Trophy },
    { id: 'stats' as const, label: 'Statistiken', icon: BarChart3 },
    { id: 'achievements' as const, label: 'Erfolge', icon: Award },
    { id: 'activity' as const, label: 'Aktivität', icon: Activity },
    { id: 'loyalty' as const, label: 'Treueprogramm', icon: Crown },
  ];

  // Enhanced handlers with haptic feedback
  const handleEdit = () => {
    triggerHaptic('light');
    setIsEditing(true);
    setEditedData(profileData);
  };

  const handleSave = () => {
    triggerHaptic('success');
    setProfileData(editedData);
    updateProfile({ name: editedData.name, bio: editedData.bio }).finally(() => {
      setIsEditing(false);
    });
  };

  const handleCancel = () => {
    triggerHaptic('light');
    setEditedData(profileData);
    setIsEditing(false);
  };

  // New tab handlers for hierarchical system
  const handleMainTabChange = (mainTabId: MainTabId) => {
    triggerHaptic('light');
    setActiveMainTab(mainTabId);
    // Set default sub-tab when main tab changes
    const mainTab = mainTabs.find(t => t.id === mainTabId);
    if (mainTab && mainTab.subTabs.length > 0) {
      setActiveSubTab(mainTab.subTabs[0].id);
      mapToLegacyTab(mainTabId, mainTab.subTabs[0].id);
    } else {
      // Tabs without sub-tabs (tickets, loyalty)
      setActiveSubTab('overview'); // fallback
      mapToLegacyTab(mainTabId);
    }
  };

  const handleSubTabChange = (subTabId: SubTabId) => {
    triggerHaptic('light');
    setActiveSubTab(subTabId);
    // Update legacy activeTab for backward compatibility
    mapToLegacyTab(activeMainTab, subTabId);
  };

  // Map new tab system to legacy tab system for backward compatibility
  const mapToLegacyTab = (mainTab: MainTabId, subTab?: SubTabId) => {
    // If main tab has no sub-tabs, map directly
    if (mainTab === 'tickets') {
      setActiveTab('tickets');
      return;
    }
    if (mainTab === 'loyalty') {
      setActiveTab('loyalty');
      return;
    }
    if (mainTab === 'invite') {
      setActiveTab('invite');
      return;
    }
    
    if (!subTab) return;
    
    const mapping: Record<string, typeof activeTab> = {
      'overview': 'overview',
      'stats': 'stats',
      'activity': 'activity',
      'orders-list': 'orders',
      'interests': 'interests',
      'achievements-list': 'achievements',
      'rank': 'rank',
    };
    const legacyTab = mapping[subTab] || 'overview';
    setActiveTab(legacyTab);
  };

  // Legacy handler for backward compatibility
  const handleTabChange = (tab: typeof activeTab) => {
    triggerHaptic('light');
    setActiveTab(tab);
    // Map legacy tab to new system
    const mainTabMapping: Record<typeof tab, MainTabId> = {
      'overview': 'dashboard',
      'stats': 'dashboard',
      'activity': 'dashboard',
      'orders': 'orders',
      'tickets': 'tickets', // Tickets ist jetzt eigenständig
      'achievements': 'achievements',
      'rank': 'achievements',
      'gallery': 'achievements', // Legacy support - wird zu achievements-list gemappt
      'invite': 'invite', // InviteSystem ist jetzt eigenständig
      'interests': 'orders', // Interessen zu Bestellungen verschoben
      'loyalty': 'loyalty',
    };
    const subTabMapping: Record<typeof tab, SubTabId> = {
      'overview': 'overview',
      'stats': 'stats',
      'activity': 'activity',
      'orders': 'orders-list',
      'tickets': 'overview', // fallback für tickets (hat keine sub-tabs)
      'achievements': 'achievements-list',
      'rank': 'rank',
      'gallery': 'achievements-list', // Legacy: Galerie zu achievements-list
      'invite': 'overview', // fallback für invite (hat keine sub-tabs)
      'interests': 'interests',
      'loyalty': 'overview', // fallback
    };
    setActiveMainTab(mainTabMapping[tab]);
    setActiveSubTab(subTabMapping[tab]);
  };

  const handleAvatarChange = () => {
    triggerHaptic('medium');
    setShowAvatarModal(true);
  };

  const handleShareInvite = () => {
    triggerHaptic('medium');
    setShowInviteModal(true);
  };

  const handleSettings = () => {
    triggerHaptic('medium');
    setShowSettingsModal(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    // Handle file drop logic here
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleAvatarUpload(files[0]);
    }
  };

  const handleAvatarUpload = (file: File) => {
    triggerHaptic('success');
    // Simulate avatar upload
    const reader = new FileReader();
    reader.onload = (e) => {
      setProfileData(prev => ({ ...prev, avatar: e.target?.result as string }));
      setShowAvatarModal(false);
    };
    reader.readAsDataURL(file);
  };

  const handleThemeChange = (theme: 'dark' | 'neon' | 'cosmic') => {
    triggerHaptic('light');
    setSelectedTheme(theme);
    setProfileData(prev => ({ ...prev, theme }));
  };

  const toggleInsight = () => {
    triggerHaptic('light');
    setShowInsights(!showInsights);
  };

  // Cookie Clicker nickname handlers
  const handleEditCookieNickname = () => {
    triggerHaptic('light');
    setIsEditingCookieNickname(true);
    setCookieNicknameInput(cookieNickname || '');
  };

  const handleSaveCookieNickname = async () => {
    const trimmed = cookieNicknameInput.trim();
    
    if (!trimmed) {
      addToast({
        type: 'error',
        title: 'Fehler',
        message: 'Nickname darf nicht leer sein',
        duration: 3000
      });
      return;
    }
    
    if (trimmed.length < 3) {
      addToast({
        type: 'error',
        title: 'Fehler',
        message: 'Nickname muss mindestens 3 Zeichen lang sein',
        duration: 3000
      });
      return;
    }
    
    if (trimmed.length > 20) {
      addToast({
        type: 'error',
        title: 'Fehler',
        message: 'Nickname darf maximal 20 Zeichen lang sein',
        duration: 3000
      });
      return;
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      addToast({
        type: 'error',
        title: 'Fehler',
        message: 'Nickname darf nur Buchstaben, Zahlen, Unterstriche und Bindestriche enthalten',
        duration: 3000
      });
      return;
    }

    setIsUpdatingCookieNickname(true);
    triggerHaptic('medium');
    
    try {
      await setNickname(trimmed);
      setCookieNickname(trimmed);
      setIsEditingCookieNickname(false);
      addToast({
        type: 'success',
        title: 'Nickname aktualisiert',
        message: 'Dein Cookie Clicker Nickname wurde erfolgreich geändert!',
        duration: 5000
      });
      triggerHaptic('success');
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Fehler',
        message: error.message || 'Fehler beim Aktualisieren des Nicknames',
        duration: 5000
      });
      triggerHaptic('error');
    } finally {
      setIsUpdatingCookieNickname(false);
    }
  };

  const handleCancelCookieNickname = () => {
    triggerHaptic('light');
    setIsEditingCookieNickname(false);
    setCookieNicknameInput(cookieNickname || '');
  };

  const handleGoToLeaderboard = () => {
    triggerHaptic('medium');
    navigate('/cookie-clicker?tab=leaderboard');
  };

  // Format time played
  const formatTimePlayed = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  // Format large numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000000000) {
      return `${(num / 1000000000).toFixed(2)}B`;
    } else if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(2)}K`;
    }
    return num.toLocaleString();
  };

  // Erweiterte Insights-Berechnung
  const insights = useMemo(() => {
    const winRate = profileData.stats.wonDrops / profileData.stats.totalDrops * 100;
    const avgCoinsPerDay = profileData.stats.totalCoins / 30; // Assuming 30 days active
    const socialEngagement = profileData.social.likes + profileData.social.shares;
    const rankProgress = ((profileData.stats.rank - 1) / 100) * 100; // Assuming top 100

    return [
      {
        type: 'success',
        title: 'Drop Master',
        description: `Deine Gewinnrate liegt bei ${winRate.toFixed(1)}% - über dem Durchschnitt!`,
        icon: Trophy,
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/20',
        action: 'Mehr Drops versuchen',
        actionType: 'primary',
      },
      {
        type: 'info',
        title: 'Täglicher Durchschnitt',
        description: `Du verdienst ca. ${Math.round(avgCoinsPerDay)} Coins pro Tag`,
        icon: TrendingIcon,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/20',
        action: 'Tägliche Ziele setzen',
        actionType: 'secondary',
      },
      {
        type: 'social',
        title: 'Insider Star',
        description: `${socialEngagement} Interaktionen in den letzten 30 Tagen`,
        icon: Heart,
        color: 'text-pink-400',
        bgColor: 'bg-pink-500/20',
        action: 'Mehr teilen',
        actionType: 'social',
      },
      {
        type: 'rank',
        title: 'Rank Progress',
        description: `Du bist #${profileData.stats.rank} von 100 - ${rankProgress.toFixed(1)}% zum nächsten Rang`,
        icon: Crown,
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/20',
        action: 'Rank verbessern',
        actionType: 'rank',
      },
    ];
  }, [profileData]);

  // Achievement-Galerie Daten
  const achievementGallery = useMemo(() => [
    {
      id: 1,
      name: 'Erster Drop',
      description: 'Dein erster gewonnener Drop',
      icon: Gift,
      rarity: 'common',
      unlockedAt: '2025-01-15',
      points: 100,
    },
    {
      id: 2,
      name: 'Coin Collector',
      description: '1000 Coins gesammelt',
      icon: Coins,
      rarity: 'rare',
      unlockedAt: '2025-01-20',
      points: 500,
    },
    {
      id: 3,
      name: 'Social Butterfly',
      description: '10 Freunde eingeladen',
      icon: Users,
      rarity: 'epic',
      unlockedAt: '2025-01-25',
      points: 1000,
    },
  ], []);

  // Render tab content based on active tab
  // The new hierarchical system updates activeTab through mapToLegacyTab
  // So we can use the existing switch statement
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <PageErrorBoundary
            pageName="OverviewTab"
            fallback={<div className="p-4 text-sm text-gray-300">Übersicht konnte nicht geladen werden.</div>}
          >
            {isProfileLoading ? (
              <div className="space-y-6" role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
                <motion.div 
                  className="flex items-center justify-center py-12"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="flex flex-col items-center gap-4">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader2 className="w-10 h-10 text-purple-400 drop-shadow-lg" />
                    </motion.div>
                    <motion.p 
                      className="text-gray-300 font-medium"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      Profil wird geladen...
                    </motion.p>
                  </div>
                </motion.div>
                {/* Premium Loading Skeletons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <motion.div 
                      key={i} 
                      className="h-40 backdrop-blur-md bg-gradient-to-br from-slate-800/60 to-slate-700/40 rounded-2xl border border-white/10 relative overflow-hidden"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.2, type: "spring" }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                    </motion.div>
                  ))}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <motion.div 
                      key={i} 
                      className="h-28 backdrop-blur-md bg-gradient-to-br from-slate-800/60 to-slate-700/40 rounded-2xl border border-white/10 relative overflow-hidden"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + i * 0.1, type: "spring" }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6" role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
            {/* Smart Insights Toggle - Premium Glassmorphism */}
            {showInsights && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className={cn(
                  "relative overflow-hidden rounded-3xl backdrop-blur-2xl bg-gradient-to-br from-purple-900/30 via-blue-900/20 to-purple-900/30 border border-purple-500/30 shadow-2xl group",
                  "p-4 sm:p-5 md:p-6"
                )}
              >
                {/* Animated Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" />
                
                <div className="relative z-10 flex items-center justify-between mb-4">
                  <h3 className={cn(
                    "font-bold text-white flex items-center gap-3",
                    "text-base sm:text-lg"
                  )}>
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                      <Sparkles className="w-6 h-6 text-purple-400 drop-shadow-lg" />
                    </motion.div>
                    Deine Insights
                  </h3>
                  <motion.button
                    onClick={toggleInsight}
                    whileHover={{ scale: 1.1, rotate: 180 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 rounded-xl backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 transition-all duration-300 touch-target"
                    aria-label="Insights ausblenden"
                  >
                    <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                  </motion.button>
                </div>
                <div className={cn(
                  "grid gap-4",
                  "grid-cols-1",
                  "sm:grid-cols-2",
                  "md:grid-cols-2",
                  "lg:grid-cols-3",
                  "xl:grid-cols-3"
                )}>
                  {insights.map((insight, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
                      whileHover={{ scale: 1.05, y: -4 }}
                      className={cn(
                        "flex items-start gap-3 rounded-2xl transition-all duration-300 relative overflow-hidden backdrop-blur-md border border-white/10 shadow-lg",
                        insight.bgColor,
                        "hover:shadow-xl hover:border-white/20",
                        "p-3 sm:p-4",
                        "touch-target"
                      )}
                    >
                      {/* Shine Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                      
                      <motion.div
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 3, repeat: Infinity, delay: index * 0.5 }}
                      >
                        <insight.icon className={cn("w-6 h-6 mt-0.5 drop-shadow-lg", insight.color)} />
                      </motion.div>
                      <div className="relative z-10">
                        <p className="text-sm font-bold text-white mb-1">{insight.title}</p>
                        <p className="text-xs text-gray-300 leading-relaxed">{insight.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Live Stats - Featured - Premium Glassmorphism */}
            <div className={cn(
              "grid gap-4 mb-6",
              "grid-cols-1",
              "md:grid-cols-2",
              "md:gap-6"
            )}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                whileHover={{ scale: 1.02, y: -4 }}
                className={cn(
                  "relative overflow-hidden rounded-3xl backdrop-blur-2xl bg-gradient-to-br from-yellow-900/40 via-orange-900/30 to-yellow-900/40 border border-yellow-500/40 shadow-2xl group",
                  "p-4 sm:p-6 md:p-8"
                )}
              >
                {/* Animated Gradient Overlay */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 via-transparent to-transparent"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                
                {/* Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-500 rounded-3xl opacity-0 group-hover:opacity-30 blur-2xl transition-opacity duration-500" />
                
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <motion.div
                        animate={{ rotate: [0, 15, -15, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
                      >
                        <Coins className="w-6 h-6 text-yellow-400 drop-shadow-lg" />
                      </motion.div>
                      <span className="text-sm text-gray-300 font-semibold">{REALTIME_CONFIG.ENABLE_REALTIME ? 'Live Coins' : 'Coins'}</span>
                      {REALTIME_CONFIG.ENABLE_REALTIME && realtimeConnected && (
                        <motion.div 
                          className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-lg shadow-green-400/50"
                          animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                      )}
                    </div>
                    <motion.p
                      key={displayCoins}
                      initial={{ scale: 1.1, y: 10 }}
                      animate={{ scale: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 400 }}
                      className={cn(
                        "font-black text-white mb-2 bg-gradient-to-r from-yellow-200 via-yellow-100 to-white bg-clip-text text-transparent drop-shadow-lg",
                        "text-3xl sm:text-4xl md:text-5xl"
                      )}
                    >
                      {displayCoins.toLocaleString('de-DE')}
                    </motion.p>
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm text-green-400 font-medium flex items-center gap-1"
                    >
                      <TrendingUp className="w-3 h-3" />
                      +127 heute
                    </motion.p>
                  </div>
                  <motion.div 
                    className="p-4 rounded-2xl backdrop-blur-md bg-yellow-500/30 border border-yellow-400/30 shadow-xl"
                    whileHover={{ rotate: 12, scale: 1.1 }}
                  >
                    <Sparkles className="w-10 h-10 text-yellow-300 drop-shadow-lg" />
                  </motion.div>
                </div>
              </motion.div>

              <motion.div
                key={liveInviteCount}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                whileHover={{ scale: 1.02, y: -4 }}
                className={cn(
                  "relative overflow-hidden rounded-3xl backdrop-blur-2xl bg-gradient-to-br from-purple-900/40 via-pink-900/30 to-purple-900/40 border border-purple-500/40 shadow-2xl group",
                  "p-4 sm:p-6 md:p-8"
                )}
              >
                {/* Animated Gradient Overlay */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-transparent to-transparent"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                />
                
                {/* Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-3xl opacity-0 group-hover:opacity-30 blur-2xl transition-opacity duration-500" />
                
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <motion.div
                        animate={{ rotate: [0, -15, 15, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
                      >
                        <Users className="w-6 h-6 text-purple-400 drop-shadow-lg" />
                      </motion.div>
                      <span className="text-sm text-gray-300 font-semibold">Einladungen</span>
                      {REALTIME_CONFIG.ENABLE_REALTIME && realtimeConnected && (
                        <motion.div 
                          className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-lg shadow-green-400/50"
                          animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                      )}
                    </div>
                    <motion.p
                      key={liveInviteCount ?? invite?.totalReferrals}
                      initial={{ scale: 1.1, y: 10 }}
                      animate={{ scale: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 400 }}
                      className={cn(
                        "font-black text-white mb-2 bg-gradient-to-r from-purple-200 via-pink-100 to-white bg-clip-text text-transparent drop-shadow-lg",
                        "text-3xl sm:text-4xl md:text-5xl"
                      )}
                    >
                      {(liveInviteCount ?? (invite?.totalReferrals ?? 0))}
                    </motion.p>
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm text-purple-400 font-medium flex items-center gap-1"
                    >
                      <TrendingUp className="w-3 h-3" />
                      +3 diese Woche
                    </motion.p>
                  </div>
                  <motion.div 
                    className="p-4 rounded-2xl backdrop-blur-md bg-purple-500/30 border border-purple-400/30 shadow-xl"
                    whileHover={{ rotate: -12, scale: 1.1 }}
                  >
                    <Share2 className="w-10 h-10 text-purple-300 drop-shadow-lg" />
                  </motion.div>
                </div>
              </motion.div>
            </div>

            {/* Quick Actions Dashboard - Premium Glassmorphism */}
            <div className={cn(
              "grid gap-3 sm:gap-4",
              "grid-cols-2",
              "sm:grid-cols-2",
              "md:grid-cols-2",
              "lg:grid-cols-4"
            )}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, type: "spring" }}
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('orders')}
                className={cn(
                  "relative overflow-hidden rounded-2xl backdrop-blur-xl bg-gradient-to-br from-blue-900/40 to-cyan-900/30 border border-blue-500/40 shadow-xl cursor-pointer group touch-target",
                  "p-3 sm:p-4 md:p-5"
                )}
              >
                {/* Animated Background */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
                
                {/* Glow Effect */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl opacity-0 group-hover:opacity-30 blur-lg transition-opacity duration-300" />
                
                <div className="relative z-10 flex flex-col gap-3">
                  <motion.div 
                    className="p-3 rounded-xl backdrop-blur-md bg-blue-500/30 border border-blue-400/30 w-fit"
                    whileHover={{ rotate: 12, scale: 1.1 }}
                  >
                    <Package className="w-6 h-6 text-blue-300 drop-shadow-lg" />
                  </motion.div>
                  <div>
                    <p className="text-sm font-bold text-white mb-1">Bestellungen</p>
                    <p className="text-xs text-blue-200/80">Verfolge deine Orders</p>
                  </div>
                </div>
                <motion.div 
                  className="absolute -top-2 -right-2 w-5 h-5 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50"
                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0.8, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, type: "spring" }}
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('interests')}
                className={cn(
                  "relative overflow-hidden rounded-2xl backdrop-blur-xl bg-gradient-to-br from-purple-900/40 to-violet-900/30 border border-purple-500/40 shadow-xl cursor-pointer group touch-target",
                  "p-3 sm:p-4 md:p-5"
                )}
              >
                {/* Animated Background */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-violet-500/20"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
                
                {/* Glow Effect */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-violet-500 rounded-2xl opacity-0 group-hover:opacity-30 blur-lg transition-opacity duration-300" />
                
                <div className="relative z-10 flex flex-col gap-3">
                  <motion.div 
                    className="p-3 rounded-xl backdrop-blur-md bg-purple-500/30 border border-purple-400/30 w-fit"
                    whileHover={{ rotate: -12, scale: 1.1 }}
                  >
                    <Heart className="w-6 h-6 text-purple-300 drop-shadow-lg fill-purple-300" />
                  </motion.div>
                  <div>
                    <p className="text-sm font-bold text-white mb-1">Interessen</p>
                    <p className="text-xs text-purple-200/80">Gespeicherte Items</p>
                  </div>
                </div>
                <motion.div 
                  className="absolute -top-2 -right-2 w-5 h-5 bg-purple-500 rounded-full shadow-lg shadow-purple-500/50"
                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0.8, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, type: "spring" }}
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('rank')}
                className={cn(
                  "relative overflow-hidden rounded-2xl backdrop-blur-xl bg-gradient-to-br from-green-900/40 to-emerald-900/30 border border-green-500/40 shadow-xl cursor-pointer group touch-target",
                  "p-3 sm:p-4 md:p-5"
                )}
              >
                {/* Animated Background */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
                
                {/* Glow Effect */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl opacity-0 group-hover:opacity-30 blur-lg transition-opacity duration-300" />
                
                <div className="relative z-10 flex flex-col gap-3">
                  <motion.div 
                    className="p-3 rounded-xl backdrop-blur-md bg-green-500/30 border border-green-400/30 w-fit"
                    whileHover={{ rotate: 12, scale: 1.1 }}
                  >
                    <Trophy className="w-6 h-6 text-green-300 drop-shadow-lg" />
                  </motion.div>
                  <div>
                    <p className="text-sm font-bold text-white mb-1">Rang</p>
                    <p className="text-xs text-green-200/80">Dein Level</p>
                  </div>
                </div>
                <motion.div 
                  className="absolute -top-2 -right-2 w-5 h-5 bg-green-500 rounded-full shadow-lg shadow-green-500/50"
                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0.8, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, type: "spring" }}
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('invite')}
                className={cn(
                  "relative overflow-hidden rounded-2xl backdrop-blur-xl bg-gradient-to-br from-orange-900/40 to-amber-900/30 border border-orange-500/40 shadow-xl cursor-pointer group touch-target",
                  "p-3 sm:p-4 md:p-5"
                )}
              >
                {/* Animated Background */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-amber-500/20"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
                
                {/* Glow Effect */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl opacity-0 group-hover:opacity-30 blur-lg transition-opacity duration-300" />
                
                <div className="relative z-10 flex flex-col gap-3">
                  <motion.div 
                    className="p-3 rounded-xl backdrop-blur-md bg-orange-500/30 border border-orange-400/30 w-fit"
                    whileHover={{ rotate: -12, scale: 1.1 }}
                  >
                    <Share2 className="w-6 h-6 text-orange-300 drop-shadow-lg" />
                  </motion.div>
                  <div>
                    <p className="text-sm font-bold text-white mb-1">Einladen</p>
                    <p className="text-xs text-orange-200/80">Freunde werben</p>
                  </div>
                </div>
                <motion.div 
                  className="absolute -top-2 -right-2 w-5 h-5 bg-orange-500 rounded-full shadow-lg shadow-orange-500/50"
                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0.8, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
                />
              </motion.div>
            </div>

            {/* Stats Overview Cards - Premium Glassmorphism - Collapsible */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-3xl backdrop-blur-2xl bg-gradient-to-br from-slate-900/50 via-purple-900/30 to-slate-900/50 border border-purple-500/30 shadow-2xl"
            >
              <button
                onClick={() => toggleSection('stats')}
                className={cn(
                  "w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors touch-target",
                  isMobile ? "p-3" : "p-5"
                )}
                aria-expanded={!collapsedSections.stats}
                aria-label="Statistiken Übersicht ein-/ausblenden"
              >
                <div className="flex items-center gap-3">
                  <BarChart3 className={cn("text-purple-400", isMobile ? "w-5 h-5" : "w-6 h-6")} />
                  <h3 className={cn("font-bold text-white", isMobile ? "text-base" : "text-lg")}>
                    Statistiken Übersicht
                  </h3>
                </div>
                <motion.div
                  animate={{ rotate: collapsedSections.stats ? 0 : 180 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown className={cn("text-gray-400", isMobile ? "w-4 h-4" : "w-5 h-5")} />
                </motion.div>
              </button>
              
              <AnimatePresence>
                {!collapsedSections.stats && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className={cn(
                      "grid gap-4 pb-4",
                      "grid-cols-1",
                      "sm:grid-cols-1",
                      "md:grid-cols-2",
                      "lg:grid-cols-3",
                      "px-3 sm:px-4 md:px-5",
                      "gap-4 md:gap-6"
                    )}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, type: "spring" }}
                whileHover={{ scale: 1.02, y: -4 }}
                className={cn(
                  "relative overflow-hidden backdrop-blur-2xl bg-gradient-to-br from-blue-900/40 via-cyan-900/30 to-blue-900/40 rounded-3xl border border-blue-500/40 shadow-2xl group",
                  "p-4 sm:p-5 md:p-6"
                )}
              >
                {/* Animated Background */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-transparent"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
                
                {/* Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" />
                
                <div className="relative z-10 flex items-center gap-4 mb-5">
                  <motion.div 
                    className="p-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-lg shadow-blue-500/50"
                    whileHover={{ rotate: 12, scale: 1.1 }}
                  >
                    <TrendingUp className="w-7 h-7 text-white drop-shadow-lg" />
                  </motion.div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">Aktivität</h3>
                    <p className="text-sm text-gray-300">Diese Woche</p>
                  </div>
                </div>
                <div className="relative z-10 space-y-3">
                  <div className="flex justify-between items-center p-2 rounded-lg backdrop-blur-sm bg-white/5">
                    <span className="text-sm text-gray-300">Bestellungen</span>
                    <span className="text-sm font-bold text-white">3</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg backdrop-blur-sm bg-white/5">
                    <span className="text-sm text-gray-300">Interessen</span>
                    <span className="text-sm font-bold text-white">7</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg backdrop-blur-sm bg-white/5">
                    <span className="text-sm text-gray-300">XP gesammelt</span>
                    <motion.span 
                      className="text-sm font-bold text-green-400 flex items-center gap-1"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <TrendingUp className="w-3 h-3" />
                      +127
                    </motion.span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, type: "spring" }}
                whileHover={{ scale: 1.02, y: -4 }}
                className={cn(
                  "relative overflow-hidden backdrop-blur-2xl bg-gradient-to-br from-purple-900/40 via-violet-900/30 to-purple-900/40 rounded-3xl border border-purple-500/40 shadow-2xl group",
                  "p-4 sm:p-5 md:p-6"
                )}
              >
                {/* Animated Background */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-violet-500/5 to-transparent"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
                />
                
                {/* Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-violet-500 rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" />
                
                <div className="relative z-10 flex items-center gap-4 mb-5">
                  <motion.div 
                    className="p-4 bg-gradient-to-br from-purple-500 to-violet-500 rounded-2xl shadow-lg shadow-purple-500/50"
                    whileHover={{ rotate: -12, scale: 1.1 }}
                  >
                    <Star className="w-7 h-7 text-white drop-shadow-lg fill-white" />
                  </motion.div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">Erfolge</h3>
                    <p className="text-sm text-gray-300">Errungenschaften</p>
                  </div>
                </div>
                <div className="relative z-10 space-y-3">
                  <div className="flex justify-between items-center p-2 rounded-lg backdrop-blur-sm bg-white/5">
                    <span className="text-sm text-gray-300">Freigeschaltet</span>
                    <span className="text-sm font-bold text-white">5/12</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg backdrop-blur-sm bg-white/5">
                    <span className="text-sm text-gray-300">Nächster</span>
                    <span className="text-sm font-bold text-yellow-400">Shopping Pro</span>
                  </div>
                  <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden backdrop-blur-sm">
                    <motion.div 
                      className="bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-500 h-3 rounded-full relative overflow-hidden"
                      initial={{ width: 0 }}
                      animate={{ width: '42%' }}
                      transition={{ duration: 1, delay: 0.5 }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                    </motion.div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, type: "spring" }}
                whileHover={{ scale: 1.02, y: -4 }}
                className={cn(
                  "relative overflow-hidden backdrop-blur-2xl bg-gradient-to-br from-green-900/40 via-emerald-900/30 to-green-900/40 rounded-3xl border border-green-500/40 shadow-2xl group",
                  "p-4 sm:p-5 md:p-6"
                )}
              >
                {/* Animated Background */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-transparent"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                />
                
                {/* Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" />
                
                <div className="relative z-10 flex items-center gap-4 mb-5">
                  <motion.div 
                    className="p-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl shadow-lg shadow-green-500/50"
                    whileHover={{ rotate: 12, scale: 1.1 }}
                  >
                    <Zap className="w-7 h-7 text-white drop-shadow-lg" />
                  </motion.div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">Streak</h3>
                    <p className="text-sm text-gray-300">Tägliche Aktivität</p>
                  </div>
                </div>
                <div className="relative z-10 space-y-3">
                  <div className="flex justify-between items-center p-2 rounded-lg backdrop-blur-sm bg-white/5">
                    <span className="text-sm text-gray-300">Aktuell</span>
                    <motion.span 
                      className="text-sm font-bold text-green-400"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      12 Tage
                    </motion.span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg backdrop-blur-sm bg-white/5">
                    <span className="text-sm text-gray-300">Rekord</span>
                    <span className="text-sm font-bold text-white">24 Tage</span>
                  </div>
                  <motion.div 
                    className="flex items-center gap-2 text-xs text-green-400 font-bold p-2 rounded-lg backdrop-blur-sm bg-green-500/10"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Flame className="w-4 h-4 animate-pulse" />
                    <span>On Fire!</span>
                  </motion.div>
                </div>
              </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Profile Header - Premium Glassmorphism */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
                className={cn(
                  "relative overflow-hidden rounded-3xl backdrop-blur-2xl",
                  "bg-gradient-to-br from-slate-900/80 via-purple-900/50 to-slate-900/80",
                  "border-2 border-purple-500/40 shadow-2xl shadow-purple-500/20",
                  "p-5 sm:p-7 md:p-9 lg:p-12",
                  "hover:border-purple-500/60 transition-all duration-500"
                )}
            >
              {/* Animated Background Gradient */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-pink-500/10 to-blue-500/20"
                animate={{ opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              
              {/* Glow Effect - Enhanced */}
              <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-3xl opacity-0 hover:opacity-30 blur-3xl transition-opacity duration-700" />
              
              {/* Animated Shine Effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                style={{ transform: 'skewX(-20deg)' }}
              />
              
              <div className={cn(
                "relative z-10",
                "flex flex-col lg:grid lg:grid-cols-[auto_1fr] items-center lg:items-start",
                "gap-7 md:gap-9 lg:gap-12"
              )}>
                {/* Avatar Section - Premium Enhanced */}
                <motion.div 
                  className="relative group"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <motion.div 
                    className={cn(
                      "rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 p-2 shadow-2xl shadow-purple-500/60",
                      "w-24 h-24 sm:w-28 sm:h-28 md:w-36 md:h-36 lg:w-44 lg:h-44",
                      "ring-4 ring-purple-500/30"
                    )}
                    animate={{ 
                      boxShadow: [
                        "0 0 30px rgba(168, 85, 247, 0.5)",
                        "0 0 60px rgba(168, 85, 247, 0.8)",
                        "0 0 30px rgba(168, 85, 247, 0.5)"
                      ],
                      ringOpacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center relative overflow-hidden backdrop-blur-md border-2 border-white/10">
                      {(profileData.avatar || telegramAvatar) ? (
                        <motion.img
                          src={telegramAvatar || profileData.avatar}
                          alt="Profile"
                          className="w-full h-full object-cover rounded-full"
                          initial={{ scale: 1 }}
                          whileHover={{ scale: 1.1 }}
                          transition={{ duration: 0.3 }}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <User className={cn(
                          "text-purple-400 drop-shadow-lg",
                          "w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-20 lg:h-20"
                        )} />
                      )}

                      {/* Online Status Indicator - Enhanced */}
                      <motion.div 
                        className={cn(
                          "absolute bottom-0 right-0 bg-emerald-500 rounded-full border-3 border-slate-900 shadow-lg shadow-emerald-500/50",
                          "w-4 h-4 sm:w-5 sm:h-5"
                        )}
                        animate={{ scale: [1, 1.2, 1], opacity: [1, 0.8, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      
                      {/* Telegram Sync Indicator */}
                      {isLoadingTelegram && (
                        <motion.div 
                          className="absolute inset-0 bg-slate-900/70 flex items-center justify-center rounded-full backdrop-blur-sm"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <Loader2 className="w-8 h-8 text-purple-400 animate-spin drop-shadow-lg" />
                        </motion.div>
                      )}
                    </div>
                  </motion.div>

                  {/* Enhanced Avatar Actions */}
                  <motion.div 
                    className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 flex gap-2"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <motion.button
                      onClick={handleAvatarChange}
                      whileHover={{ scale: 1.15, rotate: 12 }}
                      whileTap={{ scale: 0.9 }}
                      className={cn(
                        "p-2 sm:p-2.5 md:p-3 rounded-full transition-all duration-300 touch-target",
                        "bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700",
                        "border-2 border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-slate-900",
                        "shadow-xl hover:shadow-purple-500/50 backdrop-blur-md",
                        "min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:min-w-[40px]"
                      )}
                      aria-label="Profilbild ändern"
                      title="Profilbild ändern"
                    >
                      <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-white drop-shadow-lg" />
                    </motion.button>
                  </motion.div>

                  {/* Drag & Drop Overlay - Enhanced */}
                  {isDragOver && (
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-br from-purple-600/30 to-pink-600/30 rounded-full flex items-center justify-center backdrop-blur-md border-2 border-white/30"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <Upload className="w-10 h-10 text-white drop-shadow-lg" />
                      </motion.div>
                    </motion.div>
                  )}
            </motion.div>

            {/* Profile Info - Premium Enhanced */}
                <motion.div 
                  className={cn(
                    "flex-1 w-full",
                    "text-center md:text-left"
                  )}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
              {isEditing ? (
                <motion.input
                  type="text"
                  value={editedData.name}
                  onChange={(e) => setEditedData({ ...editedData, name: e.target.value })}
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                      className={cn(
                        "font-bold text-center backdrop-blur-md bg-white/10 border-2 rounded-xl mb-3 w-full text-white",
                        "border-purple-500/50 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/30 shadow-lg",
                        "placeholder:text-gray-500 transition-all duration-300 touch-target",
                        "text-base sm:text-lg md:text-xl lg:text-2xl",
                        "px-3 py-2 sm:px-4 sm:py-2.5 md:px-5 md:py-3"
                      )}
                  placeholder="Dein Name"
                  aria-label="Name bearbeiten"
                  autoComplete="name"
                />
              ) : (
                    <div className="w-full">
                      <motion.h1 
                        className={cn(
                          "font-black bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent mb-4 drop-shadow-2xl",
                          "text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl",
                          "tracking-tight"
                        )}
                        animate={{ 
                          backgroundPosition: ["0%", "100%", "0%"],
                        }}
                        transition={{ duration: 5, repeat: Infinity }}
                      >
                        {profileDisplayName || profileData.name}
                      </motion.h1>
                      {telegramData && !hasNickname && (
                        <motion.div 
                          className="flex items-center gap-2 justify-center mt-3"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                        >
                          <div className="px-4 py-2 backdrop-blur-md bg-yellow-500/20 border border-yellow-500/40 rounded-full shadow-lg">
                            <p className="text-xs text-yellow-300 flex items-center gap-2 font-medium">
                              <AlertCircle className="w-4 h-4" />
                              <span>Telegram Name (nicht im Leaderboard sichtbar)</span>
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </div>
              )}
              
              {isEditing ? (
                <motion.textarea
                  value={editedData.bio}
                  onChange={(e) => setEditedData({ ...editedData, bio: e.target.value })}
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  className={cn(
                    "text-gray-200 backdrop-blur-md bg-white/10 border-2 rounded-xl w-full mb-4 resize-none",
                    "border-purple-500/50 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/30 shadow-lg",
                    "placeholder:text-gray-500 transition-all duration-300",
                    "px-4 py-2 sm:px-5 sm:py-3 md:px-6",
                    "text-sm sm:text-base"
                  )}
                  rows={isMobile ? 2 : 3}
                  placeholder="Erzähl etwas über dich..."
                  aria-label="Bio bearbeiten"
                  maxLength={200}
                />
              ) : (
                    <motion.p 
                      className={cn(
                        "text-gray-200 mb-6 leading-relaxed backdrop-blur-md bg-white/10 rounded-2xl border-2 border-white/20 shadow-lg",
                        "text-sm sm:text-base md:text-lg lg:text-xl",
                        "px-5 py-4 sm:px-7 sm:py-5 md:px-8 md:py-6",
                        "hover:bg-white/15 hover:border-white/30 transition-all duration-300"
                      )}
                      role="text" 
                      aria-label={`Bio: ${profileData.bio}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      {profileData.bio}
                    </motion.p>
              )}

                  <motion.div 
                    className={cn(
                      "flex flex-wrap gap-3 sm:gap-4 text-sm",
                      "justify-center md:justify-start"
                    )}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                <div className="flex items-center gap-2.5 px-4 py-2 sm:px-5 sm:py-2.5 backdrop-blur-md bg-white/15 border-2 border-white/30 rounded-full text-gray-200 shadow-lg hover:bg-white/20 hover:border-white/40 transition-all duration-300">
                  <Calendar className="w-5 h-5 text-purple-400" />
                      <span className="font-semibold text-xs sm:text-sm">Beigetreten {profileData.joinDate}</span>
                </div>
              </motion.div>
            </motion.div>

                {/* Action Buttons - Premium Enhanced */}
                <motion.div 
                  className={cn(
                    "flex gap-4 w-full",
                    "md:col-span-2"
                  )}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
              {!isEditing ? (
                <motion.button
                  onClick={handleEdit}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "flex-1 px-5 py-3.5 sm:px-7 sm:py-4 md:px-8 md:py-5 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center gap-2.5 sm:gap-3",
                    "bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:via-pink-500 hover:to-purple-500",
                    "shadow-2xl hover:shadow-purple-500/70 backdrop-blur-md border-2 border-white/30 hover:border-white/50",
                    "min-h-[48px] sm:min-h-[52px] md:min-h-[56px] focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-slate-900",
                    "text-white text-sm sm:text-base md:text-lg",
                    "hover:scale-105 active:scale-95"
                  )}
                  aria-label="Profil bearbeiten"
                  title="Profil bearbeiten"
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <Edit2 className="w-5 h-5" aria-hidden="true" />
                  </motion.div>
                  Bearbeiten
                </motion.button>
              ) : (
                <>
                  <motion.button
                    onClick={handleSave}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={isUpdating}
                    className={cn(
                      "flex-1 px-4 py-3 sm:px-6 sm:py-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3",
                      "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-700 hover:via-teal-700 hover:to-emerald-700",
                      "shadow-xl hover:shadow-emerald-500/50 backdrop-blur-md border border-white/20",
                      "min-h-[44px] sm:min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed",
                      "text-white text-sm sm:text-base"
                    )}
                  >
                    <motion.div
                      animate={isUpdating ? { rotate: 360 } : {}}
                      transition={{ duration: 1, repeat: isUpdating ? Infinity : 0 }}
                    >
                      <Save className="w-5 h-5" />
                    </motion.div>
                    {isUpdating ? 'Speichern…' : 'Speichern'}
                  </motion.button>
                  <motion.button
                    onClick={handleCancel}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "px-4 py-3 sm:px-6 sm:py-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3",
                      "backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 shadow-xl",
                      "min-h-[44px] sm:min-h-[48px] text-white text-sm sm:text-base"
                    )}
                  >
                    <X className="w-5 h-5" />
                    Abbrechen
                  </motion.button>
                </>
              )}
            </motion.div>
              </div>
            </motion.div>

            {/* Loyalty Card - Premium Glassmorphism - Collapsible */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, type: "spring" }}
              className="relative overflow-hidden backdrop-blur-2xl bg-gradient-to-br from-yellow-900/40 via-orange-900/30 to-yellow-900/40 rounded-3xl border border-yellow-500/40 shadow-2xl group"
            >
              <button
                onClick={() => toggleSection('loyalty')}
                className={cn(
                  "w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors touch-target",
                  isMobile ? "p-3" : "p-5"
                )}
                aria-expanded={!collapsedSections.loyalty}
                aria-label="VIP Status ein-/ausblenden"
              >
                <div className="flex items-center gap-3">
                  <Crown className={cn("text-yellow-400", isMobile ? "w-5 h-5" : "w-6 h-6")} />
                  <h3 className={cn("font-bold text-white", isMobile ? "text-base" : "text-lg")}>
                    VIP Status
                  </h3>
                  <motion.span 
                    className="px-3 py-1 backdrop-blur-md bg-yellow-500/30 border border-yellow-400/40 text-yellow-300 rounded-full text-xs font-bold shadow-lg"
                    whileHover={{ scale: 1.1 }}
                  >
                    Gold Member
                  </motion.span>
                </div>
                <motion.div
                  animate={{ rotate: collapsedSections.loyalty ? 0 : 180 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown className={cn("text-gray-400", isMobile ? "w-4 h-4" : "w-5 h-5")} />
                </motion.div>
              </button>
              
              <AnimatePresence>
                {!collapsedSections.loyalty && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className={cn("p-4", isMobile ? "px-3" : "px-5")}>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {[
                          { label: 'Nächster Drop', value: '2 Tage', icon: Clock, color: 'text-blue-400', bg: 'from-blue-500/20 to-cyan-500/20' },
                          { label: 'Exklusive Drops', value: '12', icon: Gem, color: 'text-purple-400', bg: 'from-purple-500/20 to-pink-500/20' },
                          { label: 'Bonus Coins', value: '+25%', icon: Coins, color: 'text-yellow-400', bg: 'from-yellow-500/20 to-orange-500/20' },
                          { label: 'Early Access', value: '24h', icon: Zap, color: 'text-emerald-400', bg: 'from-emerald-500/20 to-teal-500/20' },
                        ].map((benefit, index) => (
                          <motion.div 
                            key={index} 
                            className="text-center p-4 rounded-2xl backdrop-blur-md bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-300"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.7 + index * 0.1, type: "spring" }}
                            whileHover={{ scale: 1.05, y: -4 }}
                          >
                            <motion.div
                              className={cn("w-10 h-10 mx-auto mb-3 rounded-xl bg-gradient-to-br flex items-center justify-center", benefit.bg)}
                              whileHover={{ rotate: 12, scale: 1.1 }}
                            >
                              <benefit.icon className={cn("w-6 h-6", benefit.color)} />
                            </motion.div>
                            <p className="text-xl font-black text-white mb-1">{benefit.value}</p>
                            <p className="text-xs text-gray-300 font-medium">{benefit.label}</p>
                          </motion.div>
                        ))}
                      </div>

                      {/* Progress to next tier - Enhanced */}
                      <div className="mt-6">
                        <div className="flex items-center justify-between text-sm mb-3">
                          <span className="text-gray-300 font-medium">Fortschritt zu Platinum</span>
                          <span className="text-purple-400 font-bold">7/10 Einladungen</span>
                        </div>
                        <div className="w-full bg-slate-800/50 rounded-full h-3 overflow-hidden backdrop-blur-sm border border-white/10">
                          <motion.div 
                            className="h-3 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 rounded-full relative overflow-hidden"
                            initial={{ width: 0 }}
                            animate={{ width: '70%' }}
                            transition={{ duration: 1, delay: 1 }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                          </motion.div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Cookie Clicker Profil - Collapsible */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-orange-900/20 to-yellow-900/20 backdrop-blur-xl rounded-2xl border border-orange-500/20 overflow-hidden"
            >
              <button
                onClick={() => toggleSection('cookieClicker')}
                className={cn(
                  "w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors touch-target",
                  isMobile ? "p-3" : "p-5"
                )}
                aria-expanded={!collapsedSections.cookieClicker}
                aria-label="Cookie Clicker Profil ein-/ausblenden"
              >
                <div className="flex items-center gap-3">
                  <Trophy className={cn("text-orange-400", isMobile ? "w-5 h-5" : "w-6 h-6")} />
                  <h3 className={cn("font-semibold text-white", isMobile ? "text-base" : "text-lg")}>
                    Cookie Clicker Profil
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGoToLeaderboard();
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300",
                      "bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 hover:border-orange-500/50",
                      "text-orange-300 hover:text-orange-200 hover:scale-105"
                    )}
                  >
                    Leaderboard →
                  </button>
                  <motion.div
                    animate={{ rotate: collapsedSections.cookieClicker ? 0 : 180 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className={cn("text-gray-400", isMobile ? "w-4 h-4" : "w-5 h-5")} />
                  </motion.div>
                </div>
              </button>
              
              <AnimatePresence>
                {!collapsedSections.cookieClicker && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className={cn("p-4", isMobile ? "px-3" : "px-5")}>

              {/* Nickname Section */}
              <div className="mb-6 p-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-300">Leaderboard Nickname</label>
                  {canChangeNickname && !isEditingCookieNickname && (
                    <button
                      onClick={handleEditCookieNickname}
                      className="p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors"
                      title="Nickname bearbeiten"
                    >
                      <Edit2 className="w-4 h-4 text-orange-400" />
                    </button>
                  )}
                </div>
                
                {isEditingCookieNickname ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={cookieNicknameInput}
                      onChange={(e) => setCookieNicknameInput(e.target.value)}
                      className={cn(
                        "w-full px-3 py-2 rounded-lg bg-slate-900/50 border",
                        "border-orange-500/30 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20",
                        "text-white placeholder-gray-500"
                      )}
                      placeholder="Dein Nickname"
                      maxLength={20}
                      disabled={isUpdatingCookieNickname}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveCookieNickname}
                        disabled={isUpdatingCookieNickname}
                        className={cn(
                          "flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                          "bg-orange-600 hover:bg-orange-700 text-white",
                          "disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                      >
                        {isUpdatingCookieNickname ? 'Speichern...' : 'Speichern'}
                      </button>
                      <button
                        onClick={handleCancelCookieNickname}
                        disabled={isUpdatingCookieNickname}
                        className={cn(
                          "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                          "bg-slate-700 hover:bg-slate-600 text-white",
                          "disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-white">
                      {cookieNickname || 'Kein Nickname gesetzt'}
                    </span>
                    {!cookieNickname && (
                      <span className="text-xs text-gray-500">
                        (Setze einen Nickname im Cookie Clicker, um auf dem Leaderboard zu erscheinen)
                      </span>
                    )}
                  </div>
                )}
                
                {!canChangeNickname && cookieNickname && (
                  <p className="text-xs text-gray-500 mt-2">
                    Nur VIP oder Stammkunde können den Nickname ändern
                  </p>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-4 h-4 text-orange-400" />
                    <span className="text-sm text-gray-400">Total Cookies</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{formatNumber(totalCookies)}</p>
                </div>
                
                <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm text-gray-400">Cookies/Sekunde</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{formatNumber(cookiesPerSecond)}</p>
                </div>
                
                <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-gray-400">Spielzeit</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{formatTimePlayed(timePlayed)}</p>
                </div>
              </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <button
                onClick={handleShareInvite}
                className={cn(
                  "flex items-center justify-center gap-2 p-4 rounded-xl transition-all duration-300",
                  "bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30",
                  "border border-purple-500/30 hover:border-purple-500/50",
                  "hover:scale-105 active:scale-95 min-h-[44px]"
                )}
              >
                <Share2 className="w-5 h-5 text-purple-400" />
                <span className="font-medium text-purple-400">Freunde einladen</span>
              </button>
              <button
                onClick={handleSettings}
                className={cn(
                  "flex items-center justify-center gap-2 p-4 rounded-xl transition-all duration-300",
                  "bg-gradient-to-r from-blue-600/20 to-cyan-600/20 hover:from-blue-600/30 hover:to-cyan-600/30",
                  "border border-blue-500/30 hover:border-blue-500/50",
                  "hover:scale-105 active:scale-95 min-h-[44px]"
                )}
              >
                <Settings className="w-5 h-5 text-blue-400" />
                <span className="font-medium text-blue-400">Einstellungen</span>
              </button>
            </div>

            {/* Live Activity Feed - Collapsible */}
            {REALTIME_CONFIG.ENABLE_REALTIME && liveActivity && liveActivity.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 bg-gradient-to-br from-slate-900/50 to-purple-900/30 backdrop-blur-xl rounded-2xl border border-purple-500/20 overflow-hidden"
              >
                <button
                  onClick={() => toggleSection('activity')}
                  className={cn(
                    "w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors touch-target",
                    isMobile ? "p-3" : "p-5"
                  )}
                  aria-expanded={!collapsedSections.activity}
                >
                  <div className="flex items-center gap-3">
                    <Activity className={cn("text-green-400", isMobile ? "w-5 h-5" : "w-6 h-6")} />
                    <h3 className={cn("font-semibold text-white", isMobile ? "text-base" : "text-lg")}>
                      Live-Aktivität
                    </h3>
                    {realtimeConnected && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-xs text-green-400 font-medium">Live</span>
                      </div>
                    )}
                  </div>
                  <motion.div
                    animate={{ rotate: collapsedSections.activity ? 0 : 180 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className={cn("text-gray-400", isMobile ? "w-4 h-4" : "w-5 h-5")} />
                  </motion.div>
                </button>
                
                <AnimatePresence>
                  {!collapsedSections.activity && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className={cn("p-4", isMobile ? "px-3" : "px-5")}>
                        <div className="space-y-3 max-h-80 overflow-y-auto">
                          {liveActivity.slice(0, 10).map((activity) => {
                            const ActivityIcon = activity.type === 'coins' ? Coins : 
                                                activity.type === 'invite' ? Users :
                                                activity.type === 'achievement' ? Trophy :
                                                activity.type === 'drop' ? Package : Gift;
                            const iconColor = activity.type === 'coins' ? 'text-yellow-400 bg-yellow-500/20' :
                                             activity.type === 'invite' ? 'text-purple-400 bg-purple-500/20' :
                                             activity.type === 'achievement' ? 'text-green-400 bg-green-500/20' :
                                             'text-blue-400 bg-blue-500/20';
                            
                            return (
                              <motion.div
                                key={activity.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300"
                              >
                                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", iconColor)}>
                                  <ActivityIcon className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-white">{activity.message}</p>
                                  <p className="text-xs text-gray-400">
                                    {new Date(activity.timestamp).toLocaleTimeString('de-DE', { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </p>
                                </div>
                                {activity.amount && (
                                  <div className="text-right">
                                    <p className="text-sm font-bold text-green-400">+{activity.amount}</p>
                                  </div>
                                )}
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
            )}
          </PageErrorBoundary>
        );

      case 'stats':
        return (
          <PageErrorBoundary
            pageName="StatsTab"
            fallback={<div className="p-4 text-sm text-gray-300">Statistiken konnten nicht geladen werden.</div>}
          >
            <Suspense fallback={
              <div className="space-y-6 animate-pulse">
                <div className="h-64 bg-white/5 rounded-2xl" />
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-32 bg-white/5 rounded-2xl" />
                  ))}
                </div>
              </div>
            }>
              <div role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
                <StatsDashboardLazy />
              </div>
            </Suspense>
          </PageErrorBoundary>
        );

      case 'achievements':
        return (
          <PageErrorBoundary
            pageName="AchievementsTab"
            fallback={<div className="p-4 text-sm text-gray-300">Erfolge konnten nicht geladen werden.</div>}
          >
            <div className="space-y-6" role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
            {/* Achievement Stats */}
            <div className={cn(
              "grid gap-4",
              "grid-cols-1",
              "sm:grid-cols-2",
              "md:grid-cols-3",
              "lg:grid-cols-3"
            )}>
              <div className="bg-gradient-to-br from-slate-900/50 to-purple-900/30 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/20 text-center">
                <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
                <p className="text-2xl font-bold text-white mb-1">
                  {userAchievements.filter(a => a.unlocked).length}
                </p>
                <p className="text-sm text-gray-400">Freigeschaltet</p>
              </div>
              <div className={cn(
                "bg-gradient-to-br from-slate-900/50 to-purple-900/30 backdrop-blur-xl rounded-2xl border border-purple-500/20 text-center",
                "p-4 sm:p-5 md:p-6"
              )}>
                <Target className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                <p className="text-2xl font-bold text-white mb-1">
                  {Math.round(userAchievements.reduce((acc, a) => acc + a.progress, 0) / userAchievements.length)}%
                </p>
                <p className="text-sm text-gray-400">Durchschnitt</p>
              </div>
              <div className={cn(
                "bg-gradient-to-br from-slate-900/50 to-purple-900/30 backdrop-blur-xl rounded-2xl border border-purple-500/20 text-center",
                "p-4 sm:p-5 md:p-6"
              )}>
                <StarIcon className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                <p className="text-2xl font-bold text-white mb-1">
                  {userAchievements.reduce((acc, a) => acc + (a.unlocked ? 1 : 0), 0)}
                </p>
                <p className="text-sm text-gray-400">Sterne verdient</p>
              </div>
            </div>

            {/* Achievement Grid */}
            <div className={cn(
              "grid gap-4",
              "grid-cols-1",
              "sm:grid-cols-1",
              "md:grid-cols-2",
              "lg:grid-cols-2"
            )}>
              {userAchievements.map((achievement, index) => (
                <div
                  key={index}
                  className={cn(
                    "relative overflow-hidden rounded-2xl transition-all duration-300",
                    "bg-gradient-to-br from-slate-900/50 to-purple-900/30 backdrop-blur-xl",
                    "border border-purple-500/20 hover:border-purple-500/40",
                    "hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20",
                    achievement.unlocked && "ring-2 ring-emerald-400/50"
                  )}
                >
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10" />
                  </div>

                  <div className={cn(
                    "relative",
                    "p-4 sm:p-5 md:p-6"
                  )}>
                    <div className="flex items-start gap-4">
                      {/* Achievement Icon */}
                      <div className={cn(
                        "relative p-3 rounded-xl transition-all duration-300",
                        achievement.unlocked
                          ? "bg-gradient-to-br from-emerald-500/20 to-teal-500/20 shadow-lg shadow-emerald-500/20"
                          : "bg-slate-800/50"
                      )}>
                        <achievement.icon className={cn(
                          "w-6 h-6",
                          achievement.unlocked ? achievement.color : "text-gray-500"
                        )} />

                        {/* Unlocked Badge */}
                        {achievement.unlocked && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Achievement Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className={cn(
                            "font-semibold truncate",
                            achievement.unlocked ? "text-white" : "text-gray-500"
                          )}>
                            {achievement.name}
                          </p>
                          {achievement.unlocked && (
                            <Sparkles className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                )}
              </div>

                        <p className="text-sm text-gray-400 mb-3 leading-relaxed">
                          {achievement.description}
                        </p>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">Fortschritt</span>
                            <span className={cn(
                              "font-medium",
                              achievement.unlocked ? "text-emerald-400" : "text-gray-500"
                            )}>
                              {achievement.progress}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className={cn(
                                "h-2 rounded-full transition-all duration-1000 relative",
                                achievement.unlocked
                                  ? "bg-gradient-to-r from-emerald-400 to-teal-400"
                                  : "bg-gray-600"
                              )}
                              style={{ width: `${achievement.progress}%` }}
                            >
                              {/* Animated Shine Effect */}
                              {achievement.unlocked && (
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              </div>

            {/* Achievement Categories */}
            <div className={cn(
              "bg-gradient-to-br from-slate-900/50 to-purple-900/30 backdrop-blur-xl rounded-2xl border border-purple-500/20",
              "p-4 sm:p-5 md:p-6"
            )}>
              <h3 className={cn(
                "font-semibold text-white mb-4 flex items-center gap-2",
                "text-base sm:text-lg"
              )}>
                <Award className="w-5 h-5 text-purple-400" />
                Achievement-Kategorien
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Social', count: 3, color: 'bg-pink-500/20 text-pink-400', icon: Users },
                  { label: 'Gaming', count: 5, color: 'bg-purple-500/20 text-purple-400', icon: Trophy },
                  { label: 'Shopping', count: 2, color: 'bg-blue-500/20 text-blue-400', icon: ShoppingBag },
                  { label: 'Insider', count: 4, color: 'bg-emerald-500/20 text-emerald-400', icon: Heart },
                ].map((category, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl transition-all duration-300 hover:scale-105 cursor-pointer",
                      category.color
                    )}
                  >
                    <category.icon className="w-5 h-5" />
                  <div>
                      <p className="font-medium text-white">{category.label}</p>
                      <p className="text-xs opacity-75">{category.count} Erfolge</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          </PageErrorBoundary>
        );

      case 'activity':
        return (
          <PageErrorBoundary
            pageName="ActivityTab"
            fallback={<div className="p-4 text-sm text-gray-300">Aktivität konnte nicht geladen werden.</div>}
          >
            <Suspense fallback={
              <div className="space-y-6 animate-pulse">
                <div className="h-12 bg-white/5 rounded-2xl" />
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-white/5 rounded-2xl" />
                ))}
              </div>
            }>
              <div className="space-y-6" role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
                <ActivityTimelineLazy />
              </div>
            </Suspense>
          </PageErrorBoundary>
        );

      case 'loyalty':
        return (
          <PageErrorBoundary
            pageName="LoyaltyTab"
            fallback={<div className="p-4 text-sm text-gray-300">Treueprogramm konnte nicht geladen werden.</div>}
          >
            <div className="space-y-6" role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
              <LoyaltyCard />
              <LoyaltyRewards />
            </div>
          </PageErrorBoundary>
        );

      case 'invite':
        return (
          <PageErrorBoundary
            pageName="InviteTab"
            fallback={<div className="p-4 text-sm text-gray-300">Einladungen konnten nicht geladen werden.</div>}
          >
            {isProfileLoading ? (
              <div className="space-y-6" role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                    <p className="text-gray-400">Einladungsdaten werden geladen...</p>
                  </div>
                </div>
              </div>
            ) : invite ? (
              <div role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
                <EnhancedInviteProfile invite={invite} coinsBalance={coinsBalance} />
              </div>
            ) : (
          <div className="space-y-6" role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
            {/* Enhanced Invite System */}
            <div className="text-center py-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className={cn(
                  "bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-purple-500/20",
                  "w-20 h-20 sm:w-24 sm:h-24",
                  "mb-4 sm:mb-6"
                )}
              >
                <Share2 className={cn(
                  "text-white",
                  "w-10 h-10 sm:w-12 sm:h-12"
                )} />
              </motion.div>
              <h2 className={cn(
                "font-bold text-white mb-2",
                "text-2xl sm:text-3xl"
              )}>Freunde einladen</h2>
              <p className={cn(
                "text-gray-400 mb-6 sm:mb-8",
                "text-sm sm:text-base",
                "px-4"
              )}>Verdiene Coins und Belohnungen für jeden Freund, den du einlädst</p>
              
              {/* Invite Benefits */}
              <div className={cn(
                "grid gap-4 sm:gap-6 mb-6 sm:mb-8",
                "grid-cols-1",
                "sm:grid-cols-2",
                "md:grid-cols-3"
              )}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className={cn(
                    "bg-gradient-to-br from-green-900/20 to-emerald-900/20 rounded-2xl border border-green-500/20",
                    "p-4 sm:p-5 md:p-6",
                    "touch-target"
                  )}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={cn(
                      "bg-green-500/20 rounded-xl",
                      "p-2 sm:p-3"
                    )}>
                      <Coins className={cn(
                        "text-green-400",
                        "w-5 h-5 sm:w-6 sm:h-6"
                      )} />
                    </div>
                    <div>
                      <h3 className={cn(
                        "font-semibold text-white",
                        "text-base sm:text-lg"
                      )}>Coins verdienen</h3>
                      <p className={cn(
                        "text-green-300",
                        "text-xs sm:text-sm"
                      )}>Für jeden Freund</p>
                    </div>
                  </div>
                  <div className={cn(
                    "font-bold text-white mb-2",
                    "text-xl sm:text-2xl"
                  )}>+500 Coins</div>
                  <div className={cn(
                    "text-green-400",
                    "text-xs sm:text-sm"
                  )}>pro erfolgreicher Einladung</div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="p-6 bg-gradient-to-br from-blue-900/20 to-cyan-900/20 rounded-2xl border border-blue-500/20"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={cn(
                      "bg-blue-500/20 rounded-xl",
                      "p-2 sm:p-3"
                    )}>
                      <Gift className={cn(
                        "text-blue-400",
                        "w-5 h-5 sm:w-6 sm:h-6"
                      )} />
                    </div>
                    <div>
                      <h3 className={cn(
                        "font-semibold text-white",
                        "text-base sm:text-lg"
                      )}>Exklusive Belohnungen</h3>
                      <p className={cn(
                        "text-blue-300",
                        "text-xs sm:text-sm"
                      )}>Nur für Einladende</p>
                    </div>
                  </div>
                  <div className={cn(
                    "font-bold text-white mb-2",
                    "text-xl sm:text-2xl"
                  )}>+10% Rabatt</div>
                  <div className={cn(
                    "text-blue-400",
                    "text-xs sm:text-sm"
                  )}>auf alle Einkäufe</div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="p-6 bg-gradient-to-br from-purple-900/20 to-violet-900/20 rounded-2xl border border-purple-500/20"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={cn(
                      "bg-purple-500/20 rounded-xl",
                      "p-2 sm:p-3"
                    )}>
                      <Crown className={cn(
                        "text-purple-400",
                        "w-5 h-5 sm:w-6 sm:h-6"
                      )} />
                    </div>
                    <div>
                      <h3 className={cn(
                        "font-semibold text-white",
                        "text-base sm:text-lg"
                      )}>VIP Status</h3>
                      <p className={cn(
                        "text-purple-300",
                        "text-xs sm:text-sm"
                      )}>Bei 5+ Einladungen</p>
                    </div>
                  </div>
                  <div className={cn(
                    "font-bold text-white mb-2",
                    "text-xl sm:text-2xl"
                  )}>VIP</div>
                  <div className={cn(
                    "text-purple-400",
                    "text-xs sm:text-sm"
                  )}>Exklusive Vorteile</div>
                </motion.div>
              </div>

              {/* How it works */}
              <div className={cn(
                "max-w-2xl mx-auto mb-6 sm:mb-8",
                "px-4"
              )}>
                <h3 className={cn(
                  "font-bold text-white mb-4 sm:mb-6",
                  "text-lg sm:text-xl"
                )}>So funktioniert's</h3>
                <div className={cn(
                  "grid gap-4 sm:gap-6",
                  "grid-cols-1",
                  "sm:grid-cols-2",
                  "md:grid-cols-3"
                )}>
                  {[
                    { step: 1, title: "Einladung senden", description: "Teile deinen persönlichen Code", icon: Share2 },
                    { step: 2, title: "Freund registriert", description: "Dein Freund meldet sich an", icon: User },
                    { step: 3, title: "Belohnung erhalten", description: "Du bekommst sofort Coins", icon: Gift }
                  ].map((item, index) => (
                    <motion.div
                      key={item.step}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.2 }}
                      className="text-center"
                    >
                      <div className={cn(
                        "bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4",
                        "w-14 h-14 sm:w-16 sm:h-16"
                      )}>
                        <item.icon className={cn(
                          "text-white",
                          "w-7 h-7 sm:w-8 sm:h-8"
                        )} />
                      </div>
                      <h4 className={cn(
                        "font-semibold text-white mb-2",
                        "text-sm sm:text-base"
                      )}>{item.title}</h4>
                      <p className={cn(
                        "text-gray-400",
                        "text-xs sm:text-sm"
                      )}>{item.description}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* CTA Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleShareInvite}
                className={cn(
                  "bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg shadow-purple-500/25 touch-target",
                  "px-6 sm:px-8",
                  "py-3 sm:py-4",
                  "text-sm sm:text-base",
                  "min-h-[44px]"
                )}
              >
                Jetzt Freunde einladen
              </motion.button>
            </div>
          </div>
            )}
          </PageErrorBoundary>
        );

      case 'orders':
        return (
          <PageErrorBoundary
            pageName="OrdersTab"
            fallback={<div className="p-4 text-sm text-gray-300">Bestellungen konnten nicht geladen werden.</div>}
          >
            <OrdersSectionLazy />
          </PageErrorBoundary>
        );

      case 'interests':
        return (
          <PageErrorBoundary
            pageName="InterestsTab"
            fallback={<div className="p-4 text-sm text-gray-300">Interessen konnten nicht geladen werden.</div>}
          >
            <InterestsSectionLazy />
          </PageErrorBoundary>
        );

      case 'tickets':
        return (
          <PageErrorBoundary
            pageName="TicketsTab"
            fallback={
              <div className="space-y-6 p-6" role="tabpanel" id="panel-tickets" aria-labelledby="tab-tickets">
                <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-2xl text-center">
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-red-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-red-200 mb-2">Ticketbereich konnte nicht geladen werden</h2>
                  <p className="text-red-100 mb-4">Bitte versuche es erneut oder lade die Seite neu.</p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors"
                    >
                      Seite neu laden
                    </button>
                  </div>
                </div>
              </div>
            }
          >
            <Suspense
              fallback={
                <div className="space-y-6" role="tabpanel" id="panel-tickets" aria-labelledby="tab-tickets">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white">Meine Tickets</h2>
                      <p className="text-gray-400 text-sm mt-1">Lade Ticketbereich...</p>
                    </div>
                    <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                  </div>
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="h-32 bg-slate-800/50 rounded-2xl border border-slate-600/30 animate-pulse" />
                    ))}
                  </div>
                </div>
              }
            >
              <TicketsSectionLazy />
            </Suspense>
          </PageErrorBoundary>
        );

      case 'rank':
        return (
          <PageErrorBoundary
            pageName="RankTab"
            fallback={<div className="p-4 text-sm text-gray-300">Rang konnte nicht geladen werden.</div>}
          >
            {isProfileLoading ? (
              <div className="space-y-6" role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                    <p className="text-gray-400">Rang-Daten werden geladen...</p>
                  </div>
                </div>
                {/* Loading Skeletons */}
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-32 bg-slate-800/50 rounded-xl animate-pulse" />
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6" role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
            {/* Nickname Warning Banner */}
            {needsRankNickname && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-yellow-400 mb-1">Leaderboard-Nickname erforderlich</h3>
                    <p className="text-sm text-yellow-300/80 mb-3">
                      Du siehst im Leaderboard nur als "Anonymer Spieler". Setze einen Cookie Clicker Nickname, um sichtbar zu sein.
                    </p>
                    <button
                      onClick={() => navigate('/cookie-clicker?tab=leaderboard')}
                      className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40 rounded-lg text-sm font-medium text-yellow-300 transition-colors"
                    >
                      Jetzt Nickname setzen
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Rank Header */}
            <div className="text-center py-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className={cn(
                  "bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-yellow-500/20",
                  "w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28"
                )}
              >
                <Trophy className="w-12 h-12 text-white" />
              </motion.div>
              <h2 className="text-3xl font-bold text-white mb-2">
                {hasRankNickname ? rankDisplayName : 'Anonymer Spieler'}
              </h2>
              <p className="text-gray-400 mb-6">Rang #47 • Level 12</p>
              
              {/* Progress Bar */}
              <div className="max-w-md mx-auto">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Level 12</span>
                  <span>650 / 1000 XP</span>
                  <span>Level 13</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-4 mb-4">
                  <motion.div 
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 h-4 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: '65%' }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </div>
                <div className="text-sm text-gray-400">350 XP bis zum nächsten Level</div>
              </div>
            </div>

            {/* Rank Stats Grid */}
            <div className={cn(
              "grid gap-4",
              "grid-cols-1",
              "sm:grid-cols-1",
              "md:grid-cols-2",
              "lg:grid-cols-3",
              "md:gap-6"
            )}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className={cn(
                  "bg-gradient-to-br from-blue-900/20 to-cyan-900/20 rounded-2xl border border-blue-500/20",
                  "p-4 sm:p-5 md:p-6"
                )}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-blue-500/20 rounded-xl">
                    <Target className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Gesamt XP</h3>
                    <p className="text-blue-300">Deine Erfahrungspunkte</p>
                  </div>
                </div>
                <div className={cn(
                  "font-bold text-white mb-2",
                  "text-2xl sm:text-2xl md:text-3xl"
                )}>2,847</div>
                <div className="flex items-center gap-1 text-sm text-green-400">
                  <TrendingUp className="w-4 h-4" />
                  <span>+127 diese Woche</span>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className={cn(
                  "bg-gradient-to-br from-purple-900/20 to-violet-900/20 rounded-2xl border border-purple-500/20",
                  "p-4 sm:p-5 md:p-6"
                )}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-purple-500/20 rounded-xl">
                    <Crown className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Rang</h3>
                    <p className="text-purple-300">Deine Position</p>
                  </div>
                </div>
                <div className={cn(
                  "font-bold text-white mb-2",
                  "text-2xl sm:text-2xl md:text-3xl"
                )}>#47</div>
                <div className="flex items-center gap-1 text-sm text-green-400">
                  <TrendingUp className="w-4 h-4" />
                  <span>+3 Plätze diese Woche</span>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className={cn(
                  "bg-gradient-to-br from-green-900/20 to-emerald-900/20 rounded-2xl border border-green-500/20",
                  "p-4 sm:p-5 md:p-6"
                )}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-green-500/20 rounded-xl">
                    <Zap className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Streak</h3>
                    <p className="text-green-300">Tägliche Aktivität</p>
                  </div>
                </div>
                <div className={cn(
                  "font-bold text-white mb-2",
                  "text-2xl sm:text-2xl md:text-3xl"
                )}>12 Tage</div>
                <div className="flex items-center gap-1 text-sm text-green-400">
                  <Flame className="w-4 h-4" />
                  <span>On Fire!</span>
                </div>
              </motion.div>
            </div>

            {/* Achievements Section */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                <Award className="w-6 h-6 text-yellow-400" />
                Errungenschaften
              </h3>
              
              <div className={cn(
                "grid gap-4",
                "grid-cols-1",
                "sm:grid-cols-1",
                "md:grid-cols-2",
                "lg:grid-cols-2"
              )}>
                {[
                  { name: "Erster Drop", description: "Dein erster gewonnener Drop", icon: Gift, unlocked: true, rarity: "common" },
                  { name: "Coin Collector", description: "1000 Coins gesammelt", icon: Coins, unlocked: true, rarity: "rare" },
                  { name: "Social Butterfly", description: "10+ Freunde eingeladen", icon: Users, unlocked: true, rarity: "epic" },
                  { name: "Shopping Pro", description: "20+ Produkte gekauft", icon: ShoppingBag, unlocked: false, rarity: "legendary" },
                  { name: "Drop Master", description: "5+ Drops gewonnen", icon: Trophy, unlocked: true, rarity: "epic" },
                  { name: "Loyalty King", description: "100+ Tage aktiv", icon: Crown, unlocked: false, rarity: "legendary" }
                ].map((achievement, index) => (
                  <motion.div
                    key={achievement.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "p-4 rounded-xl border transition-all duration-300",
                      achievement.unlocked 
                        ? "bg-gradient-to-br from-slate-800/50 to-slate-700/50 border-slate-600/30 hover:border-yellow-500/30" 
                        : "bg-slate-800/30 border-slate-700/30 opacity-60"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-3 rounded-xl",
                        achievement.unlocked ? "bg-yellow-500/20" : "bg-gray-500/20"
                      )}>
                        <achievement.icon className={cn(
                          "w-6 h-6",
                          achievement.unlocked ? "text-yellow-400" : "text-gray-500"
                        )} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-white">{achievement.name}</h4>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-semibold",
                            achievement.rarity === 'common' && "bg-gray-500/20 text-gray-400",
                            achievement.rarity === 'rare' && "bg-blue-500/20 text-blue-400",
                            achievement.rarity === 'epic' && "bg-purple-500/20 text-purple-400",
                            achievement.rarity === 'legendary' && "bg-yellow-500/20 text-yellow-400"
                          )}>
                            {achievement.rarity}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400">{achievement.description}</p>
                      </div>
                      {achievement.unlocked && (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Leaderboard Preview */}
            <div className="p-6 bg-slate-800/30 rounded-2xl border border-slate-600/30">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                Top 10 Leaderboard
              </h3>
              <div className="space-y-3">
                {[
                  { rank: 1, name: "NebulaMaster", xp: 15420, level: 25 },
                  { rank: 2, name: "DropKing", xp: 12850, level: 22 },
                  { rank: 3, name: "SneakerPro", xp: 11200, level: 20 },
                  { rank: 4, name: "CoinHunter", xp: 9850, level: 18 },
                  { rank: 5, name: "LimitedLover", xp: 8750, level: 16 }
                ].map((player, index) => (
                  <motion.div
                    key={player.rank}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                        player.rank === 1 && "bg-gradient-to-br from-yellow-500 to-orange-500 text-white",
                        player.rank === 2 && "bg-gradient-to-br from-gray-400 to-gray-500 text-white",
                        player.rank === 3 && "bg-gradient-to-br from-amber-600 to-amber-700 text-white",
                        player.rank > 3 && "bg-slate-600 text-gray-300"
                      )}>
                        {player.rank}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{player.name}</p>
                        <p className="text-sm text-gray-400">Level {player.level}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">{player.xp.toLocaleString()} XP</p>
                      <p className="text-xs text-gray-400">Top {player.rank}%</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
            )}
          </PageErrorBoundary>
        );

      default:
        return (
          <PageErrorBoundary
            pageName="UnknownTab"
            fallback={<div className="p-4 text-sm text-gray-300">Unbekannter Tab.</div>}
          >
            <div className="p-4 text-center text-gray-400">
              <p>Tab nicht gefunden</p>
            </div>
          </PageErrorBoundary>
        );
    }
  };

  return (
    <div className={cn(
      "min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950",
      isMobile && "pb-20" // Account for mobile bottom navigation
    )}>
      <Header
        coins={displayCoins}
        eyebrow="PROFIL"
        title="Mein Profil"
        description="Verwalte deine persönlichen Informationen und verfolge deine Erfolge"
      />

      <div className={cn(
        "container mx-auto max-w-6xl",
        "px-3 sm:px-4 md:px-6 lg:px-8",
        "py-4 sm:py-6 md:py-8"
      )}>
        {/* Realtime Status Indicators (nur anzeigen wenn Realtime aktiviert ist) */}
        {REALTIME_CONFIG.ENABLE_REALTIME && (
          <>
            {/* Connection Status Indicator */}
            {realtimeConnected && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 w-fit mx-auto"
              >
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-green-400 font-medium">Live verbunden</span>
                {realtimeLastUpdate && (
                  <span className="text-xs text-gray-400">• Zuletzt: {new Date(realtimeLastUpdate).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>
                )}
              </motion.div>
            )}

            {/* Error Display */}
            {realtimeError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 flex items-center justify-between gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 max-w-md mx-auto"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-xs text-red-400 font-medium">{realtimeError}</span>
                </div>
                <button
                  onClick={clearRealtimeError}
                  className="p-1 rounded-full hover:bg-red-500/20 transition-colors"
                  aria-label="Fehler schließen"
                >
                  <X className="w-3 h-3 text-red-400" />
                </button>
              </motion.div>
            )}

            {/* Loading Indicator */}
            {realtimeLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-4 flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 w-fit mx-auto"
              >
                <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                <span className="text-xs text-blue-400 font-medium">Verbinde...</span>
              </motion.div>
            )}
          </>
        )}

        {/* New Hierarchical Tab Navigation */}
        <TabNavigation
          mainTabs={mainTabs}
          activeMainTab={activeMainTab}
          activeSubTab={activeSubTab}
          onMainTabChange={handleMainTabChange}
          onSubTabChange={handleSubTabChange}
          achievementsCount={achievements?.length}
        />

        {/* Tab Content with Suspense and Smooth Transitions */}
        <Suspense fallback={
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
              "space-y-4",
              "grid gap-4",
              "grid-cols-1",
              "sm:grid-cols-1",
              "md:grid-cols-2",
              "lg:grid-cols-3"
            )}
          >
            {Array.from({ length: 3 }).map((_, i) => (
              <motion.div 
                key={i} 
                className={cn(
                  "bg-slate-800/50 rounded-xl animate-pulse backdrop-blur-md",
                  "h-32 sm:h-36 md:h-40"
                )}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              />
            ))}
        </motion.div>
        }>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{ 
                duration: 0.3,
                ease: [0.4, 0, 0.2, 1]
              }}
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </Suspense>
      </div>

      {/* Avatar Upload Modal */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-slate-900 to-purple-900 rounded-2xl p-6 max-w-md w-full border border-purple-500/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Profilbild ändern</h3>
              <button
                onClick={() => setShowAvatarModal(false)}
                className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drag & Drop Area */}
            <div
              className={cn(
                "relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300",
                isDragOver
                  ? "border-purple-400 bg-purple-500/10"
                  : "border-gray-600 hover:border-gray-500"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className={cn(
                "w-12 h-12 mx-auto mb-4",
                isDragOver ? "text-purple-400" : "text-gray-400"
              )} />
              <p className="text-white mb-2">
                {isDragOver ? "Lass die Datei hier fallen" : "Ziehe ein Bild hierher"}
              </p>
              <p className="text-sm text-gray-400 mb-4">oder</p>
              <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition-colors">
                Bild auswählen
              </button>
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAvatarUpload(file);
                }}
              />
            </div>

            {/* Quick Templates */}
            <div className="mt-4">
              <p className="text-sm text-gray-400 mb-2">Schnellauswahl:</p>
              <div className="grid grid-cols-4 gap-2">
                {['😎', '🚀', '💎', '🔥'].map((emoji, index) => (
                  <button
                    key={index}
                    className="aspect-square bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center text-2xl transition-colors"
                    onClick={() => {
                      setProfileData(prev => ({ ...prev, avatar: null }));
                      setShowAvatarModal(false);
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-slate-900 to-purple-900 rounded-2xl p-6 max-w-2xl w-full border border-purple-500/20 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <Settings className="w-6 h-6 text-purple-400" />
                Profil-Einstellungen
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Theme Selection */}
              <div>
                <h4 className="text-lg font-medium text-white mb-3">Theme auswählen</h4>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'dark' as const, name: 'Dark', color: 'from-slate-900 to-purple-900', preview: '🌙' },
                    { id: 'neon' as const, name: 'Neon', color: 'from-purple-900 to-pink-900', preview: '⚡' },
                    { id: 'cosmic' as const, name: 'Cosmic', color: 'from-indigo-900 to-purple-900', preview: '✨' },
                  ].map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => handleThemeChange(theme.id)}
                      className={cn(
                        "relative p-4 rounded-xl border-2 transition-all duration-300 text-center",
                        selectedTheme === theme.id
                          ? "border-purple-400 bg-purple-500/20"
                          : "border-slate-700 hover:border-slate-600 bg-slate-800/50",
                        "hover:scale-105"
                      )}
                    >
                      <div className={cn("text-2xl mb-2")}>{theme.preview}</div>
                      <div className="font-medium text-white">{theme.name}</div>
                      {selectedTheme === theme.id && (
                        <div className="absolute top-2 right-2 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preferences */}
              <div>
                <h4 className="text-lg font-medium text-white mb-3">Einstellungen</h4>
                <div className="space-y-3">
                  {[
                    { key: 'notifications', label: 'Benachrichtigungen', icon: Bell },
                    { key: 'sounds', label: 'Sounds', icon: Volume2 },
                    { key: 'animations', label: 'Animationen', icon: Play },
                    { key: 'autoRefresh', label: 'Auto-Refresh', icon: RefreshCw },
                  ].map((pref) => (
                    <div
                      key={pref.key}
                      className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <pref.icon className="w-5 h-5 text-purple-400" />
                        <span className="text-white">{pref.label}</span>
                      </div>
                      <button
                        className={cn(
                          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                          profileData.preferences[pref.key as keyof typeof profileData.preferences]
                            ? "bg-purple-600"
                            : "bg-slate-600"
                        )}
                        onClick={() => {
                          setProfileData(prev => ({
                            ...prev,
                            preferences: {
                              ...prev.preferences,
                              [pref.key]: !prev.preferences[pref.key as keyof typeof prev.preferences]
                            }
                          }));
                        }}
                      >
                        <span
                          className={cn(
                            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                            profileData.preferences[pref.key as keyof typeof profileData.preferences]
                              ? "translate-x-6"
                              : "translate-x-1"
                          )}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notification Settings */}
              <div>
                <NotificationSettings />
              </div>

              {/* Privacy Settings */}
              <div>
                <h4 className="text-lg font-medium text-white mb-3">Datenschutz</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-emerald-400" />
                      <span className="text-white">Profil sichtbar</span>
                    </div>
                    <Lock className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Eye className="w-5 h-5 text-blue-400" />
                      <span className="text-white">Aktivitäten teilen</span>
                    </div>
                    <Unlock className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition-colors">
                  Änderungen speichern
                </button>
                <button className="px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-medium transition-colors">
                  Zurücksetzen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite Share Modal */}
      <InviteShareModal
        open={showInviteModal}
        onOpenChange={setShowInviteModal}
        invite={invite}
      />
    </div>
  );
};

