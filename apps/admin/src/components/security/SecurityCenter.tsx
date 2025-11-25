import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  AlertTriangle,
  Lock,
  Key,
  Activity,
  Globe,
  Eye,
  FileText,
  Download,
  RefreshCw,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Users,
  Server,
  Database,
  Zap,
  Bell,
  Settings,
  BarChart3,
  MapPin,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { useSecurityEvents, useSecurityStats, useAuditLogs, useSecurityProtection } from '../../lib/api/hooks';
import { useErrorHandler } from '../../lib/hooks/useErrorHandler';
import { logger } from '../../lib/logger';
import { cn } from '../../utils/cn';

type SecurityTab = 'overview' | 'threats' | 'audit' | 'sessions' | 'policies' | 'compliance';

export function SecurityCenter() {
  const [activeTab, setActiveTab] = useState<SecurityTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'24h' | '7d' | '30d' | 'all'>('24h');
  const [privacyMode, setPrivacyMode] = useState(true);
  const { handleError } = useErrorHandler('SecurityCenter');

  // Fetch security data
  const { data: stats, isLoading: statsLoading, error: statsError } = useSecurityStats({ dateRange });
  const { data: events, isLoading: eventsLoading } = useSecurityEvents({
    severity: severityFilter !== 'all' ? severityFilter : undefined,
    limit: 50,
  });
  const { data: auditLogs, isLoading: auditLoading } = useAuditLogs({
    search: searchQuery || undefined,
    limit: 100,
  });
  const { data: protection, isLoading: protectionLoading } = useSecurityProtection();

  const securityScore = useMemo(() => {
    if (!stats) return 0;
    const { failedLogins, suspiciousActivity, activeThreats, mfaCompliance } = stats;
    
    let score = 100;
    score -= Math.min(failedLogins * 2, 30); // Max -30 für failed logins
    score -= Math.min(suspiciousActivity * 5, 40); // Max -40 für suspicious activity
    score -= activeThreats * 10; // -10 pro aktiver Threat
    score += mfaCompliance * 10; // +10 für MFA Compliance
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }, [stats]);

  const getSecurityScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'high': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'low': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const handleExportAuditLogs = useCallback(async () => {
    try {
      // TODO: Implement export
      logger.logUserAction('audit_logs_exported', {});
    } catch (error) {
      handleError(error, { operation: 'export_audit_logs' });
    }
  }, [handleError]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-orbitron text-white">Security Center</h1>
          <p className="text-muted mt-1">Überwachung, Bedrohungserkennung und Compliance</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as any)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Letzte 24h</SelectItem>
              <SelectItem value="7d">Letzte 7 Tage</SelectItem>
              <SelectItem value="30d">Letzte 30 Tage</SelectItem>
              <SelectItem value="all">Alle Zeit</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExportAuditLogs}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Aktualisieren
          </Button>
        </div>
      </div>

      {/* Security Score Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0 }}
      >
        <Card className="p-6 bg-gradient-to-br from-surface/50 to-surface/30 border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Shield className={cn('h-8 w-8', getSecurityScoreColor(securityScore))} />
                <div>
                  <h2 className="text-2xl font-bold text-text">Security Score</h2>
                  <p className="text-sm text-muted">Gesamtbewertung der System-Sicherheit</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-baseline gap-2">
                  <span className={cn('text-5xl font-bold', getSecurityScoreColor(securityScore))}>
                    {securityScore}
                  </span>
                  <span className="text-2xl text-muted">/ 100</span>
                </div>
                <div className="mt-2 h-2 bg-surface rounded-full overflow-hidden">
                  <motion.div
                    className={cn(
                      'h-full',
                      securityScore >= 80 ? 'bg-green-500' : securityScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${securityScore}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                  />
                </div>
              </div>
            </div>
            <div className="text-right">
              {securityScore >= 80 && (
                <Badge variant="success" className="text-lg px-4 py-2">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Sicher
                </Badge>
              )}
              {securityScore >= 60 && securityScore < 80 && (
                <Badge variant="warning" className="text-lg px-4 py-2">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Warnung
                </Badge>
              )}
              {securityScore < 60 && (
                <Badge variant="error" className="text-lg px-4 py-2">
                  <XCircle className="h-4 w-4 mr-2" />
                  Kritisch
                </Badge>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-20 bg-surface/50 rounded" />
            </Card>
          ))}
        </div>
      ) : statsError ? (
        <Card className="p-6 border-red-500/20 bg-red-500/10">
          <div className="flex items-center gap-3 text-red-400">
            <AlertTriangle className="h-5 w-5" />
            <p>Fehler beim Laden der Sicherheitsstatistiken</p>
          </div>
        </Card>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted">Fehlgeschlagene Logins</span>
                <AlertTriangle className="h-4 w-4 text-red-400" />
              </div>
              <div className="text-2xl font-bold text-red-400">{stats.failedLogins}</div>
              <div className="text-xs text-muted mt-1">
                {stats.failedLoginsChange > 0 ? (
                  <span className="text-red-400 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +{stats.failedLoginsChange}
                  </span>
                ) : (
                  <span className="text-green-400 flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" />
                    {stats.failedLoginsChange}
                  </span>
                )}
                {' '}vs. vorheriger Zeitraum
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted">Verdächtige Aktivitäten</span>
                <Eye className="h-4 w-4 text-orange-400" />
              </div>
              <div className="text-2xl font-bold text-orange-400">{stats.suspiciousActivity}</div>
              <div className="text-xs text-muted mt-1">
                {stats.suspiciousActivityChange > 0 ? (
                  <span className="text-red-400 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +{stats.suspiciousActivityChange}
                  </span>
                ) : (
                  <span className="text-green-400 flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" />
                    {stats.suspiciousActivityChange}
                  </span>
                )}
                {' '}vs. vorheriger Zeitraum
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted">Aktive Bedrohungen</span>
                <Shield className="h-4 w-4 text-red-400" />
              </div>
              <div className="text-2xl font-bold text-red-400">{stats.activeThreats}</div>
              <div className="text-xs text-muted mt-1">
                {stats.activeThreats > 0 ? 'Sofortige Maßnahme erforderlich' : 'Keine aktiven Bedrohungen'}
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted">MFA Compliance</span>
                <Lock className="h-4 w-4 text-green-400" />
              </div>
              <div className="text-2xl font-bold text-green-400">
                {Math.round(stats.mfaCompliance * 100)}%
              </div>
              <div className="text-xs text-muted mt-1">
                {stats.mfaCompliance >= 0.9 ? 'Exzellent' : stats.mfaCompliance >= 0.7 ? 'Gut' : 'Verbesserung nötig'}
              </div>
            </Card>
          </motion.div>
        </div>
      ) : null}

      {/* Protection & DDoS/Bot Detection */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text">Schutzstatus (DDoS/Bot/Anomalien)</h2>
          <div className="flex items-center gap-2">
            <Badge variant={protection?.ddosRiskScore >= 0.7 ? 'error' : protection?.ddosRiskScore >= 0.4 ? 'warning' : 'success'}>
              {protection ? `DDoS-Risiko ${(protection.ddosRiskScore * 100).toFixed(0)}%` : '—'}
            </Badge>
            <Button variant={privacyMode ? 'default' : 'outline'} size="sm" onClick={() => setPrivacyMode(!privacyMode)}>
              {privacyMode ? 'Privacy On' : 'Privacy Off'}
            </Button>
          </div>
        </div>
        {protectionLoading ? (
          <div className="text-center py-8 text-muted">Lade Schutzstatus...</div>
        ) : protection ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border border-white/10">
              <div className="text-sm text-muted mb-1">Requests / Minute</div>
              <div className="text-2xl font-bold text-text">{protection.requestsPerMinute}</div>
              <div className="text-xs text-muted mt-1">Unique IPs: {protection.uniqueIpsPerMinute}</div>
            </div>
            <div className="p-4 rounded-lg border border-white/10">
              <div className="text-sm text-muted mb-1">Bot Traffic</div>
              <div className="text-2xl font-bold text-text">{Math.round(protection.botTrafficPercent * 100)}%</div>
              <div className="text-xs text-muted mt-1">Erkannt via Heuristik/Signaturen</div>
            </div>
            <div className="p-4 rounded-lg border border-white/10">
              <div className="text-sm text-muted mb-1">Blocks (15m)</div>
              <div className="text-2xl font-bold text-text">{protection.rateLimitBlocksLast15m + protection.wafBlocksLast15m}</div>
              <div className="text-xs text-muted mt-1">RateLimit {protection.rateLimitBlocksLast15m} · WAF {protection.wafBlocksLast15m}</div>
            </div>
          </div>
        ) : null}
        {protection?.suspiciousIpsSample?.length ? (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-text mb-2">Auffällige IPs (anonymisiert)</h3>
            <div className="space-y-2">
              {protection.suspiciousIpsSample.map((row: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded border border-white/10">
                  <div className="text-sm text-text">
                    {privacyMode ? row.ip.replace(/[0-9]/g, '•') : row.ip}
                    <span className="text-xs text-muted ml-2">({row.reason})</span>
                  </div>
                  <div className="text-xs text-muted">{new Date(row.lastSeen).toLocaleString('de-DE')}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SecurityTab)}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="threats">Bedrohungen</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="policies">Richtlinien</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Recent Security Events */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text">Letzte Sicherheitsereignisse</h2>
              <Button variant="outline" size="sm">
                Alle anzeigen
              </Button>
            </div>
            {eventsLoading ? (
              <div className="text-center py-8 text-muted">Lade Ereignisse...</div>
            ) : events && events.length > 0 ? (
              <div className="space-y-2">
                {events.slice(0, 10).map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-lg border border-white/10 hover:bg-surface/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Badge className={cn('text-xs', getSeverityColor(event.severity))}>
                        {event.severity}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium text-text">{event.type}</p>
                        <p className="text-xs text-muted">{event.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted">
                      {event.ipAddress && (
                        <div className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {event.ipAddress}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(event.timestamp).toLocaleString('de-DE')}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted">Keine Ereignisse gefunden</div>
            )}
          </Card>

          {/* Geo Heatmap Placeholder */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-text mb-4">Login-Aktivitäten nach Region</h2>
            <div className="h-64 bg-surface/30 rounded-lg flex items-center justify-center text-muted">
              <div className="text-center">
                <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Geo-Heatmap wird geladen...</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="threats" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text">Aktive Bedrohungen</h2>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Schweregrad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="critical">Kritisch</SelectItem>
                  <SelectItem value="high">Hoch</SelectItem>
                  <SelectItem value="medium">Mittel</SelectItem>
                  <SelectItem value="low">Niedrig</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {eventsLoading ? (
              <div className="text-center py-8 text-muted">Lade Bedrohungen...</div>
            ) : events && events.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Schweregrad</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Beschreibung</TableHead>
                    <TableHead>IP-Adresse</TableHead>
                    <TableHead>Zeitpunkt</TableHead>
                    <TableHead>Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <Badge className={cn('text-xs', getSeverityColor(event.severity))}>
                          {event.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{event.type}</TableCell>
                      <TableCell className="text-muted">{event.description}</TableCell>
                      <TableCell>{event.ipAddress || '—'}</TableCell>
                      <TableCell className="text-muted">
                        {new Date(event.timestamp).toLocaleString('de-DE')}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted">Keine Bedrohungen gefunden</div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text">Audit Log</h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <Input
                    type="text"
                    placeholder="Suchen..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={handleExportAuditLogs}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
            {auditLoading ? (
              <div className="text-center py-8 text-muted">Lade Audit Log...</div>
            ) : auditLogs && auditLogs.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zeitpunkt</TableHead>
                    <TableHead>Benutzer</TableHead>
                    <TableHead>Aktion</TableHead>
                    <TableHead>Ressource</TableHead>
                    <TableHead>IP-Adresse</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-muted">
                        {new Date(log.timestamp).toLocaleString('de-DE')}
                      </TableCell>
                      <TableCell className="font-medium">{log.userEmail}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell className="text-muted">{log.resource}</TableCell>
                      <TableCell>{log.ipAddress || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={log.status === 'success' ? 'success' : 'error'}>
                          {log.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted">Keine Audit-Einträge gefunden</div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text">Aktive Sessions</h2>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Aktualisieren
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Benutzer</TableHead>
                  <TableHead>IP-Adresse</TableHead>
                  <TableHead>Gerät / Browser</TableHead>
                  <TableHead>Standort</TableHead>
                  <TableHead>Gestartet</TableHead>
                  <TableHead>Letzte Aktivität</TableHead>
                  <TableHead>Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted">
                    Session-Daten werden geladen...
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-text">Sicherheitsrichtlinien</h2>
              <Button variant="default" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Richtlinie hinzufügen
              </Button>
            </div>
            
            <div className="space-y-4">
              {/* Password Policy */}
              <div className="p-4 rounded-lg border border-white/10 bg-white/5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Lock className="h-5 w-5 text-blue-400" />
                    <div>
                      <h3 className="font-semibold text-text">Passwort-Richtlinie</h3>
                      <p className="text-sm text-muted">Anforderungen für Benutzerpasswörter</p>
                    </div>
                  </div>
                  <Badge variant="success">Aktiv</Badge>
                </div>
                <div className="ml-8 space-y-2 text-sm text-muted">
                  <p>• Mindestlänge: 12 Zeichen</p>
                  <p>• Großbuchstaben, Kleinbuchstaben, Zahlen und Sonderzeichen erforderlich</p>
                  <p>• Passwort-Historie: Letzte 5 Passwörter werden gespeichert</p>
                  <p>• Ablauf: 90 Tage</p>
                </div>
              </div>

              {/* MFA Policy */}
              <div className="p-4 rounded-lg border border-white/10 bg-white/5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-green-400" />
                    <div>
                      <h3 className="font-semibold text-text">Multi-Faktor-Authentifizierung</h3>
                      <p className="text-sm text-muted">MFA-Anforderungen für Benutzer</p>
                    </div>
                  </div>
                  <Badge variant="success">Aktiv</Badge>
                </div>
                <div className="ml-8 space-y-2 text-sm text-muted">
                  <p>• MFA erforderlich für Admin-Konten</p>
                  <p>• Optional für Standard-Benutzer</p>
                  <p>• Unterstützte Methoden: TOTP, SMS, E-Mail</p>
                </div>
              </div>

              {/* Session Policy */}
              <div className="p-4 rounded-lg border border-white/10 bg-white/5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-purple-400" />
                    <div>
                      <h3 className="font-semibold text-text">Session-Richtlinie</h3>
                      <p className="text-sm text-muted">Verwaltung von Benutzersitzungen</p>
                    </div>
                  </div>
                  <Badge variant="success">Aktiv</Badge>
                </div>
                <div className="ml-8 space-y-2 text-sm text-muted">
                  <p>• Session-Timeout: 30 Minuten Inaktivität</p>
                  <p>• Maximale Session-Dauer: 24 Stunden</p>
                  <p>• Gleichzeitige Sessions pro Benutzer: 3</p>
                </div>
              </div>

              {/* Rate Limiting Policy */}
              <div className="p-4 rounded-lg border border-white/10 bg-white/5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-yellow-400" />
                    <div>
                      <h3 className="font-semibold text-text">Rate Limiting</h3>
                      <p className="text-sm text-muted">Schutz vor Brute-Force-Angriffen</p>
                    </div>
                  </div>
                  <Badge variant="success">Aktiv</Badge>
                </div>
                <div className="ml-8 space-y-2 text-sm text-muted">
                  <p>• Login-Versuche: 5 pro 15 Minuten</p>
                  <p>• API-Anfragen: 1000 pro Stunde</p>
                  <p>• Blockierung-Dauer: 30 Minuten</p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-text">Compliance & Berichte</h2>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Bericht exportieren
              </Button>
            </div>

            {/* DSGVO Compliance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card className="p-4 bg-green-500/10 border-green-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-text mb-1">DSGVO-Konformität</h3>
                    <p className="text-sm text-muted">Datenschutz-Grundverordnung</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">Status:</span>
                    <Badge variant="success">Konform</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-muted">Letzte Prüfung:</span>
                    <span className="text-text">{new Date().toLocaleDateString('de-DE')}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-blue-500/10 border-blue-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-text mb-1">ISO 27001</h3>
                    <p className="text-sm text-muted">Informationssicherheit</p>
                  </div>
                  <Shield className="h-8 w-8 text-blue-400" />
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">Status:</span>
                    <Badge variant="success">Zertifiziert</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-muted">Gültig bis:</span>
                    <span className="text-text">31.12.2025</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Compliance Checklist */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-text mb-4">Compliance-Checkliste</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span className="text-text">Datenverschlüsselung (AES-256)</span>
                  </div>
                  <Badge variant="success">Implementiert</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span className="text-text">Regelmäßige Sicherheits-Audits</span>
                  </div>
                  <Badge variant="success">Aktiv</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span className="text-text">Datenschutz-Folgenabschätzung</span>
                  </div>
                  <Badge variant="success">Abgeschlossen</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span className="text-text">Verzeichnis von Verarbeitungstätigkeiten</span>
                  </div>
                  <Badge variant="success">Gepflegt</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span className="text-text">Incident-Response-Plan</span>
                  </div>
                  <Badge variant="success">Dokumentiert</Badge>
                </div>
              </div>
            </Card>

            {/* Recent Reports */}
            <Card className="p-6 mt-4">
              <h3 className="text-lg font-semibold text-text mb-4">Aktuelle Berichte</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-lg border border-white/10 hover:bg-white/5 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-400" />
                    <div>
                      <p className="font-medium text-text">Q4 2024 Sicherheitsbericht</p>
                      <p className="text-sm text-muted">{new Date().toLocaleDateString('de-DE')}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-white/10 hover:bg-white/5 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-400" />
                    <div>
                      <p className="font-medium text-text">DSGVO Audit-Report</p>
                      <p className="text-sm text-muted">{new Date(Date.now() - 7*24*60*60*1000).toLocaleDateString('de-DE')}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

