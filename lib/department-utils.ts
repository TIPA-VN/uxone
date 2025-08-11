/**
 * Department Utility Functions
 * Provides helper functions for department mapping and validation throughout the app
 */

import { 
  getDepartmentMapping, 
  getUXOneDepartmentCode, 
  getLegacyDepartmentName,
  getDepartmentHomePage,
  isValidDepartmentCode,
  isValidLegacyName,
  getActiveDepartments,
  getDepartmentsByCategory as getDepartmentsByCategoryFromConfig,
  getDepartmentStats
} from '@/config/department-mapping';

/**
 * Map a legacy department name to UXOne department code
 * @param legacyName - The legacy department name from central authentication
 * @returns UXOne department code or 'DEFAULT' if no mapping found
 */
export function mapLegacyToUXOne(legacyName: string): string {
  if (!legacyName) return 'DEFAULT';
  return getUXOneDepartmentCode(legacyName);
}

/**
 * Map a UXOne department code to legacy department name
 * @param uxoneCode - The UXOne department code
 * @returns Legacy department name or the code itself if no mapping found
 */
export function mapUXOneToLegacy(uxoneCode: string): string {
  if (!uxoneCode) return 'Unknown';
  return getLegacyDepartmentName(uxoneCode);
}

/**
 * Get the home page for a department (legacy name or UXOne code)
 * @param department - Department name or code
 * @returns Home page path or '/lvm' as default
 */
export function getDepartmentPage(department: string): string {
  if (!department) return '/lvm';
  const homePage = getDepartmentHomePage(department);
  console.log('🔍 getDepartmentPage:', { department, homePage });
  return homePage;
}

/**
 * Validate if a department code is valid in UXOne
 * @param code - Department code to validate
 * @returns True if valid, false otherwise
 */
export function validateDepartmentCode(code: string): boolean {
  if (!code) return false;
  return isValidDepartmentCode(code);
}

/**
 * Validate if a legacy department name is recognized
 * @param name - Legacy department name to validate
 * @returns True if recognized, false otherwise
 */
export function validateLegacyDepartment(name: string): boolean {
  if (!name) return false;
  return isValidLegacyName(name);
}

/**
 * Get all active departments with their mapping information
 * @returns Array of active department mappings
 */
export function getActiveDepartmentMappings() {
  return getActiveDepartments();
}

/**
 * Get departments by category
 * @param category - Category to filter by
 * @returns Array of departments in the specified category
 */
export function getDepartmentsByCategory(category: 'core' | 'production' | 'support' | 'manufacturing') {
  return getDepartmentsByCategoryFromConfig(category);
}

/**
 * Get comprehensive department statistics
 * @returns Object with department statistics
 */
export function getDepartmentStatistics() {
  return getDepartmentStats();
}

/**
 * Check if a user should be redirected based on their department
 * @param userDepartment - User's department from session
 * @param userRole - User's role from session
 * @returns True if user should be redirected, false otherwise
 */
export function shouldRedirectUser(userDepartment: string, userRole: string): boolean {
  if (!userDepartment) return false;
  
  // Admin users should not be redirected
  const adminRoles = ['ADMIN', 'GENERAL_DIRECTOR', 'GENERAL_MANAGER', 'ASSISTANT_GENERAL_MANAGER', 'ASSISTANT_GENERAL_MANAGER_2', 'SENIOR_MANAGER'];
  if (adminRoles.includes(userRole)) return false;
  
  // Check if department has a specific home page
  const homePage = getDepartmentPage(userDepartment);
  return homePage !== '/lvm';
}

/**
 * Get user's appropriate home page based on department and role
 * @param userDepartment - User's department from session
 * @param userRole - User's role from session
 * @returns Home page path
 */
export function getUserAppropriateHomePage(userDepartment: string, userRole: string): string {
  console.log('🔍 getUserAppropriateHomePage called:', { userDepartment, userRole });
  
  // Admin users get admin panel access
  const adminRoles = ['ADMIN', 'GENERAL_DIRECTOR', 'GENERAL_MANAGER', 'ASSISTANT_GENERAL_MANAGER', 'ASSISTANT_GENERAL_MANAGER_2', 'SENIOR_MANAGER'];
  if (adminRoles.includes(userRole)) {
    console.log('🔍 User is admin, redirecting to /lvm/admin');
    return '/lvm/admin';
  }
  
  // Regular users get their department home page
  if (userDepartment) {
    const homePage = getDepartmentPage(userDepartment);
    console.log('🔍 User department home page:', { userDepartment, homePage });
    return homePage;
  }
  
  // Default fallback
  console.log('🔍 No department, using default /lvm');
  return '/lvm';
}

/**
 * Format department name for display
 * @param department - Department name or code
 * @param format - Format type: 'short', 'long', or 'code'
 * @returns Formatted department name
 */
export function formatDepartmentName(department: string, format: 'short' | 'long' | 'code' = 'long'): string {
  if (!department) return 'Unknown Department';
  
  const mapping = getDepartmentMapping(department);
  if (!mapping) return department;
  
  switch (format) {
    case 'short':
      return mapping.uxoneCode;
    case 'code':
      return mapping.uxoneCode;
    case 'long':
    default:
      return mapping.legacyName;
  }
}

/**
 * Get department category information
 * @param department - Department name or code
 * @returns Department category or 'unknown'
 */
export function getDepartmentCategory(department: string): string {
  if (!department) return 'unknown';
  
  const mapping = getDepartmentMapping(department);
  return mapping?.category || 'unknown';
}

/**
 * Check if department is production-related
 * @param department - Department name or code
 * @returns True if production-related, false otherwise
 */
export function isProductionDepartment(department: string): boolean {
  const category = getDepartmentCategory(department);
  return category === 'production' || category === 'manufacturing';
}

/**
 * Check if department is support-related
 * @param department - Department name or code
 * @returns True if support-related, false otherwise
 */
export function isSupportDepartment(department: string): boolean {
  const category = getDepartmentCategory(department);
  return category === 'support';
}

/**
 * Get all department codes for form selection
 * @returns Array of department codes with labels
 */
export function getDepartmentOptions(): Array<{ value: string; label: string; category: string }> {
  return getActiveDepartments().map(mapping => ({
    value: mapping.uxoneCode,
    label: mapping.legacyName,
    category: mapping.category
  }));
}

/**
 * Search departments by name or code
 * @param query - Search query
 * @returns Array of matching departments
 */
export function searchDepartments(query: string): Array<{ value: string; label: string; category: string }> {
  if (!query) return getDepartmentOptions();
  
  const normalizedQuery = query.toLowerCase();
  
  return getActiveDepartments()
    .filter(mapping => 
      mapping.legacyName.toLowerCase().includes(normalizedQuery) ||
      mapping.uxoneCode.toLowerCase().includes(normalizedQuery) ||
      mapping.description.toLowerCase().includes(normalizedQuery) ||
      mapping.aliases?.some(alias => alias.toLowerCase().includes(normalizedQuery))
    )
    .map(mapping => ({
      value: mapping.uxoneCode,
      label: mapping.legacyName,
      category: mapping.category
    }));
}
