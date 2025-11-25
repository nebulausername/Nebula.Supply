# 🗄️ Nebula Data Storage Guide

## Overview

Nebula uses a comprehensive data storage system built on Zustand with persistence middleware. This guide covers all aspects of data storage, persistence, and management in the Nebula application.

## 📊 Storage Architecture

### Store Overview

| Store | Persistence | Storage Key | Purpose |
|-------|-------------|-------------|---------|
| **Cookie Clicker** | ✅ Full | `nebula-cookie-clicker` | Game state, progress, achievements |
| **Global Cart** | ✅ Partial | `nebula-global-cart` | Shopping cart items |
| **Checkout** | ✅ Partial | `nebula-checkout-store` | Checkout form data |
| **Drops** | ✅ Partial | `nebula-drops-store` | User selections, interests, reservations |
| **Auth** | ✅ Session | `nebula-auth` | User authentication |
| **Shop** | ✅ Partial | `nebula-interested-products` | Product interests |
| **Support** | ❌ None | - | Live ticket data |
| **Toast** | ❌ None | - | Temporary notifications |

## 🎯 Persistence Configuration

### Cookie Clicker Store
```typescript
// Full persistence with versioning
persist(
  immer((set, get) => ({ ... })),
  {
    name: 'nebula-cookie-clicker',
    version: 1
  }
)
```

**Persisted Data:**
- Game progress (cookies, level, XP)
- Buildings and upgrades
- Achievements and prestige
- Settings and preferences

### Global Cart Store
```typescript
// Partial persistence - only cart items
persist(
  (set, get) => ({ ... }),
  {
    name: 'nebula-global-cart',
    partialize: (state) => ({ items: state.items })
  }
)
```

**Persisted Data:**
- Cart items with quantities
- Product selections and variants

### Drops Store
```typescript
// Partial persistence - user selections
persist(
  (set, get) => ({ ... }),
  {
    name: 'nebula-drops-store',
    partialize: (state) => ({
      interests: state.interests,
      variantSelections: state.variantSelections,
      quantitySelections: state.quantitySelections,
      shippingSelections: state.shippingSelections,
      originSelections: state.originSelections,
      reservationHistory: state.reservationHistory
    })
  }
)
```

**Persisted Data:**
- User interests and selections
- Variant and quantity choices
- Shipping and origin preferences
- Reservation history

## 🛠️ Storage Management

### Using Storage Utilities

```typescript
import { StorageManager, DevStorage } from '../utils/storage';

// Clear all data
StorageManager.clearAllData();

// Get storage statistics
DevStorage.getStorageStats();

// Export/Import data
const data = StorageManager.exportData();
StorageManager.importData(data);
```

### Store Health Monitoring

```typescript
const health = StorageManager.getStoreHealth();
console.log('Healthy:', health.healthy);
console.log('Issues:', health.issues);
console.log('Recommendations:', health.recommendations);
```

## 📈 Storage Optimization

### Best Practices

1. **Selective Persistence**: Only persist essential user data
2. **Data Cleanup**: Regular cleanup of temporary data
3. **Size Monitoring**: Monitor storage usage
4. **Error Handling**: Graceful handling of storage errors

### Performance Considerations

- **LocalStorage Limit**: ~5MB per domain
- **Serialization Cost**: JSON parsing/stringifying
- **Memory Usage**: Store data in memory vs localStorage
- **Cleanup Frequency**: Balance between performance and data freshness

## 🔧 Development Tools

### Debugging Storage

```typescript
// Log all store states
DevStorage.logAllStores();

// Get detailed storage info
const info = StorageManager.getStorageInfo();
console.log('Total Size:', info.totalSize);
console.log('Store Sizes:', info.storeSizes);
```

### Auto-Cleanup

```typescript
import { AutoCleanup } from '../utils/storage';

// Start automatic cleanup
AutoCleanup.startAutoCleanup();

// Stop automatic cleanup
AutoCleanup.stopAutoCleanup();
```

## 🚨 Error Handling

### Common Issues

