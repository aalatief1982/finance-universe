
type PermissionEventType = 'sms-permission-changed' | 'notifications-permission-changed';

interface PermissionEvent {
  type: PermissionEventType;
  granted: boolean;
  timestamp: number;
}

class PermissionEventManager {
  private listeners: Map<PermissionEventType, Set<(event: PermissionEvent) => void>> = new Map();

  subscribe(type: PermissionEventType, callback: (event: PermissionEvent) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(type)?.delete(callback);
    };
  }

  emit(type: PermissionEventType, granted: boolean) {
    const event: PermissionEvent = {
      type,
      granted,
      timestamp: Date.now(),
    };

    this.listeners.get(type)?.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in permission event listener:', error);
      }
    });
  }

  hasListeners(type: PermissionEventType): boolean {
    return (this.listeners.get(type)?.size ?? 0) > 0;
  }
}

export const permissionEventManager = new PermissionEventManager();
