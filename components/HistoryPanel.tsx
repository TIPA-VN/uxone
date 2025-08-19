'use client'

import { useState } from 'react'
import DocumentHistory from './DocumentHistory'
import { X } from 'lucide-react'

interface HistoryPanelProps {
  documentId: string
  isOpen: boolean
  onClose: () => void
}

export default function HistoryPanel({ 
  documentId, 
  isOpen, 
  onClose
}: HistoryPanelProps) {
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null)
  const [versionContent, setVersionContent] = useState<string>('')
  const [loadingVersion, setLoadingVersion] = useState(false)

  const handleViewVersion = async (version: number) => {
    try {
      setLoadingVersion(true)
      setSelectedVersion(version)
      
      const response = await fetch(`/api/documents/${documentId}/versions/${version}`)
      if (!response.ok) {
        throw new Error('Failed to fetch version')
      }

      const data = await response.json()
      setVersionContent(data.version.content)
    } catch (error) {
      console.error('Error fetching version:', error)
      alert('Failed to load version')
    } finally {
      setLoadingVersion(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl h-[80vh] flex">
        {/* History List */}
        <div className="w-1/2 border-r">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-xl font-semibold">Document History</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="p-4 overflow-y-auto h-full">
            <DocumentHistory
              documentId={documentId}
              onViewVersion={handleViewVersion}
            />
          </div>
        </div>

        {/* Version Preview */}
        <div className="w-1/2 flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">
                {selectedVersion ? `Version ${selectedVersion}` : 'Select a version to preview'}
              </h3>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            {loadingVersion ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : selectedVersion ? (
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: versionContent }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Click on a version to preview its content
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
