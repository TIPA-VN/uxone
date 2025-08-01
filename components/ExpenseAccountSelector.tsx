"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, ChevronDown, Search, CreditCard, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExpenseAccount {
  account: number;
  description: string;
  glClass: string;
  stockType: string;
  orderType: string;
  businessName: string;
  bu: number;
}

interface ExpenseAccountSelectorProps {
  selectedBU: string;
  onSelectionChange: (data: {
    account: number;
    description: string;
    glClass: string;
    stockType: string;
    orderType: string;
  }) => void;
  className?: string;
}

export default function ExpenseAccountSelector({
  selectedBU,
  onSelectionChange,
  className
}: ExpenseAccountSelectorProps) {
  const [expenseAccounts, setExpenseAccounts] = useState<ExpenseAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Selection state
  const [selectedAccount, setSelectedAccount] = useState<ExpenseAccount | null>(null);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Determine orderType based on BU
  const getOrderTypeForBU = (bu: string): string => {
    switch (bu.toUpperCase()) {
      case "LVM":
        return "LR";
      case "HEV":
        return "HR";
      case "TRD":
        return "OR";
      default:
        return "";
    }
  };

  // Fetch expense accounts when BU changes
  useEffect(() => {
    if (!selectedBU) {
      setExpenseAccounts([]);
      setSelectedAccount(null);
      return;
    }

    const fetchExpenseAccounts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const orderType = getOrderTypeForBU(selectedBU);
        if (!orderType) {
          setError('Invalid Business Unit');
          return;
        }

        const response = await fetch(`/api/expense-accounts?businessName=${selectedBU}&orderType=${orderType}`);
        const result = await response.json();
        
        if (result.success) {
          setExpenseAccounts(result.data.expenseAccounts);
        } else {
          setError('Failed to fetch expense accounts');
        }
      } catch (err) {
        setError('Error loading expense accounts');
        console.error('Error fetching expense accounts:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExpenseAccounts();
  }, [selectedBU]);

  // Filter accounts based on search term
  const filteredAccounts = expenseAccounts.filter(account => 
    account.account.toString().includes(searchTerm) ||
    account.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.glClass.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle account selection
  const handleAccountSelect = (account: ExpenseAccount) => {
    setSelectedAccount(account);
    setIsSelectorOpen(false);
    setSearchTerm("");
    
    onSelectionChange({
      account: account.account,
      description: account.description,
      glClass: account.glClass,
      stockType: account.stockType,
      orderType: account.orderType,
    });
  };

  // Handle selector toggle
  const handleToggle = () => {
    if (!selectedBU) return;
    setIsSelectorOpen(!isSelectorOpen);
  };

  if (!selectedBU) {
    return (
      <div className={cn("space-y-4", className)}>
        <Label className="text-sm font-medium text-gray-700 mb-2 block">
          Expense Account
        </Label>
        <div className="p-4 bg-red-100 rounded-lg border border-dashed border-gray-300">
          <div className="flex items-center space-x-2 text-gray-500">
            <CreditCard className="h-4 w-4" />
            <span className="text-sm">Please select a Business Unit and Department first</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
              <Label className="text-sm font-medium text-gray-700 mb-1 block">
          Tài khoản Chi phí *
        </Label>
      
      <div className="relative">
                  <div
            className={cn(
              "flex items-center justify-between w-full px-2 py-1.5 border rounded-md bg-white cursor-pointer transition-colors",
              isSelectorOpen ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-300 hover:border-gray-400",
              !selectedBU && "opacity-50 cursor-not-allowed"
            )}
            onClick={handleToggle}
          >
          <div className="flex items-center space-x-1.5">
            <CreditCard className="h-3.5 w-3.5 text-gray-400" />
            <div className="flex flex-col min-w-0">
              {selectedAccount ? (
                <>
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {selectedAccount.description}
                  </span>
                  <span className="text-xs text-gray-500">
                    {selectedAccount.account} | {selectedAccount.glClass}
                  </span>
                </>
              ) : (
                <span className="text-sm text-gray-500">
                  {isLoading ? "Đang tải..." : "Chọn Tài khoản"}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />}
            <ChevronDown className={cn(
              "h-3.5 w-3.5 text-gray-400 transition-transform flex-shrink-0",
              isSelectorOpen && "rotate-180"
            )} />
          </div>
        </div>

        {isSelectorOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-hidden">
            {/* Search Input */}
            <div className="p-1.5 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <Input
                  type="text"
                                      placeholder="Tìm kiếm mô tả, tài khoản, hoặc GL class..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 h-7 text-sm"
                  autoFocus
                />
              </div>
            </div>

            {/* Account Options */}
            <div className="max-h-64 overflow-y-auto">
              {error ? (
                <div className="p-2 text-sm text-red-600">
                  Error: {error}
                </div>
              ) : filteredAccounts.length === 0 ? (
                <div className="p-2 text-sm text-gray-500">
                  {searchTerm ? "Không tìm thấy tài khoản" : "Không có tài khoản nào"}
                </div>
              ) : (
                filteredAccounts.map((account) => (
                  <div
                    key={`${account.account}-${account.businessName}-${account.orderType}`}
                    className={cn(
                      "px-2 py-2 cursor-pointer hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0",
                      selectedAccount?.account === account.account && "bg-blue-50"
                    )}
                    onClick={() => handleAccountSelect(account)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-1.5 mb-0.5">
                          <Badge variant="outline" className="font-mono text-xs">
                            {account.account}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs",
                              account.orderType === "LR" && "border-blue-300 text-blue-700",
                              account.orderType === "HR" && "border-green-300 text-green-700",
                              account.orderType === "OR" && "border-purple-300 text-purple-700"
                            )}
                          >
                            {account.orderType}
                          </Badge>
                        </div>
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {account.description}
                        </div>
                        <div className="text-xs text-gray-500">
                          GL: {account.glClass} | {account.stockType}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Display selected account details */}
      {selectedAccount && (
        <div className="flex items-center space-x-4 p-2 bg-blue-50 rounded-md border text-sm">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-700">Tài khoản:</span>
            <Badge variant="outline" className="font-mono text-xs">
              {selectedAccount.account}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-700">GL:</span>
            <span className="text-xs">{selectedAccount.glClass}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-700">Loại:</span>
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs",
                selectedAccount.orderType === "LR" && "border-blue-300 text-blue-700",
                selectedAccount.orderType === "HR" && "border-green-300 text-green-700",
                selectedAccount.orderType === "OR" && "border-purple-300 text-purple-700"
              )}
            >
              {selectedAccount.orderType}
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
} 