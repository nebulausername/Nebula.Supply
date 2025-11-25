# Admin Dashboard Setup Instructions

## ✅ Status: Implementation Complete

All critical fixes and features have been implemented. Follow these steps to get the dashboard running.

---

## 🚀 Quick Start

### 1. Create Environment File

Create a file `apps/admin/.env.local` with the following content:

```env
# Admin Dashboard Environment Variables
# API Configuration
VITE_API_URL=http://localhost:3001
VITE_WS_URL=http://localhost:3001

# Development Mode
VITE_DEV_MODE=true

# Logging Level (debug, info, warn, error)
VITE_LOG_LEVEL=info

# Feature Flags
VITE_ENABLE_WEBSOCKET=true
VITE_ENABLE_REALTIME_UPDATES=true
```

### 2. Install Dependencies

```bash
cd apps/admin
npm install
```

### 3. Start API Server

In a separate terminal:

```bash
cd apps/api-server
npm run dev
```

The API server should be running on `http://localhost:3001`

### 4. Start Admin Dashboard

```bash
cd apps/admin
npm run dev
```

The dashboard should open at `http://localhost:5173`

### 5. Login

Use the following credentials:
- **Email**: `admin@nebula.local`
- **Password**: `admin123`

---

## ✨ Implemented Features

### Phase 1: Critical Fixes ✅
- ✅ WebSocket Hook (`useWebSocket`) - Fully implemented with reconnection logic
- ✅ Environment configuration - Template provided
- ✅ API Client - Fixed error handling and token refresh

### Phase 2: API Integration ✅
- ✅ Dashboard KPIs - Real-time metrics
- ✅ Ticket Stats - Support ticket analytics
- ✅ Bot Stats - Telegram bot statistics
- ✅ E-Commerce APIs - Drops, Orders, Inventory fully integrated

### Phase 3: Features ✅
- ✅ **Bot Management**
  - Live Bot Stats with WebSocket updates
  - Verification Queue with approve/reject functionality
  - Invite Code Manager with CRUD operations
  
- ✅ **E-Commerce Management**
  - Drop Management with real-time stock updates
  - Order Management with status tracking
  - Inventory Management with low-stock alerts

### Phase 4: Optimizations ✅
- ✅ Error Boundaries - Graceful error handling
- ✅ Loading States - All components have skeleton loaders
- ✅ Performance Monitoring - Built-in metrics tracking
- ✅ WebSocket Real-time Updates - All live features connected

---

## 📋 Available Views

### 1. Overview Dashboard
- Real-time KPIs
- Activity feed
- System health status
- Quick stats

### 2. Bot Management
- Live user statistics
- Verification queue with photo review
- Invite code generation and tracking
- Real-time WebSocket updates

### 3. Drops (E-Commerce)
- Drop creation and management
- Stock level monitoring
- Sales analytics
- Real-time inventory updates

### 4. Orders
- Order processing workflow
- Status updates (pending → processing → shipped → delivered)
- Customer information
- Tracking number management

### 5. Inventory
- Stock level monitoring
- Low-stock alerts (with visual warnings)
- SKU management
- Supplier tracking

---

## 🔧 Troubleshooting

### White Screen Issue
**Cause**: Missing environment variables
**Solution**: Create `.env.local` file as shown in step 1

### API Connection Error
**Symptoms**: "Failed to load" errors, red error messages
**Solutions**:
1. Ensure API server is running on `http://localhost:3001`
2. Check `VITE_API_URL` in `.env.local`
3. Verify no CORS issues in browser console

### WebSocket Not Connecting
**Symptoms**: "Offline" status indicator
**Solutions**:
1. Check `VITE_WS_URL` in `.env.local`
2. Ensure API server has WebSocket support enabled
3. Check browser console for connection errors

### Login Issues
**Symptoms**: Invalid credentials error
**Solutions**:
1. Use correct credentials: `admin@nebula.local` / `admin123`
2. Check API server `/api/auth/login` endpoint is working
3. Clear browser localStorage and try again

---

## 🎯 Testing Checklist

### Basic Functionality
- [ ] Dashboard loads without white screen
- [ ] Login works with provided credentials
- [ ] All navigation links work
- [ ] WebSocket shows "Live" status (green indicator)

### Bot Management
- [ ] Bot stats display correctly
- [ ] Verification queue loads
- [ ] Can approve/reject verifications
- [ ] Can create invite codes
- [ ] Can delete invite codes

### E-Commerce
- [ ] Drops list loads
- [ ] Can create new drop
- [ ] Can edit drop
- [ ] Orders list loads
- [ ] Can update order status
- [ ] Inventory list loads
- [ ] Low-stock alerts appear
- [ ] Can update stock levels

### Real-time Features
- [ ] Live indicators show green when connected
- [ ] Stats auto-update (check timestamps)
- [ ] New verifications appear automatically
- [ ] Invite code usage updates in real-time

---

## 📚 Architecture Overview

### Frontend Stack
- **React 18** with TypeScript
- **Vite** for fast development
- **TanStack Query** for API state management
- **Socket.IO Client** for WebSocket connections
- **Zustand** for global state
- **Tailwind CSS** for styling

### Key Files
- `src/App.tsx` - Main app component
- `src/lib/websocket/client.ts` - WebSocket implementation
- `src/lib/api/client.ts` - HTTP client with auth
- `src/lib/api/hooks.ts` - React Query hooks
- `src/lib/api/ecommerce.ts` - E-commerce API endpoints
- `src/components/dashboard/` - Dashboard components
- `src/components/ecommerce/` - E-commerce components

### WebSocket Events
The dashboard subscribes to these real-time events:
- `bot:stats_update` - Bot statistics changes
- `bot:verification_created` - New verification submitted
- `bot:verification_approved` - Verification approved
- `bot:verification_rejected` - Verification rejected
- `bot:invite_code_created` - New invite code generated
- `bot:invite_code_used` - Invite code used by user
- `drop:stock_update` - Drop inventory changed
- `order:status_update` - Order status changed

---

## 🔐 Security Notes

### Environment Variables
- Never commit `.env.local` to version control
- Use different API URLs for production
- Rotate admin credentials regularly

### API Authentication
- JWT tokens stored in localStorage
- Automatic token refresh on 401 errors
- Secure logout clears all tokens

### Error Handling
- Sensitive errors logged server-side only
- User-friendly error messages in UI
- Error boundaries prevent app crashes

---

## 🚀 Production Deployment

### Build for Production

```bash
cd apps/admin
npm run build
```

### Production Environment Variables

Create `apps/admin/.env.production`:

```env
VITE_API_URL=https://api.your-domain.com
VITE_WS_URL=https://api.your-domain.com
VITE_DEV_MODE=false
VITE_LOG_LEVEL=error
VITE_ENABLE_WEBSOCKET=true
VITE_ENABLE_REALTIME_UPDATES=true
```

### Serve Built Files

The `dist` folder can be served with any static hosting:
- Vercel
- Netlify
- Cloudflare Pages
- AWS S3 + CloudFront
- Nginx/Apache

---

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Verify API server is running
3. Check environment variables
4. Review this troubleshooting guide
5. Check server logs for API errors

---

## 🎉 Success!

If everything is working:
- ✅ Dashboard loads with beautiful UI
- ✅ Real-time updates show live data
- ✅ All management features are functional
- ✅ WebSocket connection is stable

**Enjoy your powerful admin dashboard!**



