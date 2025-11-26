# 🚀 Realtime Homepage Setup Guide

## Environment Variables

Create a `.env` file in `apps/web/` with:

```env
# WebSocket Configuration
VITE_WS_URL=ws://localhost:3001

# API Configuration  
VITE_API_URL=http://localhost:3001

# Development Settings
VITE_ENABLE_MOCK_EVENTS=true
VITE_DEBUG_WEBSOCKET=true
```

## Backend Setup

1. **Start the API Server:**
   ```bash
   cd apps/api-server
   npm install
   npm run dev
   ```

2. **Enable Mock Events (Development):**
   ```bash
   export ENABLE_MOCK_EVENTS=true
   ```

3. **Redis Setup (Optional for Production):**
   ```bash
   # Install Redis
   # Configure in apps/api-server/.env
   REDIS_URL=redis://localhost:6379
   ```

## Frontend Setup

1. **Start the Web App:**
   ```bash
   cd apps/web
   npm install
   npm run dev
   ```

2. **WebSocket Connection:**
   - The app will automatically connect to `ws://localhost:3001`
   - Check the bottom-right corner for connection status
   - Green dot = Connected, Red dot = Disconnected

## Features Implemented

### ✅ Real-time Updates
- **Live Statistics:** Active drops, VIP members, products, success rate
- **Activity Feed:** User purchases, interests, achievements
- **Drop Updates:** New releases, stock changes, progress updates

### ✅ Visual Effects
- **Particle System:** Celebration effects for new activities
- **Glow Effects:** Hot items with pulsing borders
- **Animated Counters:** Spring-based number animations
- **Performance Optimized:** Auto-disable on low FPS

### ✅ WebSocket Features
- **Auto-reconnect:** Exponential backoff on disconnection
- **Message Queuing:** Prevents message loss during disconnects
- **Heartbeat:** 30-second ping to maintain connection
- **Bandwidth Optimization:** Message throttling (100ms minimum)

## Testing

### Development Mode
- Mock events are automatically generated
- Drop events every 30-60 seconds
- Activity events every 5-15 seconds
- Stats updates every 10-20 seconds

### Production Mode
- Real WebSocket events from backend
- Database-driven statistics
- Live user activities

## Performance Monitoring

The app includes automatic performance monitoring:
- **FPS Detection:** Auto-disable animations below 30 FPS
- **Reduced Motion:** Respects user preferences
- **Animation Budget:** Max 3 concurrent particle effects
- **Mobile Optimization:** Reduced effects on mobile devices

## Troubleshooting

### WebSocket Connection Issues
1. Check if API server is running on port 3001
2. Verify `VITE_WS_URL` environment variable
3. Check browser console for WebSocket errors
4. Ensure no firewall blocking WebSocket connections

### Performance Issues
1. Animations auto-disable on low FPS
2. Reduce particle count in `ParticleSystem.tsx`
3. Disable mock events in production
4. Check browser DevTools Performance tab

### Mock Events Not Working
1. Set `ENABLE_MOCK_EVENTS=true` in backend
2. Check `apps/api-server/src/websocket/mocks/homepageMockEvents.ts`
3. Verify WebSocket server is running
4. Check browser console for mock event logs

## Production Deployment

1. **Environment Variables:**
   ```env
   VITE_WS_URL=wss://your-domain.com
   VITE_API_URL=https://your-api.com
   VITE_ENABLE_MOCK_EVENTS=false
   ```

2. **Backend Configuration:**
   - Enable Redis for stats caching
   - Configure production WebSocket URL
   - Set up proper CORS settings

3. **Performance Optimization:**
   - Disable mock events
   - Enable production builds
   - Configure CDN for static assets

## Monitoring

- **WebSocket Status:** Bottom-right indicator
- **Console Logs:** Detailed connection info
- **Performance:** FPS monitoring in DevTools
- **Network:** WebSocket traffic in Network tab

## Next Steps

1. **Load Testing:** Test with 100+ concurrent connections
2. **Mobile Testing:** Verify performance on mobile devices
3. **Error Handling:** Add retry mechanisms for failed updates
4. **Analytics:** Track real-time feature usage
5. **A/B Testing:** Compare with/without real-time features

---

🎉 **Your realtime homepage is now ready!** The implementation includes full-stack WebSocket integration, beautiful animations, and performance optimizations for an engaging user experience.




































































































