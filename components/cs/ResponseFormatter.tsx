'use client';
import React from 'react';
import SalesOrderCard from './SalesOrderCard';
import MetricCard from './MetricCard';
import ToolCard from './ToolCard';
import InfoCard from './InfoCard';

interface ResponseFormatterProps {
  content: string;
  isDarkMode: boolean;
}

interface ParsedSalesOrder {
  orderNumber: string;
  quantity: string;
  item: string;
  price: string;
  cost: string;
  status: string;
  changes?: string;
}

interface ParsedMetric {
  label: string;
  value: string;
}

interface ParsedTool {
  name: string;
  description: string;
}

const ResponseFormatter: React.FC<ResponseFormatterProps> = ({ content, isDarkMode }) => {
  
  const detectContentType = (text: string): 'sales_orders' | 'tools' | 'metrics' | 'general' => {
    if (text.includes('Sales Order') || text.includes('SO ')) return 'sales_orders';
    if (text.includes('tools available') || text.includes('Search Sales Orders')) return 'tools';
    if (text.includes('Total Orders') || text.includes('Overview')) return 'metrics';
    return 'general';
  };

  const parseSalesOrders = (text: string): ParsedSalesOrder[] => {
    const orders: ParsedSalesOrder[] = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      const soMatch = line.match(/SO (\d+)/);
      if (soMatch) {
        const orderNumber = soMatch[1];
        
        // Extract details using regex patterns
        const quantityMatch = line.match(/(\d+)\s+units?/);
        const itemMatch = line.match(/"([^"]+)"/);
        const priceMatch = line.match(/price\s+(\$?[\d,]+\.?\d*)/);
        const costMatch = line.match(/cost\s+(\$?[\d,]+\.?\d*)/);
        
        const order: ParsedSalesOrder = {
          orderNumber,
          quantity: quantityMatch ? quantityMatch[1] + ' units' : '',
          item: itemMatch ? itemMatch[1] : '',
          price: priceMatch ? (priceMatch[1].startsWith('$') ? priceMatch[1] : '$' + priceMatch[1]) : '',
          cost: costMatch ? (costMatch[1].startsWith('$') ? costMatch[1] : '$' + costMatch[1]) : '',
          status: line.includes('backordered') ? '⚠️ 100% Backordered' : '',
          changes: line.includes('change') ? 'Order has changes' : undefined
        };
        
        orders.push(order);
      }
    }
    
    return orders;
  };

  const parseMetrics = (text: string): ParsedMetric[] => {
    const metrics: ParsedMetric[] = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      // Look for lines starting with "- **" or "**" that contain metrics
      const metricMatch = line.match(/^-?\s*\*\*([^*]+)\*\*:?\s*(.+)/);
      if (metricMatch) {
        metrics.push({
          label: metricMatch[1].trim(),
          value: metricMatch[2].trim()
        });
      }
    }
    
    return metrics;
  };

  const parseTools = (text: string): ParsedTool[] => {
    const tools: ParsedTool[] = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      const toolMatch = line.match(/\*\*\*(.+?)\*\*\*:\s*(.+)/);
      if (toolMatch) {
        tools.push({
          name: toolMatch[1].trim(),
          description: toolMatch[2].trim()
        });
      }
    }
    
    return tools;
  };

  const formatHeaders = (text: string): string => {
    return text
      .replace(/^## \*\*(.*?)\*\*/gm, '<h2 class="text-lg font-bold mb-4 flex items-center gap-2">📊 $1</h2>')
      .replace(/^### \*\*(.*?)\*\*/gm, '<h3 class="text-base font-semibold mb-3 flex items-center gap-2">🔍 $1</h3>')
      .replace(/^## (.*)/gm, '<h2 class="text-lg font-bold mb-4">$1</h2>')
      .replace(/^### (.*)/gm, '<h3 class="text-base font-semibold mb-3">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/---/g, '<hr class="my-4 border-t border-current opacity-20" />');
  };

  const renderContent = () => {
    const contentType = detectContentType(content);
    const formattedText = formatHeaders(content);
    
    // Extract headers for display
    const headerMatch = formattedText.match(/<h2[^>]*>(.*?)<\/h2>/);

    
    switch (contentType) {
      case 'sales_orders':
        const salesOrders = parseSalesOrders(content);
        const metrics = parseMetrics(content);
        
        return (
          <div className="space-y-6">
            {headerMatch && (
              <div dangerouslySetInnerHTML={{ __html: headerMatch[0] }} />
            )}
            
            {metrics.length > 0 && (
              <div>
                <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                  🔍 Overview
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {metrics.map((metric, index) => (
                    <MetricCard
                      key={index}
                      label={metric.label}
                      value={metric.value}
                      isDarkMode={isDarkMode}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {salesOrders.length > 0 && (
              <div>
                <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                  🔍 Individual Order Details
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {salesOrders.map((order, index) => (
                    <SalesOrderCard
                      key={index}
                      order={order}
                      isDarkMode={isDarkMode}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Fallback for any remaining content */}
            {salesOrders.length === 0 && metrics.length === 0 && (
              <InfoCard content={formattedText} isDarkMode={isDarkMode} />
            )}
          </div>
        );
        
      case 'tools':
        const tools = parseTools(content);
        
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              🛠️ Available Tools
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tools.map((tool, index) => (
                <ToolCard
                  key={index}
                  name={tool.name}
                  description={tool.description}
                  isDarkMode={isDarkMode}
                />
              ))}
            </div>
          </div>
        );
        
      case 'metrics':
        const metricList = parseMetrics(content);
        
        return (
          <div className="space-y-6">
            {headerMatch && (
              <div dangerouslySetInnerHTML={{ __html: headerMatch[0] }} />
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {metricList.map((metric, index) => (
                <MetricCard
                  key={index}
                  label={metric.label}
                  value={metric.value}
                  isDarkMode={isDarkMode}
                />
              ))}
            </div>
          </div>
        );
        
      default:
        return <InfoCard content={formattedText} isDarkMode={isDarkMode} />;
    }
  };

  return (
    <div className="text-sm leading-relaxed">
      {renderContent()}
    </div>
  );
};

export default ResponseFormatter;