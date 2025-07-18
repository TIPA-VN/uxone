'use client';
import React from 'react';
import { FileText, Package, DollarSign, AlertTriangle, Edit3 } from 'lucide-react';

interface SalesOrderCardProps {
  order: {
    orderNumber: string;
    quantity: string;
    item: string;
    price: string;
    cost: string;
    status: string;
    changes?: string;
  };
  isDarkMode: boolean;
}

const SalesOrderCard: React.FC<SalesOrderCardProps> = ({ order, isDarkMode }) => {
  return (
    <div className={`rounded-xl p-4 transition-all duration-200 hover:transform hover:-translate-y-1 border backdrop-blur-sm ${
      isDarkMode 
        ? 'bg-slate-800/30 border-slate-700/30 hover:bg-slate-800/40' 
        : 'bg-white/10 border-white/20 hover:bg-white/15'
    }`}>
      <div className="flex items-center gap-2 mb-3">
        <FileText className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-sky-600'}`} />
        <h4 className="font-semibold text-sm">Sales Order {order.orderNumber}</h4>
      </div>
      
      <div className="space-y-2 text-xs">
        {order.quantity && (
          <div className="flex items-center gap-2">
            <Package className="w-3 h-3 opacity-70" />
            <span className="opacity-75">Quantity:</span>
            <span className="font-medium">{order.quantity}</span>
          </div>
        )}
        
        {order.item && (
          <div className="flex items-start gap-2">
            <Package className="w-3 h-3 opacity-70 mt-0.5" />
            <span className="opacity-75">Item:</span>
            <span className="font-medium flex-1 break-words">{order.item}</span>
          </div>
        )}
        
        {order.price && (
          <div className="flex items-center gap-2">
            <DollarSign className="w-3 h-3 opacity-70" />
            <span className="opacity-75">Unit Price:</span>
            <span className="font-medium">{order.price}</span>
          </div>
        )}
        
        {order.cost && (
          <div className="flex items-center gap-2">
            <DollarSign className="w-3 h-3 opacity-70" />
            <span className="opacity-75">Unit Cost:</span>
            <span className="font-medium">{order.cost}</span>
          </div>
        )}
        
        {order.status && (
          <div className="flex items-center gap-2 mt-3">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${
              isDarkMode 
                ? 'bg-red-500/20 text-red-300 border-red-400/30' 
                : 'bg-red-100/50 text-red-700 border-red-300/50'
            }`}>
              <AlertTriangle className="w-3 h-3" />
              {order.status}
            </span>
          </div>
        )}
        
        {order.changes && (
          <div className="flex items-center gap-2 mt-2">
            <Edit3 className="w-3 h-3 opacity-50" />
            <span className="text-xs opacity-75">{order.changes}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesOrderCard;