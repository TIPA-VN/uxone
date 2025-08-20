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
  const currentYear = new Date().getFullYear();
  
  console.log('Starting document number generation:', { templateId, projectId, createdById, currentYear });

  // Use transaction to ensure atomicity
  const result = await prisma.$transaction(async (tx) => {
    console.log('Transaction started, fetching template:', templateId);
    
    // Get the template and lock it for update
    const template = await tx.documentTemplate.findUnique({
      where: { id: templateId },
    });

    console.log('Template found:', template);

    if (!template) {
      throw new Error("Document template not found");
    }

    if (!template.isActive) {
      throw new Error("Document template is not active");
    }

    console.log('Template is active, incrementing sequence from:', template.currentSequence);

    // Increment the sequence number
    const updatedTemplate = await tx.documentTemplate.update({
      where: { id: templateId },
      data: {
        currentSequence: {
          increment: 1,
        },
      },
    });

    console.log('Sequence updated to:', updatedTemplate.currentSequence);

    // Generate the document number
    const sequenceNumber = updatedTemplate.currentSequence;
    const documentNumber = `${template.prefix}-${currentYear}-${sequenceNumber.toString().padStart(3, '0')}`;
    
    console.log('Generated document number:', documentNumber);

    // Create the document number record
    const documentNumberRecord = await tx.documentNumber.create({
      data: {
        documentNumber,
        templateId,
        projectId,
        sequenceNumber,
        year: currentYear,
        createdById: createdById || 'system', // Use provided ID or fallback
      },
    });

    console.log('Document number record created:', documentNumberRecord.id);

    return {
      id: documentNumberRecord.id,
      documentNumber: documentNumberRecord.documentNumber,
      templateId: documentNumberRecord.templateId,
      projectId: documentNumberRecord.projectId || undefined,
      sequenceNumber: documentNumberRecord.sequenceNumber,
      year: documentNumberRecord.year,
    };
  });

  console.log('Document number generation completed successfully:', result);
  return result;
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