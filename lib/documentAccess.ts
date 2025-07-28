import { Document, User } from "@prisma/client";

// Restricted document types that require Senior Manager+ access
export const RESTRICTED_DOCUMENT_TYPES = ['quote', 'contract', 'invoice'] as const;

export type RestrictedDocumentType = typeof RESTRICTED_DOCUMENT_TYPES[number];

export interface DocumentAccessResult {
  canAccess: boolean;
  reason?: string;
}

export function checkDocumentAccess(
  document: Document & { project?: { ownerId: string } | null },
  user: { id: string; role?: string; department?: string }
): DocumentAccessResult {
  // Get document type from metadata
  const documentType = (document.metadata as any)?.type as string;
  
  // Check if this is a restricted document type
  const isRestrictedType = RESTRICTED_DOCUMENT_TYPES.includes(documentType as RestrictedDocumentType);
  
  // Check user role
  const userRole = user.role?.toUpperCase();
  const isAdmin = userRole === "ADMIN";
  const isSeniorManager = userRole === "SENIOR MANAGER" || userRole === "SENIOR_MANAGER";
  const isManager = userRole === "MANAGER";
  
  // Check ownership
  const isProjectOwner = document.project?.ownerId === user.id;
  const isDocumentOwner = document.ownerId === user.id;
  
  // Check department access
  const userDepartment = user.department?.toUpperCase();
  const documentDepartment = document.department?.toUpperCase();
  const isSameDepartment = userDepartment === documentDepartment;
  
  // For restricted document types (quote, contract, invoice)
  if (isRestrictedType) {
    // Only Senior Managers and above can access restricted documents
    if (isAdmin || isSeniorManager) {
      return { canAccess: true };
    }
    
    // Project owners can access their own project's restricted documents
    if (isProjectOwner) {
      return { canAccess: true };
    }
    
    return { 
      canAccess: false, 
      reason: "Access restricted to Senior Managers and above for this document type" 
    };
  }
  
  // For non-restricted documents, use standard access rules
  if (isAdmin) {
    return { canAccess: true };
  }
  
  if (isProjectOwner || isDocumentOwner) {
    return { canAccess: true };
  }
  
  if (isSeniorManager && isSameDepartment) {
    return { canAccess: true };
  }
  
  if (isManager && isSameDepartment) {
    return { canAccess: true };
  }
  
  return { 
    canAccess: false, 
    reason: "You don't have permission to access this document" 
  };
}

export function isRestrictedDocumentType(documentType: string): boolean {
  return RESTRICTED_DOCUMENT_TYPES.includes(documentType as RestrictedDocumentType);
} 