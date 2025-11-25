#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

class NebulaEyesServer {
  constructor() {
    this.server = new Server(
      {
        name: 'nebula-eyes',
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
            name: 'take_screenshot',
            description: 'Take a screenshot of the current screen',
            inputSchema: {
              type: 'object',
              properties: {
                filename: {
                  type: 'string',
                  description: 'Filename for the screenshot (optional)',
                },
                fullscreen: {
                  type: 'boolean',
                  description: 'Take full screen screenshot (default: true)',
                },
              },
            },
          },
          {
            name: 'get_screen_info',
            description: 'Get information about available screens',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'click_position',
            description: 'Click at a specific position on screen',
            inputSchema: {
              type: 'object',
              properties: {
                x: {
                  type: 'number',
                  description: 'X coordinate',
                },
                y: {
                  type: 'number',
                  description: 'Y coordinate',
                },
              },
              required: ['x', 'y'],
            },
          },
          {
            name: 'type_text',
            description: 'Type text at current cursor position',
            inputSchema: {
              type: 'object',
              properties: {
                text: {
                  type: 'string',
                  description: 'Text to type',
                },
              },
              required: ['text'],
            },
          },
          {
            name: 'press_key',
            description: 'Press a key or key combination',
            inputSchema: {
              type: 'object',
              properties: {
                key: {
                  type: 'string',
                  description: 'Key to press (e.g., "Enter", "Tab", "Ctrl+C")',
                },
              },
              required: ['key'],
            },
          },
          {
            name: 'find_window',
            description: 'Find windows by title or process name',
            inputSchema: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                  description: 'Window title to search for',
                },
                process: {
                  type: 'string',
                  description: 'Process name to search for',
                },
              },
            },
          },
          {
            name: 'get_active_window',
            description: 'Get information about the currently active window',
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
          case 'take_screenshot':
            return await this.takeScreenshot(args.filename, args.fullscreen);
          case 'get_screen_info':
            return await this.getScreenInfo();
          case 'click_position':
            return await this.clickPosition(args.x, args.y);
          case 'type_text':
            return await this.typeText(args.text);
          case 'press_key':
            return await this.pressKey(args.key);
          case 'find_window':
            return await this.findWindow(args.title, args.process);
          case 'get_active_window':
            return await this.getActiveWindow();
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

  async takeScreenshot(filename = null, fullscreen = true) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotFilename = filename || `screenshot-${timestamp}.png`;
    const screenshotPath = path.resolve(process.cwd(), 'screenshots', screenshotFilename);

    // Ensure screenshots directory exists
    const screenshotsDir = path.dirname(screenshotPath);
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    try {
      // Use PowerShell to take screenshot on Windows
      const command = `powershell -Command "Add-Type -AssemblyName System.Windows.Forms; Add-Type -AssemblyName System.Drawing; $screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds; $bitmap = New-Object System.Drawing.Bitmap $screen.Width, $screen.Height; $graphics = [System.Drawing.Graphics]::FromImage($bitmap); $graphics.CopyFromScreen($screen.Left, $screen.Top, 0, 0, $screen.Size); $bitmap.Save('${screenshotPath}'); $graphics.Dispose(); $bitmap.Dispose()"`;
      
      await execAsync(command);
      
      return {
        content: [
          {
            type: 'text',
            text: `Screenshot saved: ${screenshotPath}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to take screenshot: ${error.message}`);
    }
  }

  async getScreenInfo() {
    try {
      // Get screen information using PowerShell
      const command = `powershell -Command "Add-Type -AssemblyName System.Windows.Forms; $screens = [System.Windows.Forms.Screen]::AllScreens; $info = @(); foreach($screen in $screens) { $info += @{ Primary = $screen.Primary; Bounds = $screen.Bounds; WorkingArea = $screen.WorkingArea; DeviceName = $screen.DeviceName } }; $info | ConvertTo-Json"`;
      
      const { stdout } = await execAsync(command);
      
      return {
        content: [
          {
            type: 'text',
            text: `Screen Information:\n${stdout}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get screen info: ${error.message}`);
    }
  }

  async clickPosition(x, y) {
    try {
      // Use PowerShell to click at position
      const command = `powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${x}, ${y}); Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('{CLICK}')"`;
      
      await execAsync(command);
      
      return {
        content: [
          {
            type: 'text',
            text: `Clicked at position (${x}, ${y})`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to click at position: ${error.message}`);
    }
  }

  async typeText(text) {
    try {
      // Use PowerShell to type text
      const escapedText = text.replace(/"/g, '""');
      const command = `powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('${escapedText}')"`;
      
      await execAsync(command);
      
      return {
        content: [
          {
            type: 'text',
            text: `Typed text: ${text}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to type text: ${error.message}`);
    }
  }

  async pressKey(key) {
    try {
      // Use PowerShell to press key
      const command = `powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('{${key}}')"`;
      
      await execAsync(command);
      
      return {
        content: [
          {
            type: 'text',
            text: `Pressed key: ${key}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to press key: ${error.message}`);
    }
  }

  async findWindow(title = null, process = null) {
    try {
      let command;
      
      if (title) {
        command = `powershell -Command "Get-Process | Where-Object {$_.MainWindowTitle -like '*${title}*'} | Select-Object ProcessName, MainWindowTitle, Id | ConvertTo-Json"`;
      } else if (process) {
        command = `powershell -Command "Get-Process -Name '${process}' | Select-Object ProcessName, MainWindowTitle, Id | ConvertTo-Json"`;
      } else {
        command = `powershell -Command "Get-Process | Where-Object {$_.MainWindowTitle -ne ''} | Select-Object ProcessName, MainWindowTitle, Id | ConvertTo-Json"`;
      }
      
      const { stdout } = await execAsync(command);
      
      return {
        content: [
          {
            type: 'text',
            text: `Windows found:\n${stdout}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to find windows: ${error.message}`);
    }
  }

  async getActiveWindow() {
    try {
      // Get active window information
      const command = `powershell -Command "Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public class Win32 { [DllImport(\"user32.dll\")] public static extern IntPtr GetForegroundWindow(); [DllImport(\"user32.dll\")] public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder text, int count); [DllImport(\"user32.dll\")] public static extern int GetWindowTextLength(IntPtr hWnd); }'; $hwnd = [Win32]::GetForegroundWindow(); $length = [Win32]::GetWindowTextLength($hwnd); $text = New-Object System.Text.StringBuilder($length + 1); [Win32]::GetWindowText($hwnd, $text, $text.Capacity); $text.ToString()"`;
      
      const { stdout } = await execAsync(command);
      
      return {
        content: [
          {
            type: 'text',
            text: `Active window: ${stdout.trim()}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get active window: ${error.message}`);
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Nebula Eyes MCP server running on stdio');
  }
}

const server = new NebulaEyesServer();
server.run().catch(console.error);

