"use client";
import React, { useState, useCallback } from "react";
import {
  Upload,
  FileText,
  Play,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
} from "lucide-react";

// Types
interface SORecord {
  SO: string;
  Request_date: string;
}

interface FailedWorkOrder {
  failed_wo?: {
    wo_number?: string;
    so_number?: string;
  };
  wo_number?: string;
  so_number?: string;
  error?: string;
}

interface BatchResult {
  batch: number;
  status: string;
  response?: {
    failed_work_orders?: (string | FailedWorkOrder)[];
    batch_failed_count?: number;
    batch_success_count?: number;
    processed_sos?: string[];
    [key: string]: unknown;
  };
}

interface ProcessingStats {
  totalBatches: number;
  completedBatches: number;
  successfulBatches: number;
  failedBatches: number;
  totalRecords: number;
  uniqueRecords: number;
  duplicatesRemoved: number;
  failedRecords: string[];
  successfulRecords: number;
  processedSOs: string[];
}

const SOProcessorPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<SORecord[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [results, setResults] = useState<BatchResult[]>([]);
  const [stats, setStats] = useState<ProcessingStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);

  // API Configuration
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://10.116.2.72:8091/api/process-wo-request-dates";
  const batchSize = 10;

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      setFile(files[0]);
      setError(null);
      setParseWarnings([]);
    }
  }, []);

  // Handle file input
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setParseWarnings([]);
    }
  };

  // Parse a single CSV row handling quotes and commas
  const parseCSVRow = (row: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < row.length) {
      const char = row[i];

      if (char === '"') {
        if (inQuotes && row[i + 1] === '"') {
          // Handle escaped quote
          current += '"';
          i += 2;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        result.push(current.trim());
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }

    // Add the last field
    result.push(current.trim());
    return result;
  };

  // Robust CSV parsing
  const parseCSV = (csvText: string): { data: SORecord[]; warnings: string[] } => {
    const warnings: string[] = [];
    
    // Normalize line endings and remove BOM if present
    const normalizedText = csvText.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // Split into lines and filter out empty lines
    const lines = normalizedText.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length === 0) {
      throw new Error('CSV file is empty');
    }

    // Parse header row
    const headerLine = lines[0];
    const headers = parseCSVRow(headerLine).map(h => h.trim().toLowerCase());

    // Find column indices (case-insensitive)
    const soIndex = headers.findIndex(h => h === 'so');
    const requestDateIndex = headers.findIndex(h => h === 'request_date' || h === 'request date');

    if (soIndex === -1) {
      throw new Error('CSV must contain a "SO" column');
    }
    if (requestDateIndex === -1) {
      throw new Error('CSV must contain a "Request_date" column');
    }

    const data: SORecord[] = [];
    const seenRecords = new Set<string>();
    let skippedRows = 0;

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const values = parseCSVRow(line);
        
        if (values.length <= Math.max(soIndex, requestDateIndex)) {
          warnings.push(`Row ${i + 1}: Insufficient columns (expected at least ${Math.max(soIndex, requestDateIndex) + 1}, got ${values.length})`);
          skippedRows++;
          continue;
        }

        const so = values[soIndex]?.trim();
        const requestDate = values[requestDateIndex]?.trim();

        if (!so || !requestDate) {
          warnings.push(`Row ${i + 1}: Missing SO or Request_date (SO: "${so}", Date: "${requestDate}")`);
          skippedRows++;
          continue;
        }

        // Check for duplicates based on SO and Request_date combination
        const recordKey = `${so.toUpperCase()}|${requestDate}`;
        if (seenRecords.has(recordKey)) {
          warnings.push(`Row ${i + 1}: Duplicate record (SO: ${so}, Date: ${requestDate})`);
          skippedRows++;
          continue;
        }

        seenRecords.add(recordKey);
        data.push({
          SO: so,
          Request_date: requestDate,
        });
      } catch (error) {
        warnings.push(`Row ${i + 1}: Parse error - ${error}`);
        skippedRows++;
      }
    }

    if (data.length === 0) {
      throw new Error('No valid records found in CSV file');
    }

    
    return { data, warnings };
  };

  // Upload and parse CSV
  const uploadCSV = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setParseWarnings([]);

    try {
      const text = await file.text();
      const { data, warnings } = parseCSV(text);
      
      setCsvData(data);
      setParseWarnings(warnings);
      

      if (warnings.length > 0) {
        
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse CSV");
    } finally {
      setIsUploading(false);
    }
  };

  // Process batches
  const processData = async () => {
    if (csvData.length === 0) return;

    setIsProcessing(true);
    setError(null);
    setResults([]);
    setProcessingProgress(0);

    const totalBatches = Math.ceil(csvData.length / batchSize);
    const batchResults: BatchResult[] = [];
    const allFailedRecords = new Set<string>(); // Use Set to prevent duplicates
    const processedSOs = new Set<string>(); // Track processed SOs

    try {
      for (let i = 0; i < csvData.length; i += batchSize) {
        const batch = csvData.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;

        // Filter out SOs that have already been processed successfully
        const uniqueBatch = batch.filter(row => !processedSOs.has(row.SO));
        
        if (uniqueBatch.length === 0) {
  
          continue;
        }

        const soUpdates = uniqueBatch.map((row) => ({
          so_number: String(row.SO),
          new_request_date: String(row.Request_date),
        }));

        const payload = { so_updates: soUpdates };

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        try {
          const response = await fetch(apiUrl, {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const respJson = await response.json();
          
          // Handle different possible response structures for failed WOs
          let failedWOs: string[] = [];
          
          if (respJson.failed_work_orders) {
            if (Array.isArray(respJson.failed_work_orders)) {
              failedWOs = respJson.failed_work_orders.map((item: string | FailedWorkOrder) => {
                // Handle different formats: strings, objects with failed_wo, etc.
                if (typeof item === 'string') {
                  return item;
                } else if (item && typeof item === 'object') {
                  // Extract the most relevant identifier from the object
                  return item.failed_wo?.wo_number || 
                         item.failed_wo?.so_number || 
                         item.wo_number || 
                         item.so_number ||
                         JSON.stringify(item); // Fallback to full object as string
                }
                return String(item);
              });
            }
          }

          // Add failed WOs to our set (automatically deduplicates)
          failedWOs.forEach(wo => {
            if (wo && wo.trim() !== '') {
              allFailedRecords.add(wo.trim());
            }
          });

          // Calculate batch success count properly
          const batchSuccessCount = Math.max(0, uniqueBatch.length - failedWOs.length);

          // Mark successfully processed SOs (those not in failed list)
          uniqueBatch.forEach(row => {
            const isRowFailed = failedWOs.some(failed => 
              failed.includes(row.SO) || failed.includes(row.SO.padStart(8, '0'))
            );
            if (!isRowFailed) {
              processedSOs.add(row.SO);
            }
          });

          batchResults.push({
            batch: batchNumber,
            status: "success",
            response: {
              ...respJson,
              batch_failed_count: failedWOs.length,
              batch_success_count: batchSuccessCount,
              processed_sos: uniqueBatch.map(r => r.SO)
            },
          });

  

        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          
          // Mark the entire batch as failed
          uniqueBatch.forEach(row => {
            allFailedRecords.add(row.SO);
          });

          batchResults.push({
            batch: batchNumber,
            status: `error: ${errorMessage}`,
            response: {
              batch_failed_count: uniqueBatch.length,
              batch_success_count: 0,
              processed_sos: uniqueBatch.map(r => r.SO)
            }
          });
        }

        setProcessingProgress((batchNumber / totalBatches) * 100);
        setResults([...batchResults]);

        // Add delay between batches (except for the last batch)
        if (i + batchSize < csvData.length) {
          await new Promise((resolve) => setTimeout(resolve, 2500));
        }
      }

      // Calculate final stats
      const successfulBatches = batchResults.filter(
        (r) => r.status === "success"
      ).length;
      const failedBatches = batchResults.filter(
        (r) => r.status !== "success"
      ).length;

      // Calculate total successful records correctly
      const totalSuccessfulRecords = batchResults.reduce((sum, batch) => {
        if (batch.status === "success" && batch.response?.batch_success_count) {
          return sum + batch.response.batch_success_count;
        }
        return sum;
      }, 0);

      // Alternative calculation: total processed SOs minus failed ones
      const alternativeSuccessCount = Math.max(0, csvData.length - allFailedRecords.size);

      setStats({
        totalBatches,
        completedBatches: batchResults.length,
        successfulBatches,
        failedBatches,
        totalRecords: csvData.length,
        uniqueRecords: csvData.length,
        duplicatesRemoved: parseWarnings.filter(w => w.includes('Duplicate')).length,
        failedRecords: Array.from(allFailedRecords), // Convert Set back to Array
        successfulRecords: Math.max(totalSuccessfulRecords, alternativeSuccessCount), // Use the higher of the two calculations
        processedSOs: Array.from(processedSOs)
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : "Processing failed");
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper function to escape CSV fields
  const escapeCSVField = (field: string): string => {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  };

  // Download results as CSV
  const downloadResults = () => {
    if (!stats) return;

    const csvRows: string[] = [];
    
    // Add summary stats at the top
    csvRows.push("Processing Summary");
    csvRows.push("Metric,Value");
    csvRows.push(`Total Batches,${stats.totalBatches}`);
    csvRows.push(`Successful Batches,${stats.successfulBatches}`);
    csvRows.push(`Failed Batches,${stats.failedBatches}`);
    csvRows.push(`Total Records,${stats.totalRecords}`);
    csvRows.push(`Successful Records,${stats.successfulRecords}`);
    csvRows.push(`Failed Records,${stats.failedRecords.length}`);
    csvRows.push(`Duplicates Removed,${stats.duplicatesRemoved}`);
    csvRows.push("");
    
    // Add batch results
    csvRows.push("Batch Results");
    csvRows.push("Batch Number,Status,Success Count,Failed Count,Notes");
    
    results.forEach(result => {
      const successCount = result.response?.batch_success_count || 0;
      const failedCount = result.response?.batch_failed_count || 0;
      const notes = result.status === "success" ? "Success" : result.status;
      
      csvRows.push(`${result.batch},${escapeCSVField(result.status)},${successCount},${failedCount},${escapeCSVField(notes)}`);
    });
    
    csvRows.push("");
    
    // Add failed records section
    if (stats.failedRecords.length > 0) {
      csvRows.push("Failed Records");
      csvRows.push("Record ID,Details");
      
      stats.failedRecords.forEach((record, index) => {
        const recordStr = typeof record === 'string' ? record : JSON.stringify(record);
        csvRows.push(`${index + 1},${escapeCSVField(recordStr)}`);
      });
      
      csvRows.push("");
    }
    
    // Add successful records section
    if (stats.processedSOs.length > 0) {
      csvRows.push("Successfully Processed SOs");
      csvRows.push("SO Number");
      
      stats.processedSOs.forEach(so => {
        csvRows.push(escapeCSVField(so));
      });
      
      csvRows.push("");
    }
    
    // Add parse warnings if any
    if (parseWarnings.length > 0) {
      csvRows.push("Parse Warnings");
      csvRows.push("Warning");
      
      parseWarnings.forEach(warning => {
        csvRows.push(escapeCSVField(warning));
      });
    }

    // Create CSV content
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const exportFileDefaultName = `so-processing-results-${
      new Date().toISOString().split("T")[0]
    }.csv`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", url);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
    
    // Clean up
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            SO Request Date Processor
          </h1>
          <p className="text-gray-600">
            Upload CSV files and process Sales Order request date updates
          </p>
        </div>

        {/* File Upload Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Upload CSV File</h2>

          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onDragEnter={() => setDragActive(true)}
            onDragLeave={() => setDragActive(false)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Drop your CSV file here, or click to browse
            </p>
            <p className="text-sm text-gray-500 mb-4">
              CSV must contain &apos;SO&apos; and &apos;Request_date&apos; columns
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
            >
              Choose File
            </label>
          </div>

          {file && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm font-medium">{file.name}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <button
                  onClick={uploadCSV}
                  disabled={isUploading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? "Parsing..." : "Parse CSV"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Parse Warnings */}
        {parseWarnings.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center mb-2">
              <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
              <span className="font-medium text-yellow-800">
                Parse Warnings ({parseWarnings.length})
              </span>
            </div>
            <div className="max-h-32 overflow-y-auto">
              {parseWarnings.slice(0, 10).map((warning, index) => (
                <p key={index} className="text-sm text-yellow-700">
                  {warning}
                </p>
              ))}
              {parseWarnings.length > 10 && (
                <p className="text-sm text-yellow-600 mt-2">
                  ... and {parseWarnings.length - 10} more warnings
                </p>
              )}
            </div>
          </div>
        )}

        {/* Data Preview */}
        {csvData.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Data Preview</h2>
              <div className="text-sm text-gray-500">
                <span className="font-medium">{csvData.length}</span> unique records loaded
                {parseWarnings.filter(w => w.includes('Duplicate')).length > 0 && (
                  <span className="ml-2 text-yellow-600">
                    ({parseWarnings.filter(w => w.includes('Duplicate')).length} duplicates removed)
                  </span>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SO
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Request Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {csvData.slice(0, 5).map((row, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row.SO}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row.Request_date}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {csvData.length > 5 && (
              <p className="text-sm text-gray-500 mt-2">
                Showing first 5 of {csvData.length} records
              </p>
            )}

            <div className="mt-4">
              <button
                onClick={processData}
                disabled={isProcessing}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="h-5 w-5 mr-2" />
                {isProcessing ? "Processing..." : "Start Processing"}
              </button>
            </div>
          </div>
        )}

        {/* Processing Progress */}
        {isProcessing && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Processing Progress</h2>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${processingProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">
              {Math.round(processingProgress)}% complete
            </p>
          </div>
        )}

        {/* Results Section */}
        {results.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Processing Results</h2>
              {stats && (
                <button
                  onClick={downloadResults}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download CSV Report
                </button>
              )}
            </div>

            {/* Stats Summary */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.totalBatches}
                  </div>
                  <div className="text-sm text-gray-600">Total Batches</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.successfulBatches}
                  </div>
                  <div className="text-sm text-gray-600">Successful Batches</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {stats.failedBatches}
                  </div>
                  <div className="text-sm text-gray-600">Failed Batches</div>
                </div>
                <div className="bg-emerald-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-emerald-600">
                    {stats.successfulRecords}
                  </div>
                  <div className="text-sm text-gray-600">Successful SOs</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {stats.failedRecords.length}
                  </div>
                  <div className="text-sm text-gray-600">Failed Records</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {stats.duplicatesRemoved}
                  </div>
                  <div className="text-sm text-gray-600">Duplicates Removed</div>
                </div>
              </div>
            )}

            {/* Batch Results */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((result) => (
                <div
                  key={result.batch}
                  className={`p-3 rounded-lg border ${
                    result.status === "success"
                      ? "border-green-200 bg-green-50"
                      : "border-red-200 bg-red-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {result.status === "success" ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mr-2" />
                      )}
                      <span className="font-medium">Batch {result.batch}</span>
                      {result.response && (
                        <span className="ml-3 text-sm text-gray-600">
                          ({result.response.batch_success_count || 0} success, {result.response.batch_failed_count || 0} failed)
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {result.status === "success" ? "Success" : "Failed"}
                    </span>
                  </div>
                  {result.status !== "success" && (
                    <p className="text-sm text-red-600 mt-1">{result.status}</p>
                  )}
                  {result.response?.failed_work_orders &&
                    Array.isArray(result.response.failed_work_orders) && 
                    result.response.failed_work_orders.length > 0 && (
                      <div className="text-sm text-yellow-600 mt-1">
                        <p className="font-medium">Failed WOs:</p>
                        <div className="mt-1 max-h-24 overflow-y-auto">
                          {result.response.failed_work_orders.slice(0, 5).map((failedWO: string | FailedWorkOrder, index: number) => {
                            // Handle different object structures safely
                            let displayText = "";
                            let woNumber = "";
                            let soNumber = "";
                            let errorMsg = "";

                            if (typeof failedWO === 'string') {
                              displayText = failedWO;
                            } else if (failedWO && typeof failedWO === 'object') {
                              // Extract values safely
                              woNumber = failedWO.failed_wo?.wo_number || failedWO.wo_number || "";
                              soNumber = failedWO.failed_wo?.so_number || failedWO.so_number || "";
                              errorMsg = failedWO.error || "";
                              
                              // Special handling for JDE API errors
                              if (errorMsg.includes("API error:")) {
                                try {
                                  const apiErrorMatch = errorMsg.match(/API error: (.+)/);
                                  if (apiErrorMatch) {
                                    const apiErrorObj = JSON.parse(apiErrorMatch[1]);
                                    if (apiErrorObj.message) {
                                      errorMsg = `JDE Error: ${apiErrorObj.message}`;
                                    }
                                  }
                                } catch {

                                  // Keep original error if JSON parsing fails
                                }
                              }
                              
                              if (woNumber || soNumber || errorMsg) {
                                displayText = `WO: ${woNumber || 'N/A'}${soNumber ? `, SO: ${soNumber}` : ''}`;
                                if (errorMsg) {
                                  displayText += `\nError: ${errorMsg}`;
                                }
                              } else {
                                // Fallback for unknown object structure
                                displayText = `Failed Object: ${Object.keys(failedWO).join(', ')}`;
                              }
                            } else {
                              displayText = String(failedWO || 'Unknown');
                            }

                            return (
                              <div key={index} className="text-xs bg-yellow-100 p-2 rounded mb-1">
                                <pre className="whitespace-pre-wrap font-mono text-red-600">
                                  {displayText}
                                </pre>
                              </div>
                            );
                          })}
                          {result.response.failed_work_orders.length > 5 && (
                            <p className="text-xs text-yellow-700 mt-1">
                              ... and {result.response.failed_work_orders.length - 5} more failed WOs
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                </div>
              ))}
            </div>

            {/* Failed Records Summary */}
            {stats && stats.failedRecords.length > 0 && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="font-semibold text-red-800 mb-2">
                  All Failed Records Summary ({stats.failedRecords.length})
                </h3>
                <div className="max-h-40 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {stats.failedRecords.slice(0, 10).map((record, index) => {
                      // Safely convert record to string
                      const recordStr = typeof record === 'string' ? record : JSON.stringify(record, null, 2);
                      const isLongRecord = recordStr.length > 50;
                      
                      return (
                        <div key={index} className="text-sm bg-red-100 p-2 rounded">
                          {isLongRecord ? (
                            <details>
                              <summary className="cursor-pointer text-red-700 font-medium">
                                Failed Record #{index + 1} (click to expand)
                              </summary>
                              <pre className="text-xs text-red-600 mt-1 whitespace-pre-wrap">
                                {recordStr}
                              </pre>
                            </details>
                          ) : (
                            <span className="text-red-700">{recordStr}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {stats.failedRecords.length > 10 && (
                    <p className="text-sm text-red-600 mt-2 text-center">
                      ... and {stats.failedRecords.length - 10} more failed records
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="font-medium text-red-800">Error</span>
            </div>
            <p className="text-red-700 mt-2">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SOProcessorPage;