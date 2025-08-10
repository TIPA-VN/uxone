'use client';

import React, { useState, useCallback } from 'react';
import { 
  compareFilesComprehensive, 
  compareFilesByHash, 
  compareFilesByteByByte, 
  compareTextFiles,
  shouldCreateNewVersion,
  FileComparisonResult 
} from '@/lib/file-comparison-browser';

interface FileComparisonProps {
  onVersionDecision?: (shouldVersion: boolean, similarity: number, reason: string) => void;
  className?: string;
}

export default function FileComparison({ onVersionDecision, className = '' }: FileComparisonProps) {
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [comparisonMethod, setComparisonMethod] = useState<'comprehensive' | 'hash' | 'byte' | 'text'>('comprehensive');
  const [isComparing, setIsComparing] = useState(false);
  const [result, setResult] = useState<FileComparisonResult | null>(null);
  const [versionDecision, setVersionDecision] = useState<{
    shouldVersion: boolean;
    similarity: number;
    reason: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile1(file);
      setError(null);
    }
  };

  const handleFile2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile2(file);
      setError(null);
    }
  };

  const compareFiles = useCallback(async () => {
    if (!file1 || !file2) {
      setError('Please select both files to compare');
      return;
    }

    setIsComparing(true);
    setError(null);
    setResult(null);
    setVersionDecision(null);

    try {
      let comparisonResult: FileComparisonResult;

      switch (comparisonMethod) {
        case 'hash':
          comparisonResult = await compareFilesByHash(file1, file2);
          break;
        case 'byte':
          comparisonResult = await compareFilesByteByByte(file1, file2);
          break;
        case 'text':
          comparisonResult = await compareTextFiles(file1, file2);
          break;
        case 'comprehensive':
        default:
          comparisonResult = await compareFilesComprehensive(file1, file2);
          break;
      }

      setResult(comparisonResult);

      // Check if we should create a new version
      const versionCheck = await shouldCreateNewVersion(file1, file2);
      setVersionDecision(versionCheck);

      if (onVersionDecision) {
        onVersionDecision(versionCheck.shouldVersion, versionCheck.similarity, versionCheck.reason);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during comparison');
    } finally {
      setIsComparing(false);
    }
  }, [file1, file2, comparisonMethod, onVersionDecision]);

  const resetComparison = () => {
    setFile1(null);
    setFile2(null);
    setResult(null);
    setVersionDecision(null);
    setError(null);
  };

  const getFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">File Comparison Tool</h2>
      
      {/* File Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            File 1
          </label>
          <input
            type="file"
            onChange={handleFile1Change}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {file1 && (
            <div className="mt-2 text-sm text-gray-600">
              <div>Name: {file1.name}</div>
              <div>Size: {getFileSize(file1.size)}</div>
              <div>Type: {file1.type || 'Unknown'}</div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            File 2
          </label>
          <input
            type="file"
            onChange={handleFile2Change}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {file2 && (
            <div className="mt-2 text-sm text-gray-600">
              <div>Name: {file2.name}</div>
              <div>Size: {getFileSize(file2.size)}</div>
              <div>Type: {file2.type || 'Unknown'}</div>
            </div>
          )}
        </div>
      </div>

      {/* Comparison Method Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Comparison Method
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { value: 'comprehensive', label: 'Comprehensive', desc: 'All methods' },
            { value: 'hash', label: 'Hash Only', desc: 'MD5 + SHA256' },
            { value: 'byte', label: 'Byte-by-Byte', desc: 'Binary comparison' },
            { value: 'text', label: 'Text Diff', desc: 'Line-by-line' }
          ].map((method) => (
            <label key={method.value} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="comparisonMethod"
                value={method.value}
                checked={comparisonMethod === method.value}
                onChange={(e) => setComparisonMethod(e.target.value as any)}
                className="mr-2"
              />
              <div>
                <div className="font-medium text-sm">{method.label}</div>
                <div className="text-xs text-gray-500">{method.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={compareFiles}
          disabled={!file1 || !file2 || isComparing}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isComparing ? 'Comparing...' : 'Compare Files'}
        </button>
        <button
          onClick={resetComparison}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          Reset
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="text-red-800 font-medium">Error</div>
          <div className="text-red-600 text-sm">{error}</div>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Comparison Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-gray-700">Files are identical:</div>
                <div className={`text-lg font-bold ${result.isIdentical ? 'text-green-600' : 'text-red-600'}`}>
                  {result.isIdentical ? 'Yes' : 'No'}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700">File sizes:</div>
                <div className="text-sm text-gray-600">
                  {getFileSize(result.fileInfo.file1.size)} vs {getFileSize(result.fileInfo.file2.size)}
                </div>
              </div>
            </div>
          </div>

          {/* Hash Comparison */}
          {result.hashComparison && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Hash Comparison</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-700">MD5: </span>
                  <span className={`text-sm ${result.hashComparison.md5.match ? 'text-green-600' : 'text-red-600'}`}>
                    {result.hashComparison.md5.match ? 'Match' : 'Different'}
                  </span>
                  <div className="text-xs text-gray-500 mt-1">
                    <div>File 1: {result.hashComparison.md5.file1}</div>
                    <div>File 2: {result.hashComparison.md5.file2}</div>
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">SHA256: </span>
                  <span className={`text-sm ${result.hashComparison.sha256.match ? 'text-green-600' : 'text-red-600'}`}>
                    {result.hashComparison.sha256.match ? 'Match' : 'Different'}
                  </span>
                  <div className="text-xs text-gray-500 mt-1">
                    <div>File 1: {result.hashComparison.sha256.file1}</div>
                    <div>File 2: {result.hashComparison.sha256.file2}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Byte Comparison */}
          {result.byteComparison && (
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Byte-by-Byte Comparison</h3>
              <div className="text-sm text-gray-700 mb-2">
                Files are {result.byteComparison.identical ? 'identical' : 'different'} at byte level
              </div>
              {result.byteComparison.differences && result.byteComparison.differences.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    First {Math.min(result.byteComparison.differences.length, 100)} differences:
                  </div>
                  <div className="max-h-40 overflow-y-auto text-xs">
                    {result.byteComparison.differences.map((diff, index) => (
                      <div key={index} className="font-mono bg-white p-1 rounded mb-1">
                        Offset {diff.offset}: {diff.file1Byte.toString(16).padStart(2, '0')} vs {diff.file2Byte.toString(16).padStart(2, '0')}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Text Diff */}
          {result.textDiff && (
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Text Comparison</h3>
              <div className="text-sm text-gray-700 mb-2">
                Files are {result.textDiff.identical ? 'identical' : 'different'} at text level
              </div>
              {result.textDiff.differences && result.textDiff.differences.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    First {Math.min(result.textDiff.differences.length, 100)} differences:
                  </div>
                  <div className="max-h-40 overflow-y-auto text-xs space-y-1">
                    {result.textDiff.differences.map((diff, index) => (
                      <div key={index} className="bg-white p-2 rounded border">
                        <div className="font-medium">Line {diff.lineNumber}</div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-red-600 font-medium">File 1:</span>
                            <div className="font-mono bg-red-50 p-1 rounded text-xs">
                              {diff.file1Line || '(empty)'}
                            </div>
                          </div>
                          <div>
                            <span className="text-green-600 font-medium">File 2:</span>
                            <div className="font-mono bg-green-50 p-1 rounded text-xs">
                              {diff.file2Line || '(empty)'}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Type: {diff.type}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* File Information */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">File Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">File 1</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Size: {getFileSize(result.fileInfo.file1.size)}</div>
                  <div>Modified: {formatDate(result.fileInfo.file1.lastModified)}</div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">File 2</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Size: {getFileSize(result.fileInfo.file2.size)}</div>
                  <div>Modified: {formatDate(result.fileInfo.file2.lastModified)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Version Decision */}
          {versionDecision && (
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Version Decision</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-700">Should create new version: </span>
                  <span className={`text-lg font-bold ${versionDecision.shouldVersion ? 'text-green-600' : 'text-red-600'}`}>
                    {versionDecision.shouldVersion ? 'Yes' : 'No'}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Similarity: </span>
                  <span className="text-sm text-gray-600">
                    {Math.round(versionDecision.similarity * 100)}%
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Reason: </span>
                  <span className="text-sm text-gray-600">
                    {versionDecision.reason}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
