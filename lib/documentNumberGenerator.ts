import { prisma } from "@/lib/prisma";

export interface DocumentTemplate {
  id: string;
  templateName: string;
  templateCode: string;
  prefix: string;
  year: number;
  currentSequence: number;
  isActive: boolean;
}

export interface GeneratedDocumentNumber {
  id: string;
  documentNumber: string;
  templateId: string;
  projectId?: string;
  sequenceNumber: number;
  year: number;
}

/**
 * Generate a document number for a given template
 */
export async function generateDocumentNumber(
  templateId: string,
  projectId?: string,
  createdById?: string
): Promise<GeneratedDocumentNumber> {
  try {
    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Fetch template
      const template = await tx.documentTemplate.findUnique({
        where: { id: templateId }
      });

      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      if (!template.isActive) {
        throw new Error(`Template is not active: ${templateId}`);
      }

      // Get current year
      const currentYear = new Date().getFullYear();
      
      // Check if we need to reset sequence for new year
      if (template.year !== currentYear) {
        // Reset sequence for new year
        await tx.documentTemplate.update({
          where: { id: templateId },
          data: {
            year: currentYear,
            currentSequence: 0
          }
        });
      }

      // Increment sequence
      const updatedTemplate = await tx.documentTemplate.update({
        where: { id: templateId },
        data: {
          currentSequence: {
            increment: 1
          }
        }
      });

      // Generate document number
      const documentNumber = `${template.prefix}${updatedTemplate.year}${String(updatedTemplate.currentSequence).padStart(4, '0')}`;

      // Create document number record
      const documentNumberRecord = await tx.documentNumber.create({
        data: {
          documentNumber,
          templateId,
          projectId,
          sequenceNumber: updatedTemplate.currentSequence,
          year: updatedTemplate.year,
          status: 'ACTIVE',
          createdById: createdById || 'system'
        }
      });

      return {
        success: true,
        documentNumber,
        sequenceNumber: updatedTemplate.currentSequence,
        year: updatedTemplate.year,
        templateId,
        projectId,
        recordId: documentNumberRecord.id
      };
    });

    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Get available document templates
 */
export async function getDocumentTemplates(isActive: boolean = true) {
  return await prisma.documentTemplate.findMany({
    where: { isActive },
    select: {
      id: true,
      templateName: true,
      templateCode: true,
      prefix: true,
      year: true,
      description: true,
      revisionNumber: true,
      effectiveDate: true,
    },
    orderBy: { templateName: "asc" },
  });
}

/**
 * Get document numbers for a project
 */
export async function getProjectDocumentNumbers(projectId: string) {
  return await prisma.documentNumber.findMany({
    where: { projectId },
    include: {
      template: {
        select: {
          id: true,
          templateName: true,
          templateCode: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
} 