import { prisma } from './prisma'
import { detectChanges } from './changeTracking'

export interface SaveDocumentWithHistoryParams {
  documentId: string
  newContent: string
  newTitle: string
  newStatus?: string
  userId: string
  userName: string
  userEmail: string
}

export async function checkForConcurrentEdits(
  documentId: string,
  currentContent: string,
  currentTitle: string
) {
  try {
    // Get the latest version from the database
    const latestVersion = await prisma.documentHistory.findFirst({
      where: { documentId },
      orderBy: { version: 'desc' },
      take: 1
    });

    if (!latestVersion) {
      return { hasConflict: false, latestVersion: null, differences: null };
    }

    // Get the current document state
    const currentDoc = await prisma.document.findUnique({
      where: { id: documentId }
    });

    if (!currentDoc) {
      return { hasConflict: false, latestVersion: null, differences: null };
    }

    // Check if the database content is different from what we're trying to save
    const hasConflict = currentDoc.content !== currentContent || currentDoc.title !== currentTitle;

    if (hasConflict) {
      // Analyze the differences
      const differences = detectChanges(
        currentDoc.content || '',
        currentContent,
        currentDoc.title || '',
        currentTitle
      );

      return {
        hasConflict: true,
        latestVersion,
        currentVersion: currentDoc,
        differences,
        conflictSummary: `Someone else has saved changes while you were editing. Your version: v${latestVersion.version + 1}, Latest: v${latestVersion.version}`
      };
    }

    return { hasConflict: false, latestVersion, differences: null };
  } catch (error) {
    console.error('Error checking for concurrent edits:', error);
    return { hasConflict: false, latestVersion: null, differences: null };
  }
}

export async function saveDocumentWithHistory({
  documentId,
  newContent,
  newTitle,
  newStatus,
  userId,
  userName,
  userEmail
}: SaveDocumentWithHistoryParams) {
  
  // First check for concurrent edits
  const conflictCheck = await checkForConcurrentEdits(documentId, newContent, newTitle);
  
  if (conflictCheck.hasConflict) {
    // Return conflict information instead of saving
    return {
      success: false,
      conflict: true,
      conflictData: conflictCheck,
      message: 'Concurrent edit detected. Please resolve conflicts before saving.'
    };
  }

  // Get current document
  const currentDoc = await prisma.document.findUnique({
    where: { id: documentId }
  });

  if (!currentDoc) {
    throw new Error('Document not found')
  }

  // Get the latest version number from history
  const latestHistory = await prisma.documentHistory.findFirst({
    where: { documentId },
    orderBy: { version: 'desc' },
    take: 1
  });

  // Detect changes
  const changes = detectChanges(
    currentDoc.content || '',
    newContent,
    currentDoc.title || '',
    newTitle,
    currentDoc.workflowState,
    newStatus
  )

  // Only save if there are actual changes
  if (changes.changesCount === 0 && changes.type !== 'created') {
    return { 
      success: true, 
      document: currentDoc,
      message: 'No changes detected'
    };
  }

  // Start transaction
  const result = await prisma.$transaction(async (tx) => {
    // Update document
    const updatedDoc = await tx.document.update({
      where: { id: documentId },
      data: {
        content: newContent,
        title: newTitle,
        workflowState: newStatus || currentDoc.workflowState,
        version: { increment: 1 },
        lastUpdatedBy: userId,
        lastUpdatedById: userId
      }
    })

    // Create history entry
    const newVersion = latestHistory?.version + 1 || 1
    
    await tx.documentHistory.create({
      data: {
        documentId: documentId,
        content: newContent,
        title: newTitle,
        changeType: changes.type,
        summary: changes.summary,
        changedBy: userId,
        changedByName: userName,
        changedByEmail: userEmail,
        version: newVersion,
        wordCount: changes.wordCount
      }
    })

    return updatedDoc
  })

  return { 
    success: true, 
    document: result,
    message: 'Document saved successfully with history tracking'
  };
}

export async function getDocumentHistory(documentId: string, limit: number = 20) {
  return prisma.documentHistory.findMany({
    where: { documentId },
    orderBy: { createdAt: 'desc' },
    take: limit
  })
}

export async function getDocumentVersion(documentId: string, version: number) {
  return prisma.documentHistory.findFirst({
    where: { 
      documentId,
      version 
    }
  })
}
