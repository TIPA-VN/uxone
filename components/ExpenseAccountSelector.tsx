"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Loader2, ChevronDown, Search, CreditCard, FileText, Info } from "lucide-react";
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
  
  // Modal state
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [infoAccount, setInfoAccount] = useState<ExpenseAccount | null>(null);
  const [isViewAllModalOpen, setIsViewAllModalOpen] = useState(false);

  // Get the correct order type for each business unit
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

        // Filter by businessName AND the specific order type for the business
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

  // Filter accounts based on search term - prioritize description search
  const filteredAccounts = expenseAccounts.filter(account => {
    const searchLower = searchTerm.toLowerCase();
    return (
      account.description.toLowerCase().includes(searchLower) ||
      account.account.toString().includes(searchTerm) ||
      account.glClass.toLowerCase().includes(searchLower)
    );
  });

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

  // Handle info modal
  const handleInfoClick = (account: ExpenseAccount, event: React.MouseEvent) => {
    event.stopPropagation();
    setInfoAccount(account);
    setIsInfoModalOpen(true);
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
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-gray-700">
          Tài khoản Chi phí *
        </Label>
        <div className="flex items-center space-x-2">
          {selectedBU && (
            <Badge variant="outline" className="text-xs">
              {selectedBU} - {getOrderTypeForBU(selectedBU)}
            </Badge>
          )}
          {selectedBU && expenseAccounts.length > 0 && (
            <button
              onClick={() => setIsViewAllModalOpen(true)}
              className="text-xs text-blue-600 hover:text-blue-800 underline flex items-center space-x-1"
              title="View all expense accounts"
            >
              <FileText className="h-3 w-3" />
              <span>View All ({expenseAccounts.length})</span>
            </button>
          )}
        </div>
      </div>
      
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
                    {selectedAccount.account} | GL: {selectedAccount.glClass} | {selectedAccount.orderType}
                  </span>
                </>
              ) : (
                <span className="text-sm text-gray-500">
                  {isLoading ? "Đang tải..." : "Chọn Tài khoản Chi phí"}
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
                  placeholder="Tìm kiếm theo mô tả, tài khoản, hoặc GL class..."
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
                      selectedAccount?.account === account.account && selectedAccount?.orderType === account.orderType && "bg-blue-50"
                    )}
                    onClick={() => handleAccountSelect(account)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate mb-1">
                          {account.description}
                        </div>
                        <div className="flex items-center space-x-1.5 mb-0.5">
                          <Badge variant="outline" className="font-mono text-xs">
                            {account.account}
                          </Badge>
                          <Badge variant="outline" className="text-xs text-gray-600">
                            GL: {account.glClass}
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
                        <div className="text-xs text-gray-500">
                          {account.stockType}
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleInfoClick(account, e)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                        title="View account details"
                      >
                        <Info className="h-3.5 w-3.5 text-gray-400 hover:text-blue-600" />
                      </button>
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
        <div className="p-3 bg-blue-50 rounded-md border">
          <div className="text-sm font-medium text-gray-900 mb-2">
            {selectedAccount.description}
          </div>
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-700">Tài khoản:</span>
              <Badge variant="outline" className="font-mono">
                {selectedAccount.account}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-700">GL:</span>
              <span>{selectedAccount.glClass}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-700">Loại:</span>
              <Badge 
                variant="outline" 
                className={cn(
                  selectedAccount.orderType === "LR" && "border-blue-300 text-blue-700",
                  selectedAccount.orderType === "HR" && "border-green-300 text-green-700",
                  selectedAccount.orderType === "OR" && "border-purple-300 text-purple-700"
                )}
              >
                {selectedAccount.orderType}
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* Information Modal */}
      <Dialog open={isInfoModalOpen} onOpenChange={setIsInfoModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Info className="h-5 w-5 text-blue-600" />
              <span>Expense Account Details</span>
            </DialogTitle>
            <DialogDescription>
              Detailed information about the selected expense account
            </DialogDescription>
          </DialogHeader>
          
          {infoAccount && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Account Number</Label>
                  <div className="mt-1 p-2 bg-gray-50 rounded border">
                    <span className="font-mono text-sm">{infoAccount.account}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">GL Class</Label>
                  <div className="mt-1 p-2 bg-gray-50 rounded border">
                    <span className="text-sm">{infoAccount.glClass}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">Description</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded border">
                  <span className="text-sm">{infoAccount.description}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Business Unit</Label>
                  <div className="mt-1 p-2 bg-gray-50 rounded border">
                    <span className="text-sm">{infoAccount.businessName}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Order Type</Label>
                  <div className="mt-1 p-2 bg-gray-50 rounded border">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-sm",
                        infoAccount.orderType === "LR" && "border-blue-300 text-blue-700",
                        infoAccount.orderType === "HR" && "border-green-300 text-green-700",
                        infoAccount.orderType === "OR" && "border-purple-300 text-purple-700"
                      )}
                    >
                      {infoAccount.orderType}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Stock Type</Label>
                  <div className="mt-1 p-2 bg-gray-50 rounded border">
                    <span className="text-sm">{infoAccount.stockType}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">BU Code</Label>
                  <div className="mt-1 p-2 bg-gray-50 rounded border">
                    <span className="text-sm">{infoAccount.bu}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View All Modal */}
      <Dialog open={isViewAllModalOpen} onOpenChange={setIsViewAllModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <span>All Expense Accounts - {selectedBU} ({expenseAccounts.length})</span>
            </DialogTitle>
            <DialogDescription>
              Complete list of available expense accounts for {selectedBU} business unit
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Search in modal */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search accounts by description, account number, or GL class..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Accounts list */}
            <div className="max-h-96 overflow-y-auto border rounded-lg">
              {expenseAccounts.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No expense accounts found
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {expenseAccounts
                    .filter(account => {
                      const searchLower = searchTerm.toLowerCase();
                      return (
                        account.description.toLowerCase().includes(searchLower) ||
                        account.account.toString().includes(searchTerm) ||
                        account.glClass.toLowerCase().includes(searchLower)
                      );
                    })
                    .map((account) => (
                      <div
                        key={`${account.account}-${account.businessName}-${account.orderType}`}
                        className="p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {account.description}
                              </h4>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setInfoAccount(account);
                                  setIsInfoModalOpen(true);
                                  setIsViewAllModalOpen(false);
                                }}
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                                title="View account details"
                              >
                                <Info className="h-3.5 w-3.5 text-gray-400 hover:text-blue-600" />
                              </button>
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-gray-600">
                              <Badge variant="outline" className="font-mono">
                                {account.account}
                              </Badge>
                              <Badge variant="outline">
                                GL: {account.glClass}
                              </Badge>
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  account.orderType === "LR" && "border-blue-300 text-blue-700",
                                  account.orderType === "HR" && "border-green-300 text-green-700",
                                  account.orderType === "OR" && "border-purple-300 text-purple-700"
                                )}
                              >
                                {account.orderType}
                              </Badge>
                              <span>{account.stockType}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              handleAccountSelect(account);
                              setIsViewAllModalOpen(false);
                            }}
                            className="ml-4 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                          >
                            Select
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
            
            {/* Summary */}
            <div className="text-xs text-gray-500 text-center">
              Showing {expenseAccounts.filter(account => {
                const searchLower = searchTerm.toLowerCase();
                return (
                  account.description.toLowerCase().includes(searchLower) ||
                  account.account.toString().includes(searchTerm) ||
                  account.glClass.toLowerCase().includes(searchLower)
                );
              }).length} of {expenseAccounts.length} accounts
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 