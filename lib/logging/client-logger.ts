/**
 * Client-safe security audit logger for browser environments
 * Focuses on WHO, WHAT, WHERE, WHEN, WHY for security and compliance
 */

export interface SecurityAuditEntry {
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  userDepartment: string;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  action: string;
  resource: string;
  resourceType: string;
  resourceId: string;
  outcome: 'SUCCESS' | 'FAILURE' | 'DENIED' | 'PENDING';
  reason?: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  context?: any;
}

export class ClientLogger {
  private auditLogs: SecurityAuditEntry[] = [];
  private maxLogs = 1000;
  private isDevelopment = process.env.NODE_ENV === 'development';

  constructor() {
    if (this.isDevelopment) {
      console.log('Security Audit Logger initialized in development mode');
    }
  }

  private addAuditLog(entry: SecurityAuditEntry): void {
    this.auditLogs.push(entry);
    
    // Keep only the last maxLogs entries
    if (this.auditLogs.length > this.maxLogs) {
      this.auditLogs = this.auditLogs.slice(-this.maxLogs);
    }

    // Log to console in development with security focus
    if (this.isDevelopment) {
      const riskColor = {
        'LOW': 'green',
        'MEDIUM': 'yellow', 
        'HIGH': 'orange',
        'CRITICAL': 'red'
      }[entry.riskLevel] || 'white';
      
      console.group(`🔒 SECURITY AUDIT [${entry.riskLevel}]`);
      console.log(`⏰ WHEN: ${entry.timestamp}`);
      console.log(`👤 WHO: ${entry.userName} (${entry.userId}) - ${entry.userRole} @ ${entry.userDepartment}`);
      console.log(`📍 WHERE: ${entry.ipAddress} | Session: ${entry.sessionId}`);
      console.log(`🔄 WHAT: ${entry.action} on ${entry.resourceType} "${entry.resource}"`);
      console.log(`🎯 RESOURCE ID: ${entry.resourceId}`);
      console.log(`✅ OUTCOME: ${entry.outcome}`);
      
      // Enhanced workflow and business context logging
      if (entry.context?.workflowName) {
        console.group(`🏢 WORKFLOW CONTEXT`);
        console.log(`📋 Workflow: ${entry.context.workflowName}`);
        if (entry.context.workflowStep) console.log(`📍 Step: ${entry.context.workflowStep}`);
        if (entry.context.businessPurpose) console.log(`🎯 Purpose: ${entry.context.businessPurpose}`);
        if (entry.context.businessProcess) console.log(`⚙️ Process: ${entry.context.businessProcess}`);
        console.groupEnd();
      }
      
      if (entry.context?.relatedEntities) {
        console.group(`🔗 RELATED ENTITIES`);
        Object.entries(entry.context.relatedEntities).forEach(([key, value]) => {
          if (value) console.log(`${key}: ${value}`);
        });
        console.groupEnd();
      }
      
      if (entry.context?.businessRules) {
        console.group(`📜 BUSINESS RULES`);
        Object.entries(entry.context.businessRules).forEach(([key, value]) => {
          if (value !== undefined) console.log(`${key}: ${JSON.stringify(value)}`);
        });
        console.groupEnd();
      }
      
      if (entry.context?.formContext) {
        console.group(`📝 FORM CONTEXT`);
        Object.entries(entry.context.formContext).forEach(([key, value]) => {
          console.log(`${key}: ${value}`);
        });
        console.groupEnd();
      }
      
      if (entry.reason) console.log(`💭 WHY: ${entry.reason}`);
      if (entry.context && !entry.context.workflowName && !entry.context.relatedEntities && !entry.context.businessRules && !entry.context.formContext) {
        console.log(`📋 CONTEXT:`, entry.context);
      }
      console.groupEnd();
    }
  }

  /**
   * Log user authentication events
   */
  public logAuthentication(
    userId: string,
    userName: string,
    userRole: string,
    userDepartment: string,
    sessionId: string,
    ipAddress: string,
    userAgent: string,
    action: 'LOGIN' | 'LOGOUT' | 'SESSION_EXPIRED' | 'PASSWORD_CHANGE' | 'MFA_VERIFY',
    outcome: 'SUCCESS' | 'FAILURE' | 'DENIED',
    reason?: string,
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM'
  ): void {
    this.addAuditLog({
      timestamp: new Date().toISOString(),
      userId,
      userName,
      userRole,
      userDepartment,
      sessionId,
      ipAddress,
      userAgent,
      action: `AUTH_${action}`,
      resource: 'Authentication System',
      resourceType: 'AUTH',
      resourceId: sessionId,
      outcome,
      reason,
      riskLevel,
      context: { authAction: action }
    });
  }

