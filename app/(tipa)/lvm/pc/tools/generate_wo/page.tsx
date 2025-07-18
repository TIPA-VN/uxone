"use client";
import React, { useState, useCallback, useRef, ChangeEvent } from "react";
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Settings,
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressCleanupRef = useRef<(() => void) | null>(null);

  // API Configuration
  const API_BASE_URL: string =
    process.env.NEXT_PUBLIC_API_URL || "http://10.116.2.72:8091";

  const updateProgress = useCallback((updates: Partial<ProgressState>) => {
    setState((prev) => ({
      ...prev,
      progress: { ...prev.progress, ...updates },
    }));
  }, []);

  const simulateProgress = useCallback(
    (totalChunks: number, estimatedTimeMinutes: number) => {
      const totalTimeMs = estimatedTimeMinutes * 60 * 1000;
      const chunkDelayMs = 60 * 1000; // 60 seconds between chunks
      const progressSteps = [
        "Authenticating",
        "Processing chunks",
        "Finalizing",
      ];

      let currentStep = 0;
      let currentChunk = 0;
      const startTime = Date.now();

      updateProgress({
        isVisible: true,
        currentStep: 0,
        totalSteps: progressSteps.length,
        currentChunk: 0,
        totalChunks,
        message: progressSteps[0],
        percentage: 0,
        estimatedTimeRemaining: estimatedTimeMinutes,
      });

      const updateInterval = setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        const progressPercentage = Math.min(
          (elapsedTime / totalTimeMs) * 100,
          95
        );
        const timeRemainingMs = Math.max(totalTimeMs - elapsedTime, 0);
        const timeRemainingMinutes = Math.round(timeRemainingMs / (1000 * 60));

        // Update current chunk based on elapsed time
        const expectedChunk = Math.floor(elapsedTime / chunkDelayMs);
        if (expectedChunk > currentChunk && expectedChunk < totalChunks) {
          currentChunk = expectedChunk;
        }

        // Update step based on progress
        let newStep = currentStep;
        if (progressPercentage > 10 && currentStep === 0) {
          newStep = 1; // Processing chunks
        } else if (progressPercentage > 85 && currentStep === 1) {
          newStep = 2; // Finalizing
        }

        if (newStep !== currentStep) {
          currentStep = newStep;
        }

        updateProgress({
          currentStep,
          currentChunk: Math.min(currentChunk, totalChunks - 1),
          message: progressSteps[currentStep],
          percentage: progressPercentage,
          estimatedTimeRemaining: timeRemainingMinutes,
        });

        // Stop simulation when processing is complete or time is up
        if (progressPercentage >= 95 || !state.isProcessing) {
          clearInterval(updateInterval);
        }
      }, 2000); // Update every 2 seconds

      // Clean up interval when component unmounts or processing stops
      return () => clearInterval(updateInterval);
    },
    [updateProgress, state.isProcessing]
  );

  const parseCSV = useCallback((csvText: string): CSVData => {
    const lines = csvText.split("\n").filter((line) => line.trim());
    if (lines.length === 0) return { headers: [], data: [] };

    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
    const data: CSVRow[] = lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
      const row: CSVRow = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });
      return row;
    });

    return { headers, data };
  }, []);

  const extractSONumbers = useCallback(
    (data: CSVRow[], column: string): string[] => {
      if (!column || !data.length) return [];

      const numbers = data
        .map((row) => row[column])
        .filter((value): value is string => Boolean(value && value.trim()))
        .map((value) => value.trim());

      // Remove duplicates using Array.from with Set
      return Array.from(new Set(numbers));
    },
    []
  );

  const handleColumnSelect = useCallback(
    (column: string, data?: CSVRow[]) => {
      updateState({ selectedColumn: column });

      if (data) {
        const numbers = extractSONumbers(data, column);
        updateState({ soNumbers: numbers });
      } else if (state.file) {
        // Re-read file to get full data
        const reader = new FileReader();
        reader.onload = (e: ProgressEvent<FileReader>) => {
          const csvText = e.target?.result as string;
          const { data: fullData } = parseCSV(csvText);
          const numbers = extractSONumbers(fullData, column);
          updateState({ soNumbers: numbers });
        };
        reader.readAsText(state.file);
      }
    },
    [state.file, extractSONumbers, parseCSV, updateState]
  );
  // Fix for the handleFileUpload function - add handleColumnSelect to dependencies
  const handleFileUpload = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const uploadedFile = event.target.files?.[0];

      updateState({
        errors: [],
        apiResponse: null,
        status: "idle",
      });

      if (!uploadedFile) return;

      if (!uploadedFile.name.toLowerCase().endsWith(".csv")) {
        updateState({
          errors: ["Please select a valid CSV file"],
          status: "error",
        });
        return;
      }

      updateState({
        file: uploadedFile,
        uploadStatus: "Reading file...",
        status: "reading",
      });

      const reader = new FileReader();

      reader.onload = (e: ProgressEvent<FileReader>) => {
        try {
          const csvText = e.target?.result as string;
          const { headers, data } = parseCSV(csvText);

          if (headers.length === 0) {
            updateState({
              errors: ["CSV file appears to be empty"],
              uploadStatus: "",
              status: "error",
            });
            return;
          }

          const preview = data.slice(0, 5);

          // Auto-select SO column if found
          const soColumn = headers.find(
            (h) =>
              h.toLowerCase().includes("so") ||
              h.toLowerCase().includes("sales") ||
              h.toLowerCase().includes("order")
          );

          updateState({
            csvPreview: preview,
            uploadStatus: "",
            status: "success",
          });

          if (soColumn) {
            handleColumnSelect(soColumn, data);
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          updateState({
            errors: [`Error reading CSV: ${errorMessage}`],
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
    },
    [parseCSV, updateState, handleColumnSelect]
  ); // Added handleColumnSelect to dependencies

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

  const getStatusIcon = () => {
    if (state.isProcessing)
      return <Clock className="w-5 h-5 text-blue-500 animate-spin" />;
    if (state.errors.length > 0)
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    if (state.apiResponse)
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    return null;
  };

  const handleChunkSizeChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const value = parseInt(e.target.value) || 5;
    setChunkSize(Math.max(1, Math.min(20, value)));
  };

  const csvHeaders: string[] =
    state.csvPreview.length > 0 ? Object.keys(state.csvPreview[0]) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Sales Order CSV Processor
                </h1>
                <p className="text-gray-600">
                  Upload CSV files to process sales orders
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={downloadTemplate}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                type="button"
              >
                <Download className="w-4 h-4" />
                <span>Template</span>
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                type="button"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Processing Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Configured API base URL
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {state.progress.isVisible && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-500 animate-spin" />
              <span>Processing Sales Orders</span>
            </h2>

            <div className="space-y-4">
              {/* Main Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{state.progress.message}</span>
                  <span>{Math.round(state.progress.percentage)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${Math.min(state.progress.percentage, 100)}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Step Progress */}
              <div className="flex items-center space-x-4">
                {["Authenticating", "Processing chunks", "Finalizing"].map(
                  (step, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          index < state.progress.currentStep
                            ? "bg-green-500 text-white"
                            : index === state.progress.currentStep
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        {index < state.progress.currentStep ? "✓" : index + 1}
                      </div>
                      <span
                        className={`text-sm ${
                          index <= state.progress.currentStep
                            ? "text-gray-900"
                            : "text-gray-500"
                        }`}
                      >
                        {step}
                      </span>
                      {index < 2 && (
                        <div
                          className={`w-8 h-0.5 ${
                            index < state.progress.currentStep
                              ? "bg-green-500"
                              : "bg-gray-200"
                          }`}
                        ></div>
                      )}
                    </div>
                  )
                )}
              </div>

              {/* Chunk Progress */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="font-medium text-blue-700">Current Chunk</div>
                  <div className="text-blue-600">
                    {state.progress.currentChunk + 1} of{" "}
                    {state.progress.totalChunks}
                  </div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="font-medium text-green-700">SO Numbers</div>
                  <div className="text-green-600">
                    {state.soNumbers.length} total
                  </div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="font-medium text-purple-700">
                    Time Remaining
                  </div>
                  <div className="text-purple-600">
                    {state.progress.estimatedTimeRemaining > 0
                      ? `~${state.progress.estimatedTimeRemaining} min`
                      : "Almost done!"}
                  </div>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="font-medium text-orange-700">Chunk Size</div>
                  <div className="text-orange-600">{chunkSize} SO numbers</div>
                </div>
              </div>

              {/* Cancel Button */}
              <div className="flex justify-center">
                <button
                  onClick={resetForm}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  type="button"
                >
                  Cancel Processing
                </button>
              </div>
            </div>
          </div>
        )}

        {/* File Upload */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Upload CSV File</h2>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-700">
                {state.file
                  ? state.file.name
                  : "Drop your CSV file here or click to browse"}
              </p>
              <p className="text-sm text-gray-500">
                CSV files only, up to 10MB
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="mt-4 space-x-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                type="button"
              >
                Choose File
              </button>
              {state.file && (
                <button
                  onClick={resetForm}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  type="button"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Status Messages */}
          {(state.uploadStatus || state.errors.length > 0) && (
            <div className="mt-4 p-4 rounded-lg border">
              <div className="flex items-center space-x-2">
                {getStatusIcon()}
                <div className="flex-1">
                  {state.uploadStatus && (
                    <p className="text-sm font-medium text-gray-700">
                      {state.uploadStatus}
                    </p>
                  )}
                  {state.errors.map((error, index) => (
                    <p key={index} className="text-sm text-red-600">
                      {error}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Column Selection */}
        {csvHeaders.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">
              Select SO Number Column
            </h2>
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
                  type="button"
                >
                  {header}
                </button>
              ))}
            </div>

            {/* CSV Preview */}
            {state.csvPreview.length > 0 && (
              <div className="overflow-x-auto">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Preview (first 5 rows):
                </h3>
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {csvHeaders.map((header) => (
                        <th
                          key={header}
                          className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {state.csvPreview.map((row, index) => (
                      <tr key={index}>
                        {csvHeaders.map((header) => (
                          <td
                            key={header}
                            className={`px-3 py-2 whitespace-nowrap ${
                              header === state.selectedColumn
                                ? "bg-blue-50 font-medium"
                                : ""
                            }`}
                          >
                            {row[header]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* SO Numbers Summary */}
        {state.soNumbers.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">
              Extracted SO Numbers ({state.soNumbers.length} total)
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-40 overflow-y-auto">
              {state.soNumbers.map((so, index) => (
                <div
                  key={index}
                  className="px-3 py-2 bg-gray-100 rounded text-sm font-mono text-center"
                >
                  {so}
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-center">
              <button
                onClick={submitToAPI}
                disabled={state.isProcessing}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                type="button"
              >
                {state.isProcessing
                  ? "Processing..."
                  : `Process ${state.soNumbers.length} SO Numbers`}
              </button>
            </div>
          </div>
        )}

        {/* API Response */}
        {state.apiResponse && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>Processing Started Successfully</span>
            </h2>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Status:</span>{" "}
                  {state.apiResponse.status}
                </div>
                <div>
                  <span className="font-medium">SO Numbers Processed:</span>{" "}
                  {state.apiResponse.total_so_numbers_received}
                </div>
                <div>
                  <span className="font-medium">Estimated Time:</span>{" "}
                  {state.apiResponse.estimated_processing_time_minutes} minutes
                </div>
                <div>
                  <span className="font-medium">Chunk Size Used:</span>{" "}
                  {chunkSize}
                </div>
              </div>
              <div className="mt-3">
                <span className="font-medium">Message:</span>{" "}
                {state.apiResponse.message}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SOUploadInterface;
