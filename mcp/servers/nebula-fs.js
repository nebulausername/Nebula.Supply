#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { promises as fs } from 'fs';
import path from 'path';

class NebulaFileSystemServer {
  constructor() {
    this.server = new Server(
      {
        name: 'nebula-fs',
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
            name: 'read_file',
            description: 'Read contents of a file in the Nebula project',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: 'Path to the file relative to project root',
                },
              },
              required: ['path'],
            },
          },
          {
            name: 'write_file',
            description: 'Write contents to a file in the Nebula project',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: 'Path to the file relative to project root',
                },
                content: {
                  type: 'string',
                  description: 'Content to write to the file',
                },
              },
              required: ['path', 'content'],
            },
          },
          {
            name: 'list_directory',
            description: 'List contents of a directory in the Nebula project',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: 'Path to the directory relative to project root',
                },
              },
              required: ['path'],
            },
          },
          {
            name: 'create_directory',
            description: 'Create a new directory in the Nebula project',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: 'Path to the directory to create',
                },
              },
              required: ['path'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'read_file':
            return await this.readFile(args.path);
          case 'write_file':
            return await this.writeFile(args.path, args.content);
          case 'list_directory':
            return await this.listDirectory(args.path);
          case 'create_directory':
            return await this.createDirectory(args.path);
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

  async readFile(filePath) {
    const fullPath = path.resolve(process.cwd(), filePath);
    const content = await fs.readFile(fullPath, 'utf-8');
    
    return {
      content: [
        {
          type: 'text',
          text: content,
        },
      ],
    };
  }

  async writeFile(filePath, content) {
    const fullPath = path.resolve(process.cwd(), filePath);
    await fs.writeFile(fullPath, content, 'utf-8');
    
    return {
      content: [
        {
          type: 'text',
          text: `File written successfully: ${filePath}`,
        },
      ],
    };
  }

  async listDirectory(dirPath) {
    const fullPath = path.resolve(process.cwd(), dirPath);
    const items = await fs.readdir(fullPath, { withFileTypes: true });
    
    const result = items.map(item => ({
      name: item.name,
      type: item.isDirectory() ? 'directory' : 'file',
    }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  async createDirectory(dirPath) {
    const fullPath = path.resolve(process.cwd(), dirPath);
    await fs.mkdir(fullPath, { recursive: true });
    
    return {
      content: [
        {
          type: 'text',
          text: `Directory created successfully: ${dirPath}`,
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Nebula FileSystem MCP server running on stdio');
  }
}

const server = new NebulaFileSystemServer();
server.run().catch(console.error);


