import { logger } from '../logger';

export interface ConflictResolutionStrategy {
  strategy: 'server_wins' | 'client_wins' | 'merge' | 'manual';
  field?: string;
}

export interface ConflictData {
  field: string;
  serverValue: any;
  clientValue: any;
  timestamp: {
    server: string;
    client: string;
  };
}

export class ConflictResolver {
  /**
   * Resolve conflicts between server and client values
   */
  static resolve(
    conflicts: ConflictData[],
    strategy: ConflictResolutionStrategy
  ): Record<string, any> {
    const resolved: Record<string, any> = {};

    for (const conflict of conflicts) {
      switch (strategy.strategy) {
        case 'server_wins':
          resolved[conflict.field] = conflict.serverValue;
          logger.info(`[ConflictResolver] Server wins for ${conflict.field}`);
          break;
        
        case 'client_wins':
          resolved[conflict.field] = conflict.clientValue;
          logger.info(`[ConflictResolver] Client wins for ${conflict.field}`);
          break;
        
        case 'merge':
          resolved[conflict.field] = this.mergeValues(
            conflict.serverValue,
            conflict.clientValue,
            conflict.field
          );
          logger.info(`[ConflictResolver] Merged values for ${conflict.field}`);
          break;
        
        case 'manual':
          // Manual resolution - return conflicts for user to resolve
          logger.warn(`[ConflictResolver] Manual resolution required for ${conflict.field}`);
          break;
        
        default:
          // Default to server wins
          resolved[conflict.field] = conflict.serverValue;
      }
    }

    return resolved;
  }

  /**
   * Merge two values intelligently
   */
  private static mergeValues(serverValue: any, clientValue: any, field: string): any {
    // For arrays, merge unique items
    if (Array.isArray(serverValue) && Array.isArray(clientValue)) {
      const merged = [...new Set([...serverValue, ...clientValue])];
      return merged;
    }

    // For objects, deep merge
    if (
      typeof serverValue === 'object' &&
      typeof clientValue === 'object' &&
      serverValue !== null &&
      clientValue !== null &&
      !Array.isArray(serverValue) &&
      !Array.isArray(clientValue)
    ) {
      return { ...serverValue, ...clientValue };
    }

    // For timestamps, use the most recent
    if (field.includes('timestamp') || field.includes('updatedAt') || field.includes('createdAt')) {
      const serverTime = new Date(serverValue).getTime();
      const clientTime = new Date(clientValue).getTime();
      return serverTime > clientTime ? serverValue : clientValue;
    }

    // For numbers, use the higher value (e.g., stock, price)
    if (typeof serverValue === 'number' && typeof clientValue === 'number') {
      if (field.includes('stock') || field.includes('inventory') || field.includes('quantity')) {
        return Math.max(serverValue, clientValue);
      }
      if (field.includes('price') || field.includes('cost')) {
        return Math.max(serverValue, clientValue);
      }
    }

    // Default: prefer client value (optimistic update)
    return clientValue;
  }

  /**
   * Detect conflicts between server and client state
   */
  static detectConflicts(
    serverState: Record<string, any>,
    clientState: Record<string, any>,
    fieldsToCheck?: string[]
  ): ConflictData[] {
    const conflicts: ConflictData[] = [];
    const fields = fieldsToCheck || Object.keys(clientState);

    for (const field of fields) {
      if (serverState[field] !== undefined && clientState[field] !== undefined) {
        // Deep comparison for objects
        if (JSON.stringify(serverState[field]) !== JSON.stringify(clientState[field])) {
          conflicts.push({
            field,
            serverValue: serverState[field],
            clientValue: clientState[field],
            timestamp: {
              server: serverState.updatedAt || new Date().toISOString(),
              client: clientState.updatedAt || new Date().toISOString(),
            },
          });
        }
      }
    }

    return conflicts;
  }
}

