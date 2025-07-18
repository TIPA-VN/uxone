'use client';
import React from 'react';
import { BarChart3, TrendingUp, Target, Activity } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string;
  isDarkMode: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, isDarkMode }) => {
  
  const getMetricIcon = (label: string) => {
    const lowerLabel = label.toLowerCase();
    
    if (lowerLabel.includes('total') || lowerLabel.includes('orders')) {
      return <BarChart3 className="w-4 h-4" />;
    } else if (lowerLabel.includes('performance') || lowerLabel.includes('delivery')) {
      return <TrendingUp className="w-4 h-4" />;
    } else if (lowerLabel.includes('backorder') || lowerLabel.includes('status')) {
      return <Target className="w-4 h-4" />;
    } else {
      return <Activity className="w-4 h-4" />;
    }
  };

  const getMetricColor = (label: string, value: string) => {
    const lowerLabel = label.toLowerCase();
    const lowerValue = value.toLowerCase();
    
    // Determine color based on context
    if (lowerLabel.includes('backorder') || lowerValue.includes('100%')) {
      return isDarkMode ? 'text-red-400' : 'text-red-600';
    } else if (lowerLabel.includes('performance') || lowerLabel.includes('delivery')) {
      return isDarkMode ? 'text-green-400' : 'text-green-600';
    } else if (lowerLabel.includes('total') || lowerLabel.includes('quantity')) {
      return isDarkMode ? 'text-blue-400' : 'text-blue-600';
    } else {
      return isDarkMode ? 'text-cyan-400' : 'text-cyan-600';
    }
  };

  const iconColor = getMetricColor(label, value);

  return (
    <div className={`rounded-lg p-3 transition-all duration-200 hover:transform hover:-translate-y-0.5 border backdrop-blur-sm ${
      isDarkMode 
        ? 'bg-slate-800/20 border-slate-700/20 hover:bg-slate-800/30' 
        : 'bg-white/5 border-white/15 hover:bg-white/10'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={iconColor}>
          {getMetricIcon(label)}
        </div>
        <h5 className="font-medium text-xs opacity-90">{label}</h5>
      </div>
      
      <div className="text-base font-bold leading-tight">
        {value}
      </div>
    </div>
  );
};

export default MetricCard;