import { useState } from 'react';
import { useAuthActions } from '../../lib/store/auth';
import { logger } from '../../lib/logger';

export function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuthActions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      return;
    }

    setIsLoading(true);

    try {
      await login(formData.email, formData.password);
      logger.logUserAction('login_success');
    } catch (error) {
      logger.logUserAction('login_failed', { error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData(prev => ({
        ...prev,
        [field]: e.target.value
      }));
    };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-black via-[#0B0B12] to-[#050509]">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-5xl font-orbitron font-bold text-white mb-2 bg-gradient-to-r from-neon via-white to-neon bg-clip-text text-transparent">
            NEBULA
          </h1>
          <h2 className="text-2xl font-space-grotesk font-semibold text-neon mb-2">
            SUPPLY ADMIN
          </h2>
          <p className="text-sm text-gray-400 font-inter">
            Mission Control Portal
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-space-grotesk font-medium text-gray-300 uppercase tracking-wide">
                E-Mail Adresse
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleInputChange('email')}
                className="mt-1 block w-full rounded-lg border border-neon/30 bg-black/50 px-4 py-3 text-white placeholder-gray-400 font-inter shadow-sm focus:border-neon focus:outline-none focus:ring-2 focus:ring-neon/20 transition-all duration-300"
                placeholder="admin@nebula.local"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-space-grotesk font-medium text-gray-300 uppercase tracking-wide">
                Passwort
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleInputChange('password')}
                className="mt-1 block w-full rounded-lg border border-neon/30 bg-black/50 px-4 py-3 text-white placeholder-gray-400 font-inter shadow-sm focus:border-neon focus:outline-none focus:ring-2 focus:ring-neon/20 transition-all duration-300"
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || !formData.email || !formData.password}
              className="group relative flex w-full justify-center rounded-lg bg-gradient-to-r from-neon to-neon-dark px-4 py-3 text-sm font-space-grotesk font-semibold text-black hover:from-neon-dark hover:to-neon focus:outline-none focus:ring-2 focus:ring-neon focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-neon"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent"></div>
                  Anmelden...
                </div>
              ) : (
                <span className="font-bold">Anmelden</span>
              )}
            </button>
          </div>

          <div className="text-center text-sm text-gray-400 font-inter">
            <p className="text-neon font-semibold">Demo-Anmeldung:</p>
            <p className="text-white">admin@nebula.local / admin123</p>
          </div>
        </form>
      </div>
    </div>
  );
}
