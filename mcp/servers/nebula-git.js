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

class NebulaGitServer {
  constructor() {
    this.server = new Server(
      {
        name: 'nebula-git',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'git_status',
            description: 'Get git status of the Nebula repository',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'git_commit',
            description: 'Commit changes to the Nebula repository',
            inputSchema: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  description: 'Commit message',
                },
                files: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Files to commit (optional, commits all if not specified)',
                },
              },
              required: ['message'],
            },
          },
          {
            name: 'git_push',
            description: 'Push changes to remote repository',
            inputSchema: {
              type: 'object',
              properties: {
                branch: {
                  type: 'string',
                  description: 'Branch to push to (default: current branch)',
                },
              },
            },
          },
          {
            name: 'git_pull',
            description: 'Pull latest changes from remote repository',
            inputSchema: {
              type: 'object',
              properties: {
                branch: {
                  type: 'string',
                  description: 'Branch to pull from (default: current branch)',
                },
              },
            },
          },
          {
            name: 'git_branch',
            description: 'List or create git branches',
            inputSchema: {
              type: 'object',
              properties: {
                action: {
                  type: 'string',
                  enum: ['list', 'create', 'switch'],
                  description: 'Branch action to perform',
                },
                name: {
                  type: 'string',
                  description: 'Branch name (required for create/switch)',
                },
              },
              required: ['action'],
            },
          },
          {
            name: 'git_log',
            description: 'Get git commit history',
            inputSchema: {
              type: 'object',
              properties: {
                limit: {
                  type: 'number',
                  description: 'Number of commits to show (default: 10)',
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
          case 'git_status':
            return await this.gitStatus();
          case 'git_commit':
            return await this.gitCommit(args.message, args.files);
          case 'git_push':
            return await this.gitPush(args.branch);
          case 'git_pull':
            return await this.gitPull(args.branch);
          case 'git_branch':
            return await this.gitBranch(args.action, args.name);
          case 'git_log':
            return await this.gitLog(args.limit);
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

  async gitStatus() {
    const { stdout } = await execAsync('git status --porcelain');
    return {
      content: [
        {
          type: 'text',
          text: stdout || 'Working directory clean',
        },
      ],
    };
  }

  async gitCommit(message, files = null) {
    let command = 'git add';
    
    if (files && files.length > 0) {
      command += ` ${files.join(' ')}`;
    } else {
      command += ' .';
    }
    
    await execAsync(command);
    await execAsync(`git commit -m "${message}"`);
    
    return {
      content: [
        {
          type: 'text',
          text: `Committed successfully: ${message}`,
        },
      ],
    };
  }

  async gitPush(branch = null) {
    const command = branch ? `git push origin ${branch}` : 'git push';
    const { stdout } = await execAsync(command);
    
    return {
      content: [
        {
          type: 'text',
          text: stdout || 'Push completed successfully',
        },
      ],
    };
  }

  async gitPull(branch = null) {
    const command = branch ? `git pull origin ${branch}` : 'git pull';
    const { stdout } = await execAsync(command);
    
    return {
      content: [
        {
          type: 'text',
          text: stdout || 'Pull completed successfully',
        },
      ],
    };
  }

  async gitBranch(action, name = null) {
    let command;
    
    switch (action) {
      case 'list':
        command = 'git branch -a';
        break;
      case 'create':
        if (!name) throw new Error('Branch name required for create action');
        command = `git checkout -b ${name}`;
        break;
      case 'switch':
        if (!name) throw new Error('Branch name required for switch action');
        command = `git checkout ${name}`;
        break;
      default:
        throw new Error(`Unknown branch action: ${action}`);
    }
    
    const { stdout } = await execAsync(command);
    
    return {
      content: [
        {
          type: 'text',
          text: stdout || `${action} completed successfully`,
        },
      ],
    };
  }

  async gitLog(limit = 10) {
    const { stdout } = await execAsync(`git log --oneline -${limit}`);
    
    return {
      content: [
        {
          type: 'text',
          text: stdout || 'No commits found',
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Nebula Git MCP server running on stdio');
  }
}

const server = new NebulaGitServer();
server.run().catch(console.error);


