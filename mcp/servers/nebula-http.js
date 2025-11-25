#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

class NebulaHttpServer {
  constructor() {
    this.server = new Server(
      {
        name: 'nebula-http',
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
            name: 'http_request',
            description: 'Make HTTP requests to test Nebula APIs',
            inputSchema: {
              type: 'object',
              properties: {
                method: {
                  type: 'string',
                  enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
                  description: 'HTTP method',
                },
                url: {
                  type: 'string',
                  description: 'URL to request',
                },
                headers: {
                  type: 'object',
                  description: 'HTTP headers',
                },
                body: {
                  type: 'string',
                  description: 'Request body (for POST/PUT/PATCH)',
                },
              },
              required: ['method', 'url'],
            },
          },
          {
            name: 'test_local_api',
            description: 'Test local Nebula API endpoints',
            inputSchema: {
              type: 'object',
              properties: {
                endpoint: {
                  type: 'string',
                  description: 'API endpoint (e.g., /api/shop/products)',
                },
                method: {
                  type: 'string',
                  enum: ['GET', 'POST', 'PUT', 'DELETE'],
                  description: 'HTTP method',
                },
                data: {
                  type: 'object',
                  description: 'Request data',
                },
                port: {
                  type: 'number',
                  description: 'Local server port (default: 3000)',
                },
              },
              required: ['endpoint'],
            },
          },
          {
            name: 'health_check',
            description: 'Check health of Nebula services',
            inputSchema: {
              type: 'object',
              properties: {
                service: {
                  type: 'string',
                  enum: ['web', 'admin', 'bot', 'api'],
                  description: 'Service to check',
                },
                port: {
                  type: 'number',
                  description: 'Service port',
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
          case 'http_request':
            return await this.makeHttpRequest(args.method, args.url, args.headers, args.body);
          case 'test_local_api':
            return await this.testLocalApi(args.endpoint, args.method, args.data, args.port);
          case 'health_check':
            return await this.healthCheck(args.service, args.port);
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

  async makeHttpRequest(method, url, headers = {}, body = null) {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
      options.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);
      const responseText = await response.text();
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: response.status,
              statusText: response.statusText,
              headers: Object.fromEntries(response.headers.entries()),
              data: responseData,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`HTTP request failed: ${error.message}`);
    }
  }

  async testLocalApi(endpoint, method = 'GET', data = null, port = 3000) {
    const url = `http://localhost:${port}${endpoint}`;
    return await this.makeHttpRequest(method, url, {}, data);
  }

  async healthCheck(service, port = null) {
    const defaultPorts = {
      web: 5173,
      admin: 5273,
      bot: 3001,
      api: 3000,
    };

    const servicePort = port || defaultPorts[service];
    const url = `http://localhost:${servicePort}/health`;

    try {
      const response = await fetch(url, { method: 'GET' });
      const isHealthy = response.ok;
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              service,
              port: servicePort,
              healthy: isHealthy,
              status: response.status,
              message: isHealthy ? 'Service is healthy' : 'Service is not responding',
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              service,
              port: servicePort,
              healthy: false,
              error: error.message,
            }, null, 2),
          },
        ],
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Nebula HTTP MCP server running on stdio');
  }
}

const server = new NebulaHttpServer();
server.run().catch(console.error);


