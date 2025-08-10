'use client';

import FileComparison from '@/components/FileComparison';

export default function FileComparisonDemoPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">File Comparison Demo</h1>
          <p className="text-gray-600 text-lg">
            This tool demonstrates advanced file comparison capabilities including hash comparison, 
            byte-by-byte analysis, and text diff functionality to determine if files should be versioned.
          </p>
        </div>

        <FileComparison 
          onVersionDecision={(shouldVersion, similarity, reason) => {
            console.log('Version decision:', { shouldVersion, similarity, reason });
          }}
        />

        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Hash Comparison</h3>
              <p className="text-gray-600 text-sm">
                Generates MD5 and SHA-256 hashes for both files. Identical files will have matching hashes.
                This is the fastest method and is 100% accurate for detecting identical files.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Byte-by-Byte</h3>
              <p className="text-gray-600 text-sm">
                Compares files at the binary level, showing exact differences in byte values and positions.
                Useful for detecting even minor changes in binary files like images, PDFs, or executables.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Text Diff</h3>
              <p className="text-gray-600 text-sm">
                Performs line-by-line comparison for text files, showing added, removed, or modified lines.
                Ideal for source code, configuration files, and other text-based documents.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Use Cases</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h4 className="font-medium text-gray-800">Document Versioning</h4>
                <p className="text-gray-600 text-sm">
                  Determine if an uploaded file is truly different from existing versions before creating a new version.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h4 className="font-medium text-gray-800">Quality Assurance</h4>
                <p className="text-gray-600 text-sm">
                  Verify that file processing or conversion hasn't corrupted the original content.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h4 className="font-medium text-gray-800">Content Deduplication</h4>
                <p className="text-gray-600 text-sm">
                  Identify duplicate files in storage systems to save space and improve organization.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h4 className="font-medium text-gray-800">Change Detection</h4>
                <p className="text-gray-600 text-sm">
                  Monitor files for unauthorized modifications or track changes in collaborative workflows.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
