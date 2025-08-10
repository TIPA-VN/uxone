import { logger } from './logger';
import { UserActionLog } from './types';

/**
 * Enhanced form logging utilities for specific form operations
 */
export class FormLogger {
  
  /**
   * Log form field focus events
   */
  static logFieldFocus(
    formType: string,
    formId: string,
    fieldName: string,
    context: Partial<UserActionLog>
  ): void {
    logger.logUserAction({
      action: 'FORM_FIELD_FOCUS',
      description: `Field ${fieldName} focused in ${formType}`,
      formType,
      formId,
      fields: [fieldName],
      timestamp: new Date().toISOString(),
      ...context
    });
  }

  /**
   * Log form field blur events
   */
  static logFieldBlur(
    formType: string,
    formId: string,
    fieldName: string,
    fieldValue: any,
    context: Partial<UserActionLog>
  ): void {
    logger.logUserAction({
      action: 'FORM_FIELD_BLUR',
      description: `Field ${fieldName} blurred in ${formType}`,
      formType,
      formId,
      fields: [fieldName],
      timestamp: new Date().toISOString(),
      ...context,
      context: {
        fieldValue: typeof fieldValue === 'string' && fieldValue.length > 100 ? '[TRUNCATED]' : fieldValue,
        ...context.context
      }
    });
  }

  /**
   * Log form validation start
   */
  static logValidationStart(
    formType: string,
    formId: string,
    fields: string[],
    context: Partial<UserActionLog>
  ): void {
    logger.logUserAction({
      action: 'FORM_VALIDATION_START',
      description: `Form validation started for ${formType}`,
      formType,
      formId,
      fields,
      timestamp: new Date().toISOString(),
      ...context
    });
  }

  /**
   * Log form validation completion
   */
  static logValidationComplete(
    formType: string,
    formId: string,
    isValid: boolean,
    errorCount: number,
    context: Partial<UserActionLog>
  ): void {
    logger.logUserAction({
      action: 'FORM_VALIDATION_COMPLETE',
      description: `Form validation completed for ${formType} - ${isValid ? 'Valid' : 'Invalid'} (${errorCount} errors)`,
      formType,
      formId,
      timestamp: new Date().toISOString(),
      ...context,
      context: {
        isValid,
        errorCount,
        ...context.context
      }
    });
  }

  /**
   * Log form step navigation (for multi-step forms)
   */
  static logStepNavigation(
    formType: string,
    formId: string,
    fromStep: string | number,
    toStep: string | number,
    direction: 'forward' | 'backward',
    context: Partial<UserActionLog>
  ): void {
    logger.logUserAction({
      action: 'FORM_STEP_NAVIGATION',
      description: `Form step navigation in ${formType}: ${fromStep} → ${toStep} (${direction})`,
      formType,
      formId,
      timestamp: new Date().toISOString(),
      ...context,
      context: {
        fromStep,
        toStep,
        direction,
        ...context.context
      }
    });
  }

  /**
   * Log form auto-save events
   */
  static logAutoSave(
    formType: string,
    formId: string,
    success: boolean,
    savedFields: string[],
    context: Partial<UserActionLog>
  ): void {
    logger.logUserAction({
      action: 'FORM_AUTO_SAVE',
      description: `Form auto-save ${success ? 'succeeded' : 'failed'} for ${formType}`,
      formType,
      formId,
      fields: savedFields,
      timestamp: new Date().toISOString(),
      ...context,
      context: {
        success,
        savedFields,
        ...context.context
      }
    });
  }

  /**
   * Log form data export
   */
  static logDataExport(
    formType: string,
    formId: string,
    exportFormat: string,
    exportedFields: string[],
    context: Partial<UserActionLog>
  ): void {
    logger.logUserAction({
      action: 'FORM_DATA_EXPORT',
      description: `Form data exported from ${formType} in ${exportFormat} format`,
      formType,
      formId,
      fields: exportedFields,
      timestamp: new Date().toISOString(),
      ...context,
      context: {
        exportFormat,
        exportedFields,
        ...context.context
      }
    });
  }

  /**
   * Log form data import
   */
  static logDataImport(
    formType: string,
    formId: string,
    importFormat: string,
    importedFields: string[],
    success: boolean,
    context: Partial<UserActionLog>
  ): void {
    logger.logUserAction({
      action: 'FORM_DATA_IMPORT',
      description: `Form data import ${success ? 'succeeded' : 'failed'} for ${formType} from ${importFormat}`,
      formType,
      formId,
      fields: importedFields,
      timestamp: new Date().toISOString(),
      ...context,
      context: {
        importFormat,
        importedFields,
        success,
        ...context.context
      }
    });
  }

  /**
   * Log form template usage
   */
  static logTemplateUsage(
    formType: string,
    formId: string,
    templateName: string,
    templateId: string,
    context: Partial<UserActionLog>
  ): void {
    logger.logUserAction({
      action: 'FORM_TEMPLATE_USED',
      description: `Form template ${templateName} applied to ${formType}`,
      formType,
      formId,
      timestamp: new Date().toISOString(),
      ...context,
      context: {
        templateName,
        templateId,
        ...context.context
      }
    });
  }

  /**
   * Log form collaboration events
   */
  static logCollaboration(
    formType: string,
    formId: string,
    collaborationType: 'shared' | 'commented' | 'reviewed' | 'approved',
    collaboratorId: string,
    collaboratorName: string,
    context: Partial<UserActionLog>
  ): void {
    logger.logUserAction({
      action: 'FORM_COLLABORATION',
      description: `Form collaboration: ${collaborationType} by ${collaboratorName} on ${formType}`,
      formType,
      formId,
      timestamp: new Date().toISOString(),
      ...context,
      context: {
        collaborationType,
        collaboratorId,
        collaboratorName,
        ...context.context
      }
    });
  }

  /**
   * Log form accessibility events
   */
  static logAccessibility(
    formType: string,
    formId: string,
    accessibilityAction: 'screen_reader' | 'keyboard_navigation' | 'high_contrast' | 'font_size',
    context: Partial<UserActionLog>
  ): void {
    logger.logUserAction({
      action: 'FORM_ACCESSIBILITY',
      description: `Accessibility action ${accessibilityAction} used on ${formType}`,
      formType,
      formId,
      timestamp: new Date().toISOString(),
      ...context,
      context: {
        accessibilityAction,
        ...context.context
      }
    });
  }

  /**
   * Log form performance metrics
   */
  static logPerformance(
    formType: string,
    formId: string,
    metric: string,
    value: number,
    unit: string,
    context: Partial<UserActionLog>
  ): void {
    logger.logUserAction({
      action: 'FORM_PERFORMANCE',
      description: `Form performance metric: ${metric} = ${value}${unit} for ${formType}`,
      formType,
      formId,
      timestamp: new Date().toISOString(),
      ...context,
      context: {
        metric,
        value,
        unit,
        ...context.context
      }
    });
  }

  /**
   * Log form error recovery
   */
  static logErrorRecovery(
    formType: string,
    formId: string,
    errorType: string,
    recoveryMethod: string,
    success: boolean,
    context: Partial<UserActionLog>
  ): void {
    logger.logUserAction({
      action: 'FORM_ERROR_RECOVERY',
      description: `Form error recovery ${success ? 'succeeded' : 'failed'} for ${errorType} in ${formType}`,
      formType,
      formId,
      timestamp: new Date().toISOString(),
      ...context,
      context: {
        errorType,
        recoveryMethod,
        success,
        ...context.context
      }
    });
  }
}

export default FormLogger;
