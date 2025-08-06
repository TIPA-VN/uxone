'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Bot, User, Loader2, Send, Sun, Moon, Headphones, Heart, Ticket, FileText, HelpCircle } from 'lucide-react';
import ResponseFormatter from '@/components/cs/ResponseFormatter';

interface Message {
  id: number;
  type: 'user' | 'agent' | 'error';
  content: string;
  timestamp: string;
  isTyping?: boolean;
}

export default function CSAgentPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const webhookUrl = process.env.NEXT_PUBLIC_CS_AGENT_URL || 'http://10.116.2.72:5678/webhook/cs-agent-v2';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date().toLocaleTimeString()
    };

    setInputValue('');
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          sessionId: "123456789"
        })
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      
      let outputContent;
      if (Array.isArray(data)) {
        outputContent = JSON.stringify(data[0]); // or data[0] if you want the first item
      } else {
        outputContent = JSON.stringify(data); // always stringify the full object
      }

      const agentMessage: Message = {
        id: Date.now() + 1,
        type: 'agent',
        content: outputContent,
        timestamp: new Date().toLocaleTimeString()
      };

      setMessages(prev => [...prev, agentMessage]);
      setIsLoading(false);

    } catch (error) {
      console.error('Error calling webhook:', error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        type: 'error',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  const setQuickMessage = (message: string) => {
    setInputValue(message);
  };

  const handleChatKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const WelcomeMessage = () => (
    <div className="text-center mt-20">
      <div className="relative mb-6">
        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-sm transition-all duration-300 ${isDarkMode ? 'bg-gradient-to-br from-blue-700/20 to-teal-700/20 border border-blue-600/30' : 'bg-gradient-to-br from-sky-200/40 to-cyan-200/40 border border-sky-400/40'}`}>
          <Bot className={`w-9 h-9 ${isDarkMode ? 'text-blue-400' : 'text-sky-600'}`} />
        </div>
        <div className={`absolute inset-0 w-20 h-20 rounded-2xl mx-auto animate-ping transition-all duration-300 ${isDarkMode ? 'bg-blue-600/20' : 'bg-sky-400/30'}`}></div>
      </div>
      <p className={`font-medium text-lg mb-2 transition-all duration-300 ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>Customer Service Assistant Online</p>
      <p className={`text-sm mb-4 transition-all duration-300 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Ready to assist with customer inquiries, support tickets, and service requests</p>
      
      <div className="flex flex-wrap justify-center gap-3 mt-6">
        <button 
          className={`px-4 py-2 rounded-xl text-sm transition-all duration-200 flex items-center gap-2 ${isDarkMode ? 'bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 border border-slate-700/50' : 'bg-gray-50/60 hover:bg-gray-100/80 text-gray-700 border border-gray-300/50'}`}
          onClick={() => setQuickMessage("Check customer support tickets")}
        >
          <Ticket size={14} />
          Support Tickets
        </button>
        <button 
          className={`px-4 py-2 rounded-xl text-sm transition-all duration-200 flex items-center gap-2 ${isDarkMode ? 'bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 border border-slate-700/50' : 'bg-gray-50/60 hover:bg-gray-100/80 text-gray-700 border border-gray-300/50'}`}
          onClick={() => setQuickMessage("View customer satisfaction metrics")}
        >
          <Heart size={14} />
          Satisfaction Metrics
        </button>
        <button 
          className={`px-4 py-2 rounded-xl text-sm transition-all duration-200 flex items-center gap-2 ${isDarkMode ? 'bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 border border-slate-700/50' : 'bg-gray-50/60 hover:bg-gray-100/80 text-gray-700 border border-gray-300/50'}`}
          onClick={() => setQuickMessage("Generate service report")}
        >
          <FileText size={14} />
          Service Report
        </button>
      </div>
    </div>
  );

  const MessageBubble = ({ message }: { message: Message }) => (
    <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-in`}>
      <div className="flex items-start space-x-3 w-full max-w-6xl">
        {message.type !== 'user' && (
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mt-1 backdrop-blur-sm transition-all duration-300 flex-shrink-0 ${message.type === 'error' ? (isDarkMode ? 'bg-red-500/20 border border-red-400/30' : 'bg-red-200/40 border border-red-400/40') : (isDarkMode ? 'bg-gradient-to-br from-blue-700/20 to-teal-700/20 border border-blue-600/30' : 'bg-gradient-to-br from-sky-200/40 to-cyan-200/40 border border-sky-400/40')}`}>
            <Bot className={`w-4 h-4 ${message.type === 'error' ? (isDarkMode ? 'text-red-400' : 'text-red-600') : (isDarkMode ? 'text-blue-400' : 'text-sky-600')}`} />
          </div>
        )}
        
        <div className={`border relative shadow-lg backdrop-blur-sm transition-all duration-300 ${message.type === 'user' ? (isDarkMode ? 'bg-gradient-to-r from-blue-700 to-teal-700 text-white border-blue-600/30 shadow-blue-600/20 max-w-md ml-auto px-5 py-4 rounded-2xl' : 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white border-sky-400/40 shadow-sky-400/30 max-w-md ml-auto px-5 py-4 rounded-2xl') : message.type === 'error' ? (isDarkMode ? 'bg-red-500/20 text-red-300 border-red-400/30 shadow-red-500/20 rounded-2xl w-full' : 'bg-red-200/40 text-red-700 border-red-400/40 shadow-red-400/30 rounded-2xl w-full') : (isDarkMode ? 'bg-teal-800/60 text-teal-200 border-teal-700/50 shadow-teal-900/50 rounded-2xl w-full' : 'bg-sky-50/80 text-sky-800 border-sky-300/50 shadow-sky-300/30 rounded-2xl w-full')}`}>
          {message.type === 'user' ? (
            <div className="text-sm leading-relaxed">{message.content}</div>
          ) : (
            <div className="p-4">
              <ResponseFormatter content={message.content} isDarkMode={isDarkMode} />
            </div>
          )}
          <p className={`text-xs mt-2 opacity-75 flex items-center ${message.type !== 'user' ? 'px-4 pb-2' : ''}`}>
            <span>{message.timestamp}</span>
          </p>
        </div>

        {message.type === 'user' && (
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mt-1 shadow-lg transition-all duration-300 flex-shrink-0 ${isDarkMode ? 'bg-gradient-to-br from-blue-700 to-teal-700 shadow-blue-600/20' : 'bg-gradient-to-br from-sky-500 to-cyan-500 shadow-sky-400/30'}`}>
            <User className="text-white w-4 h-4" />
          </div>
        )}
      </div>
    </div>
  );

  const LoadingMessage = () => (
    <div className="flex justify-start animate-in">
      <div className="flex items-start space-x-3">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center backdrop-blur-sm transition-all duration-300 ${isDarkMode ? 'bg-gradient-to-br from-blue-700/20 to-teal-700/20 border border-blue-600/30' : 'bg-gradient-to-br from-sky-200/40 to-cyan-200/40 border border-sky-400/40'}`}>
          <Bot className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-sky-600'}`} />
        </div>
        <div className={`px-5 py-4 rounded-2xl flex items-center space-x-3 border shadow-lg backdrop-blur-sm transition-all duration-300 ${isDarkMode ? 'bg-teal-800/60 border-teal-700/50' : 'bg-sky-50/80 border-sky-300/50'}`}>
          <Loader2 className={`w-4 h-4 animate-spin ${isDarkMode ? 'text-blue-400' : 'text-sky-600'}`} />
          <span className={`text-sm transition-all duration-300 ${isDarkMode ? 'text-teal-200' : 'text-sky-800'}`}>Processing customer request...</span>
          <div className="flex space-x-1">
            <div className={`w-2 h-2 rounded-full animate-pulse ${isDarkMode ? 'bg-blue-400' : 'bg-sky-600'}`}></div>
            <div className={`w-2 h-2 rounded-full animate-pulse delay-100 ${isDarkMode ? 'bg-teal-400' : 'bg-cyan-600'}`}></div>
            <div className={`w-2 h-2 rounded-full animate-pulse delay-200 ${isDarkMode ? 'bg-cyan-400' : 'bg-teal-600'}`}></div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`h-screen w-screen flex relative overflow-hidden transition-all duration-300 ${isDarkMode ? 'bg-blue-700' : 'bg-sky-400'}`}>
      {/* Background */}
      <div className={`absolute inset-0 transition-all duration-300 ${isDarkMode ? 'bg-teal-800' : 'bg-cyan-500'}`}></div>
      
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className={`absolute top-1/4 left-1/4 w-32 h-32 rounded-full blur-2xl animate-pulse transition-all duration-300 ${isDarkMode ? 'bg-blue-600/30' : 'bg-sky-300/40'}`}></div>
        <div className={`absolute bottom-1/3 right-1/3 w-40 h-40 rounded-full blur-2xl animate-pulse delay-1000 transition-all duration-300 ${isDarkMode ? 'bg-teal-600/20' : 'bg-cyan-300/30'}`}></div>
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-2xl animate-pulse delay-500 transition-all duration-300 ${isDarkMode ? 'bg-cyan-700/15' : 'bg-teal-400/25'}`}></div>
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full" style={{backgroundImage: 'linear-gradient(rgba(30, 64, 175, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(30, 64, 175, 0.3) 1px, transparent 1px)', backgroundSize: '40px 40px'}}></div>
      </div>

      {/* Floating icons */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/6 left-1/6 opacity-15">
          <Headphones className="w-10 h-10 animate-pulse text-white" />
        </div>
        <div className="absolute top-1/3 right-1/4 opacity-15">
          <Heart className="w-9 h-9 animate-pulse delay-500 text-white" />
        </div>
        <div className="absolute bottom-1/4 left-1/3 opacity-15">
          <Ticket className="w-8 h-8 animate-pulse delay-1000 text-white" />
        </div>
        <div className="absolute bottom-1/6 right-1/6 opacity-15">
          <FileText className="w-10 h-10 animate-pulse delay-1500 text-white" />
        </div>
        <div className="absolute top-2/3 left-1/5 opacity-15">
          <HelpCircle className="w-9 h-9 animate-pulse delay-2000 text-white" />
        </div>
        <div className="absolute top-1/2 right-1/5 opacity-15">
          <Bot className="w-8 h-8 animate-pulse delay-2500 text-white" />
        </div>
      </div>

      {/* Main content */}
      <div className="w-full h-full flex flex-col relative z-10 transition-all duration-300">
        <div className={`h-full backdrop-blur-xl rounded-2xl border flex flex-col shadow-2xl overflow-hidden transition-all duration-300 m-6 ${isDarkMode ? 'bg-slate-900/95 border-slate-700/50' : 'bg-white/95 border-gray-300/50'}`}>
          
          {/* Header */}
          <div className={`border-b flex-shrink-0 p-6 transition-all duration-300 ${isDarkMode ? 'bg-gradient-to-r from-blue-700 via-teal-700 to-cyan-700 border-blue-700/50' : 'bg-gradient-to-r from-sky-500 via-cyan-500 to-teal-500 border-sky-300/50'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="p-3 bg-white/10 rounded-2xl shadow-lg backdrop-blur-sm border border-white/20">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                  <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-400 rounded-full border-2 border-white animate-ping"></div>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Customer Service & Support AI</h2>
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-500/20 text-green-300 border border-green-400/30 px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse inline-block"></div>
                      Support Active
                    </div>
                    <div className="border-white/30 text-white bg-white/10 px-3 py-1 rounded-full text-sm backdrop-blur-sm border">
                      <Headphones className="w-3 h-3 mr-1 inline" />
                      Customer Care
                    </div>
                    <div className="border-white/30 text-white bg-white/10 px-3 py-1 rounded-full text-sm backdrop-blur-sm border">
                      <Ticket className="w-3 h-3 mr-1 inline" />
                      Support Tickets
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-200 backdrop-blur-sm border border-white/20"
                  title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                  {isDarkMode ? <Sun className="w-5 h-5 text-white" /> : <Moon className="w-5 h-5 text-white" />}
                </button>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className={`flex-1 overflow-y-auto p-6 space-y-6 min-h-0 transition-all duration-300 ${isDarkMode ? 'bg-slate-900/50' : 'bg-white/50'}`}>
            {messages.length === 0 ? (
              <WelcomeMessage />
            ) : (
              messages.map(message => (
                <MessageBubble key={message.id} message={message} />
              ))
            )}
            {isLoading && <LoadingMessage />}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className={`p-6 border-t flex-shrink-0 transition-all duration-300 ${isDarkMode ? 'bg-slate-900/60 border-slate-700/50' : 'bg-white/80 border-gray-300/50'}`}>
            <div className="flex space-x-4">
              <div className="flex-1 relative">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleChatKeyPress}
                  placeholder="Ask about support tickets, customer satisfaction, service requests, or help documentation..."
                  rows={2}
                  disabled={isLoading}
                  className={`w-full resize-none rounded-xl px-4 py-3 backdrop-blur-sm border focus:outline-none focus:ring-2 transition-all duration-300 ${isDarkMode ? 'bg-slate-800/50 border-slate-700/50 text-slate-200 placeholder:text-slate-400 focus:border-slate-600/50 focus:ring-slate-600/20' : 'bg-gray-50/70 border-gray-300/50 text-gray-800 placeholder:text-gray-500 focus:border-gray-500/50 focus:ring-gray-500/20'}`}
                />
                
                <div className="absolute right-3 top-3 flex space-x-2">
                  <button
                    onClick={() => setQuickMessage("Generate customer service report")}
                    className={`p-1.5 rounded-lg transition-all duration-200 ${isDarkMode ? 'hover:bg-slate-700/50 text-slate-400 hover:text-slate-300' : 'hover:bg-gray-200/50 text-gray-500 hover:text-gray-600'}`}
                    title="Service Report"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setQuickMessage("Check ticket status")}
                    className={`p-1.5 rounded-lg transition-all duration-200 ${isDarkMode ? 'hover:bg-slate-700/50 text-slate-400 hover:text-slate-300' : 'hover:bg-gray-200/50 text-gray-500 hover:text-gray-600'}`}
                    title="Ticket Status"
                  >
                    <Ticket className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setQuickMessage("Help with customer inquiry")}
                    className={`p-1.5 rounded-lg transition-all duration-200 ${isDarkMode ? 'hover:bg-slate-700/50 text-slate-400 hover:text-slate-300' : 'hover:bg-gray-200/50 text-gray-500 hover:text-gray-600'}`}
                    title="Customer Help"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <button
                onClick={sendMessage}
                disabled={isLoading || !inputValue.trim()}
                className={`border-0 shadow-lg disabled:opacity-50 h-auto px-6 rounded-xl transition-all duration-200 flex items-center justify-center min-w-[60px] ${isDarkMode ? 'bg-gradient-to-r from-blue-700 to-teal-700 hover:from-blue-800 hover:to-teal-800 text-white shadow-blue-600/20' : 'bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white shadow-sky-400/30'}`}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <Headphones className="w-4 h-4 animate-pulse" />
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Send className="w-5 h-5" />
                    <Bot className="w-4 h-4" />
                  </div>
                )}
              </button>
            </div>
            
            {/* Status bar */}
            <div className="flex items-center justify-between mt-4 text-xs">
              <div className="flex items-center space-x-4">
                <div className={`flex items-center space-x-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Customer Service Network Active</span>
                </div>
                <div className={`flex items-center space-x-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                  <Headphones className="w-3 h-3" />
                  <span>Support Intelligence</span>
                </div>
                <div className={`flex items-center space-x-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                  <Heart className="w-3 h-3" />
                  <span>Customer Database Connected</span>
                </div>
                <div className={`flex items-center space-x-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                  <Ticket className="w-3 h-3" />
                  <span>Ticket Management System</span>
                </div>
              </div>
              <div className={`flex items-center space-x-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                <Bot className="w-3 h-3" />
                <span>Customer Service & Support Hub</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}