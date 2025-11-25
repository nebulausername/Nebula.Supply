# Nebula Admin Dashboard - Setup & Startup Guide

## 🎉 Features Implemented

### ✅ Phase 1: Critical Fixes
- ✅ WebSocket Hook (`useWebSocket`) with full React integration
- ✅ Environment configuration for API & WebSocket URLs
- ✅ Fixed API integration for all endpoints

### ✅ Phase 2: Bot Management Features
- ✅ **Live Bot Stats**: Real-time bot statistics with WebSocket updates
- ✅ **Verification Queue**: Approve/Reject user verifications with live updates
- ✅ **Invite Code Manager**: Generate, manage, and track invite codes

### ✅ Phase 3: E-Commerce Features
- ✅ **Drop Management**: Full CRUD operations with real-time stock updates
- ✅ **Order Management**: Track and update order statuses
- ✅ **Inventory Management**: Stock tracking with low-stock alerts
- ✅ **Analytics Dashboard**: Real-time sales and performance metrics

### ✅ Phase 4: Optimizations
- ✅ Error Boundary for graceful error handling
- ✅ Loading states for all API calls
- ✅ WebSocket real-time updates across all features
- ✅ Optimistic UI updates for better UX

---

## 🚀 Quick Start

### 1. Environment Setup

Create a `.env.local` file in `apps/admin/` directory:

```env
# API Server URL
VITE_API_URL=http://localhost:3001

# WebSocket Server URL (usually same as API)
VITE_WS_URL=http://localhost:3001

# Enable debug logging
VITE_DEBUG=true

# Environment
VITE_ENV=development
```

### 2. Install Dependencies

```bash
# From the root directory
pnpm install

# Or from apps/admin directory
cd apps/admin
npm install
```

### 3. Start the API Server

```bash
cd apps/api-server
npm run dev
```

The API server should start on http://localhost:3001

### 4. Start the Admin Dashboard

```bash
cd apps/admin
npm run dev
```

The admin dashboard should start on http://localhost:5273

### 5. Login

Use the demo credentials:
- **Email**: `admin@nebula.local`
- **Password**: `admin123`

---

## 📊 Dashboard Views

### Overview Dashboard
- **KPI Dashboard**: Live metrics for tickets, response times, and automation
- **Ticket Command**: Ticket management and status updates
- **Activity Feed**: Real-time system activity
- **Queue Management**: Priority-based ticket queues

### Bot Management
Access via **"Bot"** in the sidebar:
- **Bot Stats**: User counts, verifications, invite codes
- **Verification Queue**: Pending user verifications with approve/reject actions
- **Invite Code Manager**: Generate and manage invite codes
- **Bot Activity Feed**: Live bot events

### E-Commerce
Access via sidebar navigation:
- **Drops**: Manage product drops with real-time stock updates
- **Orders**: Track and update order statuses
- **Analytics**: Sales metrics and performance data
- **Inventory**: Stock management with alerts
- **Customers**: Customer management and history

---

## 🔌 WebSocket Features

The admin dashboard uses WebSocket for real-time updates:

### Connection Status
Look for the connection indicator in the top-right of each component:
- 🟢 **LIVE**: Connected and receiving updates
- ⚪ **OFFLINE**: Disconnected

### Real-Time Events

#### Bot Events
- `bot:user_joined`: New user registrations
- `bot:verification_created`: New verification requests
- `bot:verification_approved/rejected`: Verification updates
- `bot:invite_code_created/used`: Invite code updates
- `bot:stats_update`: Bot statistics updates

#### E-Commerce Events
- `drop:created`: New drops added
- `drop:updated`: Drop information changes
- `drop:stock_changed`: Stock level changes
- `drop:status_changed`: Drop status updates
- `order:status_changed`: Order status updates

#### Dashboard Events
- `dashboard:kpi_update`: KPI metric updates
- `ticket:created/updated`: Ticket changes
- `ticket:status_changed`: Ticket status updates

---

## 🛠️ API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token

### Dashboard
- `GET /api/dashboard/overview` - Dashboard overview
- `GET /api/dashboard/kpis` - Live KPIs
- `GET /api/dashboard/activity` - Activity feed
- `GET /api/dashboard/alerts` - Active alerts

### Bot Management
- `GET /api/bot/stats` - Bot statistics
- `GET /api/bot/verifications` - Verification queue
- `POST /api/bot/verifications/:id/approve` - Approve verification
- `POST /api/bot/verifications/:id/reject` - Reject verification
- `GET /api/bot/invite-codes` - List invite codes
- `POST /api/bot/invite-codes` - Create invite code
- `DELETE /api/bot/invite-codes/:id` - Delete invite code

