'use client';
import React from 'react';
import { Bot, MessageSquare, ExternalLink } from 'lucide-react';

const CustomerServiceLauncher: React.FC = () => {
  const openCustomerServiceChat = () => {
    // Complete standalone HTML for the customer service agent with Blue/Teal theme
    const customerServiceAgentHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Customer Service Assistant</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
    <style>
        body { 
            margin: 0; 
            padding: 0; 
            font-family: system-ui, -apple-system, sans-serif; 
            overflow: hidden;
        }
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .animate-ping { animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
        @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .blur-2xl { filter: blur(40px); }
        .backdrop-blur-xl { backdrop-filter: blur(24px); }
        .animate-in { animation: slideInFromBottom 0.5s ease-out; }
        @keyframes slideInFromBottom {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        .messages-container {
            scrollbar-width: thin;
            scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
        }
        .messages-container::-webkit-scrollbar { width: 6px; }
        .messages-container::-webkit-scrollbar-track { background: transparent; }
        .messages-container::-webkit-scrollbar-thumb {
            background-color: rgba(156, 163, 175, 0.5);
            border-radius: 3px;
        }
    </style>
</head>
<body>
    <div id="app" class="h-screen w-screen"></div>
    
    <script>
        class CustomerServiceAgent {
            constructor() {
                this.state = {
                    messages: [],
                    inputValue: '',
                    isLoading: false,
                    isDarkMode: false
                };
                this.webhookUrl = 'http://10.116.2.72:5678/webhook/cs-agent-prompt';
                this.isInitialized = false;
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
                this.updateDOM(oldState);
                this.scrollToBottom();
            }

            updateDOM(oldState) {
                if (oldState.isDarkMode !== this.state.isDarkMode) {
                    this.updateTheme();
                }
                if (oldState.messages !== this.state.messages || oldState.isLoading !== this.state.isLoading) {
                    this.updateMessages();
                }
                this.updateSendButton();
            }

            updateTheme() {
                const { isDarkMode } = this.state;
                const app = document.getElementById('app');
                
                const mainContainer = app.querySelector('.h-full.flex.relative.overflow-hidden');
                if (mainContainer) {
                    mainContainer.className = \`h-full flex relative overflow-hidden transition-all duration-300 \${isDarkMode ? 'bg-blue-700' : 'bg-sky-400'}\`;
                }

                const bgOverlay = app.querySelector('.absolute.inset-0.transition-all');
                if (bgOverlay) {
                    bgOverlay.className = \`absolute inset-0 transition-all duration-300 \${isDarkMode ? 'bg-teal-800' : 'bg-cyan-500'}\`;
                }

                const chatContainer = app.querySelector('.backdrop-blur-xl.rounded-2xl.border.flex.flex-col');
                if (chatContainer) {
                    chatContainer.className = \`h-full backdrop-blur-xl rounded-2xl border flex flex-col shadow-2xl overflow-hidden transition-all duration-300 m-6 \${isDarkMode ? 'bg-slate-900/95 border-slate-700/50' : 'bg-white/95 border-gray-300/50'}\`;
                }

                const header = app.querySelector('.border-b.flex-shrink-0.p-6');
                if (header) {
                    header.className = \`border-b flex-shrink-0 p-6 transition-all duration-300 \${isDarkMode ? 'bg-gradient-to-r from-blue-700 via-teal-700 to-cyan-700 border-blue-700/50' : 'bg-gradient-to-r from-sky-500 via-cyan-500 to-teal-500 border-sky-300/50'}\`;
                }

                const messagesContainer = document.getElementById('messages-container');
                if (messagesContainer) {
                    messagesContainer.className = \`flex-1 overflow-y-auto p-6 space-y-6 min-h-0 transition-all duration-300 messages-container \${isDarkMode ? 'bg-slate-900/50' : 'bg-white/50'}\`;
                }

                const inputArea = app.querySelector('.p-6.border-t.flex-shrink-0');
                if (inputArea) {
                    inputArea.className = \`p-6 border-t flex-shrink-0 transition-all duration-300 \${isDarkMode ? 'bg-slate-900/60 border-slate-700/50' : 'bg-white/80 border-gray-300/50'}\`;
                }

                const input = document.getElementById('message-input');
                if (input) {
                    input.className = \`w-full resize-none rounded-xl px-4 py-3 backdrop-blur-sm border focus:outline-none focus:ring-2 transition-all duration-300 \${isDarkMode ? 'bg-slate-800/50 border-slate-700/50 text-slate-200 placeholder:text-slate-400 focus:border-slate-600/50 focus:ring-slate-600/20' : 'bg-gray-50/70 border-gray-300/50 text-gray-800 placeholder:text-gray-500 focus:border-gray-500/50 focus:ring-gray-500/20'}\`;
                }

                const themeButton = document.getElementById('theme-toggle');
                if (themeButton) {
                    const icon = themeButton.querySelector('i');
                    if (icon) {
                        icon.setAttribute('data-lucide', isDarkMode ? 'sun' : 'moon');
                        if (window.lucide) window.lucide.createIcons();
                    }
                }

                this.updateSendButton();
                this.updateMessages();
            }

            updateMessages() {
                const messagesContainer = document.getElementById('messages-container');
                if (!messagesContainer) return;

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
                if (window.lucide) window.lucide.createIcons();
            }

            renderWelcomeMessage() {
                const { isDarkMode } = this.state;
                return \`
                    <div class="text-center mt-20">
                        <div class="relative mb-6">
                            <div class="\${isDarkMode ? 'bg-gradient-to-br from-blue-700/20 to-teal-700/20 border border-blue-600/30' : 'bg-gradient-to-br from-sky-200/40 to-cyan-200/40 border border-sky-400/40'} w-20 h-20 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-sm transition-all duration-300">
                                <i data-lucide="bot" class="\${isDarkMode ? 'text-blue-400' : 'text-sky-600'} w-9 h-9"></i>
                            </div>
                            <div class="\${isDarkMode ? 'bg-blue-600/20' : 'bg-sky-400/30'} absolute inset-0 w-20 h-20 rounded-2xl mx-auto animate-ping transition-all duration-300"></div>
                        </div>
                        <p class="\${isDarkMode ? 'text-slate-200' : 'text-gray-800'} font-medium text-lg mb-2 transition-all duration-300">Customer Service Assistant Online</p>
                        <p class="\${isDarkMode ? 'text-slate-400' : 'text-gray-600'} text-sm mb-4 transition-all duration-300">Ready to assist with customer inquiries, support tickets, and service requests</p>
                        
                        <div class="flex flex-wrap justify-center gap-3 mt-6">
                            <button class="quick-action \${isDarkMode ? 'bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 border border-slate-700/50' : 'bg-gray-50/60 hover:bg-gray-100/80 text-gray-700 border border-gray-300/50'} px-4 py-2 rounded-xl text-sm transition-all duration-200" data-message="Check customer support tickets">
                                <i data-lucide="ticket" class="w-3.5 h-3.5 mr-2 inline"></i>
                                Support Tickets
                            </button>
                            <button class="quick-action \${isDarkMode ? 'bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 border border-slate-700/50' : 'bg-gray-50/60 hover:bg-gray-100/80 text-gray-700 border border-gray-300/50'} px-4 py-2 rounded-xl text-sm transition-all duration-200" data-message="View customer satisfaction metrics">
                                <i data-lucide="heart" class="w-3.5 h-3.5 mr-2 inline"></i>
                                Satisfaction Metrics
                            </button>
                            <button class="quick-action \${isDarkMode ? 'bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 border border-slate-700/50' : 'bg-gray-50/60 hover:bg-gray-100/80 text-gray-700 border border-gray-300/50'} px-4 py-2 rounded-xl text-sm transition-all duration-200" data-message="Generate service report">
                                <i data-lucide="file-text" class="w-3.5 h-3.5 mr-2 inline"></i>
                                Service Report
                            </button>
                        </div>
                    </div>
                \`;
            }

            renderMessage(msg) {
                const { isDarkMode } = this.state;
                return \`
                    <div class="flex \${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-in">
                        <div class="flex items-start space-x-3 max-w-sm lg:max-w-md">
                            \${msg.type !== 'user' ? \`
                                <div class="\${msg.type === 'error' ? (isDarkMode ? 'bg-red-500/20 border border-red-400/30' : 'bg-red-200/40 border border-red-400/40') : (isDarkMode ? 'bg-gradient-to-br from-blue-700/20 to-teal-700/20 border border-blue-600/30' : 'bg-gradient-to-br from-sky-200/40 to-cyan-200/40 border border-sky-400/40')} w-10 h-10 rounded-2xl flex items-center justify-center mt-1 backdrop-blur-sm transition-all duration-300">
                                    <i data-lucide="bot" class="\${msg.type === 'error' ? (isDarkMode ? 'text-red-400' : 'text-red-600') : (isDarkMode ? 'text-blue-400' : 'text-sky-600')} w-4.5 h-4.5"></i>
                                </div>
                            \` : ''}
                            
                            <div class="\${msg.type === 'user' ? (isDarkMode ? 'bg-gradient-to-r from-blue-700 to-teal-700 text-white border-blue-600/30 shadow-blue-600/20' : 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white border-sky-400/40 shadow-sky-400/30') : msg.type === 'error' ? (isDarkMode ? 'bg-red-500/20 text-red-300 border-red-400/30 shadow-red-500/20' : 'bg-red-200/40 text-red-700 border-red-400/40 shadow-red-400/30') : (isDarkMode ? 'bg-teal-800/60 text-teal-200 border-teal-700/50 shadow-teal-900/50' : 'bg-sky-50/80 text-sky-800 border-sky-300/50 shadow-sky-300/30')} px-5 py-4 rounded-2xl border relative shadow-lg backdrop-blur-sm transition-all duration-300">
                                <p class="text-sm leading-relaxed" id="message-\${msg.id}">\${msg.content}</p>
                                <p class="text-xs mt-2 opacity-75 flex items-center">
                                    <span>\${msg.timestamp}</span>
                                </p>
                            </div>

                            \${msg.type === 'user' ? \`
                                <div class="\${isDarkMode ? 'bg-gradient-to-br from-blue-700 to-teal-700 shadow-blue-600/20' : 'bg-gradient-to-br from-sky-500 to-cyan-500 shadow-sky-400/30'} w-10 h-10 rounded-2xl flex items-center justify-center mt-1 shadow-lg transition-all duration-300">
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
                            <div class="\${isDarkMode ? 'bg-gradient-to-br from-blue-700/20 to-teal-700/20 border border-blue-600/30' : 'bg-gradient-to-br from-sky-200/40 to-cyan-200/40 border border-sky-400/40'} w-10 h-10 rounded-2xl flex items-center justify-center backdrop-blur-sm transition-all duration-300">
                                <i data-lucide="bot" class="\${isDarkMode ? 'text-blue-400' : 'text-sky-600'} w-4.5 h-4.5"></i>
                            </div>
                            <div class="\${isDarkMode ? 'bg-teal-800/60 border-teal-700/50' : 'bg-sky-50/80 border-sky-300/50'} px-5 py-4 rounded-2xl flex items-center space-x-3 border shadow-lg backdrop-blur-sm transition-all duration-300">
                                <i data-lucide="loader-2" class="\${isDarkMode ? 'text-blue-400' : 'text-sky-600'} w-4.5 h-4.5 animate-spin"></i>
                                <span class="\${isDarkMode ? 'text-teal-200' : 'text-sky-800'} text-sm transition-all duration-300">Processing customer request...</span>
                                <div class="flex space-x-1">
                                    <div class="\${isDarkMode ? 'bg-blue-400' : 'bg-sky-600'} w-2 h-2 rounded-full animate-pulse"></div>
                                    <div class="\${isDarkMode ? 'bg-teal-400' : 'bg-cyan-600'} w-2 h-2 rounded-full animate-pulse delay-100"></div>
                                    <div class="\${isDarkMode ? 'bg-cyan-400' : 'bg-teal-600'} w-2 h-2 rounded-full animate-pulse delay-200"></div>
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
                sendButton.className = \`border-0 shadow-lg disabled:opacity-50 h-auto px-6 rounded-xl transition-all duration-200 flex items-center justify-center min-w-[60px] \${isDarkMode ? 'bg-gradient-to-r from-blue-700 to-teal-700 hover:from-blue-800 hover:to-teal-800 text-white shadow-blue-600/20' : 'bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white shadow-sky-400/30'}\`;
                
                sendButton.innerHTML = isLoading ? \`
                    <div class="flex items-center space-x-2">
                        <i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i>
                        <i data-lucide="headphones" class="w-4 h-4 animate-pulse"></i>
                    </div>
                \` : \`
                    <div class="flex items-center space-x-2">
                        <i data-lucide="send" class="w-5 h-5"></i>
                        <i data-lucide="bot" class="w-4 h-4"></i>
                    </div>
                \`;

                if (window.lucide) window.lucide.createIcons();
            }

            bindEvents() {
                if (this.eventsbound) return;
                this.eventsbound = true;

                document.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    if (e.target.id === 'send-button' || e.target.closest('#send-button')) {
                        this.sendMessage();
                        return;
                    }
                    
                    if (e.target.id === 'theme-toggle' || e.target.closest('#theme-toggle')) {
                        this.setState({ isDarkMode: !this.state.isDarkMode });
                        return;
                    }
                    
                    if (e.target.classList.contains('quick-action') || e.target.closest('.quick-action')) {
                        const button = e.target.classList.contains('quick-action') ? e.target : e.target.closest('.quick-action');
                        const message = button.dataset.message;
                        if (message) this.setQuickMessage(message);
                        return;
                    }
                    
                    if (e.target.classList.contains('input-quick-action') || e.target.closest('.input-quick-action')) {
                        const button = e.target.classList.contains('input-quick-action') ? e.target : e.target.closest('.input-quick-action');
                        const message = button.dataset.message;
                        if (message) this.setQuickMessage(message);
                        return;
                    }
                });

                document.addEventListener('keydown', (e) => {
                    if (e.target.id === 'message-input' && e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        this.sendMessage();
                    }
                });

                document.addEventListener('input', (e) => {
                    if (e.target.id === 'message-input') {
                        this.state.inputValue = e.target.value;
                        this.updateSendButton();
                    }
                });

                document.addEventListener('paste', (e) => {
                    if (e.target.id === 'message-input') {
                        setTimeout(() => {
                            this.state.inputValue = e.target.value;
                            this.updateSendButton();
                        }, 0);
                    }
                });

                document.addEventListener('keyup', (e) => {
                    if (e.target.id === 'message-input') {
                        this.state.inputValue = e.target.value;
                        this.updateSendButton();
                    }
                });
            }

            async sendMessage() {
                const input = document.getElementById('message-input');
                const currentInput = input ? input.value.trim() : '';
                
                if (!currentInput || this.state.isLoading) return;

                const userMessage = {
                    id: Date.now(),
                    type: 'user',
                    content: currentInput,
                    timestamp: new Date().toLocaleTimeString()
                };

                if (input) {
                    input.value = '';
                    input.textContent = '';
                    input.innerHTML = '';
                }
                
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
                        timestamp: new Date().toLocaleTimeString(),
                        isTyping: true
                    };

                    const messagesWithTyping = [...this.state.messages, {
                        ...agentMessage,
                        content: ''
                    }];

                    this.setState({
                        messages: messagesWithTyping,
                        isLoading: false
                    });

                    this.startTypewriterEffect(agentMessage.id, outputContent);

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

            startTypewriterEffect(messageId, fullText) {
                setTimeout(() => {
                    const messageElement = document.getElementById(\`message-\${messageId}\`);
                    if (!messageElement) return;

                    let currentIndex = 0;
                    const speed = 25;
                    const { isDarkMode } = this.state;
                    
                    messageElement.innerHTML = \`<span class="animate-pulse \${isDarkMode ? 'text-blue-400' : 'text-sky-600'}">|</span>\`;
                    
                    const typeNextCharacter = () => {
                        if (currentIndex < fullText.length) {
                            const displayText = fullText.substring(0, currentIndex + 1);
                            const cursor = \`<span class="animate-pulse \${isDarkMode ? 'text-blue-400' : 'text-sky-600'}">|</span>\`;
                            messageElement.innerHTML = displayText + cursor;
                            currentIndex++;
                            setTimeout(typeNextCharacter, speed);
                            this.scrollToBottom();
                        } else {
                            messageElement.textContent = fullText;
                            const messageIndex = this.state.messages.findIndex(msg => msg.id === messageId);
                            if (messageIndex !== -1) {
                                this.state.messages[messageIndex] = {
                                    ...this.state.messages[messageIndex],
                                    isTyping: false,
                                    content: fullText
                                };
                            }
                        }
                    };

                    setTimeout(() => {
                        messageElement.textContent = '';
                        typeNextCharacter();
                    }, 500);
                }, 200);
            }

            setQuickMessage(message) {
                const input = document.getElementById('message-input');
                if (input) {
                    input.value = '';
                    input.textContent = '';
                    input.innerHTML = '';
                    input.value = message;
                    input.focus();
                    this.state.inputValue = message;
                    this.updateSendButton();
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

            render() {
                const { isDarkMode } = this.state;
                const app = document.getElementById('app');
                
                app.innerHTML = \`
                    <div class="\${isDarkMode ? 'bg-blue-700' : 'bg-sky-400'} h-full flex relative overflow-hidden transition-all duration-300">
                        <div class="\${isDarkMode ? 'bg-teal-800' : 'bg-cyan-500'} absolute inset-0 transition-all duration-300"></div>
                        
                        <div class="absolute inset-0">
                            <div class="\${isDarkMode ? 'bg-blue-600/30' : 'bg-sky-300/40'} absolute top-1/4 left-1/4 w-32 h-32 rounded-full blur-2xl animate-pulse transition-all duration-300"></div>
                            <div class="\${isDarkMode ? 'bg-teal-600/20' : 'bg-cyan-300/30'} absolute bottom-1/3 right-1/3 w-40 h-40 rounded-full blur-2xl animate-pulse delay-1000 transition-all duration-300"></div>
                            <div class="\${isDarkMode ? 'bg-cyan-700/15' : 'bg-teal-400/25'} absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-2xl animate-pulse delay-500 transition-all duration-300"></div>
                        </div>

                        <div class="absolute inset-0 opacity-10">
                            <div class="w-full h-full" style="background-image: linear-gradient(rgba(30, 64, 175, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(30, 64, 175, 0.3) 1px, transparent 1px); background-size: 40px 40px;"></div>
                        </div>

                        <div class="absolute inset-0 pointer-events-none">
                            <div class="absolute top-1/6 left-1/6 opacity-15">
                                <i data-lucide="headphones" class="w-10 h-10 animate-pulse text-white"></i>
                            </div>
                            <div class="absolute top-1/3 right-1/4 opacity-15">
                                <i data-lucide="heart" class="w-9 h-9 animate-pulse delay-500 text-white"></i>
                            </div>
                            <div class="absolute bottom-1/4 left-1/3 opacity-15">
                                <i data-lucide="ticket" class="w-8 h-8 animate-pulse delay-1000 text-white"></i>
                            </div>
                            <div class="absolute bottom-1/6 right-1/6 opacity-15">
                                <i data-lucide="phone" class="w-10 h-10 animate-pulse delay-1500 text-white"></i>
                            </div>
                            <div class="absolute top-2/3 left-1/5 opacity-15">
                                <i data-lucide="mail" class="w-9 h-9 animate-pulse delay-2000 text-white"></i>
                            </div>
                            <div class="absolute top-1/2 right-1/5 opacity-15">
                                <i data-lucide="users" class="w-8 h-8 animate-pulse delay-2500 text-white"></i>
                            </div>
                        </div>

                        <div class="w-full h-full flex flex-col relative z-10 transition-all duration-300">
                            <div class="\${isDarkMode ? 'bg-slate-900/95 border-slate-700/50' : 'bg-white/95 border-gray-300/50'} h-full backdrop-blur-xl rounded-2xl border flex flex-col shadow-2xl overflow-hidden transition-all duration-300 m-6">
                                
                                <!-- Header -->
                                <div class="\${isDarkMode ? 'bg-gradient-to-r from-blue-700 via-teal-700 to-cyan-700 border-blue-700/50' : 'bg-gradient-to-r from-sky-500 via-cyan-500 to-teal-500 border-sky-300/50'} border-b flex-shrink-0 p-6 transition-all duration-300">
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center space-x-4">
                                            <div class="relative">
                                                <div class="p-3 bg-white/10 rounded-2xl shadow-lg backdrop-blur-sm border border-white/20">
                                                    <i data-lucide="bot" class="w-6 h-6 text-white"></i>
                                                </div>
                                                <div class="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                                                <div class="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-400 rounded-full border-2 border-white animate-ping"></div>
                                            </div>
                                            <div>
                                                <h2 class="text-xl font-bold text-white mb-1">Customer Service & Support AI</h2>
                                                <div class="flex items-center space-x-3">
                                                    <div class="bg-green-500/20 text-green-300 border border-green-400/30 px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                                                        <div class="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse inline-block"></div>
                                                        Support Active
                                                    </div>
                                                    <div class="border-white/30 text-white bg-white/10 px-3 py-1 rounded-full text-sm backdrop-blur-sm border">
                                                        <i data-lucide="headphones" class="w-3 h-3 mr-1 inline"></i>
                                                        Customer Care
                                                    </div>
                                                    <div class="border-white/30 text-white bg-white/10 px-3 py-1 rounded-full text-sm backdrop-blur-sm border">
                                                        <i data-lucide="ticket" class="w-3 h-3 mr-1 inline"></i>
                                                        Support Tickets
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <button id="theme-toggle" class="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-200 backdrop-blur-sm border border-white/20" title="\${isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}">
                                            <i data-lucide="\${isDarkMode ? 'sun' : 'moon'}" class="w-5 h-5 text-white"></i>
                                        </button>
                                    </div>
                                </div>

                                <!-- Messages Area -->
                                <div id="messages-container" class="\${isDarkMode ? 'bg-slate-900/50' : 'bg-white/50'} flex-1 overflow-y-auto p-6 space-y-6 min-h-0 transition-all duration-300 messages-container">
                                </div>

                                <!-- Input Area -->
                                <div class="\${isDarkMode ? 'bg-slate-900/60 border-slate-700/50' : 'bg-white/80 border-gray-300/50'} p-6 border-t flex-shrink-0 transition-all duration-300">
                                    <div class="flex space-x-4">
                                        <div class="flex-1 relative">
                                            <textarea id="message-input" placeholder="Ask about support tickets, customer satisfaction, service requests, or help documentation..." rows="2" class="\${isDarkMode ? 'bg-slate-800/50 border-slate-700/50 text-slate-200 placeholder:text-slate-400 focus:border-slate-600/50 focus:ring-slate-600/20' : 'bg-gray-50/70 border-gray-300/50 text-gray-800 placeholder:text-gray-500 focus:border-gray-500/50 focus:ring-gray-500/20'} w-full resize-none rounded-xl px-4 py-3 backdrop-blur-sm border focus:outline-none focus:ring-2 transition-all duration-300" \${this.state.isLoading ? 'disabled' : ''}></textarea>
                                            
                                            <div class="absolute right-3 top-3 flex space-x-2">
                                                <button class="input-quick-action \${isDarkMode ? 'hover:bg-slate-700/50 text-slate-400 hover:text-slate-300' : 'hover:bg-gray-200/50 text-gray-500 hover:text-gray-600'} p-1.5 rounded-lg transition-all duration-200" data-message="Generate customer service report" title="Service Report">
                                                    <i data-lucide="file-text" class="w-4 h-4"></i>
                                                </button>
                                                <button class="input-quick-action \${isDarkMode ? 'hover:bg-slate-700/50 text-slate-400 hover:text-slate-300' : 'hover:bg-gray-200/50 text-gray-500 hover:text-gray-600'} p-1.5 rounded-lg transition-all duration-200" data-message="Check ticket status" title="Ticket Status">
                                                    <i data-lucide="ticket" class="w-4 h-4"></i>
                                                </button>
                                                <button class="input-quick-action \${isDarkMode ? 'hover:bg-slate-700/50 text-slate-400 hover:text-slate-300' : 'hover:bg-gray-200/50 text-gray-500 hover:text-gray-600'} p-1.5 rounded-lg transition-all duration-200" data-message="Help with customer inquiry" title="Customer Help">
                                                    <i data-lucide="help-circle" class="w-4 h-4"></i>
                                                </button>
                                            </div>
                                        </div>
                                        <button id="send-button" class="\${isDarkMode ? 'bg-gradient-to-r from-blue-700 to-teal-700 hover:from-blue-800 hover:to-teal-800 text-white shadow-blue-600/20' : 'bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white shadow-sky-400/30'} border-0 shadow-lg disabled:opacity-50 h-auto px-6 rounded-xl transition-all duration-200 flex items-center justify-center min-w-[60px]" \${this.state.isLoading || !this.state.inputValue.trim() ? 'disabled' : ''}>
                                            \${this.state.isLoading ? \`
                                                <div class="flex items-center space-x-2">
                                                    <i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i>
                                                    <i data-lucide="headphones" class="w-4 h-4 animate-pulse"></i>
                                                </div>
                                            \` : \`
                                                <div class="flex items-center space-x-2">
                                                    <i data-lucide="send" class="w-5 h-5"></i>
                                                    <i data-lucide="bot" class="w-4 h-4"></i>
                                                </div>
                                            \`}
                                        </button>
                                    </div>
                                    
                                    <!-- Status bar -->
                                    <div class="flex items-center justify-between mt-4 text-xs">
                                        <div class="flex items-center space-x-4">
                                            <div class="\${isDarkMode ? 'text-slate-400' : 'text-gray-600'} flex items-center space-x-2">
                                                <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                                <span>Customer Service Network Active</span>
                                            </div>
                                            <div class="\${isDarkMode ? 'text-slate-400' : 'text-gray-600'} flex items-center space-x-2">
                                                <i data-lucide="headphones" class="w-3 h-3"></i>
                                                <span>Support Intelligence</span>
                                            </div>
                                            <div class="\${isDarkMode ? 'text-slate-400' : 'text-gray-600'} flex items-center space-x-2">
                                                <i data-lucide="heart" class="w-3 h-3"></i>
                                                <span>Customer Database Connected</span>
                                            </div>
                                            <div class="\${isDarkMode ? 'text-slate-400' : 'text-gray-600'} flex items-center space-x-2">
                                                <i data-lucide="ticket" class="w-3 h-3"></i>
                                                <span>Ticket Management System</span>
                                            </div>
                                        </div>
                                        <div class="\${isDarkMode ? 'text-slate-400' : 'text-gray-600'} flex items-center space-x-2">
                                            <i data-lucide="bot" class="w-3 h-3"></i>
                                            <span>Customer Service & Support Hub</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                \`;

                if (window.lucide) {
                    window.lucide.createIcons();
                }
                this.scrollToBottom();
            }
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                new CustomerServiceAgent();
            });
        } else {
            new CustomerServiceAgent();
        }
    </script>
</body>
</html>`;

    const popup = window.open(
      '', 
      'CustomerServiceAssistant', 
      'width=1000,height=800,scrollbars=yes,resizable=yes,menubar=no,toolbar=no,location=no,status=no'
    );
    
    if (popup) {
      popup.document.write(customerServiceAgentHTML);
      popup.document.close();
      popup.focus();
      popup.document.title = 'Customer Service Assistant';
    } else {
      alert('Please allow popups for this site to open the Customer Service Assistant.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-sky-100 to-cyan-100 p-8">
      <div className="text-center max-w-2xl">
        <div className="relative mb-8">
          <div className="w-32 h-32 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl transform hover:scale-105 transition-transform duration-300">
            <Bot size={64} className="text-white" />
          </div>
          <div className="absolute -top-3 -right-3 w-10 h-10 bg-green-400 rounded-full border-4 border-white animate-pulse flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-full"></div>
          </div>
          
          <div className="absolute -top-2 -left-2 w-8 h-8 bg-blue-400 rounded-full border-2 border-white animate-bounce delay-1000">
            <MessageSquare size={16} className="text-white m-1" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-cyan-400 rounded-full border-2 border-white animate-bounce delay-500">
            <ExternalLink size={16} className="text-white m-1" />
          </div>
        </div>

        <h1 className="text-4xl font-bold text-gray-800 mb-4 bg-gradient-to-r from-sky-600 to-cyan-600 bg-clip-text text-transparent">
          Customer Service Assistant
        </h1>
        
        <p className="text-gray-600 mb-8 text-lg leading-relaxed">
          Launch your dedicated customer service and support AI assistant in a separate window. 
          Handle customer inquiries, support tickets, and service requests with ease.
        </p>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/70 rounded-xl p-6 shadow-lg backdrop-blur-sm border border-sky-200/50">
            <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-cyan-400 rounded-lg flex items-center justify-center mx-auto mb-4">
              <ExternalLink size={24} className="text-white" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Independent Window</h3>
            <p className="text-sm text-gray-600">Opens in a separate tab with blue/teal customer service theme</p>
          </div>
          
          <div className="bg-white/70 rounded-xl p-6 shadow-lg backdrop-blur-sm border border-sky-200/50">
            <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-cyan-400 rounded-lg flex items-center justify-center mx-auto mb-4">
              <MessageSquare size={24} className="text-white" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Support Features</h3>
            <p className="text-sm text-gray-600">Complete customer service tools with ticket management and satisfaction tracking</p>
          </div>
          
          <div className="bg-white/70 rounded-xl p-6 shadow-lg backdrop-blur-sm border border-sky-200/50">
            <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-cyan-400 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Bot size={24} className="text-white" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">24/7 Available</h3>
            <p className="text-sm text-gray-600">Always-on customer service assistant for instant support</p>
          </div>
        </div>

        <button
          onClick={openCustomerServiceChat}
          className="group bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white font-semibold py-4 px-10 rounded-2xl shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-4 mx-auto text-lg"
        >
          <MessageSquare size={28} />
          <span>Launch Customer Service Assistant</span>
          <ExternalLink size={24} className="group-hover:translate-x-1 transition-transform duration-300" />
        </button>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>Blue/Teal Theme</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span>Support Tickets</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
            <span>Customer Care</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
            <span>Service Reports</span>
          </div>
        </div>

        <div className="mt-6 p-4 bg-sky-50 rounded-xl border border-sky-200">
          <p className="text-sm text-sky-700">
            <strong>Customer Service Theme:</strong> Blue and teal colors optimized for customer support workflows with ticket management and satisfaction tracking features.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustomerServiceLauncher;