"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Loader2,
  Bot,
  ShoppingBag,
  Sun,
  Moon,
  CreditCard,
  Receipt,
  MessageSquare,
  User,
  Banknote,
  Calculator,
  Coins,
  FileSpreadsheet,
  CheckCircle2,
} from "lucide-react";

interface Message {
  id: number;
  type: "user" | "agent" | "error";
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

type ApiResponseArray = ApiResponse[];

type TableData = Record<string, unknown>[] | Record<string, unknown> | null;

interface TypewriterTextProps {
  text: string;
  isTyping?: boolean;
  onComplete?: () => void;
  isDarkMode: boolean;
}

const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  isTyping,
  onComplete,
  isDarkMode,
}) => {
  const [displayedText, setDisplayedText] = useState<string>("");
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  useEffect(() => {
    if (!isTyping) {
      setDisplayedText(text);
      return;
    }

    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, 30);

      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, isTyping, onComplete]);

  useEffect(() => {
    if (isTyping) {
      setDisplayedText("");
      setCurrentIndex(0);
    }
  }, [text, isTyping]);

  return (
    <span>
      {displayedText}
      {isTyping && currentIndex < text.length && (
        <span
          className={`animate-pulse ${
            isDarkMode ? "text-amber-400" : "text-orange-600"
          }`}
        >
          |
        </span>
      )}
    </span>
  );
};

