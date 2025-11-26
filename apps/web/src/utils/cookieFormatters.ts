// 🎯 Shared Formatierungs-Funktionen für Cookie Clicker
// Verhindert Code-Duplikation und sorgt für Konsistenz

/**
 * Formatiert große Zahlen für bessere Lesbarkeit
 * @param num - Die zu formatierende Zahl
 * @returns Formatierte Zahl als String (z.B. "1.5K", "2.3M")
 */
export const formatNumber = (num: number): string => {
  if (num >= 1e12) return `${(num / 1e12).toFixed(1)}T`;
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return Math.floor(num).toString();
};

/**
 * Formatiert Zeit in lesbarer Form
 * @param seconds - Zeit in Sekunden
 * @returns Formatierte Zeit als String (z.B. "1h 23m", "45s")
 */
export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
};

/**
 * Formatiert Zeit mit Sekunden (für Mobile/Stats)
 * @param seconds - Zeit in Sekunden
 * @returns Formatierte Zeit als String (z.B. "01:23:45")
 */
export const formatTimeWithSeconds = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Formatiert Prozentangabe
 * @param value - Prozentwert (0-100)
 * @param decimals - Anzahl Nachkommastellen
 * @returns Formatierte Prozentangabe
 */
export const formatPercent = (value: number, decimals: number = 0): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Formatiert CPS (Cookies Per Second) für Anzeige
 * @param cps - Cookies pro Sekunde
 * @returns Formatierte CPS
 */
export const formatCPS = (cps: number): string => {
  if (cps < 1) return cps.toFixed(2);
  return formatNumber(cps);
};









































































