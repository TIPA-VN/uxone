'use client';

import { useEffect, useRef, useCallback } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { clientLogger } from '@/lib/logging/client-logger';

interface FormLoggerConfig {
  formId: string;
  formType: string;
  // Workflow and Business Context
  workflowName: string;
  workflowStep?: string;
  businessPurpose: string;
  businessProcess?: string;
  relatedEntities?: {
    projectId?: string;
    departmentId?: string;
    requestId?: string;
    approvalId?: string;
    [key: string]: string | undefined;
  };
  businessRules?: {
    requiresApproval?: boolean;
    approvalLevel?: string;
    budgetThreshold?: number;
    departmentRestrictions?: string[];
    [key: string]: any;
  };
  // User Context
  userId: string;
  userName: string;
  userRole: string;
  userDepartment: string;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
}

interface FormAnalytics {
  totalFields: number;
  modifiedFields: number;
  validationErrors: number;
  submissionAttempts: number;
  lastModified: string;
  accessCount: number;
}

/**
 * Client-safe form security audit hook for React Hook Form
 * Focuses on WHO, WHAT, WHERE, WHEN, WHY for security and compliance
 */
export function useClientFormLogger<T extends Record<string, any>>(
  form: UseFormReturn<T>,
  config: FormLoggerConfig
) {
  const {
    formId,
    formType,
    userId,
    userName,
    userRole,
    userDepartment,
    sessionId,
    ipAddress,
    userAgent
  } = config;

  const analytics = useRef<FormAnalytics>({
    totalFields: 0,
    modifiedFields: 0,
    validationErrors: 0,
    submissionAttempts: 0,
    lastModified: new Date().toISOString(),
    accessCount: 0
  });

  const fieldStates = useRef<Map<string, { originalValue: any; modified: boolean }>>(new Map());

  // Log form access when component mounts
  useEffect(() => {
    analytics.current.accessCount++;
    
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
      undefined,
      'LOW',
      {
        workflowName: config.workflowName,
        workflowStep: config.workflowStep,
        businessPurpose: config.businessPurpose,
        businessProcess: config.businessProcess,
        relatedEntities: config.relatedEntities,
        businessRules: config.businessRules,
        formContext: {
          totalFields: Object.keys(form.getValues() || {}).length,
          formType,
          step: config.workflowStep || 'initial'
        }
      }
    );
  }, [formId, formType, userId, userName, userRole, userDepartment, sessionId, ipAddress, userAgent, config.workflowName, config.workflowStep, config.businessPurpose, config.businessProcess, config.relatedEntities, config.businessRules]);

  // Track field changes for security audit
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (name && type === 'change') {
        const fieldName = name as string;
        const currentValue = (value as any)[name as string];
        
        if (!fieldStates.current.has(fieldName)) {
          fieldStates.current.set(fieldName, {
            originalValue: currentValue,
            modified: false
          });
          analytics.current.totalFields++;
        }

        const fieldState = fieldStates.current.get(fieldName)!;
        if (fieldState.originalValue !== currentValue && !fieldState.modified) {
          fieldState.modified = true;
          analytics.current.modifiedFields++;
          analytics.current.lastModified = new Date().toISOString();

          // Log field modification for security audit
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
            'SUCCESS',
            undefined,
            'LOW',
            { modifiedFields: [fieldName], fieldValue: currentValue }
          );
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form, formId, formType, userId, userName, userRole, userDepartment, sessionId, ipAddress, userAgent]);

  // Track validation errors for security audit
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (name && type === 'change') {
        const fieldName = name as string;
        const fieldError = form.formState.errors[name as keyof T];
        
        if (fieldError && typeof fieldError.message === 'string' && !fieldError.message.includes('already logged')) {
          analytics.current.validationErrors++;
          
          // Log validation failure for security audit
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
            `Validation error in field ${fieldName}: ${fieldError.message}`,
            'MEDIUM',
            { failedFields: [fieldName], errorMessage: fieldError.message }
          );
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form, formId, formType, userId, userName, userRole, userDepartment, sessionId, ipAddress, userAgent]);

  // Log form submission for security audit
  const logSubmitHandler = useCallback((onSubmit: (data: T) => Promise<void>) => {
    return async (data: T) => {
      analytics.current.submissionAttempts++;
      
      try {
        // Log submission start
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
          'SUCCESS',
          undefined,
          'LOW'
        );

        await onSubmit(data);

        // Log successful submission
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
          'SUCCESS',
          undefined,
          'LOW',
          { submittedData: Object.keys(data) }
        );
      } catch (error) {
        // Log failed submission
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
          'FAILURE',
          error instanceof Error ? error.message : 'Unknown error',
          'MEDIUM',
          { error: error instanceof Error ? error.message : String(error) }
        );
        throw error;
      }
    };
  }, [formId, formType, userId, userName, userRole, userDepartment, sessionId, ipAddress, userAgent]);

  // Log form abandonment for security audit
  const logFormAbandonment = useCallback((reason?: string) => {
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
      reason || 'Form abandoned by user',
      'LOW',
      { 
        abandonmentReason: reason,
        modifiedFields: Array.from(fieldStates.current.entries())
          .filter(([_, state]) => state.modified)
          .map(([fieldName]) => fieldName)
      }
    );
  }, [formId, formType, userId, userName, userRole, userDepartment, sessionId, ipAddress, userAgent]);

  // Log form reset for security audit
  const logFormReset = useCallback((reason?: string) => {
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
      'SUCCESS',
      reason || 'Form reset by user',
      'LOW',
      { 
        resetReason: reason,
        resetFields: Array.from(fieldStates.current.keys())
      }
    );

    // Reset analytics
    analytics.current.modifiedFields = 0;
    analytics.current.validationErrors = 0;
    fieldStates.current.clear();
  }, [formId, formType, userId, userName, userRole, userDepartment, sessionId, ipAddress, userAgent]);

  // Get form analytics for security reporting
  const getFormAnalytics = useCallback((): FormAnalytics => {
    return { ...analytics.current };
  }, []);

  // Log suspicious activity
  const logSuspiciousActivity = useCallback((
    activityType: string,
    reason: string,
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'HIGH'
  ) => {
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
      { formType, formId, analytics: analytics.current }
    );
  }, [formId, formType, userId, userName, userRole, userDepartment, sessionId, ipAddress, userAgent]);

  return {
    logSubmitHandler,
    logFormAbandonment,
    logFormReset,
    getFormAnalytics,
    logSuspiciousActivity
  };
}

// Also export as default for backward compatibility
export default useClientFormLogger;
