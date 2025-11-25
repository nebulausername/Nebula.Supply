#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class NebulaShellServer {
  constructor() {
    this.server = new Server(
      {
        name: 'nebula-shell',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Whitelist für sichere Befehle
    this.allowedCommands = [
      'pnpm',
      'npm',
      'node',
      'git',
      'tsc',
      'eslint',
      'vitest',
      'playwright',
      'drizzle-kit',
      'vite',
      'build',
      'dev',
      'test',
      'lint',
      'typecheck',
      'install',
      'run',
      'start',
      'stop',
      'restart'
    ];

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'run_command',
            description: 'Run a whitelisted command in the Nebula project',
            inputSchema: {
              type: 'object',
              properties: {
                command: {
                  type: 'string',
                  description: 'Command to run (must be whitelisted)',
                },
                args: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Command arguments',
                },
                cwd: {
                  type: 'string',
                  description: 'Working directory (optional)',
                },
              },
              required: ['command'],
            },
          },
          {
            name: 'run_pnpm',
            description: 'Run pnpm commands (build, dev, test, etc.)',
            inputSchema: {
              type: 'object',
              properties: {
                script: {
                  type: 'string',
                  description: 'pnpm script to run (dev, build, test, etc.)',
                },
                filter: {
                  type: 'string',
                  description: 'Filter for specific workspace (e.g., @nebula/web)',
                },
                args: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Additional arguments',
                },
              },
              required: ['script'],
            },
          },
          {
            name: 'run_git',
            description: 'Run git commands safely',
            inputSchema: {
              type: 'object',
              properties: {
                action: {
                  type: 'string',
                  enum: ['status', 'add', 'commit', 'push', 'pull', 'branch', 'checkout', 'merge'],
                  description: 'Git action to perform',
                },
                args: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Additional git arguments',
                },
              },
              required: ['action'],
            },
          },
          {
            name: 'run_build',
            description: 'Run build commands for the Nebula project',
            inputSchema: {
              type: 'object',
              properties: {
                target: {
                  type: 'string',
                  enum: ['web', 'admin', 'bot', 'all'],
                  description: 'Build target',
                },
              },
            },
          },
          {
            name: 'run_test',
            description: 'Run tests for the Nebula project',
            inputSchema: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: ['unit', 'e2e', 'all'],
                  description: 'Type of tests to run',
                },
                filter: {
                  type: 'string',
                  description: 'Filter for specific workspace',
                },
              },
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'run_command':
            return await this.runCommand(args.command, args.args, args.cwd);
          case 'run_pnpm':
            return await this.runPnpm(args.script, args.filter, args.args);
          case 'run_git':
            return await this.runGit(args.action, args.args);
          case 'run_build':
            return await this.runBuild(args.target);
          case 'run_test':
            return await this.runTest(args.type, args.filter);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
        };
      }
    });
  }

  isCommandAllowed(command) {
    const cmd = command.toLowerCase();
    return this.allowedCommands.some(allowed => 
      cmd.startsWith(allowed) || cmd.includes(allowed)
    );
  }

  async runCommand(command, args = [], cwd = process.cwd()) {
    if (!this.isCommandAllowed(command)) {
      throw new Error(`Command not allowed: ${command}. Allowed commands: ${this.allowedCommands.join(', ')}`);
    }

    const fullCommand = args.length > 0 ? `${command} ${args.join(' ')}` : command;
    const { stdout, stderr } = await execAsync(fullCommand, { cwd });
    
    return {
      content: [
        {
          type: 'text',
          text: `Command: ${fullCommand}\nOutput:\n${stdout}${stderr ? `\nErrors:\n${stderr}` : ''}`,
        },
      ],
    };
  }

  async runPnpm(script, filter = null, args = []) {
    let command = 'pnpm';
    
    if (filter) {
      command += ` --filter ${filter}`;
    }
    
    command += ` ${script}`;
    
    if (args.length > 0) {
      command += ` ${args.join(' ')}`;
    }
    
    const { stdout, stderr } = await execAsync(command);
    
    return {
      content: [
        {
          type: 'text',
          text: `pnpm ${script} completed\nOutput:\n${stdout}${stderr ? `\nErrors:\n${stderr}` : ''}`,
        },
      ],
    };
  }

  async runGit(action, args = []) {
    const command = `git ${action} ${args.join(' ')}`.trim();
    const { stdout, stderr } = await execAsync(command);
    
    return {
      content: [
        {
          type: 'text',
          text: `git ${action} completed\nOutput:\n${stdout}${stderr ? `\nErrors:\n${stderr}` : ''}`,
        },
      ],
    };
  }

  async runBuild(target = 'all') {
    let command;
    
    switch (target) {
      case 'web':
        command = 'pnpm --filter @nebula/web build';
        break;
      case 'admin':
        command = 'pnpm --filter @nebula/admin build';
        break;
      case 'bot':
        command = 'pnpm --filter @nebula/bot build';
        break;
      case 'all':
      default:
        command = 'pnpm build';
        break;
    }
    
    const { stdout, stderr } = await execAsync(command);
    
    return {
      content: [
        {
          type: 'text',
          text: `Build (${target}) completed\nOutput:\n${stdout}${stderr ? `\nErrors:\n${stderr}` : ''}`,
        },
      ],
    };
  }

  async runTest(type = 'all', filter = null) {
    let command;
    
    switch (type) {
      case 'unit':
        command = filter ? `pnpm --filter ${filter} test` : 'pnpm test';
        break;
      case 'e2e':
        command = 'pnpm test:e2e';
        break;
      case 'all':
      default:
        command = 'pnpm test:ci';
        break;
    }
    
    const { stdout, stderr } = await execAsync(command);
    
    return {
      content: [
        {
          type: 'text',
          text: `Tests (${type}) completed\nOutput:\n${stdout}${stderr ? `\nErrors:\n${stderr}` : ''}`,
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Nebula Shell MCP server running on stdio');
  }
}

const server = new NebulaShellServer();
server.run().catch(console.error);


