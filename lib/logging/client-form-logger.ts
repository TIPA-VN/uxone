import { clientLogger } from './client-logger';

/**
 * Client-safe form security audit logger for browser environments
 * Focuses on WHO, WHAT, WHERE, WHEN, WHY for form security and compliance
 */
export class ClientFormLogger {
  
  /**
   * Log form access events (when user opens/views a form)
   */
  static logFormAccess(
    userId: string,
    userName: string,
    userRole: string,
    userDepartment: string,
    sessionId: string,
    ipAddress: string,
    userAgent: string,
    formType: string,
    formId: string,
    outcome: 'SUCCESS' | 'FAILURE' | 'DENIED' = 'SUCCESS',
    reason?: string,
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW'
  ): void {
    clientLogger.logFormAccess(
      userId,
      userName,
      userRole,
      userDepartment,
      sessionId,
      ipAddress,
      userAgent,
      formType,
      formId,
      'ACCESS',
      outcome,
      reason,
      riskLevel
    );
  }

  /**
   * Log form submission events
   */
  static logFormSubmission(
    userId: string,
    userName: string,
    userRole: string,
    userDepartment: string,
    sessionId: string,
    ipAddress: string,
    userAgent: string,
    formType: string,
    formId: string,
    outcome: 'SUCCESS' | 'FAILURE' | 'DENIED',
    reason?: string,
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW',
    context?: any
  ): void {
    clientLogger.logFormAccess(
      userId,
      userName,
      userRole,
      userDepartment,
      sessionId,
      ipAddress,
      userAgent,
      formType,
      formId,
      'SUBMIT',
      outcome,
      reason,
      riskLevel,
      context
    );
  }

  /**
   * Log form modification events (when user changes form data)
   */
  static logFormModification(
    userId: string,
    userName: string,
    userRole: string,
    userDepartment: string,
    sessionId: string,
    ipAddress: string,
    userAgent: string,
    formType: string,
    formId: string,
    modifiedFields: string[],
    outcome: 'SUCCESS' | 'FAILURE' | 'DENIED' = 'SUCCESS',
    reason?: string,
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW'
  ): void {
    clientLogger.logFormAccess(
      userId,
      userName,
      userRole,
      userDepartment,
      sessionId,
      ipAddress,
      userAgent,
      formType,
      formId,
      'MODIFY',
      outcome,
      reason,
      riskLevel,
      { modifiedFields }
    );
  }

  /**
   * Log form data export events
   */
  static logFormExport(
    userId: string,
    userName: string,
    userRole: string,
    userDepartment: string,
    sessionId: string,
    ipAddress: string,
    userAgent: string,
    formType: string,
    formId: string,
    exportFormat: string,
    exportedFields: string[],
    outcome: 'SUCCESS' | 'FAILURE' | 'DENIED',
    reason?: string,
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM'
  ): void {
    clientLogger.logFormAccess(
      userId,
      userName,
      userRole,
      userDepartment,
      sessionId,
      ipAddress,
      userAgent,
      formType,
      formId,
      'EXPORT',
      outcome,
      reason,
      riskLevel,
      { exportFormat, exportedFields }
    );
  }

  /**
   * Log form data import events
   */
  static logFormImport(
    userId: string,
    userName: string,
    userRole: string,
    userDepartment: string,
    sessionId: string,
    ipAddress: string,
    userAgent: string,
    formType: string,
    formId: string,
    importFormat: string,
    importedFields: string[],
    outcome: 'SUCCESS' | 'FAILURE' | 'DENIED',
    reason?: string,
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM'
  ): void {
    clientLogger.logFormAccess(
      userId,
      userName,
      userRole,
      userDepartment,
      sessionId,
      ipAddress,
      userAgent,
      formType,
      formId,
      'IMPORT',
      outcome,
      reason,
      riskLevel,
      { importFormat, importedFields }
    );
  }

  /**
   * Log form deletion events
   */
  static logFormDeletion(
    userId: string,
    userName: string,
    userRole: string,
    userDepartment: string,
    sessionId: string,
    ipAddress: string,
    userAgent: string,
    formType: string,
    formId: string,
    outcome: 'SUCCESS' | 'FAILURE' | 'DENIED',
    reason?: string,
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'HIGH'
  ): void {
    clientLogger.logFormAccess(
      userId,
      userName,
      userRole,
      userDepartment,
      sessionId,
      ipAddress,
      userAgent,
      formType,
      formId,
      'DELETE',
      outcome,
      reason,
      riskLevel
    );
  }

  /**
   * Log form validation failures (security concern)
   */
  static logValidationFailure(
    userId: string,
    userName: string,
    userRole: string,
    userDepartment: string,
    sessionId: string,
    ipAddress: string,
    userAgent: string,
    formType: string,
    formId: string,
    failedFields: string[],
    reason: string,
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM'
  ): void {
    clientLogger.logFormAccess(
      userId,
      userName,
      userRole,
      userDepartment,
      sessionId,
      ipAddress,
      userAgent,
      formType,
      formId,
      'MODIFY',
      'FAILURE',
      reason,
      riskLevel,
      { failedFields, validationType: 'FAILURE' }
    );
  }

  /**
   * Log suspicious form activities
   */
  static logSuspiciousActivity(
    userId: string,
    userName: string,
    userRole: string,
    userDepartment: string,
    sessionId: string,
    ipAddress: string,
    userAgent: string,
    formType: string,
    formId: string,
    activityType: string,
    reason: string,
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'HIGH'
  ): void {
    clientLogger.logSecurityViolation(
      userId,
      userName,
      userRole,
      userDepartment,
      sessionId,
      ipAddress,
      userAgent,
      activityType,
      formType,
      formId,
      reason,
      riskLevel,
      { formType, formId }
    );
  }

  /**
   * Log form access from unusual locations/IPs
   */
  static logUnusualAccess(
    userId: string,
    userName: string,
    userRole: string,
    userDepartment: string,
    sessionId: string,
    ipAddress: string,
    userAgent: string,
    formType: string,
    formId: string,
    reason: string,
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM'
  ): void {
    clientLogger.logFormAccess(
      userId,
      userName,
      userRole,
      userDepartment,
      sessionId,
      ipAddress,
      userAgent,
      formType,
      formId,
      'ACCESS',
      'SUCCESS',
      reason,
      riskLevel,
      { accessType: 'UNUSUAL_LOCATION' }
    );
  }

  /**
   * Log form access outside business hours
   */
  static logAfterHoursAccess(
    userId: string,
    userName: string,
    userRole: string,
    userDepartment: string,
    sessionId: string,
    ipAddress: string,
    userAgent: string,
    formType: string,
    formId: string,
    reason?: string,
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM'
  ): void {
    clientLogger.logFormAccess(
      userId,
      userName,
      userRole,
      userDepartment,
      sessionId,
      ipAddress,
      userAgent,
      formType,
      formId,
      'ACCESS',
      'SUCCESS',
      reason || 'Access outside business hours',
      riskLevel,
      { accessType: 'AFTER_HOURS' }
    );
  }
}

export default ClientFormLogger;
