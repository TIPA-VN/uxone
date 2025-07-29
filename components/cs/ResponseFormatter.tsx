'use client';
import React from 'react';

interface ResponseFormatterProps {
  content: string;
  isDarkMode: boolean;
}

interface CardProps {
  content: string;
  isDarkMode: boolean;
}

// New interface for the API response format
interface ApiResponse {
  urgency?: string;
  output?: string;
  confidence?: number;
}

const CustomerInformationCard: React.FC<CardProps> = ({ content, isDarkMode }) => {
  return (
    <div className={`p-4 rounded-lg border ${
      isDarkMode 
        ? 'bg-gray-800 border-gray-700 text-white' 
        : 'bg-white border-gray-200 text-gray-900'
    }`}>
      <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
        👤 Customer Information
      </h3>
      <div 
        className="text-sm leading-relaxed"
        dangerouslySetInnerHTML={{ __html: content || 'No customer information available' }}
      />
    </div>
  );
};

const LineItemDetailsCard: React.FC<CardProps> = ({ content, isDarkMode }) => {
  return (
    <div className={`p-4 rounded-lg border ${
      isDarkMode 
        ? 'bg-gray-800 border-gray-700 text-white' 
        : 'bg-white border-gray-200 text-gray-900'
    }`}>
      <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
        📦 Line Item Details
      </h3>
      <div 
        className="text-sm leading-relaxed"
        dangerouslySetInnerHTML={{ __html: content || 'No line item details available' }}
      />
    </div>
  );
};

const OrderSummaryCard: React.FC<CardProps> = ({ content, isDarkMode }) => {
  return (
    <div className={`p-4 rounded-lg border ${
      isDarkMode 
        ? 'bg-gray-800 border-gray-700 text-white' 
        : 'bg-white border-gray-200 text-gray-900'
    }`}>
      <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
        📊 Order Summary
      </h3>
      <div 
        className="text-sm leading-relaxed"
        dangerouslySetInnerHTML={{ __html: content || 'No order summary available' }}
      />
    </div>
  );
};

