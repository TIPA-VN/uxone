'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { getChangeTypeColor, getChangeTypeIcon } from '@/lib/changeTracking'
import { Clock, User, FileText, Eye } from 'lucide-react'

interface HistoryEntry {
  id: string
  changeType: string
  summary: string
  changedByName: string
  changedByEmail: string
  version: number
  wordCount: number
  createdAt: string
}

interface DocumentHistoryProps {
  documentId: string
  onViewVersion?: (version: number) => void
}

export default function DocumentHistory({ 
  documentId, 
  onViewVersion 
}: DocumentHistoryProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchHistory()
  }, [documentId])

  const fetchHistory = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/documents/${documentId}/history`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch history')
      }

      const data = await response.json()
      setHistory(data.history)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-red-600 bg-red-50 rounded-lg">
        Error loading history: {error}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Clock size={20} />
        Document History
      </h3>

      {history.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No history available</p>
      ) : (
        <div className="space-y-3">
          {history.map((entry) => (
            <div 
              key={entry.id} 
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">
                      {getChangeTypeIcon(entry.changeType)}
                    </span>
                    <span 
                      className={`px-2 py-1 rounded-full text-xs font-medium text-${getChangeTypeColor(entry.changeType)}-800 bg-${getChangeTypeColor(entry.changeType)}-100`}
                    >
                      v{entry.version}
                    </span>
                    <span className="text-sm text-gray-600">
                      {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                    </span>
                  </div>

                  <p className="font-medium mb-1">{entry.summary}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <User size={14} />
                      {entry.changedByName}
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText size={14} />
                      {entry.wordCount} words
                    </div>
                  </div>
                </div>

                {onViewVersion && (
                  <button
                    onClick={() => onViewVersion(entry.version)}
                    className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                  >
                    <Eye size={14} />
                    View
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