### E-Commerce
- `GET /api/admin/drops` - List drops
- `POST /api/admin/drops` - Create drop
- `PUT /api/admin/drops/:id` - Update drop
- `DELETE /api/admin/drops/:id` - Delete drop
- `PATCH /api/admin/drops/:id/stock` - Update stock
- `GET /api/orders` - List orders
- `PATCH /api/orders/:id/status` - Update order status
- `GET /api/inventory` - List inventory
- `GET /api/inventory/alerts/low-stock` - Low stock alerts

### Tickets
- `GET /api/tickets` - List tickets
- `GET /api/tickets/stats/overview` - Ticket statistics
- `POST /api/tickets` - Create ticket
- `PUT /api/tickets/:id` - Update ticket
- `POST /api/tickets/:id/status` - Update ticket status

---

## 🐛 Troubleshooting

### White Screen Issue
If you see a white screen:
1. Check the browser console for errors
2. Ensure `.env.local` file exists with correct API URL
3. Verify API server is running on http://localhost:3001
4. Clear browser cache and reload

### WebSocket Not Connecting
If WebSocket shows "OFFLINE":
1. Check API server is running
2. Verify VITE_WS_URL in `.env.local`
3. Check browser console for connection errors
4. Try refreshing the page

### API Errors
If you see "Failed to fetch" errors:
1. Ensure API server is running: `cd apps/api-server && npm run dev`
2. Check VITE_API_URL matches the API server URL
3. Verify CORS settings in API server allow admin dashboard origin
4. Check network tab in browser DevTools for failed requests

### Login Issues
If login fails:
1. Use correct credentials: `admin@nebula.local` / `admin123`
2. Check API server logs for authentication errors
3. Clear browser localStorage: `localStorage.clear()` in console
4. Try logging out and back in

---

## 📝 Development Notes

### Technology Stack
- **React 18** with TypeScript
- **Vite** for fast development and building
- **TanStack Query** (React Query) for data fetching and caching
- **Socket.IO Client** for WebSocket connections
- **Zustand** for state management
- **Tailwind CSS** for styling
- **Lucide React** for icons

### Project Structure
```
apps/admin/
├── src/
│   ├── components/
│   │   ├── auth/              # Authentication components
│   │   ├── dashboard/         # Dashboard components
│   │   ├── ecommerce/         # E-commerce components
│   │   └── ui/                # Reusable UI components
│   ├── lib/
│   │   ├── api/               # API client and hooks
│   │   ├── store/             # Zustand stores
│   │   └── websocket/         # WebSocket client and hooks
│   ├── hooks/                 # Custom React hooks
│   └── utils/                 # Utility functions
├── .env.local                 # Environment variables
└── vite.config.ts             # Vite configuration
```

### Key Files
- `src/lib/websocket/client.ts` - WebSocket client and useWebSocket hook
- `src/lib/api/hooks.ts` - React Query hooks for API calls
- `src/lib/api/ecommerce.ts` - E-commerce API endpoints
- `src/lib/store/auth.ts` - Authentication store
- `src/lib/store/dashboard.ts` - Dashboard state management
- `src/components/ErrorBoundary.tsx` - Error handling component

---

## 🎯 Next Steps

### Testing
1. Start both API server and admin dashboard
2. Login with demo credentials
3. Test each dashboard view:
   - Overview: Check KPIs and activity feed
   - Bot: Test verification approval/rejection
   - Drops: Create/edit drops, update stock
   - Orders: Update order statuses
4. Verify WebSocket connection (green dot = live)
5. Test real-time updates by making changes

### Production Deployment
1. Update `.env.production` with production API URL
2. Build admin dashboard: `npm run build`
3. Deploy built files from `dist/` directory
4. Ensure API server is accessible from admin dashboard
5. Configure CORS on API server for production domain

---

## 💡 Tips

- **Live Updates**: Keep an eye on the connection status indicator
- **Keyboard Shortcuts**: Use browser DevTools (F12) to debug
- **Performance**: React Query caches data for better performance
- **Error Handling**: ErrorBoundary will catch and display errors gracefully
- **Mobile**: Dashboard is responsive and works on tablets

---

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Check API server logs
3. Verify environment variables are set correctly
4. Review this guide for troubleshooting steps

---

**Status**: ✅ Fully functional with real-time updates!
**Last Updated**: October 2025

