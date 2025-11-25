import React, { useState, useEffect } from 'react';
import { ExternalInterestButton, embedInterestButton } from '../components/ExternalInterestButton';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { useBotCommandHandler } from '../utils/botCommandHandler';
import { cn } from '../utils/cn';

// 🎯 Demo page showcasing external interest button variants
export const ExternalInterestDemo: React.FC = () => {
  const [selectedDrop, setSelectedDrop] = useState('drop-1');
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('auto');
  const { executeCommand } = useBotCommandHandler();

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

  // Sample drops for demo
  const demoDrops = [
    {
      id: 'drop-1',
      name: 'Nebula Hoodie Limited Edition',
      description: 'Exclusive cosmic design with premium materials',
      price: '€89.99',
      interestCount: 247
    },
    {
      id: 'drop-2',
      name: 'Galaxy Sneakers Pro',
      description: 'Revolutionary comfort meets stellar style',
      price: '€159.99',
      interestCount: 183
    },
    {
      id: 'drop-3',
      name: 'Stellar Backpack',
      description: 'Interdimensional storage for cosmic travelers',
      price: '€69.99',
      interestCount: 92
    }
  ];

  const currentDrop = demoDrops.find(d => d.id === selectedDrop);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            🚀 Nebula External Interest Button Demo
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Showcase of the universal interest button that works across all devices and platforms.
            Perfect for embedding on external websites, blogs, and e-commerce platforms.
          </p>
        </div>

        {/* Theme Selector */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Theme Settings
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Choose how the button adapts to different environments
              </p>
            </div>
            <div className="flex gap-2">
              {(['light', 'dark', 'auto'] as const).map((themeOption) => (
                <button
                  key={themeOption}
                  onClick={() => setTheme(themeOption)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    theme === themeOption
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  )}
                >
                  {themeOption.charAt(0).toUpperCase() + themeOption.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Drop Selector */}
        <Card className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Select Demo Drop
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {demoDrops.map((drop) => (
                <button
                  key={drop.id}
                  onClick={() => setSelectedDrop(drop.id)}
                  className={cn(
                    'p-4 rounded-lg border-2 text-left transition-all',
                    selectedDrop === drop.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                  )}
                >
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {drop.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {drop.description}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {drop.price}
                    </span>
                    <Badge variant="secondary">{drop.interestCount} interested</Badge>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Button Variants Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* React Component Examples */}
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  React Component Variants
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Perfect for React applications and modern web frameworks
                </p>
              </div>

              {/* Default Variant */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-white">Default</h4>
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <ExternalInterestButton
                    dropId={selectedDrop}
                    dropName={currentDrop?.name}
                    variant="default"
                    theme={theme}
                    showCount={true}
                    onInterestChange={(interested, count) => {
                      console.log('Interest changed:', { interested, count });
                    }}
                  />
                </div>
              </div>

              {/* Minimal Variant */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-white">Minimal</h4>
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <ExternalInterestButton
                    dropId={selectedDrop}
                    variant="minimal"
                    size="sm"
                    theme={theme}
                  />
                </div>
              </div>

              {/* Large Variant */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-white">Large</h4>
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <ExternalInterestButton
                    dropId={selectedDrop}
                    variant="default"
                    size="lg"
                    theme={theme}
                    showCount={true}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Web Component Examples */}
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Web Component Variants
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Works on any website, even without React or modern frameworks
                </p>
              </div>

              {/* Web Component Example */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-white">Standard Web Component</h4>
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  {/* TODO: Fix web component registration */}
                  <div className="p-8 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
                    <p className="text-gray-600 dark:text-gray-400">
                      Web component would render here
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                      Drop ID: {selectedDrop}
                    </p>
                  </div>
                </div>
              </div>

              {/* Floating Variant */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-white">Floating Action Button</h4>
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg relative min-h-[200px]">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    The floating variant appears as a fixed position button in the bottom-right corner.
                  </p>
                  {/* TODO: Fix web component registration */}
                  <div className="p-8 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
                    <p className="text-gray-600 dark:text-gray-400">
                      Floating web component would render here
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                      Drop ID: {selectedDrop}
                    </p>
                  </div>
                </div>
              </div>

              {/* Custom Integration */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-white">Custom Integration</h4>
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <button
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    onClick={() => {
                      // Example: Embed button in external container
                      const externalContainer = document.getElementById('external-demo');
                      if (externalContainer) {
                        embedInterestButton(externalContainer, selectedDrop, {
                          variant: 'minimal',
                          theme: theme,
                          showCount: false
                        });
                      }
                    }}
                  >
                    Embed in External Container
                  </button>
                  <div id="external-demo" className="mt-4 min-h-[60px]"></div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Code Examples */}
        <Card className="p-6">
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Integration Examples
            </h3>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">React Integration</h4>
                <pre className="bg-gray-800 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`import { ExternalInterestButton } from '@nebula/web-components';

<ExternalInterestButton
  dropId="${selectedDrop}"
  dropName="${currentDrop?.name}"
  variant="default"
  theme="${theme}"
  showCount={true}
  onInterestChange={(interested, count) => {
    console.log('Interest changed:', { interested, count });
  }}
/>`}
                </pre>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Vanilla JavaScript</h4>
                <pre className="bg-gray-800 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`// Using Web Component
<nebula-interest-button
  drop-id="${selectedDrop}"
  variant="default"
  theme="${theme}"
  show-count>
</nebula-interest-button>

// Or using the utility function
import { embedInterestButton } from '@nebula/web-components';
embedInterestButton('#my-container', '${selectedDrop}', {
  variant: 'minimal',
  theme: '${theme}'
});`}
                </pre>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">WordPress/CMS Integration</h4>
                <pre className="bg-gray-800 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`<!-- Add to your theme's functions.php -->
<script src="https://your-domain.com/nebula-components.js"></script>

<!-- In your template -->
<nebula-interest-button
  drop-id="<?php echo get_post_meta($post->ID, 'nebula_drop_id', true); ?>"
  variant="floating"
  theme="auto"
  show-count>
</nebula-interest-button>`}
                </pre>
              </div>
            </div>
          </div>
        </Card>

        {/* Features */}
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Cross-Platform</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Works on React, Vue, Angular, vanilla JS, WordPress, Shopify, and more
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Responsive Design</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Optimized for mobile, tablet, and desktop with touch-friendly interactions
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Real-time Updates</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Live interest counts and status updates without page refresh
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Accessibility</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                WCAG compliant with keyboard navigation and screen reader support
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Customizable</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Multiple variants, sizes, themes, and customization options
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Analytics Ready</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Built-in tracking and analytics integration for interest metrics
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ExternalInterestDemo;
