import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { 
  Copy, Check, Plus, Search, Filter, Download, Upload, 
  Settings, BarChart3, TrendingUp, Users, Clock, Zap,
  Eye, EyeOff, Trash2, Edit, RefreshCw, Calendar, Hash
} from 'lucide-react';
import { useCreateInviteCode, useDeleteInviteCode, useBotInviteCodes, useBotStats } from '../../lib/api/hooks';
import { useWebSocket } from '../../lib/websocket/client';
import { useAuthStore } from '../../lib/store/auth';
import { useToast } from '../ui/Toast';
import { cn } from '../../utils/cn';
import { logger } from '../../lib/logger';

interface InviteCode {
  id: string;
  code: string;
  created_by: string;
  max_uses: number;
  used_count: number;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  metadata?: any;
}

interface CodeTemplate {
  name: string;
  maxUses: number;
  expiresInHours?: number;
  description: string;
}

const CODE_TEMPLATES: CodeTemplate[] = [
  { name: 'Test Code', maxUses: 1, expiresInHours: 24, description: 'Für schnelle Tests' },
  { name: 'Standard', maxUses: 10, description: 'Standard Code mit 10 Verwendungen' },
  { name: 'Event Code', maxUses: 100, expiresInHours: 168, description: 'Für Events (7 Tage)' },
  { name: 'VIP Code', maxUses: 50, expiresInHours: 720, description: 'VIP Zugang (30 Tage)' },
  { name: 'Unlimited', maxUses: 1000, description: 'Unbegrenzte Verwendungen' },
];

