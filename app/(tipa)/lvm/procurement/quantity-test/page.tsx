"use client";
import { formatQuantity, formatQuantityWithUOM, formatQuantityForTable, getDecimalPlaces } from '@/lib/quantity-formatter';

export default function QuantityTestPage() {
  // Test data with different UOMs and quantities
  const testData = [
    { quantity: 7200, uom: 'EA', description: 'Each (no decimals)' },
    { quantity: 1500, uom: 'PCS', description: 'Pieces (no decimals)' },
    { quantity: 2500, uom: 'KG', description: 'Kilograms (2 decimals)' },
    { quantity: 1800, uom: 'L', description: 'Liters (2 decimals)' },
    { quantity: 3200, uom: 'M', description: 'Meters (2 decimals)' },
    { quantity: 4500, uom: 'BOX', description: 'Boxes (no decimals)' },
    { quantity: 1200, uom: 'SET', description: 'Sets (no decimals)' },
    { quantity: 8900, uom: 'TON', description: 'Tons (2 decimals)' },
    { quantity: 6700, uom: 'GAL', description: 'Gallons (2 decimals)' },
    { quantity: 3400, uom: 'PACK', description: 'Packs (no decimals)' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Quantity Formatting Test</h1>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Rules Applied</h2>
          <ul className="space-y-2 text-gray-700">
            <li>• All quantities are divided by 100 (JDE internal format)</li>
            <li>• Non-decimal UOMs (EA, PCS, BOX, etc.) show whole numbers</li>
            <li>• Metric/Imperial UOMs (KG, L, M, etc.) show 2 decimal places</li>
            <li>• Numbers are formatted with locale-specific separators</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Test Results</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Raw Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    UOM
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Decimal Places
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Formatted Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    With UOM
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {testData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.quantity.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {item.uom}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getDecimalPlaces(item.uom)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {formatQuantityForTable(item.quantity, item.uom)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {formatQuantityWithUOM(item.quantity, item.uom)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Example Calculations</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p><strong>EA (Each):</strong> 7200 ÷ 100 = 72 → "72"</p>
            <p><strong>KG (Kilograms):</strong> 2500 ÷ 100 = 25 → "25.00"</p>
            <p><strong>BOX (Boxes):</strong> 4500 ÷ 100 = 45 → "45"</p>
            <p><strong>L (Liters):</strong> 1800 ÷ 100 = 18 → "18.00"</p>
          </div>
        </div>
      </div>
    </div>
  );
} 