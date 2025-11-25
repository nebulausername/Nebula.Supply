// 📤 EXPORT MANAGER - Daten-Export & Reporting!

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Download,
  FileText,
  FileJson,
  File,
  Calendar,
  CheckCircle,
  X,
  Settings
} from 'lucide-react';
import type { ContestAdminConfig } from './ContestAdminPanel';

const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

interface Participant {
  id: string;
  name: string;
  rank: number;
  score: number;
  cookies: number;
  achievements: number;
  status: string;
  joinedAt: string;
}

interface ExportManagerProps {
  contest: ContestAdminConfig;
  participants?: Participant[];
}

type ExportFormat = 'csv' | 'json' | 'pdf';
type ExportType = 'leaderboard' | 'participants' | 'scores' | 'full';

// 📤 EXPORT MANAGER - MAXIMIERT & PREMIUM!
export const ExportManager = ({ contest, participants = [] }: ExportManagerProps) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv');
  const [selectedType, setSelectedType] = useState<ExportType>('leaderboard');
  const [isExporting, setIsExporting] = useState(false);
  const [exportHistory, setExportHistory] = useState<Array<{
    id: string;
    type: ExportType;
    format: ExportFormat;
    timestamp: string;
    filename: string;
  }>>([]);

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      let data: any;
      let filename: string;

      switch (selectedType) {
        case 'leaderboard':
          data = participants.map(p => ({
            Rank: p.rank,
            Name: p.name,
            Score: p.score,
            Cookies: p.cookies,
            Achievements: p.achievements,
            Status: p.status,
          }));
          filename = `contest-${contest.contestId}-leaderboard`;
          break;
        
        case 'participants':
          data = participants.map(p => ({
            ID: p.id,
            Name: p.name,
            Rank: p.rank,
            Score: p.score,
            Joined: p.joinedAt,
          }));
          filename = `contest-${contest.contestId}-participants`;
          break;
        
        case 'scores':
          data = participants.map(p => ({
            Rank: p.rank,
            Name: p.name,
            Score: p.score,
            Cookies: p.cookies,
          }));
          filename = `contest-${contest.contestId}-scores`;
          break;
        
        case 'full':
          data = {
            contest: {
              id: contest.contestId,
              name: contest.name,
              type: contest.type,
              status: contest.status,
              startDate: contest.startDate,
              endDate: contest.endDate,
              participantCount: contest.participantCount,
              prizes: contest.prizes,
            },
            participants: participants,
            exportDate: new Date().toISOString(),
          };
          filename = `contest-${contest.contestId}-full`;
          break;
      }

      if (selectedFormat === 'csv') {
        await exportCSV(data, filename);
      } else if (selectedFormat === 'json') {
        await exportJSON(data, filename);
      } else if (selectedFormat === 'pdf') {
        await exportPDF(data, filename);
      }

      // Add to history
      setExportHistory(prev => [{
        id: Date.now().toString(),
        type: selectedType,
        format: selectedFormat,
        timestamp: new Date().toISOString(),
        filename: `${filename}.${selectedFormat}`,
      }, ...prev].slice(0, 10));

      alert('Export erfolgreich!');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Fehler beim Export!');
    } finally {
      setIsExporting(false);
    }
  };

  const exportCSV = async (data: any, filename: string) => {
    let csv: string;

    if (Array.isArray(data)) {
      // Array of objects
      const headers = Object.keys(data[0] || {});
      csv = [
        headers.join(','),
        ...data.map(row => headers.map(h => {
          const value = row[h];
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        }).join(','))
      ].join('\n');
    } else {
      // Object - convert to JSON-like CSV
      csv = JSON.stringify(data, null, 2);
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = async (data: any, filename: string) => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = async (data: any, filename: string) => {
    // PDF export would require a library like jsPDF
    // For now, we'll create a simple HTML page that can be printed
    const html = generatePDFHTML(data, contest);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url);
    // Note: User can print to PDF from browser
    alert('PDF-Vorschau geöffnet. Bitte drucke als PDF (Strg+P > Als PDF speichern).');
  };

  const generatePDFHTML = (data: any, contest: ContestAdminConfig): string => {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>${contest.name} - Export</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    h1 { color: #333; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
  </style>
</head>
<body>
  <h1>${contest.name}</h1>
  <p><strong>Export Date:</strong> ${new Date().toLocaleString()}</p>
  ${Array.isArray(data) ? `
    <table>
      <thead>
        <tr>
          ${Object.keys(data[0] || {}).map(k => `<th>${k}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${data.map(row => `
          <tr>
            ${Object.values(row).map(v => `<td>${v}</td>`).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : `<pre>${JSON.stringify(data, null, 2)}</pre>`}
</body>
</html>
    `;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Download className="w-6 h-6 text-green-400" />
            Daten-Export & Reporting
          </h2>
          <p className="text-white/60 text-sm mt-1">
            Exportiere Contest-Daten in verschiedenen Formaten
          </p>
        </div>
      </div>

      {/* Export Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Format Selection */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Export Format</h3>
          <div className="space-y-2">
            {(['csv', 'json', 'pdf'] as ExportFormat[]).map((format) => (
              <motion.button
                key={format}
                onClick={() => setSelectedFormat(format)}
                className={cn(
                  "w-full p-4 rounded-lg border-2 transition-all text-left flex items-center gap-3",
                  selectedFormat === format
                    ? "border-blue-500/50 bg-blue-500/10"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {format === 'csv' && <FileText className="w-5 h-5 text-blue-400" />}
                {format === 'json' && <FileJson className="w-5 h-5 text-purple-400" />}
                {format === 'pdf' && <File className="w-5 h-5 text-red-400" />}
                <div>
                  <div className="font-semibold text-white">{format.toUpperCase()}</div>
                  <div className="text-xs text-white/60">
                    {format === 'csv' && 'Tabellen-Format für Excel'}
                    {format === 'json' && 'Strukturierte Daten'}
                    {format === 'pdf' && 'Druckbares Dokument'}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Type Selection */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Export Typ</h3>
          <div className="space-y-2">
            {([
              { type: 'leaderboard' as ExportType, label: 'Leaderboard', desc: 'Rangliste mit allen Teilnehmern' },
              { type: 'participants' as ExportType, label: 'Teilnehmer Liste', desc: 'Alle Teilnehmer-Details' },
              { type: 'scores' as ExportType, label: 'Scores', desc: 'Nur Scores und Rankings' },
              { type: 'full' as ExportType, label: 'Vollständig', desc: 'Alle Contest-Daten' },
            ]).map(({ type, label, desc }) => (
              <motion.button
                key={type}
                onClick={() => setSelectedType(type)}
                className={cn(
                  "w-full p-4 rounded-lg border-2 transition-all text-left",
                  selectedType === type
                    ? "border-green-500/50 bg-green-500/10"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="font-semibold text-white">{label}</div>
                <div className="text-xs text-white/60">{desc}</div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Export Button */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Export starten</h3>
            <p className="text-sm text-white/60">
              {selectedType} als {selectedFormat.toUpperCase()} exportieren
            </p>
          </div>
          <motion.button
            onClick={handleExport}
            disabled={isExporting || participants.length === 0}
            className={cn(
              "px-6 py-3 rounded-lg font-bold flex items-center gap-2",
              isExporting || participants.length === 0
                ? "bg-gray-500/20 text-gray-400 cursor-not-allowed"
                : "bg-green-500 text-white"
            )}
            whileHover={{ scale: isExporting ? 1 : 1.05 }}
            whileTap={{ scale: isExporting ? 1 : 0.95 }}
          >
            {isExporting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Exportiere...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Export starten
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Export History */}
      {exportHistory.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Export History</h3>
          <div className="space-y-2">
            {exportHistory.map((exportItem) => (
              <div
                key={exportItem.id}
                className="flex items-center justify-between p-3 rounded-lg bg-white/5"
              >
                <div className="flex items-center gap-3">
                  {exportItem.format === 'csv' && <FileText className="w-4 h-4 text-blue-400" />}
                  {exportItem.format === 'json' && <FileJson className="w-4 h-4 text-purple-400" />}
                  {exportItem.format === 'pdf' && <File className="w-4 h-4 text-red-400" />}
                  <div>
                    <div className="text-sm font-semibold text-white">{exportItem.filename}</div>
                    <div className="text-xs text-white/60">
                      {exportItem.type} · {new Date(exportItem.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
                <CheckCircle className="w-4 h-4 text-green-400" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