export function InviteCodeAdminPage() {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const { wsManager, connectionStatus } = useWebSocket();
  
  // State Management
  const [customCode, setCustomCode] = useState('');
  const [maxUses, setMaxUses] = useState(10);
  const [expiresInHours, setExpiresInHours] = useState<number | undefined>();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'fully-used'>('all');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [bulkCount, setBulkCount] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<CodeTemplate | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState<'created' | 'uses' | 'expires' | 'code'>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // API Hooks
  const createMutation = useCreateInviteCode();
  const deleteMutation = useDeleteInviteCode();
  const { data: codesData, isLoading, refetch } = useBotInviteCodes({ 
    status: statusFilter === 'all' ? undefined : statusFilter,
    limit: 500 
  });
  const { data: botStats } = useBotStats();
  
  // Live Updates
  const [liveCodes, setLiveCodes] = useState<InviteCode[]>([]);
  
  useEffect(() => {
    if (codesData?.data) {
      setLiveCodes(codesData.data);
    }
  }, [codesData]);

  // WebSocket Live Updates
  useEffect(() => {
    if (!wsManager) return;

    const handleCodeCreated = (event: { inviteCode: InviteCode }) => {
      logger.debug('New invite code created', event);
      setLiveCodes(prev => [event.inviteCode, ...prev]);
      showToast({ type: 'success', title: 'Neuer Code erstellt!', message: `Code "${event.inviteCode.code}" wurde erstellt` });
    };

    const handleCodeUsed = (event: { code: string; userId: string }) => {
      logger.debug('Invite code used', event);
      setLiveCodes(prev => prev.map(code => 
        code.code === event.code 
          ? { ...code, used_count: code.used_count + 1 } 
          : code
      ));
    };

    const handleCodeExpired = (event: { code: string }) => {
      logger.debug('Invite code expired', event);
      setLiveCodes(prev => prev.map(code => 
        code.code === event.code 
          ? { ...code, is_active: false } 
          : code
      ));
    };

    wsManager.on('bot:invite_code_created', handleCodeCreated);
    wsManager.on('bot:invite_code_used', handleCodeUsed);
    wsManager.on('bot:invite_code_expired', handleCodeExpired);

    if (wsManager.isConnected) {
      wsManager.socket?.emit('subscribe:bot_invite_codes', { status: 'all' });
    }

    return () => {
      wsManager.off('bot:invite_code_created', handleCodeCreated);
      wsManager.off('bot:invite_code_used', handleCodeUsed);
      wsManager.off('bot:invite_code_expired', handleCodeExpired);
    };
  }, [wsManager, showToast]);

  // Template Handler
  const applyTemplate = useCallback((template: CodeTemplate) => {
    setSelectedTemplate(template);
    setMaxUses(template.maxUses);
    setExpiresInHours(template.expiresInHours);
    setCustomCode('');
  }, []);

  // Create Code Handler
  const handleCreateCode = useCallback(async (codeOverride?: string, usesOverride?: number, expiresOverride?: number) => {
    if (!user?.id) {
      showToast({ type: 'error', title: 'Fehler', message: 'Nicht angemeldet' });
      return;
    }

    const finalCode = codeOverride || customCode.toUpperCase() || undefined;
    const finalMaxUses = usesOverride || maxUses;
    const finalExpires = expiresOverride !== undefined ? expiresOverride : expiresInHours;

    if (finalCode && (finalCode.length < 6 || !/^[A-Z0-9-]+$/.test(finalCode))) {
      showToast({ type: 'error', title: 'Ungültiges Format', message: 'Code muss mindestens 6 Zeichen lang sein und nur Großbuchstaben, Zahlen und Bindestriche enthalten' });
      return;
    }

    try {
      const payload: any = {
        created_by: user.id,
        is_active: true
      };
      
      if (finalCode) {
        payload.code = finalCode;
      }
      
      if (finalMaxUses) {
        payload.max_uses = finalMaxUses;
      }
      
      if (finalExpires) {
        payload.expires_at = new Date(Date.now() + finalExpires * 60 * 60 * 1000).toISOString();
      }
      
      await createMutation.mutateAsync(payload);
      
      if (!codeOverride) {
        setCustomCode('');
        setSelectedTemplate(null);
      }
      
      showToast({ type: 'success', title: 'Code erstellt!', message: finalCode ? `Code "${finalCode}" wurde erstellt` : 'Neuer Code wurde generiert' });
      refetch();
    } catch (error) {
      showToast({ type: 'error', title: 'Fehler', message: error instanceof Error ? error.message : 'Code konnte nicht erstellt werden' });
    }
  }, [user, customCode, maxUses, expiresInHours, createMutation, showToast, refetch]);

  // Bulk Create
  const handleBulkCreate = useCallback(async () => {
    if (bulkCount < 1 || bulkCount > 50) {
      showToast({ type: 'error', title: 'Ungültige Anzahl', message: 'Bitte wähle zwischen 1 und 50 Codes' });
      return;
    }

    for (let i = 0; i < bulkCount; i++) {
      await handleCreateCode(undefined, maxUses, expiresInHours);
      // Small delay to avoid rate limiting
      if (i < bulkCount - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    showToast({ type: 'success', title: 'Bulk Erstellung abgeschlossen', message: `${bulkCount} Codes wurden erstellt` });
  }, [bulkCount, maxUses, expiresInHours, handleCreateCode, showToast]);

  // Copy Handler
  const handleCopyCode = useCallback((code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast({ type: 'success', title: 'Kopiert!', message: `Code "${code}" wurde in die Zwischenablage kopiert` });
    setTimeout(() => setCopiedCode(null), 2000);
  }, [showToast]);

  // Delete Handler
  const handleDelete = useCallback(async (codeId: string, code: string) => {
    if (!confirm(`Möchtest du den Code "${code}" wirklich löschen?`)) return;
    
    try {
      await deleteMutation.mutateAsync(codeId);
      showToast({ type: 'success', title: 'Code gelöscht', message: `Code "${code}" wurde gelöscht` });
      refetch();
    } catch (error) {
      showToast({ type: 'error', title: 'Fehler', message: 'Code konnte nicht gelöscht werden' });
    }
  }, [deleteMutation, showToast, refetch]);

  // Filtered & Sorted Codes
  const filteredAndSortedCodes = useMemo(() => {
    let filtered = liveCodes.filter(code => 
      code.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Status Filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(c => c.is_active && (!c.expires_at || new Date(c.expires_at) > new Date()) && c.used_count < c.max_uses);
    } else if (statusFilter === 'expired') {
      filtered = filtered.filter(c => c.expires_at && new Date(c.expires_at) < new Date());
    } else if (statusFilter === 'fully-used') {
      filtered = filtered.filter(c => c.used_count >= c.max_uses);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'created':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'uses':
          comparison = a.used_count - b.used_count;
          break;
        case 'expires':
          const aExp = a.expires_at ? new Date(a.expires_at).getTime() : Infinity;
          const bExp = b.expires_at ? new Date(b.expires_at).getTime() : Infinity;
          comparison = aExp - bExp;
          break;
        case 'code':
          comparison = a.code.localeCompare(b.code);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [liveCodes, searchTerm, statusFilter, sortBy, sortOrder]);

  // Statistics
  const stats = useMemo(() => {
    const codes = liveCodes;
    const active = codes.filter(c => c.is_active && (!c.expires_at || new Date(c.expires_at) > new Date()) && c.used_count < c.max_uses);
    const expired = codes.filter(c => c.expires_at && new Date(c.expires_at) < new Date());
    const fullyUsed = codes.filter(c => c.used_count >= c.max_uses);
    const totalUses = codes.reduce((sum, c) => sum + c.used_count, 0);
    const totalMaxUses = codes.reduce((sum, c) => sum + c.max_uses, 0);
    const usageRate = totalMaxUses > 0 ? (totalUses / totalMaxUses) * 100 : 0;
    
    // Recent activity (last 24h)
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentUses = codes.filter(c => 
      new Date(c.updated_at) > last24h && c.used_count > 0
    ).length;

    return {
      total: codes.length,
      active: active.length,
      expired: expired.length,
      fullyUsed: fullyUsed.length,
      totalUses,
      totalMaxUses,
      usageRate: usageRate.toFixed(1),
      recentUses,
      averageUses: codes.length > 0 ? (totalUses / codes.length).toFixed(1) : '0'
    };
  }, [liveCodes]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neon flex items-center gap-3">
            <Hash className="w-8 h-8" />
            Invite Code Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Hochkonfigurierbare Verwaltung und Tracking von Telegram Invite-Codes
          </p>
        </div>
        <div className="flex items-center gap-3">
          {connectionStatus.connected && (
            <Badge variant="secondary" className="text-green-400 border-green-400">
              🟢 LIVE
            </Badge>
          )}
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
            size="sm"
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
            Aktualisieren
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Gesamt Codes</p>
              <p className="text-2xl font-bold text-blue-400">{stats.total}</p>
            </div>
            <Hash className="w-8 h-8 text-blue-400/30" />
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Aktive Codes</p>
              <p className="text-2xl font-bold text-green-400">{stats.active}</p>
            </div>
            <Zap className="w-8 h-8 text-green-400/30" />
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Nutzungsrate</p>
              <p className="text-2xl font-bold text-purple-400">{stats.usageRate}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-400/30" />
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-yellow-900/20 to-yellow-800/10 border-yellow-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Letzte 24h</p>
              <p className="text-2xl font-bold text-yellow-400">{stats.recentUses}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400/30" />
          </div>
        </Card>
      </div>

      {/* Code Creation Section */}
      <Card className="p-6 bg-gradient-to-br from-gray-900/50 to-black/50 border-neon/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Neuen Code erstellen
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showAdvanced ? 'Einfach' : 'Erweitert'}
          </Button>
        </div>

        {/* Templates */}
        <div className="mb-4">
          <p className="text-sm text-gray-400 mb-2">Schnellvorlagen:</p>
          <div className="flex flex-wrap gap-2">
            {CODE_TEMPLATES.map((template) => (
              <Button
                key={template.name}
                variant={selectedTemplate?.name === template.name ? "default" : "outline"}
                size="sm"
                onClick={() => applyTemplate(template)}
                className={cn(
                  selectedTemplate?.name === template.name && "bg-neon/20 border-neon text-neon"
                )}
              >
                {template.name}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Custom Code (optional)</label>
            <Input
              placeholder="NEB-TEST123"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
              className="bg-black/30 border-white/10 font-mono"
              maxLength={20}
            />
            <p className="text-xs text-gray-500 mt-1">
              Leer lassen für automatische Generierung
            </p>
          </div>
          
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Max. Verwendungen</label>
            <Input
              type="number"
              value={maxUses}
              onChange={(e) => setMaxUses(parseInt(e.target.value) || 1)}
              min="1"
              max="10000"
              className="bg-black/30 border-white/10"
            />
          </div>
          
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Gültigkeit (Stunden)</label>
            <Input
              type="number"
              value={expiresInHours || ''}
              onChange={(e) => setExpiresInHours(e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Unbegrenzt"
              min="1"
              className="bg-black/30 border-white/10"
            />
          </div>
        </div>

        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-black/20 rounded-lg border border-white/5">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Bulk Erstellung</label>
              <Input
                type="number"
                value={bulkCount}
                onChange={(e) => setBulkCount(parseInt(e.target.value) || 1)}
                min="1"
                max="50"
                className="bg-black/30 border-white/10"
              />
              <p className="text-xs text-gray-500 mt-1">Anzahl Codes (max. 50)</p>
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleBulkCreate}
                disabled={createMutation.isPending || bulkCount < 1}
                className="bg-purple-600 hover:bg-purple-700 w-full"
              >
                {createMutation.isPending ? '⏳ Erstelle...' : `✨ ${bulkCount} Codes erstellen`}
              </Button>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            onClick={() => handleCreateCode()}
            disabled={createMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 flex-1"
          >
            {createMutation.isPending ? (
              <>⏳ Erstelle...</>
            ) : (
              <>✨ Code erstellen</>
            )}
          </Button>
        </div>
      </Card>

      {/* Filters & Search */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Codes durchsuchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-black/30 border-white/10 pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              Alle ({stats.total})
            </Button>
            <Button
              variant={statusFilter === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('active')}
            >
              Aktiv ({stats.active})
            </Button>
            <Button
              variant={statusFilter === 'expired' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('expired')}
            >
              Abgelaufen ({stats.expired})
            </Button>
            <Button
              variant={statusFilter === 'fully-used' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('fully-used')}
            >
              Voll ({stats.fullyUsed})
            </Button>
          </div>

          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm"
            >
              <option value="created">Erstellt</option>
              <option value="uses">Verwendungen</option>
              <option value="expires">Ablauf</option>
              <option value="code">Code</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Codes List */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            Codes ({filteredAndSortedCodes.length})
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              Liste
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              Grid
            </Button>
          </div>
        </div>
        
        {isLoading && filteredAndSortedCodes.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p>Lade Codes...</p>
          </div>
        ) : filteredAndSortedCodes.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>Keine Codes gefunden</p>
            <p className="text-sm mt-1">Erstelle einen neuen Code oben</p>
          </div>
        ) : (
          <div className={cn(
            viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              : "space-y-3"
          )}>
            {filteredAndSortedCodes.map((code) => {
              const usagePercent = (code.used_count / code.max_uses) * 100;
              const isExpired = code.expires_at && new Date(code.expires_at) < new Date();
              const isFullyUsed = code.used_count >= code.max_uses;
              const isActive = code.is_active && !isExpired && !isFullyUsed;
              
              return (
                <div
                  key={code.id}
                  className={cn(
                    "rounded-xl border p-4 bg-black/25 transition-all hover:bg-black/40",
                    isExpired || isFullyUsed ? 'opacity-60 border-red-500/30' : 'border-white/10',
                    viewMode === 'grid' && 'h-full'
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <code className="font-mono text-lg font-bold text-green-400 truncate">
                        {code.code}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyCode(code.code)}
                        className="h-7 w-7 p-0 flex-shrink-0"
                      >
                        {copiedCode === code.code ? (
                          <Check className="w-3 h-3 text-green-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isExpired && <Badge variant="destructive" className="text-xs">Abgelaufen</Badge>}
                      {isFullyUsed && !isExpired && <Badge variant="secondary" className="text-xs">Voll</Badge>}
                      {isActive && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-400 text-xs">
                          Aktiv
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(code.id, code.code)}
                        className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Usage Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                      <span>Verwendungen</span>
                      <span className="font-semibold">
                        {code.used_count} / {code.max_uses}
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className={cn(
                          "h-2 rounded-full transition-all",
                          usagePercent === 100 ? 'bg-red-500' : 
                          usagePercent > 80 ? 'bg-yellow-500' : 
                          'bg-green-500'
                        )}
                        style={{ width: `${Math.min(usagePercent, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-gray-400">Erstellt</p>
                      <p className="font-semibold">
                        {new Date(code.created_at).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                    {code.expires_at && (
                      <div>
                        <p className="text-gray-400">Läuft ab</p>
                        <p className={cn(
                          "font-semibold",
                          isExpired ? 'text-red-400' : 'text-yellow-400'
                        )}>
                          {new Date(code.expires_at).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                    )}
                    <div className="col-span-2">
                      <p className="text-gray-400">Nutzungsrate</p>
                      <p className="font-semibold">{usagePercent.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