const GeneralCard: React.FC<CardProps> = ({ content, isDarkMode }) => {
  return (
    <div className={`p-4 rounded-lg border ${
      isDarkMode 
        ? 'bg-gray-800 border-gray-700 text-white' 
        : 'bg-white border-gray-200 text-gray-900'
    }`}>
      <div 
        className="text-sm leading-relaxed"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
};

// New component for API response format
const ApiResponseCard: React.FC<{ response: ApiResponse; isDarkMode: boolean }> = ({ response, isDarkMode }) => {
  const formatMarkdown = (text: string): string => {
    return text
      .replace(/^## \*\*(.*?)\*\*/gm, '<h2 class="text-lg font-bold mb-4 text-blue-600">$1</h2>')
      .replace(/^### \*\*(.*?)\*\*/gm, '<h3 class="text-base font-semibold mb-3 text-blue-500">$1</h3>')
      .replace(/^## (.*)/gm, '<h2 class="text-lg font-bold mb-4 text-blue-600">$1</h2>')
      .replace(/^### (.*)/gm, '<h3 class="text-base font-semibold mb-3 text-blue-500">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/---/g, '<hr class="my-4 border-t border-current opacity-20" />')
      .replace(/\n/g, '<br />');
  };

  const getUrgencyColor = (urgency?: string) => {
    switch (urgency?.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-100 border-red-300';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-300';
      case 'low': return 'text-green-600 bg-green-100 border-green-300';
      default: return 'text-gray-600 bg-gray-100 border-gray-300';
    }
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-600 bg-gray-100 border-gray-300';
    if (confidence >= 0.8) return 'text-green-600 bg-green-100 border-green-300';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100 border-yellow-300';
    return 'text-red-600 bg-red-100 border-red-300';
  };

  return (
    <div className={`p-4 rounded-lg border shadow-sm ${
      isDarkMode 
        ? 'bg-gray-800 border-gray-700 text-white' 
        : 'bg-white border-gray-200 text-gray-900'
    }`}>
      {/* Header with metadata */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getUrgencyColor(response.urgency)}`}>
            {response.urgency?.toUpperCase() || 'UNKNOWN'} URGENCY
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getConfidenceColor(response.confidence)}`}>
            {response.confidence ? `${Math.round(response.confidence * 100)}%` : 'N/A'} CONFIDENCE
          </div>
        </div>
        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          📊 Sales Activity Report
        </div>
      </div>

      {/* Content */}
      <div 
        className="text-sm leading-relaxed"
        dangerouslySetInnerHTML={{ 
          __html: response.output ? formatMarkdown(response.output) : 'No content available' 
        }}
      />
    </div>
  );
};

// Use Array<Record<string, unknown>> for table data
const renderTable = (dataArray: Array<Record<string, unknown>>, isDarkMode: boolean) => {
  if (!Array.isArray(dataArray) || dataArray.length === 0) return <div>No data available.</div>;
  const headers = Object.keys(dataArray[0]);
  return (
    <div className={`overflow-x-auto rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-3 py-2 text-xs font-semibold uppercase tracking-wider border-b border-gray-300">
                {header.replace(/_/g, ' ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataArray.map((row, idx) => (
            <tr key={idx} className={idx % 2 === 0 ? (isDarkMode ? 'bg-gray-900' : 'bg-gray-50') : ''}>
              {headers.map((header) => (
                <td key={header} className="px-3 py-2 text-xs border-b border-gray-200">
                  {row[header] !== undefined && row[header] !== null ? row[header]?.toString() : ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ResponseFormatter: React.FC<ResponseFormatterProps> = ({ content, isDarkMode }) => {
  
  // First, try to parse as the new API response format
  let apiResponse: ApiResponse | null = null;
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === 'object' && 'output' in parsed) {
      apiResponse = parsed as ApiResponse;
    }
  } catch {
    // Not the new format, continue with existing logic
  }

  // If it's the new API response format, render it
  if (apiResponse) {
    return <ApiResponseCard response={apiResponse} isDarkMode={isDarkMode} />;
  }

  // Try to parse content as JSON and extract structured_data (existing logic)
  let parsed: unknown = null;
  let structuredData: unknown = null;
  try {
    parsed = JSON.parse(content);
    if (
      parsed &&
      typeof parsed === 'object' &&
      'structured_data' in parsed &&
      (parsed as Record<string, unknown>).structured_data
    ) {
      structuredData = (parsed as Record<string, { structured_data?: unknown }>).structured_data;
    }
  } catch {
    // Not JSON, fallback to original logic
  }

  // If structured_data.sales_orders is present and is an array, render as table
  if (
    structuredData &&
    typeof structuredData === 'object' &&
    'sales_orders' in structuredData &&
    Array.isArray((structuredData as Record<string, unknown>).sales_orders)
  ) {
    const salesOrdersArr = (structuredData as Record<string, unknown>).sales_orders as Array<Record<string, unknown>>;
    const answer = (structuredData as Record<string, unknown>).answer as string | undefined;
    return (
      <div className="space-y-4">
        {answer && (
          <div className={`p-2 rounded font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{answer}</div>
        )}
        {renderTable(salesOrdersArr, isDarkMode)}
      </div>
    );
  }

  const formatHeaders = (text: string): string => {
    return text
      .replace(/^## \*\*(.*?)\*\*/gm, '<h2 class="text-lg font-bold mb-4">$1</h2>')
      .replace(/^### \*\*(.*?)\*\*/gm, '<h3 class="text-base font-semibold mb-3">$1</h3>')
      .replace(/^## (.*)/gm, '<h2 class="text-lg font-bold mb-4">$1</h2>')
      .replace(/^### (.*)/gm, '<h3 class="text-base font-semibold mb-3">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/---/g, '<hr class="my-4 border-t border-current opacity-20" />');
  };

  const extractSectionContent = (content: string, sectionKeywords: string[]): string => {
    const lines = content.split('\n');
    const sectionLines: string[] = [];
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (sectionKeywords.some(keyword => lowerLine.includes(keyword.toLowerCase()))) {
        sectionLines.push(line);
      }
    }
    return sectionLines.join('\n');
  };

  const customerKeywords = ['customer', 'buyer', 'contact', 'address', 'phone', 'email', 'company'];
  const lineItemKeywords = ['item', 'product', 'quantity', 'units', 'price', 'cost', 'sku', 'description'];
  const orderSummaryKeywords = ['total', 'subtotal', 'tax', 'shipping', 'order', 'status', 'date', 'number'];

  const customerContent = extractSectionContent(content, customerKeywords);
  const lineItemContent = extractSectionContent(content, lineItemKeywords);
  const orderSummaryContent = extractSectionContent(content, orderSummaryKeywords);

  // Check if we have meaningful content in at least 2 sections
  const sectionsWithContent = [customerContent, lineItemContent, orderSummaryContent].filter(section => section.trim().length > 0);
  const shouldUseSectionedTemplate = sectionsWithContent.length >= 2;

  if (!shouldUseSectionedTemplate) {
    // Display as single general card with all content
    return (
      <div className="text-sm leading-relaxed">
        <GeneralCard 
          content={formatHeaders(content)} 
          isDarkMode={isDarkMode} 
        />
      </div>
    );
  }

  // Use the three-section template
  return (
    <div className="text-sm leading-relaxed space-y-4">
      <CustomerInformationCard 
        content={formatHeaders(customerContent)} 
        isDarkMode={isDarkMode} 
      />
      
      <LineItemDetailsCard 
        content={formatHeaders(lineItemContent)} 
        isDarkMode={isDarkMode} 
      />
      
      <OrderSummaryCard 
        content={formatHeaders(orderSummaryContent)} 
        isDarkMode={isDarkMode} 
      />
    </div>
  );
};

export default ResponseFormatter;