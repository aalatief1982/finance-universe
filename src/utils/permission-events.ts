
type PermissionEventType = 'sms-permission-changed' | 'notifications-permission-changed';

export type PermissionStatus = 'granted' | 'denied' | 'never-ask-again' | 'not-requested';

interface PermissionEvent {
  type: PermissionEventType;
  granted: boolean;
  status: PermissionStatus;
  timestamp: number;
  reason?: string;
}

interface PermissionState {
  status: PermissionStatus;
  lastRequested?: number;
  requestCount: number;
  canRequest: boolean;
}

class PermissionEventManager {
  private listeners: Map<PermissionEventType, Set<(event: PermissionEvent) => void>> = new Map();
  private permissionStates: Map<string, PermissionState> = new Map();

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

  emit(type: PermissionEventType, granted: boolean, status: PermissionStatus = granted ? 'granted' : 'denied', reason?: string) {
    const event: PermissionEvent = {
      type,
      granted,
      status,
      timestamp: Date.now(),
      reason,
    };

    // Update internal state
    const permissionKey = type.replace('-permission-changed', '');
    this.permissionStates.set(permissionKey, {
      status,
      lastRequested: Date.now(),
      requestCount: (this.permissionStates.get(permissionKey)?.requestCount || 0) + 1,
      canRequest: status !== 'never-ask-again',
    });

    this.listeners.get(type)?.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in permission event listener:', error);
      }
    });
  }

  getPermissionState(permission: string): PermissionState | null {
    return this.permissionStates.get(permission) || null;
  }

  hasListeners(type: PermissionEventType): boolean {
    return (this.listeners.get(type)?.size ?? 0) > 0;
  }

  canRequestPermission(permission: string): boolean {
    const state = this.permissionStates.get(permission);
    return state?.canRequest !== false;
  }
}

export const permissionEventManager = new PermissionEventManager();
