'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, Users, TrendingUp,  Sun, Moon, Zap, Target, MessageSquare, User, Cpu, Monitor, Wifi } from 'lucide-react';

interface Message {
  id: number;
  type: 'user' | 'agent' | 'error';
  content: string;
  timestamp: string;
  isTyping?: boolean;
}

interface ApiResponse {
  output?: string | Record<string, unknown>;
  response?: string;
  message?: string;
  tableData?: TableData;
  data?: TableData;
}

const CS_AGENT_URL = process.env.NEXT_PUBLIC_CS_AGENT_URL || 'http://10.116.2.72:5678/webhook/cs-agent-prompt'//

type ApiResponseArray = ApiResponse[];

type TableData = Record<string, unknown>[] | Record<string, unknown> | null;

interface TypewriterTextProps {
  text: string;
  isTyping?: boolean;
  onComplete?: () => void;
  isDarkMode: boolean;
}

const TypewriterText: React.FC<TypewriterTextProps> = ({ text, isTyping, onComplete, isDarkMode }) => {
  const [displayedText, setDisplayedText] = useState<string>('');
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  useEffect(() => {
    if (!isTyping) {
      setDisplayedText(text);
      return;
    }

    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 30);

      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, isTyping, onComplete]);

  useEffect(() => {
    if (isTyping) {
      setDisplayedText('');
      setCurrentIndex(0);
    }
  }, [text, isTyping]);

  return (
    <span>
      {displayedText}
      {isTyping && currentIndex < text.length && (
        <span className={`animate-pulse ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>|</span>
      )}
    </span>
  );
};

const SalesAIAgent: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [tableData, setTableData] = useState<TableData>(null);
  const [webhookUrl] = useState<string>(CS_AGENT_URL);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (): Promise<void> => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputValue,
          sessionId: "123456789"
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse | ApiResponseArray = await response.json();
      
      if (Array.isArray(data)) {
        const firstItem = data[0];
        const outputText = typeof firstItem?.output === 'string' ? firstItem.output : 'Array response received';
        
        const agentMessage: Message = {
          id: Date.now() + 1,
          type: 'agent',
          content: outputText,
          timestamp: new Date().toLocaleTimeString(),
          isTyping: true
        };

        setMessages(prev => [...prev, agentMessage]);
        setTableData(data as TableData);
      } else {
        const outputContent = typeof data.output === 'string' 
          ? data.output 
          : data.response || data.message || 'No output received';
          
        const agentMessage: Message = {
          id: Date.now() + 1,
          type: 'agent',
          content: outputContent,
          timestamp: new Date().toLocaleTimeString(),
          isTyping: true
        };

        setMessages(prev => [...prev, agentMessage]);

        if (data.tableData || data.data) {
          setTableData(data.tableData || data.data || null);
        } else if (data.output && typeof data.output === 'object') {
          setTableData(data.output as TableData);
        }
      }

    } catch (error) {
      console.error('Error calling n8n webhook:', error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        type: 'error',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTypingComplete = (messageId: number): void => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId ? { ...msg, isTyping: false } : msg
      )
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderEnhancedTable = (): React.ReactNode => {
    if (!tableData) return null;

    if (Array.isArray(tableData) && tableData.length > 0) {
      const firstRow = tableData[0] as Record<string, unknown>;
      const columns = Object.keys(firstRow);
      
      return (
        <div className={`overflow-hidden rounded-2xl border backdrop-blur-xl shadow-2xl transition-all duration-300 mb-6 ${
          isDarkMode 
            ? 'border-slate-700/30 bg-gradient-to-br from-slate-900/80 to-slate-800/80' 
            : 'border-gray-300/40 bg-gradient-to-br from-white/90 to-gray-50/90'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b transition-all duration-300 ${
                  isDarkMode 
                    ? 'border-slate-700/50 bg-gradient-to-r from-cyan-500/10 to-blue-500/10' 
                    : 'border-gray-300/50 bg-gradient-to-r from-cyan-200/20 to-blue-200/20'
                }`}>
                  {columns.map((column) => (
                    <th key={column} className={`px-6 py-4 text-left text-sm font-semibold transition-all duration-300 ${
                      isDarkMode 
                        ? 'text-cyan-300 bg-slate-800/50' 
                        : 'text-cyan-700 bg-gray-50/80'
                    }`}>
                      <div className="flex items-center space-x-2">
                        <Bot size={16} />
                        <span>{column}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, index) => (
                  <tr key={index} className={`border-b transition-all duration-200 hover:scale-[1.001] ${
                    isDarkMode 
                      ? index % 2 === 0 
                        ? 'bg-slate-900/30 border-slate-700/30 hover:bg-slate-800/40' 
                        : 'bg-slate-800/30 border-slate-700/30 hover:bg-slate-700/40'
                      : index % 2 === 0 
                        ? 'bg-white/60 border-gray-200/40 hover:bg-gray-50/80' 
                        : 'bg-gray-50/60 border-gray-200/40 hover:bg-gray-100/80'
                  }`}>
                    {columns.map((column) => {
                      const value = (row as Record<string, unknown>)[column];
                      const isNumeric = typeof value === 'number';
                      const isDate = column.toLowerCase().includes('date');
                      
                      return (
                        <td key={column} className={`px-6 py-4 text-sm transition-all duration-300 ${
                          isNumeric 
                            ? `text-right font-mono ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'}`
                            : isDate
                              ? `text-center font-mono ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`
                              : isDarkMode ? 'text-slate-200' : 'text-gray-800'
                        }`}>
                          {typeof value === 'object' ? (
                            <code className={`text-xs px-2 py-1 rounded-lg border transition-all duration-300 ${
                              isDarkMode 
                                ? 'text-cyan-400 bg-slate-800/50 border-cyan-500/20' 
                                : 'text-cyan-700 bg-cyan-50/80 border-cyan-300/30'
                            }`}>
                              {JSON.stringify(value)}
                            </code>
                          ) : isNumeric ? (
                            formatNumber(value as number)
                          ) : isDate ? (
                            formatDate(String(value))
                          ) : (
                            String(value || '')
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (typeof tableData === 'object' && tableData !== null) {
      return (
        <div className="space-y-3 mb-6">
          {Object.entries(tableData).map(([key, value]) => (
            <div key={key} className={`flex justify-between items-center p-4 rounded-xl backdrop-blur-sm transition-all duration-200 ${
              isDarkMode 
                ? 'bg-gradient-to-r from-slate-900/40 to-slate-800/40 border border-slate-700/30 hover:from-slate-800/50 hover:to-slate-700/50' 
                : 'bg-gradient-to-r from-white/60 to-gray-50/60 border border-gray-300/40 hover:from-gray-50/80 hover:to-gray-100/80'
            }`}>
              <span className={`font-medium transition-all duration-300 ${
                isDarkMode ? 'text-cyan-300' : 'text-cyan-700'
              }`}>{key}:</span>
              <span className={`font-mono text-sm transition-all duration-300 ${
                isDarkMode ? 'text-slate-200' : 'text-gray-800'
              }`}>
                {typeof value === 'object' ? 
                  <code className={`px-2 py-1 rounded-lg text-xs border transition-all duration-300 ${
                    isDarkMode 
                      ? 'text-cyan-400 bg-slate-800/50 border-cyan-500/20' 
                      : 'text-cyan-700 bg-cyan-50/80 border-cyan-300/30'
                  }`}>
                    {JSON.stringify(value)}
                  </code> : 
                  String(value)
                }
              </span>
            </div>
          ))}
        </div>
      );
    }

    return (
      <pre className={`text-sm p-6 rounded-xl overflow-auto font-mono backdrop-blur-sm transition-all duration-300 mb-6 ${
        isDarkMode 
          ? 'text-cyan-300 bg-slate-900/50 border border-slate-700/30' 
          : 'text-cyan-700 bg-white/60 border border-gray-300/40'
      }`}>
        {JSON.stringify(tableData, null, 2)}
      </pre>
    );
  };

  return (
    <div className={`h-full flex relative overflow-hidden transition-all duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
        : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'
    }`}>
      {/* AI/Robot themed background elements */}
      <div className={`absolute inset-0 transition-all duration-300 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-cyan-700/5 via-blue-900/5 to-purple-800/5' 
          : 'bg-gradient-to-br from-cyan-200/20 via-blue-200/20 to-purple-300/20'
      }`} />
      
      {/* Neural network patterns */}
      <div className="absolute top-0 left-0 w-full h-full">
        {/* AI processing nodes */}
        <div className={`absolute top-1/4 left-1/4 w-32 h-32 rounded-full blur-2xl animate-pulse transition-all duration-300 ${
          isDarkMode 
            ? 'bg-gradient-conic from-cyan-600/20 via-blue-600/20 to-purple-600/20' 
            : 'bg-gradient-conic from-cyan-300/30 via-blue-300/30 to-purple-300/30'
        }`} />
        <div className={`absolute bottom-1/3 right-1/3 w-40 h-40 rounded-full blur-2xl animate-pulse delay-1000 transition-all duration-300 ${
          isDarkMode 
            ? 'bg-gradient-conic from-blue-700/15 via-cyan-700/15 to-purple-700/15' 
            : 'bg-gradient-conic from-blue-200/25 via-cyan-200/25 to-purple-200/25'
        }`} />
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-2xl animate-pulse delay-500 transition-all duration-300 ${
          isDarkMode 
            ? 'bg-gradient-radial from-cyan-600/10 to-transparent' 
            : 'bg-gradient-radial from-cyan-300/20 to-transparent'
        }`} />
        
        {/* Neural connection lines */}
        <div className={`absolute top-1/4 left-1/4 w-1 h-32 rotate-45 blur-sm transition-all duration-300 ${
          isDarkMode 
            ? 'bg-gradient-to-b from-cyan-600/20 to-transparent' 
            : 'bg-gradient-to-b from-cyan-400/30 to-transparent'
        }`} />
        <div className={`absolute bottom-1/3 right-1/3 w-1 h-24 -rotate-45 blur-sm transition-all duration-300 ${
          isDarkMode 
            ? 'bg-gradient-to-b from-blue-600/20 to-transparent' 
            : 'bg-gradient-to-b from-blue-400/30 to-transparent'
        }`} />
        <div className={`absolute top-1/2 left-1/3 w-32 h-1 blur-sm transition-all duration-300 ${
          isDarkMode 
            ? 'bg-gradient-to-r from-cyan-600/20 to-transparent' 
            : 'bg-gradient-to-r from-cyan-400/30 to-transparent'
        }`} />
      </div>

      {/* Circuit board grid pattern */}
      <div className={`absolute inset-0 transition-all duration-300 ${isDarkMode ? 'opacity-8' : 'opacity-12'}`}>
        <div className="w-full h-full" style={{
          backgroundImage: isDarkMode ? `
            linear-gradient(rgba(6, 182, 212, 0.08) 1px, transparent 1px), 
            linear-gradient(90deg, rgba(6, 182, 212, 0.08) 1px, transparent 1px),
            linear-gradient(rgba(59, 130, 246, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.05) 1px, transparent 1px)
          ` : `
            linear-gradient(rgba(6, 182, 212, 0.12) 1px, transparent 1px), 
            linear-gradient(90deg, rgba(6, 182, 212, 0.12) 1px, transparent 1px),
            linear-gradient(rgba(59, 130, 246, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px, 60px 60px, 20px 20px, 20px 20px'
        }} />
      </div>

      {/* Floating robotic/AI icons */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute top-1/6 left-1/6 transition-all duration-300 ${isDarkMode ? 'opacity-5' : 'opacity-8'}`}>
          <Bot size={40} className={`animate-pulse ${isDarkMode ? 'text-cyan-600' : 'text-cyan-500'}`} />
        </div>
        <div className={`absolute top-1/3 right-1/4 transition-all duration-300 ${isDarkMode ? 'opacity-5' : 'opacity-8'}`}>
          <Cpu size={36} className={`animate-pulse delay-500 ${isDarkMode ? 'text-blue-600' : 'text-blue-500'}`} />
        </div>
        <div className={`absolute bottom-1/4 left-1/3 transition-all duration-300 ${isDarkMode ? 'opacity-5' : 'opacity-8'}`}>
          <Monitor size={32} className={`animate-pulse delay-1000 ${isDarkMode ? 'text-cyan-600' : 'text-cyan-500'}`} />
        </div>
        <div className={`absolute bottom-1/6 right-1/6 transition-all duration-300 ${isDarkMode ? 'opacity-5' : 'opacity-8'}`}>
          <Zap size={38} className={`animate-pulse delay-1500 ${isDarkMode ? 'text-blue-600' : 'text-blue-500'}`} />
        </div>
        <div className={`absolute top-2/3 left-1/5 transition-all duration-300 ${isDarkMode ? 'opacity-5' : 'opacity-8'}`}>
          <Target size={34} className={`animate-pulse delay-2000 ${isDarkMode ? 'text-cyan-600' : 'text-cyan-500'}`} />
        </div>
        <div className={`absolute top-1/2 right-1/5 transition-all duration-300 ${isDarkMode ? 'opacity-5' : 'opacity-8'}`}>
          <Wifi size={30} className={`animate-pulse delay-2500 ${isDarkMode ? 'text-blue-600' : 'text-blue-500'}`} />
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="w-full h-full flex flex-col relative z-0 transition-all duration-300">
        <div className={`h-full backdrop-blur-xl rounded-none border-0 flex flex-col shadow-2xl overflow-hidden transition-all duration-300 ${
          isDarkMode 
            ? 'bg-slate-900/70' 
            : 'bg-white/80'
        }`}>
          {/* Chat Header */}
          <div className={`border-b flex-shrink-0 p-6 transition-all duration-300 ${
            isDarkMode 
              ? 'bg-gradient-to-r from-cyan-700 via-blue-700 to-purple-700 border-slate-700/50' 
              : 'bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 border-gray-300/50'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="p-3 bg-white/10 rounded-2xl shadow-lg backdrop-blur-sm border border-white/20">
                    <Bot size={24} className="text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse" />
                  <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-cyan-400 rounded-full border-2 border-white animate-ping" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">
                    TIPA Sales & Customer Service AI
                  </h2>
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-500/20 text-green-300 border border-green-400/30 px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse inline-block" />
                      Neural Network Active
                    </div>
                    <div className="border-white/30 text-white bg-white/10 px-3 py-1 rounded-full text-sm backdrop-blur-sm border">
                      <Cpu size={12} className="mr-1 inline" />
                      Sales Intelligence
                    </div>
                    <div className="border-white/30 text-white bg-white/10 px-3 py-1 rounded-full text-sm backdrop-blur-sm border">
                      <Users size={12} className="mr-1 inline" />
                      Customer Support
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Theme Toggle */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-200 backdrop-blur-sm border border-white/20"
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDarkMode ? (
                  <Sun size={20} className="text-white" />
                ) : (
                  <Moon size={20} className="text-white" />
                )}
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className={`flex-1 overflow-y-auto p-6 space-y-6 min-h-0 backdrop-blur-sm transition-all duration-300 ${
            isDarkMode 
              ? 'bg-gradient-to-b from-slate-900/30 to-slate-800/30' 
              : 'bg-gradient-to-b from-gray-50/50 to-white/50'
          }`}>
            {messages.length === 0 && (
              <div className="text-center mt-20">
                <div className="relative mb-6">
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-sm transition-all duration-300 ${
                    isDarkMode 
                      ? 'bg-gradient-to-br from-cyan-700/20 to-blue-700/20 border border-cyan-600/30' 
                      : 'bg-gradient-to-br from-cyan-200/40 to-blue-200/40 border border-cyan-400/40'
                  }`}>
                    <Bot size={36} className={isDarkMode ? 'text-cyan-400' : 'text-cyan-600'} />
                  </div>
                  <div className={`absolute inset-0 w-20 h-20 rounded-2xl mx-auto animate-ping transition-all duration-300 ${
                    isDarkMode ? 'bg-cyan-600/20' : 'bg-cyan-400/30'
                  }`} />
                </div>
                <p className={`font-medium text-lg mb-2 transition-all duration-300 ${
                  isDarkMode ? 'text-slate-200' : 'text-gray-800'
                }`}>AI Sales Assistant Online</p>
                <p className={`text-sm mb-4 transition-all duration-300 ${
                  isDarkMode ? 'text-slate-400' : 'text-gray-600'
                }`}>Ready to assist with sales inquiries, customer support, and product information</p>
                
                {/* Quick action buttons */}
                <div className="flex flex-wrap justify-center gap-3 mt-6">
                  <button 
                    onClick={() => setInputValue("What are our current sales targets?")}
                    className={`px-4 py-2 rounded-xl text-sm transition-all duration-200 ${
                      isDarkMode 
                        ? 'bg-slate-800/50 hover:bg-slate-700/50 text-cyan-300 border border-slate-700/50' 
                        : 'bg-white/60 hover:bg-gray-50/80 text-cyan-700 border border-gray-300/50'
                    }`}
                  >
                    <Target size={14} className="mr-2 inline" />
                    Sales Targets
                  </button>
                  <button 
                    onClick={() => setInputValue("Show me customer support metrics")}
                    className={`px-4 py-2 rounded-xl text-sm transition-all duration-200 ${
                      isDarkMode 
                        ? 'bg-slate-800/50 hover:bg-slate-700/50 text-cyan-300 border border-slate-700/50' 
                        : 'bg-white/60 hover:bg-gray-50/80 text-cyan-700 border border-gray-300/50'
                    }`}
                  >
                    <Users size={14} className="mr-2 inline" />
                    Support Metrics
                  </button>
                  <button 
                    onClick={() => setInputValue("Generate sales report")}
                    className={`px-4 py-2 rounded-xl text-sm transition-all duration-200 ${
                      isDarkMode 
                        ? 'bg-slate-800/50 hover:bg-slate-700/50 text-cyan-300 border border-slate-700/50' 
                        : 'bg-white/60 hover:bg-gray-50/80 text-cyan-700 border border-gray-300/50'
                    }`}
                  >
                    <TrendingUp size={14} className="mr-2 inline" />
                    Sales Report
                  </button>
                </div>
              </div>
            )}
            
            {/* Table data display */}
            {tableData && renderEnhancedTable()}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4 duration-500`}
              >
                <div className="flex items-start space-x-3 max-w-sm lg:max-w-md">
                  {message.type !== 'user' && (
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mt-1 backdrop-blur-sm transition-all duration-300 ${
                      message.type === 'error' 
                        ? isDarkMode 
                          ? 'bg-red-500/20 border border-red-400/30' 
                          : 'bg-red-200/40 border border-red-400/40'
                        : isDarkMode 
                          ? 'bg-gradient-to-br from-cyan-700/20 to-blue-700/20 border border-cyan-600/30' 
                          : 'bg-gradient-to-br from-cyan-200/40 to-blue-200/40 border border-cyan-400/40'
                    }`}>
                      <Bot size={18} className={
                        message.type === 'error' 
                          ? isDarkMode ? 'text-red-400' : 'text-red-600'
                          : isDarkMode ? 'text-cyan-400' : 'text-cyan-600'
                      } />
                    </div>
                  )}
                  
                  <div
                    className={`px-5 py-4 rounded-2xl border relative shadow-lg backdrop-blur-sm transition-all duration-300 ${
                      message.type === 'user'
                        ? isDarkMode 
                          ? 'bg-gradient-to-r from-cyan-700 to-blue-700 text-white border-cyan-600/30 shadow-cyan-600/20'
                          : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-cyan-400/40 shadow-cyan-400/30'
                        : message.type === 'error'
                        ? isDarkMode 
                          ? 'bg-red-500/20 text-red-300 border-red-400/30 shadow-red-500/20'
                          : 'bg-red-200/40 text-red-700 border-red-400/40 shadow-red-400/30'
                        : isDarkMode 
                          ? 'bg-slate-800/60 text-slate-200 border-slate-700/50 shadow-slate-900/50'
                          : 'bg-white/80 text-gray-800 border-gray-300/50 shadow-gray-300/30'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">
                      {message.type === 'agent' ? (
                        <TypewriterText 
                          text={message.content} 
                          isTyping={message.isTyping}
                          onComplete={() => handleTypingComplete(message.id)}
                          isDarkMode={isDarkMode}
                        />
                      ) : (
                        message.content
                      )}
                    </p>
                    <p className="text-xs mt-2 opacity-75 flex items-center">
                      <span>{message.timestamp}</span>
                    </p>
                  </div>

                  {message.type === 'user' && (
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mt-1 shadow-lg transition-all duration-300 ${
                      isDarkMode 
                        ? 'bg-gradient-to-br from-cyan-700 to-blue-700 shadow-cyan-600/20'
                        : 'bg-gradient-to-br from-cyan-500 to-blue-500 shadow-cyan-400/30'
                    }`}>
                      <User size={18} className="text-white" />
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-start space-x-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center backdrop-blur-sm transition-all duration-300 ${
                    isDarkMode 
                      ? 'bg-gradient-to-br from-cyan-700/20 to-blue-700/20 border border-cyan-600/30'
                      : 'bg-gradient-to-br from-cyan-200/40 to-blue-200/40 border border-cyan-400/40'
                  }`}>
                    <Bot size={18} className={isDarkMode ? 'text-cyan-400' : 'text-cyan-600'} />
                  </div>
                  <div className={`px-5 py-4 rounded-2xl flex items-center space-x-3 border shadow-lg backdrop-blur-sm transition-all duration-300 ${
                    isDarkMode 
                      ? 'bg-slate-800/60 border-slate-700/50'
                      : 'bg-white/80 border-gray-300/50'
                  }`}>
                    <Loader2 size={18} className={`animate-spin ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
                    <span className={`text-sm transition-all duration-300 ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>AI is processing your request...</span>
                    <div className="flex space-x-1">
                      <div className={`w-2 h-2 rounded-full animate-pulse ${isDarkMode ? 'bg-cyan-400' : 'bg-cyan-600'}`} />
                      <div className={`w-2 h-2 rounded-full animate-pulse delay-100 ${isDarkMode ? 'bg-blue-400' : 'bg-blue-600'}`} />
                      <div className={`w-2 h-2 rounded-full animate-pulse delay-200 ${isDarkMode ? 'bg-purple-400' : 'bg-purple-600'}`} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className={`p-6 border-t flex-shrink-0 backdrop-blur-sm transition-all duration-300 ${
            isDarkMode 
              ? 'bg-slate-900/60 border-slate-700/50' 
              : 'bg-white/80 border-gray-300/50'
          }`}>
            <div className="flex space-x-4">
              <div className="flex-1 relative">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about sales data, customer inquiries, product information, or support metrics..."
                  className={`w-full resize-none rounded-xl px-4 py-3 backdrop-blur-sm border focus:outline-none focus:ring-2 transition-all duration-300 ${
                    isDarkMode 
                      ? 'bg-slate-800/50 border-slate-700/50 text-slate-200 placeholder:text-slate-400 focus:border-cyan-600/50 focus:ring-cyan-600/20'
                      : 'bg-white/70 border-gray-300/50 text-gray-800 placeholder:text-gray-500 focus:border-cyan-500/50 focus:ring-cyan-500/20'
                  }`}
                  rows={2}
                  disabled={isLoading}
                />
                {/* Quick action buttons in input */}
                <div className="absolute right-3 top-3 flex space-x-2">
                  <button
                    onClick={() => setInputValue("Generate quarterly sales report")}
                    className={`p-1.5 rounded-lg transition-all duration-200 ${
                      isDarkMode 
                        ? 'hover:bg-slate-700/50 text-slate-400 hover:text-cyan-400'
                        : 'hover:bg-gray-200/50 text-gray-500 hover:text-cyan-600'
                    }`}
                    title="Sales Report"
                  >
                    <TrendingUp size={16} />
                  </button>
                  <button
                    onClick={() => setInputValue("Show customer satisfaction metrics")}
                    className={`p-1.5 rounded-lg transition-all duration-200 ${
                      isDarkMode 
                        ? 'hover:bg-slate-700/50 text-slate-400 hover:text-cyan-400'
                        : 'hover:bg-gray-200/50 text-gray-500 hover:text-cyan-600'
                    }`}
                    title="Customer Metrics"
                  >
                    <Users size={16} />
                  </button>
                  <button
                    onClick={() => setInputValue("Help with customer support inquiry")}
                    className={`p-1.5 rounded-lg transition-all duration-200 ${
                      isDarkMode 
                        ? 'hover:bg-slate-700/50 text-slate-400 hover:text-cyan-400'
                        : 'hover:bg-gray-200/50 text-gray-500 hover:text-cyan-600'
                    }`}
                    title="Support Help"
                  >
                    <MessageSquare size={16} />
                  </button>
                </div>
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className={`border-0 shadow-lg disabled:opacity-50 h-auto px-6 rounded-xl transition-all duration-200 flex items-center justify-center min-w-[60px] ${
                  isDarkMode 
                    ? 'bg-gradient-to-r from-cyan-700 to-blue-700 hover:from-cyan-800 hover:to-blue-800 text-white shadow-cyan-600/20'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-cyan-400/30'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 size={20} className="animate-spin" />
                    <Cpu size={16} className="animate-pulse" />
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Send size={20} />
                    <Bot size={16} />
                  </div>
                )}
              </button>
            </div>
            
            {/* Status bar */}
            <div className="flex items-center justify-between mt-4 text-xs">
              <div className="flex items-center space-x-4">
                <div className={`flex items-center space-x-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span>AI Neural Network Active</span>
                </div>
                <div className={`flex items-center space-x-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                  <Cpu size={12} />
                  <span>Sales Intelligence Engine</span>
                </div>
                <div className={`flex items-center space-x-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                  <Wifi size={12} />
                  <span>Customer Database Connected</span>
                </div>
              </div>
              <div className={`flex items-center space-x-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                <Bot size={12} />
                <span>TIPA Motor Manufacturing</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesAIAgent;