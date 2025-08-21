"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, MessageSquare, TrendingUp, Package, ShoppingCart, DollarSign, AlertTriangle, ExternalLink } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'agent' | 'error';
  content: string;
  timestamp: string;
}

export default function ProcurementAIAgent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showPopupLauncher, setShowPopupLauncher] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const webhookUrl = process.env.NEXT_PUBLIC_PR_AGENT_URL || 'http://10.116.2.72:5678/webhook/pr-agent-prompt';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const openProcurementChat = () => {
    const popup = window.open('', 'procurement_assistant', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    
    if (popup) {
      // Complete standalone HTML for the procurement agent
      const procurementAgentHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Procurement Assistant</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
    <style>
        body { 
            margin: 0; 
            padding: 0; 
            font-family: system-ui, -apple-system, sans-serif; 
            overflow: hidden;
        }
        .animate-pulse { 
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; 
        }
        .animate-ping { 
            animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite; 
        }
        .animate-spin { 
            animation: spin 1s linear infinite; 
        }
        @keyframes pulse { 
            0%, 100% { opacity: 1; } 
            50% { opacity: .5; } 
        }
        @keyframes ping { 
            75%, 100% { transform: scale(2); opacity: 0; } 
        }
        @keyframes spin { 
            from { transform: rotate(0deg); } 
            to { transform: rotate(360deg); } 
        }
        .blur-2xl { filter: blur(40px); }
        .blur-sm { filter: blur(4px); }
        .backdrop-blur-xl { backdrop-filter: blur(24px); }
        .backdrop-blur-sm { backdrop-filter: blur(4px); }
        .animate-in { animation: slideInFromBottom 0.5s ease-out; }
        @keyframes slideInFromBottom {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        .messages-container {
            scrollbar-width: thin;
            scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
        }
        .messages-container::-webkit-scrollbar {
            width: 6px;
        }
        .messages-container::-webkit-scrollbar-track {
            background: transparent;
        }
        .messages-container::-webkit-scrollbar-thumb {
            background-color: rgba(156, 163, 175, 0.5);
            border-radius: 3px;
        }
        .messages-container::-webkit-scrollbar-thumb:hover {
            background-color: rgba(156, 163, 175, 0.7);
        }
    </style>
</head>
<body>
    <div id="app" class="h-screen w-screen"></div>
    
    <script>
        class ProcurementAgent {
            constructor() {
                this.state = {
                    messages: [],
                    inputValue: '',
                    isLoading: false,
                    isDarkMode: false,
                    tableData: null
                };
                this.webhookUrl = '${webhookUrl}';
                this.messagesEndRef = null;
                this.isInitialized = false;
                this.eventsbound = false;
                this.init();
            }

            init() {
                if (!this.isInitialized) {
                    this.render();
                    this.bindEvents();
                    this.isInitialized = true;
                }
            }

            render() {
                const app = document.getElementById('app');
                app.innerHTML = this.getHTML();
                this.messagesEndRef = document.getElementById('messages-end');
                this.scrollToBottom();
            }

            getHTML() {
                return \`
                <div class="h-screen w-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col">
                    <!-- Header -->
                    <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 p-4">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-3">
                                <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                </div>
                                <div>
                                    <h1 class="text-xl font-bold text-gray-900 dark:text-white">Procurement Assistant</h1>
                                    <p class="text-sm text-gray-600 dark:text-gray-400">AI-powered procurement management</p>
                                </div>
                            </div>
                            <div class="flex items-center space-x-2">
                                <button id="dark-mode-toggle" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                    <svg class="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Main Content -->
                    <div class="flex-1 flex overflow-hidden">
                        <!-- Sidebar -->
                        <div class="w-80 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-r border-gray-200/50 dark:border-gray-700/50 p-4">
                            <div class="space-y-4">
                                <div class="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-4 text-white">
                                    <h3 class="font-semibold mb-2">Quick Actions</h3>
                                    <div class="space-y-2">
                                        <button class="w-full text-left p-2 rounded-lg hover:bg-white/20 transition-colors text-sm">
                                            📋 Create Purchase Order
                                        </button>
                                        <button class="w-full text-left p-2 rounded-lg hover:bg-white/20 transition-colors text-sm">
                                            📦 Check Inventory
                                        </button>
                                        <button class="w-full text-left p-2 rounded-lg hover:bg-white/20 transition-colors text-sm">
                                            💰 Analyze Spending
                                        </button>
                                        <button class="w-full text-left p-2 rounded-lg hover:bg-white/20 transition-colors text-sm">
                                            🏢 Supplier Management
                                        </button>
                                    </div>
                                </div>

                                <div class="bg-white/80 dark:bg-gray-800/80 rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
                                    <h3 class="font-semibold text-gray-900 dark:text-white mb-3">Recent Activities</h3>
                                    <div class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                        <div class="flex items-center space-x-2">
                                            <div class="w-2 h-2 bg-green-400 rounded-full"></div>
                                            <span>PO-2024-001 Approved</span>
                                        </div>
                                        <div class="flex items-center space-x-2">
                                            <div class="w-2 h-2 bg-blue-400 rounded-full"></div>
                                            <span>New Supplier Added</span>
                                        </div>
                                        <div class="flex items-center space-x-2">
                                            <div class="w-2 h-2 bg-yellow-400 rounded-full"></div>
                                            <span>Inventory Alert</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Chat Area -->
                        <div class="flex-1 flex flex-col">
                            <!-- Messages -->
                            <div id="messages-container" class="flex-1 overflow-y-auto p-4 space-y-4 messages-container">
                                <div class="flex justify-center">
                                    <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 max-w-2xl text-center border border-gray-200/50 dark:border-gray-700/50">
                                        <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                            </svg>
                                        </div>
                                        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Welcome to Procurement Assistant</h2>
                                        <p class="text-gray-600 dark:text-gray-400 mb-4">I can help you with purchase orders, inventory management, supplier analysis, and more.</p>
                                        <div class="grid grid-cols-2 gap-2 text-sm">
                                            <button class="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
                                                "Show me current POs"
                                            </button>
                                            <button class="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors">
                                                "Check inventory levels"
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div id="messages-end"></div>
                            </div>

                            <!-- Input Area -->
                            <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-t border-gray-200/50 dark:border-gray-700/50 p-4">
                                <div class="flex space-x-3">
                                    <input
                                        id="message-input"
                                        type="text"
                                        placeholder="Ask me about procurement..."
                                        class="flex-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                    <button
                                        id="send-button"
                                        class="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                    >
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                \`;
            }

            bindEvents() {
                if (this.eventsbound) return;
                
                const input = document.getElementById('message-input');
                const sendButton = document.getElementById('send-button');
                const darkModeToggle = document.getElementById('dark-mode-toggle');

                if (input) {
                    input.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            this.handleSendMessage();
                        }
                    });
                }

                if (sendButton) {
                    sendButton.addEventListener('click', () => {
                        this.handleSendMessage();
                    });
                }

                if (darkModeToggle) {
                    darkModeToggle.addEventListener('click', () => {
                        this.toggleDarkMode();
                    });
                }

                this.eventsbound = true;
            }

            async handleSendMessage() {
                const input = document.getElementById('message-input');
                const message = input.value.trim();
                
                if (!message || this.state.isLoading) return;

                // Add user message
                this.addMessage(message, 'user');
                input.value = '';

                // Show loading state
                this.showLoading();

                try {
                    const response = await fetch(this.webhookUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            message: message,
                            sessionId: "procurement-popup-session"
                        })
                    });

                    if (!response.ok) throw new Error(\`HTTP error! status: \${response.status}\`);

                    const data = await response.json();
                    
                    let outputContent = '';
                    if (Array.isArray(data)) {
                        const firstItem = data[0];
                        outputContent = typeof firstItem?.output === 'string' ? firstItem.output : 'Array response received';
                    } else {
                        outputContent = typeof data.output === 'string' 
                            ? data.output 
                            : data.response || data.message || 'No output received';
                    }

                    this.addMessage(outputContent, 'agent');
                } catch (error) {
                    // Handle webhook error silently
                } finally {
                    this.hideLoading();
                }
            }

            addMessage(content, type) {
                const message = {
                    id: Date.now(),
                    content: content,
                    type: type,
                    timestamp: new Date().toLocaleTimeString()
                };

                this.state.messages.push(message);
                this.renderMessage(message);
                this.scrollToBottom();
            }

            renderMessage(message) {
                const container = document.getElementById('messages-container');
                const messageDiv = document.createElement('div');
                
                const isUser = message.type === 'user';
                const bgColor = isUser ? 'bg-blue-500 text-white' : 'bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white';
                const alignClass = isUser ? 'justify-end' : 'justify-start';
                
                messageDiv.innerHTML = \`
                    <div class="flex \${alignClass}">
                        <div class="\${bgColor} backdrop-blur-sm rounded-2xl px-4 py-3 max-w-xs lg:max-w-md border border-gray-200/50 dark:border-gray-700/50">
                            <p class="text-sm">\${message.content}</p>
                            <p class="text-xs opacity-70 mt-2">\${message.timestamp}</p>
                        </div>
                    </div>
                \`;
                
                container.insertBefore(messageDiv, document.getElementById('messages-end'));
            }

            showLoading() {
                this.state.isLoading = true;
                const container = document.getElementById('messages-container');
                const loadingDiv = document.createElement('div');
                loadingDiv.id = 'loading-message';
                loadingDiv.innerHTML = \`
                    <div class="flex justify-start">
                        <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl px-4 py-3 border border-gray-200/50 dark:border-gray-700/50">
                            <div class="flex space-x-1">
                                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                            </div>
                        </div>
                    </div>
                \`;
                
                container.insertBefore(loadingDiv, document.getElementById('messages-end'));
                this.scrollToBottom();
            }

            hideLoading() {
                this.state.isLoading = false;
                const loadingMessage = document.getElementById('loading-message');
                if (loadingMessage) {
                    loadingMessage.remove();
                }
            }

            toggleDarkMode() {
                this.state.isDarkMode = !this.state.isDarkMode;
                document.documentElement.classList.toggle('dark', this.state.isDarkMode);
            }

            scrollToBottom() {
                if (this.messagesEndRef) {
                    this.messagesEndRef.scrollIntoView({ behavior: 'smooth' });
                }
            }
        }

        // Initialize the agent
        const agent = new ProcurementAgent();
    </script>
</body>
</html>`;

      popup.document.write(procurementAgentHTML);
      popup.document.close();
      setShowPopupLauncher(false);
    } else {
      alert('Please allow popups for this site to open the Procurement Assistant. Check your browser\'s popup blocker settings.');
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputValue,
          sessionId: "procurement-session"
        })
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      
      let outputContent = '';
      if (Array.isArray(data)) {
        const firstItem = data[0];
        outputContent = typeof firstItem?.output === 'string' ? firstItem.output : 'Array response received';
      } else {
        outputContent = typeof data.output === 'string' 
          ? data.output 
          : data.response || data.message || 'No output received';
      }

      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        content: outputContent,
        timestamp: new Date().toLocaleTimeString()
      };

      setMessages(prev => [...prev, agentMessage]);
    } catch (error) {
      // Handle webhook error silently
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    { text: "Show me current purchase orders", icon: <ShoppingCart size={16} /> },
    { text: "Check inventory levels", icon: <Package size={16} /> },
    { text: "Analyze spending patterns", icon: <DollarSign size={16} /> },
    { text: "Identify cost savings opportunities", icon: <TrendingUp size={16} /> },
    { text: "Check supplier performance", icon: <AlertTriangle size={16} /> },
  ];

  if (showPopupLauncher) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 p-8">
        <div className="text-center max-w-2xl">
          <div className="relative mb-8">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl transform hover:scale-105 transition-transform duration-300">
              <Bot size={64} className="text-white" />
            </div>
            <div className="absolute -top-3 -right-3 w-10 h-10 bg-green-400 rounded-full border-4 border-white animate-pulse flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full"></div>
            </div>
            
            {/* Floating icons around main icon */}
            <div className="absolute -top-2 -left-2 w-8 h-8 bg-indigo-400 rounded-full border-2 border-white animate-bounce delay-1000">
              <MessageSquare size={16} className="text-white m-1" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-400 rounded-full border-2 border-white animate-bounce delay-500">
              <ExternalLink size={16} className="text-white m-1" />
            </div>
          </div>

          <h1 className="text-4xl font-bold text-gray-800 mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Procurement Assistant
          </h1>
          
          <p className="text-gray-600 mb-8 text-lg leading-relaxed">
            Launch your dedicated procurement AI assistant in a separate window. 
            Continue working seamlessly while having instant access to purchase orders, vendor management, 
            and procurement analytics tools.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/70 rounded-xl p-6 shadow-lg backdrop-blur-sm border border-blue-200/50">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-lg flex items-center justify-center mx-auto mb-4">
                <ExternalLink size={24} className="text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Independent Window</h3>
              <p className="text-sm text-gray-600">Opens in a separate tab, completely independent of your current application</p>
            </div>
            
            <div className="bg-white/70 rounded-xl p-6 shadow-lg backdrop-blur-sm border border-blue-200/50">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-lg flex items-center justify-center mx-auto mb-4">
                <MessageSquare size={24} className="text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Full Features</h3>
              <p className="text-sm text-gray-600">Complete procurement assistant with AI chat, reports, and vendor management</p>
            </div>
            
            <div className="bg-white/70 rounded-xl p-6 shadow-lg backdrop-blur-sm border border-blue-200/50">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Bot size={24} className="text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Always Available</h3>
              <p className="text-sm text-gray-600">Keep the assistant open while working, can be minimized and restored anytime</p>
            </div>
          </div>

          <button
            onClick={openProcurementChat}
            className="group bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-4 px-10 rounded-2xl shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-4 mx-auto text-lg"
          >
            <MessageSquare size={28} />
            <span>Launch Procurement Assistant</span>
            <ExternalLink size={24} className="group-hover:translate-x-1 transition-transform duration-300" />
          </button>

          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>New Tab/Window</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>Independent Layout</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span>Full Procurement Suite</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
              <span>Always Accessible</span>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> If the popup does not open, please check your browser popup blocker settings and allow popups for this site.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-t-lg">
            <div className="flex items-center space-x-3">
              <Bot className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">Procurement AI Assistant</h1>
                <p className="text-blue-100">AI-powered procurement management and analytics</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => setInputValue(action.text)}
                  className="p-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors text-left"
                >
                  <div className="flex items-center space-x-2">
                    {action.icon}
                    <span className="text-sm text-gray-700 dark:text-gray-300">{action.text}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Interface */}
          <div className="p-6">
            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-blue-500 text-white'
                        : message.type === 'error'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">{message.timestamp}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex space-x-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about procurement..."
                className="flex-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 