const ProcurementAgent: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [tableData, setTableData] = useState<TableData>(null);
  const [webhookUrl] = useState<string>(
    "http://10.116.2.72:5678/webhook/pr-agent-prompt"
  );
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
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
      type: "user",
      content: inputValue,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: inputValue,
          sessionId: "123456789",
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse | ApiResponseArray = await response.json();

      if (Array.isArray(data)) {
        const firstItem = data[0];
        const outputText =
          typeof firstItem?.output === "string"
            ? firstItem.output
            : "Array response received";

        const agentMessage: Message = {
          id: Date.now() + 1,
          type: "agent",
          content: outputText,
          timestamp: new Date().toLocaleTimeString(),
          isTyping: true,
        };

        setMessages((prev) => [...prev, agentMessage]);
        setTableData(data as TableData);
      } else {
        const outputContent =
          typeof data.output === "string"
            ? data.output
            : data.response || data.message || "No output received";

        const agentMessage: Message = {
          id: Date.now() + 1,
          type: "agent",
          content: outputContent,
          timestamp: new Date().toLocaleTimeString(),
          isTyping: true,
        };

        setMessages((prev) => [...prev, agentMessage]);

        if (data.tableData || data.data) {
          setTableData(data.tableData || data.data || null);
        } else if (data.output && typeof data.output === "object") {
          setTableData(data.output as TableData);
        }
      }
    } catch (error) {
      console.error("Error calling n8n webhook:", error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        type: "error",
        content: `Error: ${
          error instanceof Error ? error.message : "Unknown error occurred"
        }`,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTypingComplete = (messageId: number): void => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, isTyping: false } : msg
      )
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderEnhancedTable = (): React.ReactNode => {
    if (!tableData) return null;

    if (Array.isArray(tableData) && tableData.length > 0) {
      const firstRow = tableData[0] as Record<string, unknown>;
      const columns = Object.keys(firstRow);

      return (
        <div
          className={`overflow-hidden rounded-2xl border backdrop-blur-xl shadow-2xl transition-all duration-300 mb-6 ${
            isDarkMode
              ? "border-amber-700/30 bg-gradient-to-br from-amber-900/80 to-orange-800/80"
              : "border-orange-300/40 bg-gradient-to-br from-orange-50/90 to-amber-50/90"
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr
                  className={`border-b transition-all duration-300 ${
                    isDarkMode
                      ? "border-amber-700/50 bg-gradient-to-r from-amber-500/10 to-orange-500/10"
                      : "border-orange-300/50 bg-gradient-to-r from-orange-200/20 to-amber-200/20"
                  }`}
                >
                  {columns.map((column) => (
                    <th
                      key={column}
                      className={`px-6 py-4 text-left text-sm font-semibold transition-all duration-300 ${
                        isDarkMode
                          ? "text-amber-300 bg-amber-800/50"
                          : "text-orange-700 bg-orange-50/80"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <ShoppingBag size={16} />
                        <span>{column}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, index) => (
                  <tr
                    key={index}
                    className={`border-b transition-all duration-200 hover:scale-[1.001] ${
                      isDarkMode
                        ? index % 2 === 0
                          ? "bg-amber-900/30 border-amber-700/30 hover:bg-amber-800/40"
                          : "bg-amber-800/30 border-amber-700/30 hover:bg-amber-700/40"
                        : index % 2 === 0
                        ? "bg-orange-50/60 border-orange-200/40 hover:bg-orange-100/80"
                        : "bg-amber-50/60 border-orange-200/40 hover:bg-amber-100/80"
                    }`}
                  >
                    {columns.map((column) => {
                      const value = (row as Record<string, unknown>)[column];
                      const isNumeric = typeof value === "number";
                      const isDate = column.toLowerCase().includes("date");

                      return (
                        <td
                          key={column}
                          className={`px-6 py-4 text-sm transition-all duration-300 ${
                            isNumeric
                              ? `text-right font-mono ${
                                  isDarkMode
                                    ? "text-amber-300"
                                    : "text-orange-700"
                                }`
                              : isDate
                              ? `text-center font-mono ${
                                  isDarkMode
                                    ? "text-amber-300"
                                    : "text-orange-700"
                                }`
                              : isDarkMode
                              ? "text-amber-200"
                              : "text-orange-800"
                          }`}
                        >
                          {typeof value === "object" ? (
                            <code
                              className={`text-xs px-2 py-1 rounded-lg border transition-all duration-300 ${
                                isDarkMode
                                  ? "text-amber-400 bg-amber-800/50 border-amber-500/20"
                                  : "text-orange-700 bg-orange-50/80 border-orange-300/30"
                              }`}
                            >
                              {JSON.stringify(value)}
                            </code>
                          ) : isNumeric ? (
                            formatNumber(value as number)
                          ) : isDate ? (
                            formatDate(String(value))
                          ) : (
                            String(value || "")
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

    if (typeof tableData === "object" && tableData !== null) {
      return (
        <div className="space-y-3 mb-6">
          {Object.entries(tableData).map(([key, value]) => (
            <div
              key={key}
              className={`flex justify-between items-center p-4 rounded-xl backdrop-blur-sm transition-all duration-200 ${
                isDarkMode
                  ? "bg-gradient-to-r from-amber-900/40 to-orange-800/40 border border-amber-700/30 hover:from-amber-800/50 hover:to-orange-700/50"
                  : "bg-gradient-to-r from-orange-50/60 to-amber-50/60 border border-orange-300/40 hover:from-orange-100/80 hover:to-amber-100/80"
              }`}
            >
              <span
                className={`font-medium transition-all duration-300 ${
                  isDarkMode ? "text-amber-300" : "text-orange-700"
                }`}
              >
                {key}:
              </span>
              <span
                className={`font-mono text-sm transition-all duration-300 ${
                  isDarkMode ? "text-amber-200" : "text-orange-800"
                }`}
              >
                {typeof value === "object" ? (
                  <code
                    className={`px-2 py-1 rounded-lg text-xs border transition-all duration-300 ${
                      isDarkMode
                        ? "text-amber-400 bg-amber-800/50 border-amber-500/20"
                        : "text-orange-700 bg-orange-50/80 border-orange-300/30"
                    }`}
                  >
                    {JSON.stringify(value)}
                  </code>
                ) : (
                  String(value)
                )}
              </span>
            </div>
          ))}
        </div>
      );
    }

    return (
      <pre
        className={`text-sm p-6 rounded-xl overflow-auto font-mono backdrop-blur-sm transition-all duration-300 mb-6 ${
          isDarkMode
            ? "text-amber-300 bg-amber-900/50 border border-amber-700/30"
            : "text-orange-700 bg-orange-50/60 border border-orange-300/40"
        }`}
      >
        {JSON.stringify(tableData, null, 2)}
      </pre>
    );
  };

  return (
    <div
      className={`h-full flex relative overflow-hidden transition-all duration-300 ${
        isDarkMode ? "bg-orange-700" : "bg-orange-400"
      }`}
    >
      {/* Solid Tuscan background overlay */}
      <div
        className={`absolute inset-0 transition-all duration-300 ${
          isDarkMode ? "bg-amber-800" : "bg-amber-500"
        }`}
      />

      {/* Purchasing network patterns */}
      <div className="absolute top-0 left-0 w-full h-full">
        {/* Purchasing processing nodes */}
        <div
          className={`absolute top-1/4 left-1/4 w-32 h-32 rounded-full blur-2xl animate-pulse transition-all duration-300 ${
            isDarkMode ? "bg-orange-600/30" : "bg-orange-300/40"
          }`}
        />
        <div
          className={`absolute bottom-1/3 right-1/3 w-40 h-40 rounded-full blur-2xl animate-pulse delay-1000 transition-all duration-300 ${
            isDarkMode ? "bg-amber-600/20" : "bg-amber-300/30"
          }`}
        />
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-2xl animate-pulse delay-500 transition-all duration-300 ${
            isDarkMode ? "bg-red-700/15" : "bg-yellow-400/25"
          }`}
        />

        {/* Purchasing connection lines */}
        <div
          className={`absolute top-1/4 left-1/4 w-1 h-32 rotate-45 blur-sm transition-all duration-300 ${
            isDarkMode ? "bg-orange-500/40" : "bg-orange-600/50"
          }`}
        />
        <div
          className={`absolute bottom-1/3 right-1/3 w-1 h-24 -rotate-45 blur-sm transition-all duration-300 ${
            isDarkMode ? "bg-amber-500/40" : "bg-amber-600/50"
          }`}
        />
        <div
          className={`absolute top-1/2 left-1/3 w-32 h-1 blur-sm transition-all duration-300 ${
            isDarkMode ? "bg-red-600/40" : "bg-yellow-500/50"
          }`}
        />
      </div>

      {/* Purchasing grid pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `
            linear-gradient(rgba(139, 69, 19, 0.3) 1px, transparent 1px), 
            linear-gradient(90deg, rgba(139, 69, 19, 0.3) 1px, transparent 1px)
          `,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Floating purchasing/financial icons */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/6 left-1/6 opacity-15">
          <ShoppingBag size={40} className="animate-pulse text-white" />
        </div>
        <div className="absolute top-1/3 right-1/4 opacity-15">
          <CreditCard
            size={36}
            className="animate-pulse delay-500 text-white"
          />
        </div>
        <div className="absolute bottom-1/4 left-1/3 opacity-15">
          <Calculator
            size={32}
            className="animate-pulse delay-1000 text-white"
          />
        </div>
        <div className="absolute bottom-1/6 right-1/6 opacity-15">
          <Banknote size={38} className="animate-pulse delay-1500 text-white" />
        </div>
        <div className="absolute top-2/3 left-1/5 opacity-15">
          <Receipt size={34} className="animate-pulse delay-2000 text-white" />
        </div>
        <div className="absolute top-1/2 right-1/5 opacity-15">
          <Coins size={30} className="animate-pulse delay-2500 text-white" />
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="w-full h-full flex flex-col relative z-0 transition-all duration-300">
        <div
          className={`h-full backdrop-blur-xl rounded-2xl border flex flex-col shadow-2xl overflow-hidden transition-all duration-300 m-6 ${
            isDarkMode
              ? "bg-slate-900/95 border-slate-700/50"
              : "bg-white/95 border-gray-300/50"
          }`}
        >
          {/* Chat Header */}
          <div
            className={`border-b flex-shrink-0 p-6 transition-all duration-300 ${
              isDarkMode
                ? "bg-gradient-to-r from-amber-700 via-orange-700 to-red-700 border-amber-700/50"
                : "bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 border-orange-300/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="p-3 bg-white/10 rounded-2xl shadow-lg backdrop-blur-sm border border-white/20">
                    <Bot size={24} className="text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse" />
                  <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-white animate-ping" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">
                    Purchasing & Customer Service AI
                  </h2>
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-500/20 text-green-300 border border-green-400/30 px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse inline-block" />
                      Purchasing Active
                    </div>
                    <div className="border-white/30 text-white bg-white/10 px-3 py-1 rounded-full text-sm backdrop-blur-sm border">
                      <ShoppingBag size={12} className="mr-1 inline" />
                      Purchase Orders
                    </div>
                    <div className="border-white/30 text-white bg-white/10 px-3 py-1 rounded-full text-sm backdrop-blur-sm border">
                      <MessageSquare size={12} className="mr-1 inline" />
                      Customer Support
                    </div>
                  </div>
                </div>
              </div>

              {/* Theme Toggle */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-200 backdrop-blur-sm border border-white/20"
                title={
                  isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"
                }
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
          <div
            className={`flex-1 overflow-y-auto p-6 space-y-6 min-h-0 transition-all duration-300 ${
              isDarkMode ? "bg-slate-900/50" : "bg-white/50"
            }`}
          >
            {messages.length === 0 && (
              <div className="text-center mt-20">
                <div className="relative mb-6">
                  <div
                    className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-sm transition-all duration-300 ${
                      isDarkMode
                        ? "bg-gradient-to-br from-amber-700/20 to-orange-700/20 border border-amber-600/30"
                        : "bg-gradient-to-br from-orange-200/40 to-amber-200/40 border border-orange-400/40"
                    }`}
                  >
                    <Bot
                      size={36}
                      className={
                        isDarkMode ? "text-amber-400" : "text-orange-600"
                      }
                    />
                  </div>
                  <div
                    className={`absolute inset-0 w-20 h-20 rounded-2xl mx-auto animate-ping transition-all duration-300 ${
                      isDarkMode ? "bg-amber-600/20" : "bg-orange-400/30"
                    }`}
                  />
                </div>
                <p
                  className={`font-medium text-lg mb-2 transition-all duration-300 ${
                    isDarkMode ? "text-slate-200" : "text-gray-800"
                  }`}
                >
                  Purchasing Assistant Online
                </p>
                <p
                  className={`text-sm mb-4 transition-all duration-300 ${
                    isDarkMode ? "text-slate-400" : "text-gray-600"
                  }`}
                >
                  Ready to assist with purchase orders, vendor management, and
                  customer support
                </p>

                {/* Quick action buttons */}
                <div className="flex flex-wrap justify-center gap-3 mt-6">
                  <button
                    onClick={() =>
                      setInputValue("Show me current purchase orders")
                    }
                    className={`px-4 py-2 rounded-xl text-sm transition-all duration-200 ${
                      isDarkMode
                        ? "bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 border border-slate-700/50"
                        : "bg-gray-50/60 hover:bg-gray-100/80 text-gray-700 border border-gray-300/50"
                    }`}
                  >
                    <ShoppingBag size={14} className="mr-2 inline" />
                    Purchase Orders
                  </button>
                  <button
                    onClick={() => setInputValue("Check vendor payment status")}
                    className={`px-4 py-2 rounded-xl text-sm transition-all duration-200 ${
                      isDarkMode
                        ? "bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 border border-slate-700/50"
                        : "bg-gray-50/60 hover:bg-gray-100/80 text-gray-700 border border-gray-300/50"
                    }`}
                  >
                    <CreditCard size={14} className="mr-2 inline" />
                    Payment Status
                  </button>
                  <button
                    onClick={() => setInputValue("Generate spending report")}
                    className={`px-4 py-2 rounded-xl text-sm transition-all duration-200 ${
                      isDarkMode
                        ? "bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 border border-slate-700/50"
                        : "bg-gray-50/60 hover:bg-gray-100/80 text-gray-700 border border-gray-300/50"
                    }`}
                  >
                    <FileSpreadsheet size={14} className="mr-2 inline" />
                    Spending Report
                  </button>
                </div>
              </div>
            )}

            {/* Table data display */}
            {tableData && renderEnhancedTable()}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.type === "user" ? "justify-end" : "justify-start"
                } animate-in slide-in-from-bottom-4 duration-500`}
              >
                <div className="flex items-start space-x-3 max-w-sm lg:max-w-md">
                  {message.type !== "user" && (
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center mt-1 backdrop-blur-sm transition-all duration-300 ${
                        message.type === "error"
                          ? isDarkMode
                            ? "bg-red-500/20 border border-red-400/30"
                            : "bg-red-200/40 border border-red-400/40"
                          : isDarkMode
                          ? "bg-gradient-to-br from-amber-700/20 to-orange-700/20 border border-amber-600/30"
                          : "bg-gradient-to-br from-orange-200/40 to-amber-200/40 border border-orange-400/40"
                      }`}
                    >
                      <Bot
                        size={18}
                        className={
                          message.type === "error"
                            ? isDarkMode
                              ? "text-red-400"
                              : "text-red-600"
                            : isDarkMode
                            ? "text-amber-400"
                            : "text-orange-600"
                        }
                      />
                    </div>
                  )}

                  <div
                    className={`px-5 py-4 rounded-2xl border relative shadow-lg backdrop-blur-sm transition-all duration-300 ${
                      message.type === "user"
                        ? isDarkMode
                          ? "bg-gradient-to-r from-amber-700 to-orange-700 text-white border-amber-600/30 shadow-amber-600/20"
                          : "bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-400/40 shadow-orange-400/30"
                        : message.type === "error"
                        ? isDarkMode
                          ? "bg-red-500/20 text-red-300 border-red-400/30 shadow-red-500/20"
                          : "bg-red-200/40 text-red-700 border-red-400/40 shadow-red-400/30"
                        : isDarkMode
                        ? "bg-amber-800/60 text-amber-200 border-amber-700/50 shadow-amber-900/50"
                        : "bg-orange-50/80 text-orange-800 border-orange-300/50 shadow-orange-300/30"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">
                      {message.type === "agent" ? (
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

                  {message.type === "user" && (
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center mt-1 shadow-lg transition-all duration-300 ${
                        isDarkMode
                          ? "bg-gradient-to-br from-amber-700 to-orange-700 shadow-amber-600/20"
                          : "bg-gradient-to-br from-orange-500 to-amber-500 shadow-orange-400/30"
                      }`}
                    >
                      <User size={18} className="text-white" />
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-start space-x-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center backdrop-blur-sm transition-all duration-300 ${
                      isDarkMode
                        ? "bg-gradient-to-br from-amber-700/20 to-orange-700/20 border border-amber-600/30"
                        : "bg-gradient-to-br from-orange-200/40 to-amber-200/40 border border-orange-400/40"
                    }`}
                  >
                    <Bot
                      size={18}
                      className={
                        isDarkMode ? "text-amber-400" : "text-orange-600"
                      }
                    />
                  </div>
                  <div
                    className={`px-5 py-4 rounded-2xl flex items-center space-x-3 border shadow-lg backdrop-blur-sm transition-all duration-300 ${
                      isDarkMode
                        ? "bg-amber-800/60 border-amber-700/50"
                        : "bg-orange-50/80 border-orange-300/50"
                    }`}
                  >
                    <Loader2
                      size={18}
                      className={`animate-spin ${
                        isDarkMode ? "text-amber-400" : "text-orange-600"
                      }`}
                    />
                    <span
                      className={`text-sm transition-all duration-300 ${
                        isDarkMode ? "text-amber-200" : "text-orange-800"
                      }`}
                    >
                      Processing purchase request...
                    </span>
                    <div className="flex space-x-1">
                      <div
                        className={`w-2 h-2 rounded-full animate-pulse ${
                          isDarkMode ? "bg-amber-400" : "bg-orange-600"
                        }`}
                      />
                      <div
                        className={`w-2 h-2 rounded-full animate-pulse delay-100 ${
                          isDarkMode ? "bg-orange-400" : "bg-amber-600"
                        }`}
                      />
                      <div
                        className={`w-2 h-2 rounded-full animate-pulse delay-200 ${
                          isDarkMode ? "bg-red-400" : "bg-yellow-600"
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div
            className={`p-6 border-t flex-shrink-0 transition-all duration-300 ${
              isDarkMode
                ? "bg-slate-900/60 border-slate-700/50"
                : "bg-white/80 border-gray-300/50"
            }`}
          >
            <div className="flex space-x-4">
              <div className="flex-1 relative">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about purchase orders, vendor payments, budget analysis, invoice processing, or customer inquiries..."
                  className={`w-full resize-none rounded-xl px-4 py-3 backdrop-blur-sm border focus:outline-none focus:ring-2 transition-all duration-300 ${
                    isDarkMode
                      ? "bg-slate-800/50 border-slate-700/50 text-slate-200 placeholder:text-slate-400 focus:border-slate-600/50 focus:ring-slate-600/20"
                      : "bg-gray-50/70 border-gray-300/50 text-gray-800 placeholder:text-gray-500 focus:border-gray-500/50 focus:ring-gray-500/20"
                  }`}
                  rows={2}
                  disabled={isLoading}
                />
                {/* Quick action buttons in input */}
                <div className="absolute right-3 top-3 flex space-x-2">
                  <button
                    onClick={() =>
                      setInputValue("Generate quarterly spending report")
                    }
                    className={`p-1.5 rounded-lg transition-all duration-200 ${
                      isDarkMode
                        ? "hover:bg-slate-700/50 text-slate-400 hover:text-slate-300"
                        : "hover:bg-gray-200/50 text-gray-500 hover:text-gray-600"
                    }`}
                    title="Spending Report"
                  >
                    <FileSpreadsheet size={16} />
                  </button>
                  <button
                    onClick={() =>
                      setInputValue("Check vendor payment schedules")
                    }
                    className={`p-1.5 rounded-lg transition-all duration-200 ${
                      isDarkMode
                        ? "hover:bg-slate-700/50 text-slate-400 hover:text-slate-300"
                        : "hover:bg-gray-200/50 text-gray-500 hover:text-gray-600"
                    }`}
                    title="Payment Schedules"
                  >
                    <CreditCard size={16} />
                  </button>
                  <button
                    onClick={() =>
                      setInputValue("Help with customer support inquiry")
                    }
                    className={`p-1.5 rounded-lg transition-all duration-200 ${
                      isDarkMode
                        ? "hover:bg-slate-700/50 text-slate-400 hover:text-slate-300"
                        : "hover:bg-gray-200/50 text-gray-500 hover:text-gray-600"
                    }`}
                    title="Customer Support"
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
                    ? "bg-gradient-to-r from-amber-700 to-orange-700 hover:from-amber-800 hover:to-orange-800 text-white shadow-amber-600/20"
                    : "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-400/30"
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 size={20} className="animate-spin" />
                    <ShoppingBag size={16} className="animate-pulse" />
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
                <div
                  className={`flex items-center space-x-2 ${
                    isDarkMode ? "text-slate-400" : "text-gray-600"
                  }`}
                >
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span>Purchasing Network Active</span>
                </div>
                <div
                  className={`flex items-center space-x-2 ${
                    isDarkMode ? "text-slate-400" : "text-gray-600"
                  }`}
                >
                  <ShoppingBag size={12} />
                  <span>Purchase Intelligence</span>
                </div>
                <div
                  className={`flex items-center space-x-2 ${
                    isDarkMode ? "text-slate-400" : "text-gray-600"
                  }`}
                >
                  <Calculator size={12} />
                  <span>Financial Database Connected</span>
                </div>
                <div
                  className={`flex items-center space-x-2 ${
                    isDarkMode ? "text-slate-400" : "text-gray-600"
                  }`}
                >
                  <CheckCircle2 size={12} />
                  <span>Order Management System</span>
                </div>
              </div>
              <div
                className={`flex items-center space-x-2 ${
                  isDarkMode ? "text-slate-400" : "text-gray-600"
                }`}
              >
                <Bot size={12} />
                <span>Purchasing & Customer Service Hub</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcurementAgent;
