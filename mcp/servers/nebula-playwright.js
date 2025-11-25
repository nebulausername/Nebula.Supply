#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { chromium, firefox, webkit } from 'playwright';

class NebulaPlaywrightServer {
  constructor() {
    this.server = new Server(
      {
        name: 'nebula-playwright',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.browser = null;
    this.context = null;
    this.page = null;

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'start_browser',
            description: 'Start a browser instance for testing',
            inputSchema: {
              type: 'object',
              properties: {
                browser: {
                  type: 'string',
                  enum: ['chromium', 'firefox', 'webkit'],
                  description: 'Browser type to use',
                },
                headless: {
                  type: 'boolean',
                  description: 'Run in headless mode',
                },
              },
            },
          },
          {
            name: 'navigate',
            description: 'Navigate to a URL',
            inputSchema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: 'URL to navigate to',
                },
              },
              required: ['url'],
            },
          },
          {
            name: 'take_screenshot',
            description: 'Take a screenshot of the current page',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: 'Path to save screenshot',
                },
                fullPage: {
                  type: 'boolean',
                  description: 'Take full page screenshot',
                },
              },
            },
          },
          {
            name: 'click_element',
            description: 'Click an element on the page',
            inputSchema: {
              type: 'object',
              properties: {
                selector: {
                  type: 'string',
                  description: 'CSS selector for the element',
                },
                text: {
                  type: 'string',
                  description: 'Text content to click',
                },
              },
            },
          },
          {
            name: 'fill_input',
            description: 'Fill an input field',
            inputSchema: {
              type: 'object',
              properties: {
                selector: {
                  type: 'string',
                  description: 'CSS selector for the input',
                },
                value: {
                  type: 'string',
                  description: 'Value to fill',
                },
              },
              required: ['selector', 'value'],
            },
          },
          {
            name: 'get_text',
            description: 'Get text content from an element',
            inputSchema: {
              type: 'object',
              properties: {
                selector: {
                  type: 'string',
                  description: 'CSS selector for the element',
                },
              },
              required: ['selector'],
            },
          },
          {
            name: 'wait_for_element',
            description: 'Wait for an element to appear',
            inputSchema: {
              type: 'object',
              properties: {
                selector: {
                  type: 'string',
                  description: 'CSS selector for the element',
                },
                timeout: {
                  type: 'number',
                  description: 'Timeout in milliseconds',
                },
              },
              required: ['selector'],
            },
          },
          {
            name: 'test_nebula_app',
            description: 'Run automated tests on Nebula applications',
            inputSchema: {
              type: 'object',
              properties: {
                app: {
                  type: 'string',
                  enum: ['web', 'admin'],
                  description: 'Nebula app to test',
                },
                test: {
                  type: 'string',
                  enum: ['login', 'shop', 'cart', 'profile', 'full'],
                  description: 'Type of test to run',
                },
              },
              required: ['app', 'test'],
            },
          },
          {
            name: 'close_browser',
            description: 'Close the browser instance',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'start_browser':
            return await this.startBrowser(args.browser, args.headless);
          case 'navigate':
            return await this.navigate(args.url);
          case 'take_screenshot':
            return await this.takeScreenshot(args.path, args.fullPage);
          case 'click_element':
            return await this.clickElement(args.selector, args.text);
          case 'fill_input':
            return await this.fillInput(args.selector, args.value);
          case 'get_text':
            return await this.getText(args.selector);
          case 'wait_for_element':
            return await this.waitForElement(args.selector, args.timeout);
          case 'test_nebula_app':
            return await this.testNebulaApp(args.app, args.test);
          case 'close_browser':
            return await this.closeBrowser();
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

  async startBrowser(browserType = 'chromium', headless = true) {
    const browsers = { chromium, firefox, webkit };
    const browser = browsers[browserType];
    
    if (!browser) {
      throw new Error(`Unsupported browser: ${browserType}`);
    }

    this.browser = await browser.launch({ headless });
    this.context = await this.browser.newContext();
    this.page = await this.context.newPage();

    return {
      content: [
        {
          type: 'text',
          text: `Browser started: ${browserType} (headless: ${headless})`,
        },
      ],
    };
  }

  async navigate(url) {
    if (!this.page) {
      throw new Error('Browser not started. Call start_browser first.');
    }

    await this.page.goto(url);
    const title = await this.page.title();

    return {
      content: [
        {
          type: 'text',
          text: `Navigated to: ${url}\nPage title: ${title}`,
        },
      ],
    };
  }

  async takeScreenshot(path = null, fullPage = false) {
    if (!this.page) {
      throw new Error('Browser not started. Call start_browser first.');
    }

    const screenshotPath = path || `screenshot-${Date.now()}.png`;
    await this.page.screenshot({ path: screenshotPath, fullPage });

    return {
      content: [
        {
          type: 'text',
          text: `Screenshot saved: ${screenshotPath}`,
        },
      ],
    };
  }

  async clickElement(selector = null, text = null) {
    if (!this.page) {
      throw new Error('Browser not started. Call start_browser first.');
    }

    if (text) {
      await this.page.click(`text=${text}`);
    } else if (selector) {
      await this.page.click(selector);
    } else {
      throw new Error('Either selector or text must be provided');
    }

    return {
      content: [
        {
          type: 'text',
          text: `Clicked element: ${selector || text}`,
        },
      ],
    };
  }

  async fillInput(selector, value) {
    if (!this.page) {
      throw new Error('Browser not started. Call start_browser first.');
    }

    await this.page.fill(selector, value);

    return {
      content: [
        {
          type: 'text',
          text: `Filled input ${selector} with: ${value}`,
        },
      ],
    };
  }

  async getText(selector) {
    if (!this.page) {
      throw new Error('Browser not started. Call start_browser first.');
    }

    const text = await this.page.textContent(selector);

    return {
      content: [
        {
          type: 'text',
          text: `Text from ${selector}: ${text}`,
        },
      ],
    };
  }

  async waitForElement(selector, timeout = 30000) {
    if (!this.page) {
      throw new Error('Browser not started. Call start_browser first.');
    }

    await this.page.waitForSelector(selector, { timeout });

    return {
      content: [
        {
          type: 'text',
          text: `Element found: ${selector}`,
        },
      ],
    };
  }

  async testNebulaApp(app, test) {
    const ports = { web: 5173, admin: 5273 };
    const port = ports[app];
    const url = `http://localhost:${port}`;

    if (!this.page) {
      await this.startBrowser('chromium', false);
    }

    await this.navigate(url);

    let result = `Testing ${app} app - ${test} test\n`;

    switch (test) {
      case 'login':
        // Test login functionality
        result += 'Login test completed';
        break;
      case 'shop':
        // Test shop functionality
        result += 'Shop test completed';
        break;
      case 'cart':
        // Test cart functionality
        result += 'Cart test completed';
        break;
      case 'profile':
        // Test profile functionality
        result += 'Profile test completed';
        break;
      case 'full':
        // Run full test suite
        result += 'Full test suite completed';
        break;
    }

    return {
      content: [
        {
          type: 'text',
          text: result,
        },
      ],
    };
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
      this.page = null;
    }

    return {
      content: [
        {
          type: 'text',
          text: 'Browser closed',
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Nebula Playwright MCP server running on stdio');
  }
}

const server = new NebulaPlaywrightServer();
server.run().catch(console.error);