  /**
   * Log form access and submission events
   */
  public logFormAccess(
    userId: string,
    userName: string,
    userRole: string,
    userDepartment: string,
    sessionId: string,
    ipAddress: string,
    userAgent: string,
    formType: string,
    formId: string,
    action: 'ACCESS' | 'SUBMIT' | 'MODIFY' | 'DELETE' | 'EXPORT' | 'IMPORT',
    outcome: 'SUCCESS' | 'FAILURE' | 'DENIED',
    reason?: string,
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW',
    context?: any
  ): void {
    this.addAuditLog({
      timestamp: new Date().toISOString(),
      userId,
      userName,
      userRole,
      userDepartment,
      sessionId,
      ipAddress,
      userAgent,
      action: `FORM_${action}`,
      resource: formType,
      resourceType: 'FORM',
      resourceId: formId,
      outcome,
      reason,
      riskLevel,
      context: { formAction: action, ...context }
    });
  }

  /**
   * Log data access and modification events
   */
  public logDataAccess(
    userId: string,
    userName: string,
    userRole: string,
    userDepartment: string,
    sessionId: string,
    ipAddress: string,
    userAgent: string,
    dataType: string,
    dataId: string,
    action: 'VIEW' | 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'IMPORT',
    outcome: 'SUCCESS' | 'FAILURE' | 'DENIED',
    reason?: string,
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM',
    context?: any
  ): void {
    this.addAuditLog({
      timestamp: new Date().toISOString(),
      userId,
      userName,
      userRole,
      userDepartment,
      sessionId,
      ipAddress,
      userAgent,
      action: `DATA_${action}`,
      resource: dataType,
      resourceType: 'DATA',
      resourceId: dataId,
      outcome,
      reason,
      riskLevel,
      context: { dataAction: action, ...context }
    });
  }

  /**
   * Log system access and configuration changes
   */
  public logSystemAccess(
    userId: string,
    userName: string,
    userRole: string,
    userDepartment: string,
    sessionId: string,
    ipAddress: string,
    userAgent: string,
    systemComponent: string,
    componentId: string,
    action: 'ACCESS' | 'CONFIGURE' | 'MAINTENANCE' | 'BACKUP' | 'RESTORE',
    outcome: 'SUCCESS' | 'FAILURE' | 'DENIED',
    reason?: string,
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'HIGH',
    context?: any
  ): void {
    this.addAuditLog({
      timestamp: new Date().toISOString(),
      userId,
      userName,
      userRole,
      userDepartment,
      sessionId,
      ipAddress,
      userAgent,
      action: `SYSTEM_${action}`,
      resource: systemComponent,
      resourceType: 'SYSTEM',
      resourceId: componentId,
      outcome,
      reason,
      riskLevel,
      context: { systemAction: action, ...context }
    });
  }

  /**
   * Log security violations and suspicious activities
   */
  public logSecurityViolation(
    userId: string,
    userName: string,
    userRole: string,
    userDepartment: string,
    sessionId: string,
    ipAddress: string,
    userAgent: string,
    violationType: string,
    resource: string,
    resourceId: string,
    reason: string,
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'HIGH',
    context?: any
  ): void {
    this.addAuditLog({
      timestamp: new Date().toISOString(),
      userId,
      userName,
      userRole,
      userDepartment,
      sessionId,
      ipAddress,
      userAgent,
      action: `SECURITY_VIOLATION_${violationType.toUpperCase()}`,
      resource,
      resourceType: 'SECURITY',
      resourceId,
      outcome: 'DENIED',
      reason,
      riskLevel,
      context: { violationType, ...context }
    });
  }

  /**
   * Get all audit logs
   */
  public getAuditLogs(): SecurityAuditEntry[] {
    return [...this.auditLogs];
  }

  /**
   * Get audit logs by risk level
   */
  public getAuditLogsByRisk(riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): SecurityAuditEntry[] {
    return this.auditLogs.filter(log => log.riskLevel === riskLevel);
  }

  /**
   * Get audit logs by user
   */
  public getAuditLogsByUser(userId: string): SecurityAuditEntry[] {
    return this.auditLogs.filter(log => log.userId === userId);
  }

  /**
   * Get audit logs by resource
   */
  public getAuditLogsByResource(resourceType: string, resourceId?: string): SecurityAuditEntry[] {
    if (resourceId) {
      return this.auditLogs.filter(log => log.resourceType === resourceType && log.resourceId === resourceId);
    }
    return this.auditLogs.filter(log => log.resourceType === resourceType);
  }

  /**
   * Clear audit logs
   */
  public clearAuditLogs(): void {
    this.auditLogs = [];
  }

  /**
   * Export audit logs for compliance reporting
   */
  public exportAuditLogs(): string {
    return JSON.stringify(this.auditLogs, null, 2);
  }

  /**
   * Get audit summary statistics
   */
  public getAuditSummary(): {
    totalLogs: number;
    byRiskLevel: Record<string, number>;
    byOutcome: Record<string, number>;
    byAction: Record<string, number>;
  } {
    const byRiskLevel = this.auditLogs.reduce((acc, log) => {
      acc[log.riskLevel] = (acc[log.riskLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byOutcome = this.auditLogs.reduce((acc, log) => {
      acc[log.outcome] = (acc[log.outcome] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byAction = this.auditLogs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalLogs: this.auditLogs.length,
      byRiskLevel,
      byOutcome,
      byAction
    };
  }
}

// Create a singleton instance
export const clientLogger = new ClientLogger();
