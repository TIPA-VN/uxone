'use client';
import React from 'react';
import { Info } from 'lucide-react';

interface InfoCardProps {
  content: string;
  isDarkMode: boolean;
  title?: string;
}

const InfoCard: React.FC<InfoCardProps> = ({ content, isDarkMode, title = '📋 Information' }) => {
  
  // Clean and format the content
  const formatContent = (text: string) => {
    return text
      .replace(/<h[123][^>]*>/g, '') // Remove header tags but keep content
      .replace(/<\/h[123]>/g, '')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold text
      .replace(/\n\n/g, '</p><p>') // Paragraph breaks
      .replace(/\n/g, '<br>') // Line breaks
      .trim();
  };

  const formattedContent = formatContent(content);
  
  // Check if content is substantial enough for a card
  if (!formattedContent || formattedContent.length < 10) {
    return null;
  }

  return (
    <div className={`rounded-xl p-4 transition-all duration-200 hover:transform hover:-translate-y-1 border backdrop-blur-sm ${
      isDarkMode 
        ? 'bg-slate-800/30 border-slate-700/30 hover:bg-slate-800/40' 
        : 'bg-white/10 border-white/20 hover:bg-white/15'
    }`}>
      <div className="flex items-center gap-2 mb-3">
        <Info className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-sky-600'}`} />
        <h4 className="font-semibold text-sm">{title}</h4>
      </div>
      
      <div 
        className="text-xs leading-relaxed opacity-90"
        dangerouslySetInnerHTML={{ __html: `<p>${formattedContent}</p>` }}
      />
    </div>
  );
};

export default InfoCard;