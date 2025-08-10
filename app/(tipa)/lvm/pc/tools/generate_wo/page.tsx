"use client";
import React, { useState, useCallback, useRef, ChangeEvent } from "react";
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  Download,
  Settings,
  Play,
} from "lucide-react";

// Type definitions
interface CSVRow {
  [key: string]: string;
}

interface CSVData {
  headers: string[];
  data: CSVRow[];
}

interface SORequest {
  so_numbers: string[];
  chunk_size?: number;
}

interface SOResponse {
  status: string;
  message: string;
  total_so_numbers_received: number;
  estimated_processing_time_minutes: number;
}

interface APIError {
  detail: string;
}

interface ProgressState {
  isVisible: boolean;
  currentStep: number;
  totalSteps: number;
  currentChunk: number;
  totalChunks: number;
  message: string;
  percentage: number;
  estimatedTimeRemaining: number;
}

type ProcessingStatus = "idle" | "reading" | "processing" | "success" | "error";

interface UploadState {
  file: File | null;
  soNumbers: string[];
  csvPreview: CSVRow[];
  selectedColumn: string;
  status: ProcessingStatus;
  uploadStatus: string;
  errors: string[];
  apiResponse: SOResponse | null;
  isProcessing: boolean;
  progress: ProgressState;
}

const SOUploadInterface: React.FC = () => {
  // State with proper TypeScript types
  const [state, setState] = useState<UploadState>({
    file: null,
    soNumbers: [],
    csvPreview: [],
    selectedColumn: "",
    status: "idle",
    uploadStatus: "",
    errors: [],
    apiResponse: null,
    isProcessing: false,
    progress: {
      isVisible: false,
      currentStep: 0,
      totalSteps: 0,
      currentChunk: 0,
      totalChunks: 0,
      message: "",
      percentage: 0,
      estimatedTimeRemaining: 0,
    },
  });

  const updateState = useCallback((updates: Partial<UploadState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);
  const [chunkSize, setChunkSize] = useState<number>(5);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressCleanupRef = useRef<(() => void) | null>(null);

  // API Configuration
  const API_BASE_URL: string =
    process.env.NEXT_PUBLIC_API_URL || "http://10.116.2.72:8091";

  // CSV parsing function
  const parseCSV = useCallback((csvText: string): CSVData => {
    const lines = csvText.trim().split('\n');
    if (lines.length === 0) {
      throw new Error('Empty CSV file');
    }

    const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));
    const data: CSVRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        const values = line.split(',').map(value => value.trim().replace(/"/g, ''));
        const row: CSVRow = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        data.push(row);
      }
    }

    return { headers, data };
  }, []);

  // Handle column selection
  const handleColumnSelect = useCallback((columnName: string) => {
    updateState({ selectedColumn: columnName });
    
    // Extract SO numbers from the selected column
    const soNumbers = state.csvPreview
      .map(row => row[columnName])
      .filter(so => so && so.trim() !== '');
    
    updateState({ soNumbers });
  }, [state.csvPreview, updateState]);

  // Handle file upload
  const handleFileUpload = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    if (!uploadedFile.name.toLowerCase().endsWith('.csv')) {
      updateState({
        errors: ["Please select a CSV file"],
        uploadStatus: "",
        status: "error",
      });
      return;
    }

    if (uploadedFile.size > 10 * 1024 * 1024) { // 10MB limit
      updateState({
        errors: ["File size must be less than 10MB"],
        uploadStatus: "",
        status: "error",
      });
      return;
    }

    updateState({
      file: uploadedFile,
      errors: [],
      uploadStatus: "Reading file...",
      status: "reading",
    });

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csvText = event.target?.result as string;
        const { data } = parseCSV(csvText);
        
        updateState({
          csvPreview: data.slice(0, 10), // Show first 10 rows
          uploadStatus: `File loaded successfully. ${data.length} rows found.`,
          status: "idle",
        });
      } catch (error) {
        updateState({
          errors: [`Error parsing CSV: ${error instanceof Error ? error.message : 'Unknown error'}`],
          uploadStatus: "",
          status: "error",
        });
      }
    };

    reader.onerror = () => {
      updateState({
        errors: ["Error reading file"],
        uploadStatus: "",
        status: "error",
      });
    };

    reader.readAsText(uploadedFile);
  }, [parseCSV, updateState]);

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileUpload({ target: { files } } as ChangeEvent<HTMLInputElement>);
    }
  }, [handleFileUpload]);

  // Handle file input
  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileUpload(e);
    }
  };

  // Progress simulation function
  const simulateProgress = useCallback((totalChunks: number, estimatedTimeMinutes: number) => {
    let currentChunk = 0;
    let currentStep = 0;
    let interval: NodeJS.Timeout | undefined;

    const updateProgress = () => {
      if (currentStep === 0) {
        // Authentication step
        currentStep = 1;
        updateState({
          progress: {
            isVisible: true,
            currentStep: 1,
            totalSteps: 3,
            currentChunk: 0,
            totalChunks,
            message: "Authenticating with API...",
            percentage: 10,
            estimatedTimeRemaining: estimatedTimeMinutes,
          },
        });
      } else if (currentStep === 1 && currentChunk < totalChunks) {
        // Processing chunks
        currentChunk++;
        const percentage = 10 + (currentChunk / totalChunks) * 80;
        const timeRemaining = Math.max(0, estimatedTimeMinutes - (currentChunk / totalChunks) * estimatedTimeMinutes);
        
        updateState({
          progress: {
            isVisible: true,
            currentStep: 1,
            totalSteps: 3,
            currentChunk: currentChunk - 1,
            totalChunks,
            message: `Processing chunk ${currentChunk} of ${totalChunks}...`,
            percentage,
            estimatedTimeRemaining: timeRemaining,
          },
        });
      } else if (currentStep === 1 && currentChunk >= totalChunks) {
        // Finalizing step
        currentStep = 2;
        updateState({
          progress: {
            isVisible: true,
            currentStep: 2,
            totalSteps: 3,
            currentChunk: totalChunks - 1,
            totalChunks,
            message: "Finalizing processing...",
            percentage: 95,
            estimatedTimeRemaining: 0,
          },
        });
      } else if (currentStep === 2) {
        // Complete
        updateState({
          progress: {
            isVisible: true,
            currentStep: 2,
            totalSteps: 3,
            currentChunk: totalChunks - 1,
            totalChunks,
            message: "Processing completed successfully!",
            percentage: 100,
            estimatedTimeRemaining: 0,
          },
        });
        
        // Clear interval
        clearInterval(interval);
        return;
      }
    };

    // Start progress updates
    interval = setInterval(updateProgress, 1000);
    
    // Return cleanup function
    return () => {
      clearInterval(interval);
    };
  }, [updateState]);

  // Update progress helper
  const updateProgress = useCallback((updates: Partial<ProgressState>) => {
    updateState({
      progress: { ...state.progress, ...updates },
    });
  }, [state.progress, updateState]);

  const submitToAPI = async (): Promise<void> => {
    if (state.soNumbers.length === 0) {
      updateState({ errors: ["No SO numbers to process"] });
      return;
    }

    // Calculate chunks and estimated time
    const totalChunks = Math.ceil(state.soNumbers.length / chunkSize);
    const estimatedTimeMinutes = (totalChunks * 60) / 60; // 60 seconds per chunk

    updateState({
      isProcessing: true,
      errors: [],
      uploadStatus: "Sending to API...",
      status: "processing",
    });

    // Start progress simulation
    progressCleanupRef.current = simulateProgress(
      totalChunks,
      estimatedTimeMinutes
    );

    try {
      const requestBody: SORequest = {
        so_numbers: state.soNumbers,
        chunk_size: chunkSize,
      };

      const response = await fetch(`${API_BASE_URL}/api/generate-wo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData: APIError = await response.json();
        throw new Error(
          errorData.detail || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const result: SOResponse = await response.json();

      // Complete progress
      updateProgress({
        currentStep: 2,
        currentChunk: totalChunks,
        message: "Processing completed successfully!",
        percentage: 100,
        estimatedTimeRemaining: 0,
      });

      // Hide progress after a short delay
      setTimeout(() => {
        updateProgress({ isVisible: false });
      }, 2000);

      updateState({
        apiResponse: result,
        uploadStatus: "Processing started successfully!",
        status: "success",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Update progress to show error
      updateProgress({
        message: "Processing failed",
        percentage: 0,
        isVisible: false,
      });

      updateState({
        errors: [`API Error: ${errorMessage}`],
        uploadStatus: "",
        status: "error",
      });
    } finally {
      updateState({ isProcessing: false });

      // Clean up progress simulation
      if (progressCleanupRef.current) {
        progressCleanupRef.current();
        progressCleanupRef.current = null;
      }
    }
  };

  const resetForm = (): void => {
    // Clean up any running progress simulation
    if (progressCleanupRef.current) {
      progressCleanupRef.current();
      progressCleanupRef.current = null;
    }

    setState({
      file: null,
      soNumbers: [],
      csvPreview: [],
      selectedColumn: "",
      status: "idle",
      uploadStatus: "",
      errors: [],
      apiResponse: null,
      isProcessing: false,
      progress: {
        isVisible: false,
        currentStep: 0,
        totalSteps: 0,
        currentChunk: 0,
        totalChunks: 0,
        message: "",
        percentage: 0,
        estimatedTimeRemaining: 0,
      },
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const downloadTemplate = (): void => {
    const template =
      "SO_Number,Description,Status\nSO98765,Sample Order 1,Active\nSO98766,Sample Order 2,Pending\nSO98767,Sample Order 3,Complete";
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "so_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };



  const handleChunkSizeChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const value = parseInt(e.target.value) || 5;
    setChunkSize(Math.max(1, Math.min(20, value)));
  };

  const csvHeaders: string[] =
    state.csvPreview.length > 0 ? Object.keys(state.csvPreview[0]) : [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Work Order Generator
          </h1>
          <p className="text-gray-600">
            Upload CSV files and generate Work Orders from Sales Orders
          </p>
        </div>

        {/* Settings Panel */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Processing Settings</h2>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Settings className="h-4 w-4 mr-2" />
              {showSettings ? "Hide" : "Show"} Settings
            </button>
          </div>

          {showSettings && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label
                  htmlFor="chunkSize"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Chunk Size (1-20)
                </label>
                <input
                  id="chunkSize"
                  type="number"
                  min="1"
                  max="20"
                  value={chunkSize}
                  onChange={handleChunkSizeChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Number of SO numbers per processing batch
                </p>
              </div>
              <div>
                <label
                  htmlFor="apiUrl"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  API Endpoint
                </label>
                <input
                  id="apiUrl"
                  type="text"
                  value={API_BASE_URL}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Configured API base URL
                </p>
              </div>
            </div>
          )}
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
              CSV files only, up to 10MB. Select the column containing SO numbers.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />
            <div className="space-x-3">
              <label
                htmlFor="file-upload"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
              >
                Choose File
              </label>
              <button
                onClick={downloadTemplate}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </button>
            </div>
          </div>

          {state.file && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm font-medium">{state.file.name}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    ({(state.file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <button
                  onClick={resetForm}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Status Messages */}
        {(state.uploadStatus || state.errors.length > 0) && (
          <div className={`rounded-lg p-4 mb-6 ${
            state.errors.length > 0 
              ? "bg-red-50 border border-red-200" 
              : "bg-blue-50 border border-blue-200"
          }`}>
            <div className="flex items-center">
              {state.errors.length > 0 ? (
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              ) : (
                <CheckCircle className="h-5 w-5 text-blue-500 mr-2" />
              )}
              <div className="flex-1">
                {state.uploadStatus && (
                  <p className={`text-sm font-medium ${
                    state.errors.length > 0 ? "text-red-800" : "text-blue-800"
                  }`}>
                    {state.uploadStatus}
                  </p>
                )}
                {state.errors.map((error, index) => (
                  <p key={index} className="text-sm text-red-700 mt-1">
                    {error}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Column Selection */}
        {csvHeaders.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Select SO Number Column</h2>
              <div className="text-sm text-gray-500">
                <span className="font-medium">{state.csvPreview.length}</span> records loaded
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {csvHeaders.map((header) => (
                <button
                  key={header}
                  onClick={() => handleColumnSelect(header)}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                    state.selectedColumn === header
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {header}
                </button>
              ))}
            </div>

            {/* CSV Preview */}
            {state.csvPreview.length > 0 && (
              <div className="overflow-x-auto">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Data Preview
                </h3>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {csvHeaders.map((header) => (
                        <th
                          key={header}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {state.csvPreview.slice(0, 5).map((row, index) => (
                      <tr key={index}>
                        {csvHeaders.map((header) => (
                          <td
                            key={header}
                            className={`px-6 py-4 whitespace-nowrap text-sm ${
                              header === state.selectedColumn
                                ? "bg-blue-50 font-medium text-blue-900"
                                : "text-gray-900"
                            }`}
                          >
                            {row[header]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {state.csvPreview.length > 5 && (
                  <p className="text-sm text-gray-500 mt-2">
                    Showing first 5 of {state.csvPreview.length} records
                  </p>
                )}
              </div>
            )}

            <div className="mt-4">
              <button
                onClick={submitToAPI}
                disabled={!state.selectedColumn || state.isProcessing}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="h-5 w-5 mr-2" />
                {state.isProcessing ? "Processing..." : "Start Processing"}
              </button>
            </div>
          </div>
        )}

        {/* SO Numbers Summary */}
        {state.soNumbers.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                Extracted SO Numbers ({state.soNumbers.length} total)
              </h2>
              <div className="text-sm text-gray-500">
                <span className="font-medium">{state.soNumbers.length}</span> SO numbers ready for processing
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-40 overflow-y-auto mb-6">
              {state.soNumbers.slice(0, 24).map((so, index) => (
                <div
                  key={index}
                  className="px-3 py-2 bg-gray-100 rounded text-sm font-mono text-center"
                >
                  {so}
                </div>
              ))}
              {state.soNumbers.length > 24 && (
                <div className="px-3 py-2 bg-blue-100 rounded text-sm font-medium text-blue-700 text-center">
                  +{state.soNumbers.length - 24} more
                </div>
              )}
            </div>

            <div className="flex justify-center">
              <button
                onClick={submitToAPI}
                disabled={state.isProcessing}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="h-5 w-5 mr-2" />
                {state.isProcessing
                  ? "Processing..."
                  : `Generate Work Orders for ${state.soNumbers.length} SO Numbers`}
              </button>
            </div>
          </div>
        )}

        {/* Processing Progress */}
        {state.progress.isVisible && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Processing Progress</h2>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${state.progress.percentage}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              {Math.round(state.progress.percentage)}% complete - {state.progress.message}
            </p>

            {/* Progress Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-blue-700">Current Chunk</div>
                <div className="text-lg font-bold text-blue-600">
                  {state.progress.currentChunk + 1} of {state.progress.totalChunks}
                </div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-green-700">Total SO Numbers</div>
                <div className="text-lg font-bold text-green-600">
                  {state.soNumbers.length}
                </div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-purple-700">Chunk Size</div>
                <div className="text-lg font-bold text-purple-600">
                  {chunkSize}
                </div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-orange-700">Time Remaining</div>
                <div className="text-lg font-bold text-orange-600">
                  {state.progress.estimatedTimeRemaining > 0
                    ? `~${Math.round(state.progress.estimatedTimeRemaining)} min`
                    : "Almost done!"}
                </div>
              </div>
            </div>

            {/* Cancel Button */}
            <div className="flex justify-center mt-4">
              <button
                onClick={resetForm}
                className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Cancel Processing
              </button>
            </div>
          </div>
        )}

        {/* API Response */}
        {state.apiResponse && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                Processing Started Successfully
              </h2>
            </div>
            
            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {state.apiResponse.total_so_numbers_received}
                </div>
                <div className="text-sm text-gray-600">SO Numbers Processed</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {chunkSize}
                </div>
                <div className="text-sm text-gray-600">Chunk Size Used</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {state.apiResponse.estimated_processing_time_minutes}
                </div>
                <div className="text-sm text-gray-600">Estimated Time (min)</div>
              </div>
              <div className="bg-emerald-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-emerald-600">
                  {state.apiResponse.status}
                </div>
                <div className="text-sm text-gray-600">Status</div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-sm">
                <span className="font-medium text-green-800">Message:</span>{" "}
                <span className="text-green-700">{state.apiResponse.message}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SOUploadInterface;
