# Real-time Drop Dashboard

## Overview

A highly configurable admin dashboard with Socket.IO real-time updates for drop management. All drop fields are editable inline with auto-save, and changes broadcast instantly to all connected clients.

## Features

### Real-time Updates
- **Instant synchronization** across multiple admin sessions
- **WebSocket-based** real-time communication
- **Optimistic UI updates** with conflict resolution
- **Auto-reconnection** with connection status indicators

### Inline Editing
- **Click-to-edit** interface for all drop fields
- **Auto-save** with debounced updates (500ms)
- **Visual feedback** (loading, success, error states)
- **Keyboard shortcuts** (Enter, Escape, Tab navigation)

### Advanced Features
- **Stock management** with color-coded status indicators
- **Variant editing** with expandable rows
- **Real-time stats** (total drops, stock, revenue, low stock alerts)
- **Filtering and sorting** with persistent state
- **Bulk operations** and selection management

## Setup

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Environment Configuration**
   Create `.env` file in `apps/admin/`:
   ```
   VITE_API_URL=http://localhost:3001
   VITE_WS_URL=http://localhost:3001
   ```

3. **Start Development Servers**
   ```bash
   # Terminal 1: API Server
   cd apps/api-server
   pnpm dev

   # Terminal 2: Admin App
   cd apps/admin
   pnpm dev
   ```

## Testing

1. **Open multiple browser windows** to the admin dashboard
2. **Click "Show Test Panel"** to see real-time events
3. **Edit drop fields** in one window → see instant updates in other windows
4. **Test connection status** by disconnecting/reconnecting network
5. **Verify stock updates** with real-time synchronization

## Architecture

### Backend (API Server)
- **WebSocket Events**: Drop-specific event types and interfaces
- **Broadcast Methods**: Real-time event broadcasting to connected clients
- **API Integration**: WebSocket broadcasts integrated into CRUD endpoints

### Frontend (Admin App)
- **WebSocket Client**: Auto-reconnecting Socket.IO client with connection management
- **Real-time Hooks**: React Query integration for cache updates
- **UI Components**: Inline editing, connection status, variant management
- **State Management**: Zustand store for UI state and preferences

## Components

### Core Components
- `RealtimeDropDashboard` - Main dashboard with table-based inline editing
- `InlineEditCell` - Reusable inline editing component
- `DropVariantEditor` - Expandable variant management
- `ConnectionStatus` - WebSocket health indicator
- `RealtimeDropTest` - Testing component for real-time events

### WebSocket Integration
- `WebSocketClient` - Socket.IO client wrapper with auto-reconnect
- `useRealtimeDrops` - React hook for real-time drop updates
- `dropStore` - Zustand store for UI state management

## Event Flow

```
Admin A edits stock → 
  Optimistic UI update →
  API PUT /api/admin/drops/:id →
  Server validates & saves →
  Server broadcasts drop:updated →
  Admin B receives event →
  React Query cache updated →
  UI re-renders with new data
```

## Troubleshooting

### Connection Issues
- Check that API server is running on port 3001
- Verify WebSocket connection in browser dev tools
- Use the test panel to monitor real-time events

### Performance Issues
- Real-time updates are debounced (500ms)
- Large datasets use pagination
- WebSocket events are filtered by subscription

### Development Tips
- Use the test panel to monitor WebSocket events
- Check browser console for connection logs
- Test with multiple browser windows for real-time sync






