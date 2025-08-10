'use client';

import React, { useState } from 'react';

export default function FileComparisonTestPage() {
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [testFile, setTestFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setTestFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!testFile) return;

    setIsUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', testFile);
      formData.append('projectId', 'test-project-123'); // Test project ID
      formData.append('department', 'TEST');
      formData.append('metadata', JSON.stringify({ type: 'test-document' }));

      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      setUploadResult(result);
    } catch (error) {
      setUploadResult({ error: error instanceof Error ? error.message : 'Upload failed' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">File Comparison Integration Test</h1>
          <p className="text-gray-600 text-lg">
            This page tests the enhanced file comparison functionality integrated into the document upload system.
            Upload the same file multiple times to see how the system handles versioning.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Test File Upload</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select a file to upload:
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            <button
              onClick={handleUpload}
              disabled={!testFile || isUploading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Uploading...' : 'Upload File'}
            </button>
          </div>
        </div>

        {uploadResult && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload Result</h2>
            
            {uploadResult.error ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800">Error: {uploadResult.error}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-700">File Information</h3>
                    <p className="text-sm text-gray-600">Name: {uploadResult.fileName}</p>
                    <p className="text-sm text-gray-600">Type: {uploadResult.fileType}</p>
                    <p className="text-sm text-gray-600">Size: {uploadResult.size} bytes</p>
                    <p className="text-sm text-gray-600">Version: {uploadResult.version}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-700">Version Decision</h3>
                    <p className="text-sm text-gray-600">
                      Should Create Version: {uploadResult.versionDecision?.shouldCreateVersion ? 'Yes' : 'No'}
                    </p>
                    <p className="text-sm text-gray-600">Reason: {uploadResult.versionDecision?.reason}</p>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <h4 className="font-medium text-blue-800 mb-2">What This Means:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• If "Should Create Version" is Yes: A new document version was created</li>
                    <li>• If "Should Create Version" is No: The file was identical to an existing version</li>
                    <li>• The system compares file content using MD5 and SHA-256 hashes</li>
                    <li>• Only truly different files get new version numbers</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">How to Test</h2>
          <div className="space-y-3 text-gray-600">
            <p>1. <strong>First Upload:</strong> Select a file and upload it. You should see version 1.</p>
            <p>2. <strong>Same File Upload:</strong> Upload the exact same file again. The system should detect it's identical and not create a new version.</p>
            <p>3. <strong>Modified File Upload:</strong> Make a small change to the file and upload again. You should see version 2.</p>
            <p>4. <strong>Check Logs:</strong> Look at the server console for detailed versioning decisions and file comparison results.</p>
          </div>
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <h3 className="font-medium text-yellow-800 mb-2">Important Notes</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• This test uses a test project ID. In production, use real project IDs.</li>
            <li>• File comparison is based on content hashes, not just filenames.</li>
            <li>• The system logs all versioning decisions for debugging.</li>
            <li>• If file comparison fails, the system defaults to creating new versions for safety.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
