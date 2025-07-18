'use client';
import React from 'react';
import { Wrench, Search, FileText, Users, Calendar, Database } from 'lucide-react';

interface ToolCardProps {
  name: string;
  description: string;
  isDarkMode: boolean;
}

const ToolCard: React.FC<ToolCardProps> = ({ name, description, isDarkMode }) => {
  
  const getToolIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('search') || lowerName.includes('find')) {
      return <Search className="w-5 h-5" />;
    } else if (lowerName.includes('sales') || lowerName.includes('orders')) {
      return <FileText className="w-5 h-5" />;
    } else if (lowerName.includes('customer')) {
      return <Users className="w-5 h-5" />;
    } else if (lowerName.includes('date') || lowerName.includes('range')) {
      return <Calendar className="w-5 h-5" />;
    } else if (lowerName.includes('database') || lowerName.includes('data')) {
      return <Database className="w-5 h-5" />;
    } else {
      return <Wrench className="w-5 h-5" />;
    }
  };

  const getToolColor = (name: string) => {
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('search')) {
      return isDarkMode ? 'text-purple-400' : 'text-purple-600';
    } else if (lowerName.includes('sales')) {
      return isDarkMode ? 'text-green-400' : 'text-green-600';
    } else if (lowerName.includes('customer')) {
      return isDarkMode ? 'text-blue-400' : 'text-blue-600';
    } else {
      return isDarkMode ? 'text-cyan-400' : 'text-cyan-600';
    }
  };

  const iconColor = getToolColor(name);

  return (
    <div className={`rounded-xl p-4 transition-all duration-200 hover:transform hover:-translate-y-1 border backdrop-blur-sm ${
      isDarkMode 
        ? 'bg-slate-800/30 border-slate-700/30 hover:bg-slate-800/40' 
        : 'bg-white/10 border-white/20 hover:bg-white/15'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 p-2 rounded-lg ${
          isDarkMode ? 'bg-slate-700/50' : 'bg-white/20'
        }`}>
          <div className={iconColor}>
            {getToolIcon(name)}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm mb-1 flex items-center gap-2">
            🔧 {name}
          </h4>
          <p className="text-xs opacity-90 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ToolCard;