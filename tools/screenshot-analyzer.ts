import { createWriteStream, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execa } from 'execa';
import waitOn from 'wait-on';
import { chromium } from '@playwright/test';

const WEB_DEV_HOST = '127.0.0.1';
const WEB_DEV_URL = `http://${WEB_DEV_HOST}:5173`;

interface UIAnalysis {
  url: string;
  timestamp: string;
  issues: string[];
  performance: {
    loadTime: number;
    imageCount: number;
    scriptCount: number;
    consoleErrors: number;
  };
  recommendations: string[];
  screenshotPath: string;
}

class NebulaScreenshotAnalyzer {
  private browser: any;
  private devServer: any;

  async analyze(url: string = WEB_DEV_URL): Promise<UIAnalysis> {
    console.log('🚀 Starting Nebula UI Analysis...');
    
    try {
      // Start dev server if not running
      await this.ensureDevServer();
      
      // Wait for server to be ready
      await waitOn({ resources: [url], timeout: 30000, interval: 500 });
      
      // Launch browser
      this.browser = await chromium.launch({ headless: true });
      const page = await this.browser.newPage();
      
      // Set viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      // Create directories
      const screenshotsDir = join(process.cwd(), 'screenshots');
      const reportsDir = join(process.cwd(), 'reports', 'ui-analysis');
      
      if (!existsSync(screenshotsDir)) mkdirSync(screenshotsDir, { recursive: true });
      if (!existsSync(reportsDir)) mkdirSync(reportsDir, { recursive: true });
      
      // Take screenshot
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const screenshotPath = join(screenshotsDir, `nebula_analysis_${timestamp}.png`);
      console.log('📸 Taking screenshot...');
      
      const startTime = Date.now();
      await page.goto(url, { waitUntil: 'networkidle' });
      const loadTime = Date.now() - startTime;
      
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`✅ Screenshot saved: ${screenshotPath}`);
      
      // Analyze UI issues
      console.log('🔍 Analyzing UI issues...');
      const issues = await this.detectIssues(page);
      
      // Get performance metrics
      const performance = await this.getPerformanceMetrics(page, loadTime);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(issues, performance);
      
      const analysis: UIAnalysis = {
        url,
        timestamp: new Date().toISOString(),
        issues,
        performance,
        recommendations,
        screenshotPath
      };
      
      // Save report
      const reportPath = join(reportsDir, `ui_analysis_${timestamp}.json`);
      writeFileSync(reportPath, JSON.stringify(analysis, null, 2));
      
      // Generate HTML report
      const htmlReport = this.generateHTMLReport(analysis);
      const htmlPath = join(reportsDir, `ui_report_${timestamp}.html`);
      writeFileSync(htmlPath, htmlReport);
      
      await page.close();
      await this.browser.close();
      
      console.log('🎯 Analysis complete!');
      console.log(`📊 Issues found: ${issues.length}`);
      console.log(`⚡ Load time: ${loadTime}ms`);
      console.log(`🚨 Console errors: ${performance.consoleErrors}`);
      console.log(`📋 Report: ${reportPath}`);
      console.log(`🌐 HTML Report: ${htmlPath}`);
      
      return analysis;
      
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      throw error;
    }
  }
  
  private async ensureDevServer() {
    try {
      // Check if server is already running
      await waitOn({ resources: [WEB_DEV_URL], timeout: 2000, interval: 100 });
      console.log('✅ Dev server already running');
    } catch {
      console.log('🚀 Starting dev server...');
      this.devServer = execa('pnpm', ['--filter', '@nebula/web', 'dev', '--', '--host', WEB_DEV_HOST], {
        stdout: 'pipe',
        stderr: 'pipe',
      });
      
      // Don't wait for server to start here, waitOn will handle it
    }
  }
  
  private async detectIssues(page: any): Promise<string[]> {
    const issues: string[] = [];
    
    // Check for missing alt texts
    const imagesWithoutAlt = await page.$$eval('img', (imgs: any[]) => 
      imgs.filter(img => !img.alt).length
    );
    
    if (imagesWithoutAlt > 0) {
      issues.push(`🚨 ${imagesWithoutAlt} images missing alt text`);
    }
    
    // Check for missing buttons
    const buttonsWithoutText = await page.$$eval('button', (buttons: any[]) => 
      buttons.filter(btn => !btn.textContent?.trim()).length
    );
    
    if (buttonsWithoutText > 0) {
      issues.push(`🔘 ${buttonsWithoutText} buttons without text content`);
    }
    
    // Check for missing links
    const linksWithoutText = await page.$$eval('a', (links: any[]) => 
      links.filter(link => !link.textContent?.trim() && !link.getAttribute('aria-label')).length
    );
    
    if (linksWithoutText > 0) {
      issues.push(`🔗 ${linksWithoutText} links without accessible text`);
    }
    
    // Check for responsive issues
    const wideElements = await page.$$eval('*', (elements: any[]) => {
      return elements.filter(el => {
        const rect = el.getBoundingClientRect();
        return rect.width > 1920;
      }).length;
    });
    
    if (wideElements > 0) {
      issues.push(`📱 ${wideElements} elements wider than viewport`);
    }
    
    // Check for form issues
    const inputsWithoutLabels = await page.$$eval('input, textarea, select', (inputs: any[]) => {
      return inputs.filter(input => {
        const id = input.id;
        const label = document.querySelector(`label[for="${id}"]`);
        const ariaLabel = input.getAttribute('aria-label');
        const placeholder = input.getAttribute('placeholder');
        return !label && !ariaLabel && !placeholder;
      }).length;
    });
    
    if (inputsWithoutLabels > 0) {
      issues.push(`📝 ${inputsWithoutLabels} form inputs without labels`);
    }
    
    return issues;
  }
  
  private async getPerformanceMetrics(page: any, loadTime: number) {
    const imageCount = await page.$$eval('img', (imgs: any[]) => imgs.length);
    const scriptCount = await page.$$eval('script', (scripts: any[]) => scripts.length);
    
    // Count console errors
    let consoleErrors = 0;
    page.on('console', (msg: any) => {
      if (msg.type() === 'error') {
        consoleErrors++;
      }
    });
    
    return {
      loadTime,
      imageCount,
      scriptCount,
      consoleErrors
    };
  }
  
  private generateRecommendations(issues: string[], performance: any): string[] {
    const recommendations: string[] = [];
    
    if (performance.loadTime > 3000) {
      recommendations.push('⚡ Optimize page load time - consider lazy loading and code splitting');
    }
    
    if (performance.imageCount > 10) {
      recommendations.push('🖼️ Optimize images - use WebP format and lazy loading');
    }
    
    if (performance.consoleErrors > 0) {
      recommendations.push('🚨 Fix console errors - check browser dev tools');
    }
    
    if (issues.some(issue => issue.includes('alt text'))) {
      recommendations.push('♿ Add alt text to all images for accessibility');
    }
    
    if (issues.some(issue => issue.includes('buttons'))) {
      recommendations.push('🔘 Add text content to all buttons');
    }
    
    if (issues.some(issue => issue.includes('links'))) {
      recommendations.push('🔗 Add accessible text to all links');
    }
    
    if (issues.some(issue => issue.includes('form inputs'))) {
      recommendations.push('📝 Add labels to all form inputs');
    }
    
    recommendations.push('🎨 Implement consistent spacing using design tokens');
    recommendations.push('📱 Test responsive design on mobile devices');
    recommendations.push('🔍 Add focus indicators for keyboard navigation');
    
    return recommendations;
  }
  
  private generateHTMLReport(analysis: UIAnalysis): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nebula UI Analysis Report</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: #0a0a0a; 
            color: #fff; 
            line-height: 1.6;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { 
            text-align: center; 
            margin-bottom: 40px; 
            padding: 40px 20px;
            background: linear-gradient(135deg, #0bf7bc, #00d4aa);
            border-radius: 16px;
            color: #000;
        }
        .header h1 { font-size: 3rem; margin: 0; font-weight: 800; }
        .header p { font-size: 1.2rem; margin: 10px 0 0 0; opacity: 0.8; }
        .section { 
            background: #1a1a1a; 
            border-radius: 12px; 
            padding: 24px; 
            margin-bottom: 24px; 
            border: 1px solid #333; 
        }
        .section h2 { 
            color: #0bf7bc; 
            margin-top: 0; 
            font-size: 1.5rem;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .issue { 
            background: #2a1a1a; 
            border-left: 4px solid #ff6b6b; 
            padding: 16px; 
            margin: 12px 0; 
            border-radius: 8px; 
            font-weight: 500;
        }
        .recommendation { 
            background: #1a2a1a; 
            border-left: 4px solid #51cf66; 
            padding: 16px; 
            margin: 12px 0; 
            border-radius: 8px; 
            font-weight: 500;
        }
        .metric { 
            display: inline-block; 
            background: linear-gradient(135deg, #333, #444); 
            padding: 12px 20px; 
            border-radius: 25px; 
            margin: 8px; 
            font-weight: 600;
            border: 1px solid #555;
        }
        .screenshot { 
            max-width: 100%; 
            border-radius: 12px; 
            border: 2px solid #333; 
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .stat-card {
            background: #222;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            border: 1px solid #333;
        }
        .stat-number {
            font-size: 2rem;
            font-weight: 800;
            color: #0bf7bc;
            margin: 0;
        }
        .stat-label {
            color: #888;
            margin: 5px 0 0 0;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Nebula UI Analysis</h1>
            <p>Generated on ${new Date(analysis.timestamp).toLocaleString()}</p>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number">${analysis.issues.length}</div>
                <div class="stat-label">Issues Found</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${analysis.performance.loadTime}ms</div>
                <div class="stat-label">Load Time</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${analysis.performance.consoleErrors}</div>
                <div class="stat-label">Console Errors</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${analysis.recommendations.length}</div>
                <div class="stat-label">Recommendations</div>
            </div>
        </div>
        
        <div class="section">
            <h2>📊 Performance Metrics</h2>
            <div class="metric">Load Time: ${analysis.performance.loadTime}ms</div>
            <div class="metric">Images: ${analysis.performance.imageCount}</div>
            <div class="metric">Scripts: ${analysis.performance.scriptCount}</div>
            <div class="metric">Console Errors: ${analysis.performance.consoleErrors}</div>
        </div>
        
        <div class="section">
            <h2>🚨 Issues Found (${analysis.issues.length})</h2>
            ${analysis.issues.length > 0 
              ? analysis.issues.map(issue => `<div class="issue">${issue}</div>`).join('')
              : '<div class="recommendation">🎉 No issues found! Great job!</div>'
            }
        </div>
        
        <div class="section">
            <h2>💡 Recommendations (${analysis.recommendations.length})</h2>
            ${analysis.recommendations.map(rec => `<div class="recommendation">${rec}</div>`).join('')}
        </div>
        
        <div class="section">
            <h2>📸 Screenshot</h2>
            <img src="${analysis.screenshotPath}" alt="Nebula App Screenshot" class="screenshot">
        </div>
    </div>
</body>
</html>`;
  }
}

// Export for use
export { NebulaScreenshotAnalyzer };

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const analyzer = new NebulaScreenshotAnalyzer();
  const url = process.argv[2] || WEB_DEV_URL;
  
  analyzer.analyze(url)
    .then(() => {
      console.log('✅ Analysis complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Analysis failed:', error);
      process.exit(1);
    });
}
