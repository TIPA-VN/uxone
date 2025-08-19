'use client'

import { useState } from 'react'
import { X, AlertTriangle, CheckCircle, RotateCcw } from 'lucide-react'
import { detectChanges } from '@/lib/changeTracking'

export interface ConflictData {
  hasConflict: boolean
  latestVersion: any
  currentVersion: any
  differences: any
  conflictSummary: string
}

interface ConflictResolutionModalProps {
  isOpen: boolean
  onClose: () => void
  conflictData: ConflictData
  onResolveConflict: (action: 'overwrite' | 'merge' | 'cancel') => void
  currentContent: string
  currentTitle: string
}

export default function ConflictResolutionModal({
  isOpen,
  onClose,
  conflictData,
  onResolveConflict,
  currentContent,
  currentTitle
}: ConflictResolutionModalProps) {
  const [selectedAction, setSelectedAction] = useState<'overwrite' | 'merge' | 'cancel'>('cancel')

  if (!isOpen || !conflictData.hasConflict) return null

  const handleResolve = () => {
    onResolveConflict(selectedAction)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-orange-500" size={24} />
              <h2 className="text-xl font-semibold text-gray-900">
                Document Edit Conflict Detected
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <X size={20} />
            </button>
          </div>
          <p className="text-gray-600 mt-2">
            {conflictData.conflictSummary}
          </p>
        </div>

        {/* Conflict Details */}
        <div className="p-6 space-y-6">
          {/* Latest Version Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">
              Latest Version (v{conflictData.latestVersion?.version})
            </h3>
            <div className="text-sm text-blue-800">
              <p><strong>Title:</strong> {conflictData.currentVersion?.title}</p>
              <p><strong>Last Updated:</strong> {new Date(conflictData.latestVersion?.createdAt).toLocaleString()}</p>
              <p><strong>By:</strong> {conflictData.latestVersion?.changedByName}</p>
            </div>
          </div>

          {/* Your Changes */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-medium text-green-900 mb-2">
              Your Changes (v{conflictData.latestVersion?.version + 1})
            </h3>
            <div className="text-sm text-green-800">
              <p><strong>Title:</strong> {currentTitle}</p>
              <p><strong>Content Length:</strong> {currentContent.length} characters</p>
            </div>
          </div>

          {/* Change Summary */}
          {conflictData.differences && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">
                What You Changed
              </h3>
              <div className="text-sm text-gray-700">
                <p><strong>Summary:</strong> {conflictData.differences.summary}</p>
                {conflictData.differences.details && (
                  <div className="mt-2">
                    <strong>Details:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      {conflictData.differences.details.map((detail: string, index: number) => (
                        <li key={index} className="text-xs">{detail}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Resolution Options */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">How would you like to resolve this conflict?</h3>
            
            <div className="space-y-3">
              {/* Option 1: Overwrite */}
              <label className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="resolution"
                  value="overwrite"
                  checked={selectedAction === 'overwrite'}
                  onChange={(e) => setSelectedAction(e.target.value as 'overwrite')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-red-700">Overwrite Latest Version</div>
                  <div className="text-sm text-gray-600">
                    Your changes will replace the latest version. The other user's changes will be lost.
                  </div>
                </div>
              </label>

              {/* Option 2: Merge */}
              <label className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="resolution"
                  value="merge"
                  checked={selectedAction === 'merge'}
                  onChange={(e) => setSelectedAction(e.target.value as 'merge')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-blue-700">Merge Changes</div>
                  <div className="text-sm text-gray-600">
                    Your changes will be combined with the latest version. Both sets of changes will be preserved.
                  </div>
                </div>
              </label>

              {/* Option 3: Cancel */}
              <label className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="resolution"
                  value="cancel"
                  checked={selectedAction === 'cancel'}
                  onChange={(e) => setSelectedAction(e.target.value as 'cancel')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-700">Cancel Save</div>
                  <div className="text-sm text-gray-600">
                    Don't save now. You can review the latest version and try again later.
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleResolve}
            disabled={selectedAction === 'cancel'}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {selectedAction === 'overwrite' && 'Overwrite'}
            {selectedAction === 'merge' && 'Merge Changes'}
            {selectedAction === 'cancel' && 'Cancel Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
