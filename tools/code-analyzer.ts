import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, extname, relative } from 'path';

interface CodeAnalysis {
  timestamp: string;
  summary: {
    totalFiles: number;
    totalLines: number;
    totalSize: number;
  };
  issues: CodeIssue[];
  recommendations: string[];
  fileStats: FileStat[];
}

interface CodeIssue {
  type: 'error' | 'warning' | 'info';
  severity: 'low' | 'medium' | 'high' | 'critical';
  file: string;
  line?: number;
  message: string;
  suggestion: string;
}

interface FileStat {
  file: string;
  lines: number;
  size: number;
  complexity: 'low' | 'medium' | 'high';
}

class NebulaCodeAnalyzer {
  private issues: CodeIssue[] = [];
  private fileStats: FileStat[] = [];
  private totalFiles = 0;
  private totalLines = 0;
  private totalSize = 0;

  analyze(directories: string[] = ['apps/web/src', 'apps/bot/src', 'packages/shared/src']): CodeAnalysis {
    console.log('🔍 Analyzing Nebula codebase...');
    
    this.issues = [];
    this.fileStats = [];
    this.totalFiles = 0;
    this.totalLines = 0;
    this.totalSize = 0;
    
    for (const directory of directories) {
      this.scanDirectory(directory);
    }
    
    const recommendations = this.generateRecommendations();
    
    const analysis: CodeAnalysis = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFiles: this.totalFiles,
        totalLines: this.totalLines,
        totalSize: this.totalSize
      },
      issues: this.issues,
      recommendations,
      fileStats: this.fileStats
    };
    
    // Save report
    const reportsDir = join(process.cwd(), 'reports', 'code-analysis');
    if (!existsSync(reportsDir)) mkdirSync(reportsDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = join(reportsDir, `code_analysis_${timestamp}.json`);
    writeFileSync(reportPath, JSON.stringify(analysis, null, 2));
    
    // Generate HTML report
    const htmlReport = this.generateHTMLReport(analysis);
    const htmlPath = join(reportsDir, `code_report_${timestamp}.html`);
    writeFileSync(htmlPath, htmlReport);
    
    console.log(`✅ Analysis complete!`);
    console.log(`📁 Files analyzed: ${this.totalFiles}`);
    console.log(`📏 Total lines: ${this.totalLines.toLocaleString()}`);
    console.log(`🚨 Issues found: ${this.issues.length}`);
    console.log(`📋 Report: ${reportPath}`);
    console.log(`🌐 HTML Report: ${htmlPath}`);
    
    return analysis;
  }
  
  private scanDirectory(dir: string) {
    if (!existsSync(dir)) {
      console.warn(`⚠️ Directory not found: ${dir}`);
      return;
    }
    
    const files = readdirSync(dir);
    
    for (const file of files) {
      const filePath = join(dir, file);
      const stat = statSync(filePath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and dist directories
        if (!file.includes('node_modules') && !file.includes('dist') && !file.includes('.git')) {
          this.scanDirectory(filePath);
        }
      } else if (this.isCodeFile(file)) {
        this.analyzeFile(filePath);
      }
    }
  }
  
  private isCodeFile(file: string): boolean {
    const ext = extname(file);
    return ['.ts', '.tsx', '.js', '.jsx'].includes(ext);
  }
  
  private analyzeFile(filePath: string) {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      const size = Buffer.byteLength(content, 'utf8');
      const relativePath = relative(process.cwd(), filePath);
      
      this.totalFiles++;
      this.totalLines += lines.length;
      this.totalSize += size;
      
      // Analyze file complexity
      const complexity = this.calculateComplexity(lines);
      
      this.fileStats.push({
        file: relativePath,
        lines: lines.length,
        size,
        complexity
      });
      
      // Check for issues
      this.checkForIssues(filePath, content, lines);
      
    } catch (error) {
      this.issues.push({
        type: 'error',
        severity: 'high',
        file: relative(process.cwd(), filePath),
        message: `Failed to read file: ${error.message}`,
        suggestion: 'Check file permissions and encoding'
      });
    }
  }
  
  private calculateComplexity(lines: string[]): 'low' | 'medium' | 'high' {
    const complexity = lines.length;
    
    if (complexity < 100) return 'low';
    if (complexity < 300) return 'medium';
    return 'high';
  }
  
  private checkForIssues(filePath: string, content: string, lines: string[]) {
    const relativePath = relative(process.cwd(), filePath);
    
    // Check for console.log statements
    lines.forEach((line, index) => {
      if (line.includes('console.log') && !line.includes('//')) {
        this.issues.push({
          type: 'warning',
          severity: 'medium',
          file: relativePath,
          line: index + 1,
          message: 'Console.log statement found',
          suggestion: 'Remove console.log statements from production code'
        });
      }
    });
    
    // Check for 'any' types
    if (content.includes(': any') && !content.includes('// eslint-disable')) {
      this.issues.push({
        type: 'warning',
        severity: 'medium',
        file: relativePath,
        message: "TypeScript 'any' type found",
        suggestion: 'Replace with proper TypeScript types for better type safety'
      });
    }
    
    // Check for TODO/FIXME comments
    const todoMatches = content.match(/TODO|FIXME|HACK|XXX/gi);
    if (todoMatches) {
      this.issues.push({
        type: 'info',
        severity: 'low',
        file: relativePath,
        message: `${todoMatches.length} TODO/FIXME comments found`,
        suggestion: 'Address TODO/FIXME comments or remove them'
      });
    }
    
    // Check for large files
    if (lines.length > 200) {
      this.issues.push({
        type: 'warning',
        severity: 'medium',
        file: relativePath,
        message: `Large file detected (${lines.length} lines)`,
        suggestion: 'Consider splitting into smaller, more manageable components'
      });
    }
    
    // Check for missing imports
    if (content.includes('React') && !content.includes("import React")) {
      this.issues.push({
        type: 'error',
        severity: 'high',
        file: relativePath,
        message: 'React used without import',
        suggestion: 'Add proper React import statement'
      });
    }
    
    // Check for unused variables (basic check)
    const importMatches = content.match(/import\s+{([^}]+)}/g);
    if (importMatches) {
      importMatches.forEach(importMatch => {
        const imports = importMatch.match(/{([^}]+)}/)?.[1];
        if (imports) {
          const importList = imports.split(',').map(imp => imp.trim());
          importList.forEach(imp => {
            if (!content.includes(imp) && !imp.includes('type')) {
              this.issues.push({
                type: 'warning',
                severity: 'low',
                file: relativePath,
                message: `Potentially unused import: ${imp}`,
                suggestion: 'Remove unused imports to keep code clean'
              });
            }
          });
        }
      });
    }
    
    // Check for hardcoded strings
    const hardcodedStrings = content.match(/"[^"]{20,}"/g);
    if (hardcodedStrings && hardcodedStrings.length > 5) {
      this.issues.push({
        type: 'info',
        severity: 'low',
        file: relativePath,
        message: 'Multiple hardcoded strings found',
        suggestion: 'Consider using constants or i18n for better maintainability'
      });
    }
    
    // Check for missing error handling
    if (content.includes('fetch(') && !content.includes('catch')) {
      this.issues.push({
        type: 'warning',
        severity: 'medium',
        file: relativePath,
        message: 'Fetch without error handling',
        suggestion: 'Add proper error handling for fetch requests'
      });
    }
  }
  
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    const criticalIssues = this.issues.filter(i => i.severity === 'critical').length;
    const highIssues = this.issues.filter(i => i.severity === 'high').length;
    const consoleLogs = this.issues.filter(i => i.message.includes('console.log')).length;
    const anyTypes = this.issues.filter(i => i.message.includes("'any'")).length;
    const largeFiles = this.issues.filter(i => i.message.includes('Large file')).length;
    
    if (criticalIssues > 0) {
      recommendations.push(`🚨 Fix ${criticalIssues} critical issues immediately`);
    }
    
    if (highIssues > 0) {
      recommendations.push(`⚠️ Address ${highIssues} high-priority issues`);
    }
    
    if (consoleLogs > 0) {
      recommendations.push(`🧹 Remove ${consoleLogs} console.log statements from production code`);
    }
    
    if (anyTypes > 0) {
      recommendations.push(`🔧 Replace ${anyTypes} 'any' types with proper TypeScript types`);
    }
    
    if (largeFiles > 0) {
      recommendations.push(`✂️ Split ${largeFiles} large files into smaller components`);
    }
    
    recommendations.push('🧪 Add unit tests for complex functions');
    recommendations.push('📝 Add JSDoc comments for better documentation');
    recommendations.push('🔍 Set up ESLint rules for consistent code style');
    recommendations.push('⚡ Consider using React.memo for performance optimization');
    recommendations.push('🎨 Implement consistent naming conventions');
    
    return recommendations;
  }
  
  private generateHTMLReport(analysis: CodeAnalysis): string {
    const criticalIssues = analysis.issues.filter(i => i.severity === 'critical').length;
    const highIssues = analysis.issues.filter(i => i.severity === 'high').length;
    const mediumIssues = analysis.issues.filter(i => i.severity === 'medium').length;
    const lowIssues = analysis.issues.filter(i => i.severity === 'low').length;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nebula Code Analysis Report</title>
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
        .issue.warning { border-left-color: #ffa726; }
        .issue.info { border-left-color: #42a5f5; }
        .recommendation { 
            background: #1a2a1a; 
            border-left: 4px solid #51cf66; 
            padding: 16px; 
            margin: 12px 0; 
            border-radius: 8px; 
            font-weight: 500;
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
        .file-list {
            max-height: 400px;
            overflow-y: auto;
            background: #222;
            border-radius: 8px;
            padding: 16px;
        }
        .file-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #333;
        }
        .file-item:last-child { border-bottom: none; }
        .complexity {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: 600;
        }
        .complexity.low { background: #1a2a1a; color: #51cf66; }
        .complexity.medium { background: #2a1a1a; color: #ffa726; }
        .complexity.high { background: #2a1a1a; color: #ff6b6b; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 Nebula Code Analysis</h1>
            <p>Generated on ${new Date(analysis.timestamp).toLocaleString()}</p>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number">${analysis.summary.totalFiles}</div>
                <div class="stat-label">Files Analyzed</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${analysis.summary.totalLines.toLocaleString()}</div>
                <div class="stat-label">Total Lines</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${analysis.issues.length}</div>
                <div class="stat-label">Issues Found</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${(analysis.summary.totalSize / 1024).toFixed(1)}KB</div>
                <div class="stat-label">Total Size</div>
            </div>
        </div>
        
        <div class="section">
            <h2>🚨 Issues by Severity</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number" style="color: #ff6b6b;">${criticalIssues}</div>
                    <div class="stat-label">Critical</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" style="color: #ffa726;">${highIssues}</div>
                    <div class="stat-label">High</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" style="color: #42a5f5;">${mediumIssues}</div>
                    <div class="stat-label">Medium</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" style="color: #888;">${lowIssues}</div>
                    <div class="stat-label">Low</div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2>🚨 All Issues (${analysis.issues.length})</h2>
            ${analysis.issues.length > 0 
              ? analysis.issues.map(issue => `
                <div class="issue ${issue.type}">
                    <strong>${issue.file}${issue.line ? `:${issue.line}` : ''}</strong><br>
                    ${issue.message}<br>
                    <em>💡 ${issue.suggestion}</em>
                </div>
              `).join('')
              : '<div class="recommendation">🎉 No issues found! Great job!</div>'
            }
        </div>
        
        <div class="section">
            <h2>💡 Recommendations (${analysis.recommendations.length})</h2>
            ${analysis.recommendations.map(rec => `<div class="recommendation">${rec}</div>`).join('')}
        </div>
        
        <div class="section">
            <h2>📁 File Statistics</h2>
            <div class="file-list">
                ${analysis.fileStats
                  .sort((a, b) => b.lines - a.lines)
                  .slice(0, 20)
                  .map(file => `
                    <div class="file-item">
                        <span>${file.file}</span>
                        <div>
                            <span style="color: #888; margin-right: 16px;">${file.lines} lines</span>
                            <span class="complexity ${file.complexity}">${file.complexity}</span>
                        </div>
                    </div>
                  `).join('')
                }
            </div>
        </div>
    </div>
</body>
</html>`;
  }
}

// Export for use
export { NebulaCodeAnalyzer };

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const analyzer = new NebulaCodeAnalyzer();
  const directories = process.argv.slice(2);
  
  analyzer.analyze(directories.length > 0 ? directories : undefined)
    .then(() => {
      console.log('✅ Code analysis complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Code analysis failed:', error);
      process.exit(1);
    });
}
