'use client';

import { useCallback, useRef, useEffect } from 'react';
import { UseFormReturn, FieldValues, FieldError, SubmitHandler } from 'react-hook-form';
import { FormLogger } from '@/lib/logging';
import { UserActionLog } from '@/lib/logging/types';

interface FormLoggingConfig {
  formId: string;
  formType: string;
  userId?: string;
  userName?: string;
  department?: string;
  role?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  enableFieldTracking?: boolean;
  enableValidationLogging?: boolean;
  enableSubmissionLogging?: boolean;
}

interface FormFieldChange {
  fieldName: string;
  oldValue: any;
  newValue: any;
  timestamp: string;
}

interface FormValidationError {
  fieldName: string;
  errorType: string;
  errorMessage: string;
  timestamp: string;
}

/**
 * Hook for comprehensive form logging with React Hook Form
 */
export const useFormLogger = <T extends FieldValues>(
  form: UseFormReturn<T>,
  config: FormLoggingConfig
) => {
  const fieldChanges = useRef<FormFieldChange[]>([]);
  const validationErrors = useRef<FormValidationError[]>([]);
  const formStartTime = useRef<Date>(new Date());
  const isSubmitting = useRef(false);

  const {
    formId,
    formType,
    userId = 'unknown',
    userName = 'Unknown',
    department = 'N/A',
    role = 'N/A',
    sessionId = 'unknown',
    ipAddress = '127.0.0.1',
    userAgent = 'N/A',
    enableFieldTracking = true,
    enableValidationLogging = true,
    enableSubmissionLogging = true
  } = config;

  // Log form initialization
  useEffect(() => {
    FormLogger.logUserAction({
      action: 'FORM_INITIALIZED',
      description: `Form ${formType} initialized`,
      formType,
      formId,
      timestamp: new Date().toISOString(),
      userId,
      userName,
      department,
      role,
      sessionId,
      ipAddress,
      userAgent,
      context: {
        formStartTime: formStartTime.current.toISOString(),
        totalFields: Object.keys(form.getValues()).length
      }
    });
  }, [formType, formId, userId, userName, department, role, sessionId, ipAddress, userAgent]);

  // Track field changes
  useEffect(() => {
    if (!enableFieldTracking) return;

    const subscription = form.watch((value, { name, type }) => {
      if (name && type === 'change') {
        const oldValue = form.getValues(name as keyof T);
        const newValue = value[name as keyof T];
        
        if (oldValue !== newValue) {
          const fieldChange: FormFieldChange = {
            fieldName: name,
            oldValue,
            newValue,
            timestamp: new Date().toISOString()
          };
          
          fieldChanges.current.push(fieldChange);
          
          // Log significant field changes (not every keystroke)
          if (typeof newValue === 'string' && newValue.length > 3) {
            FormLogger.logUserAction({
              action: 'FORM_FIELD_CHANGED',
              description: `Field ${name} changed in ${formType}`,
              formType,
              formId,
              fields: [name],
              timestamp: new Date().toISOString(),
              userId,
              userName,
              department,
              role,
              sessionId,
              ipAddress,
              userAgent,
              context: {
                fieldName: name,
                oldValue: typeof oldValue === 'string' && oldValue.length > 50 ? '[TRUNCATED]' : oldValue,
                newValue: typeof newValue === 'string' && newValue.length > 50 ? '[TRUNCATED]' : newValue,
                changeIndex: fieldChanges.current.length
              }
            });
          }
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form, enableFieldTracking, formType, formId, userId, userName, department, role, sessionId, ipAddress, userAgent]);

  // Track validation errors
  useEffect(() => {
    if (!enableValidationLogging) return;

    const subscription = form.watch((value, { name, type }) => {
      if (name && type === 'change') {
        const errors = form.formState.errors;
        const fieldError = errors[name as keyof T] as FieldError;
        
        if (fieldError) {
          const validationError: FormValidationError = {
            fieldName: name,
            errorType: fieldError.type || 'validation',
            errorMessage: fieldError.message || 'Unknown validation error',
            timestamp: new Date().toISOString()
          };
          
          validationErrors.current.push(validationError);
          
          FormLogger.logUserAction({
            action: 'FORM_VALIDATION_ERROR',
            description: `Validation error in field ${name}: ${fieldError.message}`,
            formType,
            formId,
            fields: [name],
            timestamp: new Date().toISOString(),
            userId,
            userName,
            department,
            role,
            sessionId,
            ipAddress,
            userAgent,
            context: {
              fieldName: name,
              errorType: fieldError.type,
              errorMessage: fieldError.message,
              errorIndex: validationErrors.current.length
            }
          });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form, enableValidationLogging, formType, formId, userId, userName, department, role, sessionId, ipAddress, userAgent]);

  // Enhanced submit handler with logging
  const logSubmitHandler = useCallback((onSubmit: SubmitHandler<T>) => {
    return async (data: T) => {
      if (isSubmitting.current) return;
      isSubmitting.current = true;
      
      const submitStartTime = new Date();
      const formEndTime = new Date();
      const totalFormTime = formEndTime.getTime() - formStartTime.current.getTime();
      
      try {
        // Log form submission start
        if (enableSubmissionLogging) {
          FormLogger.logUserAction({
            action: 'FORM_SUBMISSION_STARTED',
            description: `Form ${formType} submission started`,
            formType,
            formId,
            timestamp: submitStartTime.toISOString(),
            userId,
            userName,
            department,
            role,
            sessionId,
            ipAddress,
            userAgent,
            context: {
              submitStartTime: submitStartTime.toISOString(),
              totalFormTime,
              totalFieldChanges: fieldChanges.current.length,
              totalValidationErrors: validationErrors.current.length,
              formData: Object.keys(data)
            }
          });
        }
        
        // Execute the original submit handler
        const result = await onSubmit(data);
        
        // Log successful submission
        if (enableSubmissionLogging) {
          FormLogger.logUserAction({
            action: 'FORM_SUBMISSION_SUCCESS',
            description: `Form ${formType} submitted successfully`,
            formType,
            formId,
            timestamp: new Date().toISOString(),
            userId,
            userName,
            department,
            role,
            sessionId,
            ipAddress,
            userAgent,
            context: {
              submitStartTime: submitStartTime.toISOString(),
              submitEndTime: new Date().toISOString(),
              totalFormTime,
              totalFieldChanges: fieldChanges.current.length,
              totalValidationErrors: validationErrors.current.length,
              success: true
            }
          });
        }
        
        return result;
      } catch (error) {
        // Log submission failure
        if (enableSubmissionLogging) {
          FormLogger.logUserAction({
            action: 'FORM_SUBMISSION_FAILED',
            description: `Form ${formType} submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            formType,
            formId,
            timestamp: new Date().toISOString(),
            userId,
            userName,
            department,
            role,
            sessionId,
            ipAddress,
            userAgent,
            context: {
              submitStartTime: submitStartTime.toISOString(),
              submitEndTime: new Date().toISOString(),
              totalFormTime,
              totalFieldChanges: fieldChanges.current.length,
              totalValidationErrors: validationErrors.current.length,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              errorStack: error instanceof Error ? error.stack : undefined
            }
          });
        }
        
        throw error;
      } finally {
        isSubmitting.current = false;
      }
    };
  }, [formType, formId, userId, userName, department, role, sessionId, ipAddress, userAgent, enableSubmissionLogging]);

  // Log form abandonment
  const logFormAbandonment = useCallback(() => {
    const formEndTime = new Date();
    const totalFormTime = formEndTime.getTime() - formStartTime.current.getTime();
    
    FormLogger.logUserAction({
      action: 'FORM_ABANDONED',
      description: `Form ${formType} abandoned by user`,
      formType,
      formId,
      timestamp: formEndTime.toISOString(),
      userId,
      userName,
      department,
      role,
      sessionId,
      ipAddress,
      userAgent,
      context: {
        formStartTime: formStartTime.current.toISOString(),
        formEndTime: formEndTime.toISOString(),
        totalFormTime,
        totalFieldChanges: fieldChanges.current.length,
        totalValidationErrors: validationErrors.current.length,
        abandonmentReason: 'User left form without submitting'
      }
    });
  }, [formType, formId, userId, userName, department, role, sessionId, ipAddress, userAgent]);

  // Log form reset
  const logFormReset = useCallback(() => {
    FormLogger.logUserAction({
      action: 'FORM_RESET',
      description: `Form ${formType} reset by user`,
      formType,
      formId,
      timestamp: new Date().toISOString(),
      userId,
      userName,
      department,
      role,
      sessionId,
      ipAddress,
      userAgent,
      context: {
        totalFieldChanges: fieldChanges.current.length,
        totalValidationErrors: validationErrors.current.length,
        resetReason: 'User reset form'
      }
    });
    
    // Reset tracking data
    fieldChanges.current = [];
    validationErrors.current = [];
    formStartTime.current = new Date();
  }, [formType, formId, userId, userName, department, role, sessionId, ipAddress, userAgent]);

  // Get form analytics
  const getFormAnalytics = useCallback(() => {
    return {
      totalFieldChanges: fieldChanges.current.length,
      totalValidationErrors: validationErrors.current.length,
      formDuration: new Date().getTime() - formStartTime.current.getTime(),
      fieldChanges: [...fieldChanges.current],
      validationErrors: [...validationErrors.current]
    };
  }, []);

  return {
    logSubmitHandler,
    logFormAbandonment,
    logFormReset,
    getFormAnalytics,
    fieldChanges: fieldChanges.current,
    validationErrors: validationErrors.current
  };
};

export default useFormLogger;
