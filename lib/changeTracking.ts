import { diffWords, diffSentences } from 'diff'

export interface DocumentChange {
  type: 'created' | 'updated' | 'title_changed' | 'status_changed'
  summary: string
  wordCount: number
  changesCount: number
  details?: string[]
}

export function detectChanges(
  oldContent: string = '', 
  newContent: string,
  oldTitle: string = '',
  newTitle: string,
  oldStatus?: string,
  newStatus?: string
): DocumentChange {
  
  // Check status change
  if (oldStatus && newStatus && oldStatus !== newStatus) {
    return {
      type: 'status_changed',
      summary: `Status changed from "${oldStatus}" to "${newStatus}"`,
      wordCount: countWords(newContent),
      changesCount: 1,
      details: [`Status: ${oldStatus} → ${newStatus}`]
    }
  }

  // Check title change
  if (oldTitle && newTitle && oldTitle !== newTitle) {
    return {
      type: 'title_changed',
      summary: `Title changed from "${oldTitle}" to "${newTitle}"`,
      wordCount: countWords(newContent),
      changesCount: 1,
      details: [`Title: "${oldTitle}" → "${newTitle}"`]
    }
  }

  // First save (document creation)
  if (!oldContent || oldContent.trim() === '') {
    return {
      type: 'created',
      summary: 'Document created',
      wordCount: countWords(newContent),
      changesCount: 1,
      details: ['Initial document creation']
    }
  }

  // Content changes
  const oldText = stripHtml(oldContent)
  const newText = stripHtml(newContent)
  
  if (oldText === newText) {
    return {
      type: 'updated',
      summary: 'Minor formatting changes',
      wordCount: countWords(newContent),
      changesCount: 0,
      details: ['Formatting or styling changes only']
    }
  }

  // Detect significant content changes
  const changes = diffSentences(oldText, newText)
  const significantChanges = changes.filter(change => 
    (change.added || change.removed) && 
    change.value.trim().length > 10 // Only significant changes
  )

  if (significantChanges.length === 0) {
    return {
      type: 'updated',
      summary: 'Minor text edits',
      wordCount: countWords(newContent),
      changesCount: 0,
      details: ['Small text modifications']
    }
  }

  const summary = generateChangeSummary(significantChanges)
  const details = generateChangeDetails(significantChanges)
  
  return {
    type: 'updated',
    summary,
    wordCount: countWords(newContent),
    changesCount: significantChanges.length,
    details
  }
}

function generateChangeSummary(changes: any[]): string {
  const added = changes.filter(c => c.added).length
  const removed = changes.filter(c => c.removed).length
  
  if (added > 0 && removed > 0) {
    return `Modified ${added + removed} sections`
  } else if (added > 0) {
    return `Added ${added} new sections`
  } else if (removed > 0) {
    return `Removed ${removed} sections`
  }
  
  return 'Content updated'
}

function generateChangeDetails(changes: any[]): string[] {
  const details: string[] = []
  
  changes.forEach(change => {
    if (change.added) {
      const preview = change.value.substring(0, 50).trim()
      details.push(`+ Added: "${preview}${change.value.length > 50 ? '...' : ''}"`)
    } else if (change.removed) {
      const preview = change.value.substring(0, 50).trim()
      details.push(`- Removed: "${preview}${change.value.length > 50 ? '...' : ''}"`)
    }
  })
  
  return details.slice(0, 5) // Limit to 5 details
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
}

function countWords(html: string): number {
  const text = stripHtml(html)
  if (!text) return 0
  return text.split(/\s+/).filter(word => word.length > 0).length
}

// Helper function to get change type color for UI
export function getChangeTypeColor(type: string): string {
  switch (type) {
    case 'created': return 'green'
    case 'updated': return 'blue'
    case 'title_changed': return 'purple'
    case 'status_changed': return 'orange'
    default: return 'gray'
  }
}

// Helper function to get change type icon
export function getChangeTypeIcon(type: string): string {
  switch (type) {
    case 'created': return '✨'
    case 'updated': return '📝'
    case 'title_changed': return '📛'
    case 'status_changed': return '🔄'
    default: return '📄'
  }
}
