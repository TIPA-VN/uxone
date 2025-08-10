import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  userId: string;
  userName: string;
  userRole: string;
  userDepartment: string;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  requestId: string;
  timestamp: Date;
}

class RequestContextManager {
  private static storage = new AsyncLocalStorage<RequestContext>();
  // Fallback storage for cases where AsyncLocalStorage doesn't work
  private static fallbackStorage = new Map<string, RequestContext>();
  private static currentRequestId: string | null = null;

  /**
   * Set the request context for the current async execution
   */
  static setContext(context: RequestContext): void {
    this.storage.enterWith(context);
    // Also store in fallback storage
    this.fallbackStorage.set(context.requestId, context);
    this.currentRequestId = context.requestId;
  }

  /**
   * Get the current request context
   */
  static getContext(): RequestContext | undefined {
    const context = this.storage.getStore();
    if (context) return context;
    
    // Fallback to stored context if AsyncLocalStorage doesn't work
    if (this.currentRequestId) {
      return this.fallbackStorage.get(this.currentRequestId);
    }
    
    return undefined;
  }

  /**
   * Get a specific field from the current context
   */
  static getField<K extends keyof RequestContext>(field: K): RequestContext[K] | undefined {
    const context = this.getContext();
    return context?.[field];
  }

  /**
   * Get user information for logging
   */
  static getUserInfo(): Pick<RequestContext, 'userId' | 'userName' | 'userRole' | 'userDepartment'> | undefined {
    const context = this.getContext();
    if (!context) return undefined;

    return {
      userId: context.userId,
      userName: context.userName,
      userRole: context.userRole,
      userDepartment: context.userDepartment
    };
  }

  /**
   * Get session information for logging
   */
  static getSessionInfo(): Pick<RequestContext, 'sessionId' | 'ipAddress' | 'userAgent'> | undefined {
    const context = this.getContext();
    if (!context) return undefined;

    return {
      sessionId: context.sessionId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    };
  }

  /**
   * Create a default context for system operations
   */
  static createSystemContext(): RequestContext {
    return {
      userId: 'system',
      userName: 'System',
      userRole: 'system',
      userDepartment: 'system',
      sessionId: 'system',
      ipAddress: 'system',
      userAgent: 'system',
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };
  }

  /**
   * Check if we're in a request context
   */
  static hasContext(): boolean {
    return this.getContext() !== undefined;
  }

  /**
   * Clear the current request context
   */
  static clearContext(): void {
    if (this.currentRequestId) {
      this.fallbackStorage.delete(this.currentRequestId);
      this.currentRequestId = null;
    }
  }
}

export { RequestContextManager };
