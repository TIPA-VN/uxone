'use client';
import React from 'react';
import { Bot, MessageSquare, ExternalLink } from 'lucide-react';

const PopupLauncher: React.FC = () => {
  const openProcurementChat = () => {
    // Complete standalone HTML for the procurement agent
    const procurementAgentHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Purchasing Assistant</title>
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
                this.webhookUrl = process.env.NEXT_PUBLIC_PR_AGENT_URL || 'http://10.116.2.72:5678/webhook/pr-agent-prompt';
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

            setState(newState) {
                const oldState = { ...this.state };
                this.state = { ...this.state, ...newState };

                
                // Only update specific parts of the DOM instead of full re-render
                this.updateDOM(oldState);
                this.scrollToBottom();
            }

            updateDOM(oldState) {
                // Update messages if changed
                if (oldState.messages !== this.state.messages || oldState.isLoading !== this.state.isLoading) {
                    this.updateMessages();
                }

                // Update send button state
                this.updateSendButton();
            }

            // Enhanced message formatting for PO data
            formatPurchaseOrderData(content) {

                // Check if content contains structured PO data
                if (content.includes('Tổng số dòng PO mở') || content.includes('Total Open PO Lines') || 
                    (content.includes('PO:') && content.includes('Nhà cung cấp'))) {
                    return this.formatStructuredPOData(content);
                }
                
                // Default formatting for regular messages
                return this.formatRegularMessage(content);
            }

            formatStructuredPOData(content) {
                // Extract key metrics using regex patterns
                const metrics = {
                    totalLines: this.extractNumber(content, /(?:Tổng số dòng PO mở|Total Open PO Lines)[:\\s*]*([\\d,]+)/),
                    completed: this.extractNumber(content, /(?:Đã hoàn thành đầy đủ|Fully Completed)[:\\s*]*([\\d,]+)/),
                    partial: this.extractNumber(content, /(?:Đã hoàn thành một phần|Partially Completed)[:\\s*]*([\\d,]+)/),
                    notCompleted: this.extractNumber(content, /(?:Chưa hoàn thành|Not Completed)[:\\s*]*([\\d,]+)/),
                    urgent: this.extractNumber(content, /(?:Đơn hàng khẩn cấp|Urgent Orders)[:\\s*]*([\\d,]+)/)
                };



                // Extract PO details
                const poMatches = content.match(/PO:\\s*(\\d+).*?(?=PO:|$)/gs) || [];
                const poDetails = poMatches.map(po => this.extractPODetails(po));



                return this.generateFormattedHTML(metrics, poDetails);
            }

            formatRegularMessage(content) {
                return content.replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>')
                             .replace(/\\*(.*?)\\*/g, '<em>$1</em>')
                             .replace(/\\n/g, '<br>');
            }

            extractNumber(text, regex) {
                const match = text.match(regex);
                return match ? parseInt(match[1].replace(/[,\\.]/g, '')) : 0;
            }

            extractPODetails(poText) {
                return {
                    number: this.extractField(poText, /PO:\\s*(\\d+)/),
                    supplier: this.extractField(poText, /(?:Nhà cung cấp|Supplier):\\s*([^,\\n]+)/),
                    item: this.extractField(poText, /(?:Mã hàng|Item):\\s*([^,\\n]+)/),
                    dueDate: this.extractField(poText, /(?:Ngày dự kiến|Due Date):\\s*([^,\\n]+)/),
                    ordered: this.extractField(poText, /(?:Số lượng đặt|Ordered):\\s*(\\d+)/),
                    open: this.extractField(poText, /(?:Số lượng mở|Open):\\s*(\\d+)/),
                    value: this.extractField(poText, /(?:Giá trị mở|Open Value):\\s*(\\d+)/)
                };
            }

            extractField(text, regex) {
                const match = text.match(regex);
                return match ? match[1].trim() : '';
            }

            generateFormattedHTML(metrics, poDetails) {
                const { isDarkMode } = this.state;
                
                return \`
                    <div class="space-y-4">
                        <!-- Overview Section -->
                        <div class="\${isDarkMode ? 'bg-amber-900/40 border-amber-700/50' : 'bg-orange-50/80 border-orange-200/60'} rounded-xl p-4 border">
                            <div class="flex items-center space-x-2 mb-3">
                                <i data-lucide="bar-chart-3" class="\${isDarkMode ? 'text-amber-400' : 'text-orange-600'} w-5 h-5"></i>
                                <h3 class="\${isDarkMode ? 'text-amber-300' : 'text-orange-700'} font-semibold">Purchase Order Overview</h3>
                            </div>
                            
                            <div class="grid grid-cols-2 gap-3">
                                <div class="text-center">
                                    <div class="\${isDarkMode ? 'text-amber-400' : 'text-orange-600'} text-2xl font-bold">\${metrics.totalLines.toLocaleString()}</div>
                                    <div class="\${isDarkMode ? 'text-amber-300' : 'text-orange-700'} text-xs">Total Lines</div>
                                </div>
                                <div class="text-center">
                                    <div class="\${isDarkMode ? 'text-red-400' : 'text-red-600'} text-2xl font-bold">\${metrics.urgent.toLocaleString()}</div>
                                    <div class="\${isDarkMode ? 'text-red-300' : 'text-red-700'} text-xs">Urgent Orders</div>
                                </div>
                            </div>
                            
                            <div class="mt-3 grid grid-cols-3 gap-2 text-xs">
                                <div class="text-center">
                                    <div class="\${isDarkMode ? 'text-green-400' : 'text-green-600'} font-semibold">\${metrics.completed}</div>
                                    <div class="\${isDarkMode ? 'text-green-300' : 'text-green-700'}">Completed</div>
                                </div>
                                <div class="text-center">
                                    <div class="\${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'} font-semibold">\${metrics.partial}</div>
                                    <div class="\${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}">Partial</div>
                                </div>
                                <div class="text-center">
                                    <div class="\${isDarkMode ? 'text-gray-400' : 'text-gray-600'} font-semibold">\${metrics.notCompleted}</div>
                                    <div class="\${isDarkMode ? 'text-gray-300' : 'text-gray-700'}">Pending</div>
                                </div>
                            </div>
                        </div>

                        <!-- Urgent Orders Section -->
                        \${poDetails.length > 0 ? \`
                            <div class="\${isDarkMode ? 'bg-red-900/40 border-red-700/50' : 'bg-red-50/80 border-red-200/60'} rounded-xl p-4 border">
                                <div class="flex items-center space-x-2 mb-3">
                                    <i data-lucide="alert-triangle" class="\${isDarkMode ? 'text-red-400' : 'text-red-600'} w-5 h-5"></i>
                                    <h3 class="\${isDarkMode ? 'text-red-300' : 'text-red-700'} font-semibold">Urgent Orders (\${metrics.urgent.toLocaleString()} total)</h3>
                                </div>
                                
                                <div class="space-y-3">
                                    \${poDetails.slice(0, 4).map(po => \`
                                        <div class="\${isDarkMode ? 'bg-red-800/30 border-red-600/30' : 'bg-white/60 border-red-300/50'} rounded-lg p-3 border">
                                            <div class="flex justify-between items-start mb-2">
                                                <div class="\${isDarkMode ? 'text-red-300' : 'text-red-700'} font-bold">PO: \${po.number}</div>
                                                <div class="\${isDarkMode ? 'text-red-400' : 'text-red-600'} text-xs">\${po.dueDate}</div>
                                            </div>
                                            
                                            <div class="\${isDarkMode ? 'text-red-200' : 'text-red-800'} text-sm mb-1 font-medium">\${po.supplier}</div>
                                            <div class="\${isDarkMode ? 'text-red-300' : 'text-red-700'} text-xs mb-2">Item: \${po.item}</div>
                                            
                                            <div class="flex justify-between text-xs">
                                                <span class="\${isDarkMode ? 'text-red-400' : 'text-red-600'}">Ordered: \${po.ordered ? parseInt(po.ordered).toLocaleString() : 'N/A'}</span>
                                                <span class="\${isDarkMode ? 'text-red-400' : 'text-red-600'}">Open: \${po.open ? parseInt(po.open).toLocaleString() : 'N/A'}</span>
                                                <span class="\${isDarkMode ? 'text-red-400' : 'text-red-600'}">Value: \${po.value ? parseInt(po.value).toLocaleString() : 'N/A'}</span>
                                            </div>
                                        </div>
                                    \`).join('')}
                                </div>
                            </div>
                        \` : ''}

                        <!-- Recommendations Section -->
                        <div class="\${isDarkMode ? 'bg-blue-900/40 border-blue-700/50' : 'bg-blue-50/80 border-blue-200/60'} rounded-xl p-4 border">
                            <div class="flex items-center space-x-2 mb-3">
                                <i data-lucide="lightbulb" class="\${isDarkMode ? 'text-blue-400' : 'text-blue-600'} w-5 h-5"></i>
                                <h3 class="\${isDarkMode ? 'text-blue-300' : 'text-blue-700'} font-semibold">Recommendations</h3>
                            </div>
                            
                            <div class="space-y-2 text-sm">
                                <div class="flex items-start space-x-2">
                                    <i data-lucide="check-square" class="\${isDarkMode ? 'text-green-400' : 'text-green-600'} w-4 h-4 mt-0.5"></i>
                                    <span class="\${isDarkMode ? 'text-blue-200' : 'text-blue-800'}">Follow up on \${metrics.notCompleted.toLocaleString()} incomplete orders</span>
                                </div>
                                <div class="flex items-start space-x-2">
                                    <i data-lucide="clock" class="\${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'} w-4 h-4 mt-0.5"></i>
                                    <span class="\${isDarkMode ? 'text-blue-200' : 'text-blue-800'}">Check \${metrics.urgent.toLocaleString()} overdue orders</span>
                                </div>
                                <div class="flex items-start space-x-2">
                                    <i data-lucide="phone" class="\${isDarkMode ? 'text-blue-400' : 'text-blue-600'} w-4 h-4 mt-0.5"></i>
                                    <span class="\${isDarkMode ? 'text-blue-200' : 'text-blue-800'}">Contact suppliers for \${metrics.partial} partial orders</span>
                                </div>
                            </div>
                        </div>
                    </div>
                \`;
            }

            updateMessages() {

                const messagesContainer = document.getElementById('messages-container');
                if (!messagesContainer) {
                    console.error('Messages container not found');
                    return;
                }

                const { messages, isLoading } = this.state;
                
                let content = '';
                
                if (messages.length === 0) {
                    content += this.renderWelcomeMessage();
                } else {
                    content += messages.map(msg => this.renderMessage(msg)).join('');
                }

                if (isLoading) {
                    content += this.renderLoadingMessage();
                }

                messagesContainer.innerHTML = content;

                
                // Re-initialize icons
                if (window.lucide) {
                    window.lucide.createIcons();
                }
            }

            renderWelcomeMessage() {
                const { isDarkMode } = this.state;
                return \`
                    <div class="text-center mt-20">
                        <div class="relative mb-6">
                            <div class="\${isDarkMode ? 'bg-gradient-to-br from-amber-700/20 to-orange-700/20 border border-amber-600/30' : 'bg-gradient-to-br from-orange-200/40 to-amber-200/40 border border-orange-400/40'} w-20 h-20 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-sm transition-all duration-300">
                                <i data-lucide="bot" class="\${isDarkMode ? 'text-amber-400' : 'text-orange-600'} w-9 h-9"></i>
                            </div>
                            <div class="\${isDarkMode ? 'bg-amber-600/20' : 'bg-orange-400/30'} absolute inset-0 w-20 h-20 rounded-2xl mx-auto animate-ping transition-all duration-300"></div>
                        </div>
                        <p class="\${isDarkMode ? 'text-slate-200' : 'text-gray-800'} font-medium text-lg mb-2 transition-all duration-300">Purchasing Assistant Online</p>
                        <p class="\${isDarkMode ? 'text-slate-400' : 'text-gray-600'} text-sm mb-4 transition-all duration-300">Ready to assist with purchase orders, vendor management, and customer support</p>
                        
                        <div class="flex flex-wrap justify-center gap-3 mt-6">
                            <button class="quick-action \${isDarkMode ? 'bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 border border-slate-700/50' : 'bg-gray-50/60 hover:bg-gray-100/80 text-gray-700 border border-gray-300/50'} px-4 py-2 rounded-xl text-sm transition-all duration-200" data-message="Show me current purchase orders">
                                <i data-lucide="shopping-bag" class="w-3.5 h-3.5 mr-2 inline"></i>
                                Purchase Orders
                            </button>
                            <button class="quick-action \${isDarkMode ? 'bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 border border-slate-700/50' : 'bg-gray-50/60 hover:bg-gray-100/80 text-gray-700 border border-gray-300/50'} px-4 py-2 rounded-xl text-sm transition-all duration-200" data-message="Check vendor payment status">
                                <i data-lucide="credit-card" class="w-3.5 h-3.5 mr-2 inline"></i>
                                Payment Status
                            </button>
                            <button class="quick-action \${isDarkMode ? 'bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 border border-slate-700/50' : 'bg-gray-50/60 hover:bg-gray-100/80 text-gray-700 border border-gray-300/50'} px-4 py-2 rounded-xl text-sm transition-all duration-200" data-message="Generate spending report">
                                <i data-lucide="file-spreadsheet" class="w-3.5 h-3.5 mr-2 inline"></i>
                                Spending Report
                            </button>
                        </div>
                    </div>
                \`;
            }

            renderMessage(msg) {
                const { isDarkMode } = this.state;
                
                // Check if this is a structured PO response
                const isStructuredData = msg.content.includes('Tổng số dòng PO mở') || 
                                        msg.content.includes('Total Open PO Lines') ||
                                        (msg.content.includes('PO:') && msg.content.includes('Nhà cung cấp'));
                
                let messageContent = msg.content;
                
                if (isStructuredData && msg.type === 'agent') {
                    messageContent = this.formatPurchaseOrderData(msg.content);
                } else {
                    // Regular text formatting
                    messageContent = this.formatRegularMessage(msg.content);
                }
                
                return \`
                    <div class="flex \${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-in">
                        <div class="flex items-start space-x-3 max-w-lg lg:max-w-2xl">
                            \${msg.type !== 'user' ? \`
                                <div class="\${msg.type === 'error' ? (isDarkMode ? 'bg-red-500/20 border border-red-400/30' : 'bg-red-200/40 border border-red-400/40') : (isDarkMode ? 'bg-gradient-to-br from-amber-700/20 to-orange-700/20 border border-amber-600/30' : 'bg-gradient-to-br from-orange-200/40 to-amber-200/40 border border-orange-400/40')} w-10 h-10 rounded-2xl flex items-center justify-center mt-1 backdrop-blur-sm transition-all duration-300">
                                    <i data-lucide="bot" class="\${msg.type === 'error' ? (isDarkMode ? 'text-red-400' : 'text-red-600') : (isDarkMode ? 'text-amber-400' : 'text-orange-600')} w-4.5 h-4.5"></i>
                                </div>
                            \` : ''}
                            
                            <div class="\${msg.type === 'user' ? (isDarkMode ? 'bg-gradient-to-r from-amber-700 to-orange-700 text-white border-amber-600/30 shadow-amber-600/20' : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-400/40 shadow-orange-400/30') : msg.type === 'error' ? (isDarkMode ? 'bg-red-500/20 text-red-300 border-red-400/30 shadow-red-500/20' : 'bg-red-200/40 text-red-700 border-red-400/40 shadow-red-400/30') : (isDarkMode ? 'bg-amber-800/60 text-amber-200 border-amber-700/50 shadow-amber-900/50' : 'bg-orange-50/80 text-orange-800 border-orange-300/50 shadow-orange-300/30')} px-5 py-4 rounded-2xl border relative shadow-lg backdrop-blur-sm transition-all duration-300">
                                <div class="text-sm leading-relaxed" id="message-\${msg.id}">\${messageContent}</div>
                                <p class="text-xs mt-2 opacity-75 flex items-center">
                                    <span>\${msg.timestamp}</span>
                                </p>
                            </div>

                            \${msg.type === 'user' ? \`
                                <div class="\${isDarkMode ? 'bg-gradient-to-br from-amber-700 to-orange-700 shadow-amber-600/20' : 'bg-gradient-to-br from-orange-500 to-amber-500 shadow-orange-400/30'} w-10 h-10 rounded-2xl flex items-center justify-center mt-1 shadow-lg transition-all duration-300">
                                    <i data-lucide="user" class="text-white w-4.5 h-4.5"></i>
                                </div>
                            \` : ''}
                        </div>
                    </div>
                \`;
            }

            renderLoadingMessage() {
                const { isDarkMode } = this.state;
                return \`
                    <div class="flex justify-start animate-in">
                        <div class="flex items-start space-x-3">
                            <div class="\${isDarkMode ? 'bg-gradient-to-br from-amber-700/20 to-orange-700/20 border border-amber-600/30' : 'bg-gradient-to-br from-orange-200/40 to-amber-200/40 border border-orange-400/40'} w-10 h-10 rounded-2xl flex items-center justify-center backdrop-blur-sm transition-all duration-300">
                                <i data-lucide="bot" class="\${isDarkMode ? 'text-amber-400' : 'text-orange-600'} w-4.5 h-4.5"></i>
                            </div>
                            <div class="\${isDarkMode ? 'bg-amber-800/60 border-amber-700/50' : 'bg-orange-50/80 border-orange-300/50'} px-5 py-4 rounded-2xl flex items-center space-x-3 border shadow-lg backdrop-blur-sm transition-all duration-300">
                                <i data-lucide="loader-2" class="\${isDarkMode ? 'text-amber-400' : 'text-orange-600'} w-4.5 h-4.5 animate-spin"></i>
                                <span class="\${isDarkMode ? 'text-amber-200' : 'text-orange-800'} text-sm transition-all duration-300">Processing purchase request...</span>
                                <div class="flex space-x-1">
                                    <div class="\${isDarkMode ? 'bg-amber-400' : 'bg-orange-600'} w-2 h-2 rounded-full animate-pulse"></div>
                                    <div class="\${isDarkMode ? 'bg-orange-400' : 'bg-amber-600'} w-2 h-2 rounded-full animate-pulse delay-100"></div>
                                    <div class="\${isDarkMode ? 'bg-red-400' : 'bg-yellow-600'} w-2 h-2 rounded-full animate-pulse delay-200"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                \`;
            }

            updateSendButton() {
                const sendButton = document.getElementById('send-button');
                if (!sendButton) return;

                const { isLoading, inputValue, isDarkMode } = this.state;
                const isDisabled = isLoading || !inputValue.trim();
                
                sendButton.disabled = isDisabled;
                sendButton.className = \`border-0 shadow-lg disabled:opacity-50 h-auto px-6 rounded-xl transition-all duration-200 flex items-center justify-center min-w-[60px] \${isDarkMode ? 'bg-gradient-to-r from-amber-700 to-orange-700 hover:from-amber-800 hover:to-orange-800 text-white shadow-amber-600/20' : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-400/30'}\`;
                
                sendButton.innerHTML = isLoading ? \`
                    <div class="flex items-center space-x-2">
                        <i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i>
                        <i data-lucide="shopping-bag" class="w-4 h-4 animate-pulse"></i>
                    </div>
                \` : \`
                    <div class="flex items-center space-x-2">
                        <i data-lucide="send" class="w-5 h-5"></i>
                        <i data-lucide="bot" class="w-4 h-4"></i>
                    </div>
                \`;

                if (window.lucide) {
                    window.lucide.createIcons();
                }
            }

            scrollToBottom() {
                setTimeout(() => {
                    const container = document.getElementById('messages-container');
                    if (container) {
                        container.scrollTop = container.scrollHeight;
                    }
                }, 100);
            }

            async sendMessage() {

                // Get the current input value from DOM directly
                const input = document.getElementById('message-input');
                const currentInput = input ? input.value.trim() : '';
                
                if (!currentInput || this.state.isLoading) {
    
                    return;
                }

                const userMessage = {
                    id: Date.now(),
                    type: 'user',
                    content: currentInput,
                    timestamp: new Date().toLocaleTimeString()
                };

                // Clear input completely
                if (input) {
                    input.value = '';
                }
                
                // Update state with cleared input
                this.state.inputValue = '';
                
                this.setState({
                    messages: [...this.state.messages, userMessage],
                    inputValue: '',
                    isLoading: true
                });

                try {
                    const response = await fetch(this.webhookUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            message: userMessage.content,
                            sessionId: "123456789"
                        })
                    });

                    if (!response.ok) throw new Error(\`HTTP error! status: \${response.status}\`);

                    const data = await response.json();
                    
                    let outputContent;

                    if (Array.isArray(data)) {
                        const firstItem = data[0];
                        outputContent = typeof firstItem?.output === 'string' ? firstItem.output : 'Array response received';
                    } else {
                        outputContent = typeof data.output === 'string' 
                            ? data.output 
                            : data.response || data.message || 'No output received';
                    }

                    const agentMessage = {
                        id: Date.now() + 1,
                        type: 'agent',
                        content: outputContent,
                        timestamp: new Date().toLocaleTimeString()
                    };

                    this.setState({
                        messages: [...this.state.messages, agentMessage],
                        isLoading: false
                    });

                } catch (error) {
                    console.error('Error calling webhook:', error);
                    const errorMessage = {
                        id: Date.now() + 1,
                        type: 'error',
                        content: \`Error: \${error.message}\`,
                        timestamp: new Date().toLocaleTimeString()
                    };
                    this.setState({
                        messages: [...this.state.messages, errorMessage],
                        isLoading: false
                    });
                }
            }

            setQuickMessage(message) {
                const input = document.getElementById('message-input');
                if (input) {
                    input.value = message;
                    input.focus();
                    this.state.inputValue = message;
                    this.updateSendButton();
                }
            }

            bindEvents() {

                // Prevent multiple event binding
                if (this.eventsbound) return;
                this.eventsbound = true;

                document.addEventListener('click', (e) => {
                    if (e.target.id === 'send-button' || e.target.closest('#send-button')) {
                        e.preventDefault();
                        this.sendMessage();
                        return;
                    }
                    
                    if (e.target.id === 'theme-toggle' || e.target.closest('#theme-toggle')) {
                        e.preventDefault();
                        this.setState({ isDarkMode: !this.state.isDarkMode });
                        return;
                    }
                    
                    if (e.target.classList.contains('quick-action') || e.target.closest('.quick-action')) {
                        e.preventDefault();
                        const button = e.target.classList.contains('quick-action') ? e.target : e.target.closest('.quick-action');
                        const message = button.dataset.message;
                        if (message) {
                            this.setQuickMessage(message);
                        }
                        return;
                    }
                });

                document.addEventListener('keydown', (e) => {
                    if (e.target.id === 'message-input' && e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        this.sendMessage();
                    }
                });

                // Use input event for real-time updates
                document.addEventListener('input', (e) => {
                    if (e.target.id === 'message-input') {
                        this.state.inputValue = e.target.value;
                        this.updateSendButton();
                    }
                });


            }

            render() {

                const { isDarkMode } = this.state;
                const app = document.getElementById('app');
                
                if (!app) {
                    console.error('App element not found');
                    return;
                }
                
                app.innerHTML = \`
                    <div class="\${isDarkMode ? 'bg-orange-700' : 'bg-orange-400'} h-full flex relative overflow-hidden transition-all duration-300">
                        <!-- Solid Tuscan background -->
                        <div class="\${isDarkMode ? 'bg-amber-800' : 'bg-amber-500'} absolute inset-0 transition-all duration-300"></div>
                        
                        <!-- Background decorations -->
                        <div class="absolute inset-0">
                            <div class="\${isDarkMode ? 'bg-orange-600/30' : 'bg-orange-300/40'} absolute top-1/4 left-1/4 w-32 h-32 rounded-full blur-2xl animate-pulse transition-all duration-300"></div>
                            <div class="\${isDarkMode ? 'bg-amber-600/20' : 'bg-amber-300/30'} absolute bottom-1/3 right-1/3 w-40 h-40 rounded-full blur-2xl animate-pulse delay-1000 transition-all duration-300"></div>
                            <div class="\${isDarkMode ? 'bg-red-700/15' : 'bg-yellow-400/25'} absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-2xl animate-pulse delay-500 transition-all duration-300"></div>
                        </div>

                        <!-- Main Chat Interface -->
                        <div class="w-full h-full flex flex-col relative z-10 transition-all duration-300">
                            <div class="\${isDarkMode ? 'bg-slate-900/95 border-slate-700/50' : 'bg-white/95 border-gray-300/50'} h-full backdrop-blur-xl rounded-2xl border flex flex-col shadow-2xl overflow-hidden transition-all duration-300 m-6">
                                
                                <!-- Header -->
                                <div class="\${isDarkMode ? 'bg-gradient-to-r from-amber-700 via-orange-700 to-red-700 border-amber-700/50' : 'bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 border-orange-300/50'} border-b flex-shrink-0 p-6 transition-all duration-300">
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center space-x-4">
                                            <div class="relative">
                                                <div class="p-3 bg-white/10 rounded-2xl shadow-lg backdrop-blur-sm border border-white/20">
                                                    <i data-lucide="bot" class="w-6 h-6 text-white"></i>
                                                </div>
                                                <div class="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                                            </div>
                                            <div>
                                                <h2 class="text-xl font-bold text-white mb-1">Purchasing Assistant</h2>
                                                <div class="flex items-center space-x-3">
                                                    <div class="bg-green-500/20 text-green-300 border border-green-400/30 px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                                                        <div class="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse inline-block"></div>
                                                        Enhanced Data Format
                                                    </div>
                                                    <div class="border-white/30 text-white bg-white/10 px-3 py-1 rounded-full text-sm backdrop-blur-sm border">
                                                        <i data-lucide="shopping-bag" class="w-3 h-3 mr-1 inline"></i>
                                                        PO Intelligence
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <button id="theme-toggle" class="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-200 backdrop-blur-sm border border-white/20">
                                            <i data-lucide="\${isDarkMode ? 'sun' : 'moon'}" class="w-5 h-5 text-white"></i>
                                        </button>
                                    </div>
                                </div>

                                <!-- Messages Area -->
                                <div id="messages-container" class="\${isDarkMode ? 'bg-slate-900/50' : 'bg-white/50'} flex-1 overflow-y-auto p-6 space-y-6 min-h-0 transition-all duration-300 messages-container">
                                    <!-- Messages will be populated here -->
                                </div>

                                <!-- Input Area -->
                                <div class="\${isDarkMode ? 'bg-slate-900/60 border-slate-700/50' : 'bg-white/80 border-gray-300/50'} p-6 border-t flex-shrink-0 transition-all duration-300">
                                    <div class="flex space-x-4">
                                        <div class="flex-1">
                                            <textarea id="message-input" placeholder="Ask about purchase orders, vendor payments or customer inquiries..." rows="2" class="\${isDarkMode ? 'bg-slate-800/50 border-slate-700/50 text-slate-200 placeholder:text-slate-400 focus:border-slate-600/50 focus:ring-slate-600/20' : 'bg-gray-50/70 border-gray-300/50 text-gray-800 placeholder:text-gray-500 focus:border-gray-500/50 focus:ring-gray-500/20'} w-full resize-none rounded-xl px-4 py-3 backdrop-blur-sm border focus:outline-none focus:ring-2 transition-all duration-300"></textarea>
                                        </div>
                                        <button id="send-button" class="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0 shadow-lg disabled:opacity-50 h-auto px-6 rounded-xl transition-all duration-200 flex items-center justify-center min-w-[60px]" disabled>
                                            <div class="flex items-center space-x-2">
                                                <i data-lucide="send" class="w-5 h-5"></i>
                                                <i data-lucide="bot" class="w-4 h-4"></i>
                                            </div>
                                        </button>
                                    </div>
                                    
                                    <!-- Status bar -->
                                    <div class="flex items-center justify-between mt-4 text-xs">
                                        <div class="flex items-center space-x-4">
                                            <div class="\${isDarkMode ? 'text-slate-400' : 'text-gray-600'} flex items-center space-x-2">
                                                <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                                <span>Enhanced PO Formatting</span>
                                            </div>
                                            <div class="\${isDarkMode ? 'text-slate-400' : 'text-gray-600'} flex items-center space-x-2">
                                                <i data-lucide="bar-chart-3" class="w-3 h-3"></i>
                                                <span>Visual Metrics</span>
                                            </div>
                                        </div>
                                        <div class="\${isDarkMode ? 'text-slate-400' : 'text-gray-600'} flex items-center space-x-2">
                                            <i data-lucide="bot" class="w-3 h-3"></i>
                                            <span>Purchasing Intelligence Hub</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                \`;

                // Initialize welcome message
                this.updateMessages();

                // Re-initialize Lucide icons
                if (window.lucide) {
                    window.lucide.createIcons();
                }


            }
        }

        // Initialize the app
        function initializeApp() {
    
            try {
                new ProcurementAgent();
            } catch (error) {
                console.error('Error initializing app:', error);
                // Fallback display
                const app = document.getElementById('app');
                if (app) {
                    app.innerHTML = \`
                        <div class="h-full flex items-center justify-center bg-red-100">
                            <div class="text-center p-8 bg-white rounded-lg shadow-lg">
                                <h1 class="text-2xl font-bold text-red-600 mb-4">Error Loading Assistant</h1>
                                <p class="text-gray-600 mb-4">There was an error loading the Purchasing Assistant.</p>
                                <button onclick="location.reload()" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                                    Reload Page
                                </button>
                            </div>
                        </div>
                    \`;
                }
            }
        }

        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeApp);
        } else {
            initializeApp();
        }
    </script>
</body>
</html>`;

    // Create a new window/tab with specific dimensions and features
    const popup = window.open(
      '', 
      'PurchasingAssistant', 
      'width=1000,height=800,scrollbars=yes,resizable=yes,menubar=no,toolbar=no,location=no,status=no'
    );
    
    if (popup) {
      popup.document.write(procurementAgentHTML);
      popup.document.close();
      popup.focus();
      
      // Set the window title
      popup.document.title = 'Purchasing Assistant';
      
      // Optional: Add window close confirmation
      popup.addEventListener('beforeunload', function(e) {
        const confirmationMessage = 'Are you sure you want to close the Purchasing Assistant?';
        e.returnValue = confirmationMessage;
        return confirmationMessage;
      });
      
    } else {
      alert('Please allow popups for this site to open the Purchasing Assistant. Check your browser\'s popup blocker settings.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-100 to-amber-100 p-8">
      <div className="text-center max-w-2xl">
        <div className="relative mb-8">
          <div className="w-32 h-32 bg-gradient-to-br from-orange-500 to-amber-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl transform hover:scale-105 transition-transform duration-300">
            <Bot size={64} className="text-white" />
          </div>
          <div className="absolute -top-3 -right-3 w-10 h-10 bg-green-400 rounded-full border-4 border-white animate-pulse flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-full"></div>
          </div>
          
          {/* Floating icons around main icon */}
          <div className="absolute -top-2 -left-2 w-8 h-8 bg-amber-400 rounded-full border-2 border-white animate-bounce delay-1000">
            <MessageSquare size={16} className="text-white m-1" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-orange-400 rounded-full border-2 border-white animate-bounce delay-500">
            <ExternalLink size={16} className="text-white m-1" />
          </div>
        </div>

        <h1 className="text-4xl font-bold text-gray-800 mb-4 bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text transparent">
          Purchasing Assistant
        </h1>
        
        <p className="text-gray-600 mb-8 text-lg leading-relaxed">
          Launch your dedicated purchasing and customer service AI assistant in a separate window. 
          Continue working seamlessly while having instant access to purchase orders, vendor management, 
          and customer support tools.
        </p>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/70 rounded-xl p-6 shadow-lg backdrop-blur-sm border border-orange-200/50">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-400 rounded-lg flex items-center justify-center mx-auto mb-4">
              <ExternalLink size={24} className="text-white" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Independent Window</h3>
            <p className="text-sm text-gray-600">Opens in a separate tab, completely independent of your current application</p>
          </div>
          
          <div className="bg-white/70 rounded-xl p-6 shadow-lg backdrop-blur-sm border border-orange-200/50">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-400 rounded-lg flex items-center justify-center mx-auto mb-4">
              <MessageSquare size={24} className="text-white" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Full Features</h3>
            <p className="text-sm text-gray-600">Complete purchasing assistant with AI chat, reports, and vendor management</p>
          </div>
          
          <div className="bg-white/70 rounded-xl p-6 shadow-lg backdrop-blur-sm border border-orange-200/50">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-400 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Bot size={24} className="text-white" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Always Available</h3>
            <p className="text-sm text-gray-600">Keep the assistant open while working, can be minimized and restored anytime</p>
          </div>
        </div>

        <button
          onClick={openProcurementChat}
          className="group bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold py-4 px-10 rounded-2xl shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-4 mx-auto text-lg"
        >
          <MessageSquare size={28} />
          <span>Launch Purchasing Assistant</span>
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
            <span>Full Purchasing Suite</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
            <span>Always Accessible</span>
          </div>
        </div>

        <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
          <p className="text-sm text-amber-700">
            <strong>Note:</strong> If the popup does not open, please check your browser popup blocker settings and allow popups for this site.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PopupLauncher;