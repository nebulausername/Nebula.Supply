export function isFeatureEnabled(flagName: string, defaultEnabled = true): boolean {
  try {
    const raw = localStorage.getItem('nebula_flags');
    if (!raw) return defaultEnabled;
    const flags = JSON.parse(raw) as Record<string, boolean>;
    const value = flags?.[flagName];
    return typeof value === 'boolean' ? value : defaultEnabled;
  } catch {
    return defaultEnabled;
  }
}

export function setFeatureFlag(flagName: string, enabled: boolean): void {
  try {
    const raw = localStorage.getItem('nebula_flags');
    const flags = raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    flags[flagName] = enabled;
    localStorage.setItem('nebula_flags', JSON.stringify(flags));
  } catch {
    // no-op
  }
}











































