1. **Storage Quota Exceeded**: Clear old data or reduce storage
2. **Corrupted Data**: Clear specific store data
3. **Version Mismatch**: Handle store version updates
4. **Serialization Errors**: Validate data before storing

### Recovery Strategies

```typescript
// Check store health
const health = StorageManager.getStoreHealth();
if (!health.healthy) {
  // Clear corrupted stores
  health.issues.forEach(issue => {
    if (issue.includes('corrupted')) {
      StorageManager.clearStoreData(STORAGE_KEYS[issue.split(' ')[0]]);
    }
  });
}
```

## 📱 Mobile Considerations

### Storage Limitations

- **iOS Safari**: 5MB localStorage limit
- **Android Chrome**: 10MB localStorage limit
- **Private Browsing**: Limited or no localStorage

### Fallback Strategies

```typescript
// Check storage availability
const isStorageAvailable = () => {
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    return true;
  } catch {
    return false;
  }
};
```

## 🔄 Data Migration

### Version Updates

When updating store schemas:

1. **Increment Version**: Update store version number
2. **Migration Logic**: Handle old data format
3. **Backward Compatibility**: Support old data structures
4. **Cleanup**: Remove deprecated fields

### Example Migration

```typescript
// Store version 1 -> 2 migration
const migrateStore = (oldData: any) => {
  return {
    ...oldData,
    newField: 'defaultValue',
    // Transform old fields
    transformedField: oldData.oldField
  };
};
```

## 📊 Monitoring & Analytics

### Storage Metrics

- **Total Storage Used**: Track overall usage
- **Per-Store Usage**: Monitor individual store sizes
- **Cleanup Frequency**: Track cleanup operations
- **Error Rates**: Monitor storage errors

### Performance Metrics

- **Load Time**: Store hydration performance
- **Save Time**: Persistence operation speed
- **Memory Usage**: Runtime memory consumption
- **Error Recovery**: Failed operation recovery time

## 🛡️ Security Considerations

### Sensitive Data

- **Auth Tokens**: Store in sessionStorage
- **Payment Info**: Never persist payment details
- **Personal Data**: Encrypt sensitive information
- **User Preferences**: Safe to persist

### Data Validation

```typescript
// Validate stored data
const validateStoreData = (data: any, schema: any) => {
  // Implement validation logic
  return schema.parse(data);
};
```

## 🚀 Future Enhancements

### Planned Features

1. **Compression**: Compress large data before storage
2. **Encryption**: Encrypt sensitive user data
3. **Sync**: Cloud sync for user preferences
4. **Analytics**: Detailed storage analytics
5. **Migration**: Automated data migration tools

### Performance Improvements

1. **Lazy Loading**: Load stores on demand
2. **Incremental Updates**: Update only changed data
3. **Background Sync**: Sync in background
4. **Cache Management**: Intelligent cache invalidation

## 📚 API Reference

### StorageManager

```typescript
class StorageManager {
  static clearAllData(): void
  static clearStoreData(storeKey: StorageKey): void
  static getStorageInfo(): StorageInfo
  static exportData(): string
  static importData(jsonData: string): boolean
  static resetAllStores(): void
  static getStoreHealth(): HealthStatus
}
```

### Store-Specific Utilities

```typescript
// Cookie Clicker
CookieClickerStorage.saveGame()
CookieClickerStorage.loadGame()
CookieClickerStorage.exportSave()

// Cart
CartStorage.clearCart()
CartStorage.getCartSize()
CartStorage.getCartValue()

// Drops
DropsStorage.clearSelections()
DropsStorage.getReservationHistory()
```

## 🎯 Best Practices Summary

1. **Use selective persistence** - Only persist essential data
2. **Monitor storage usage** - Keep track of storage consumption
3. **Handle errors gracefully** - Implement proper error handling
4. **Clean up regularly** - Remove unnecessary data
5. **Test thoroughly** - Test storage in different scenarios
6. **Document changes** - Keep track of schema changes
7. **Plan for migration** - Design for future updates

---

*This guide covers the complete data storage system for Nebula. For specific implementation details, refer to the individual store files and utility functions.*

