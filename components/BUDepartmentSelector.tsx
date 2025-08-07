"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, ChevronDown, Search, Building, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface DepartmentAccount {
  id: number;
  bu: string;
  department: string;
  account: number;
  approvalRoute: string | null;
}

interface BUDepartmentSelectorProps {
  onSelectionChange: (data: {
    bu: string;
    department: string;
    account: number;
    approvalRoute: string | null;
  }) => void;
  className?: string;
}

export default function BUDepartmentSelector({
  onSelectionChange,
  className
}: BUDepartmentSelectorProps) {
  const [departmentAccounts, setDepartmentAccounts] = useState<DepartmentAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // BU Selection
  const [selectedBU, setSelectedBU] = useState<string>("");
  const [isBUSelectorOpen, setIsBUSelectorOpen] = useState(false);
  const [buSearchTerm, setBuSearchTerm] = useState("");
  
  // Department Selection
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [isDepartmentSelectorOpen, setIsDepartmentSelectorOpen] = useState(false);
  const [departmentSearchTerm, setDepartmentSearchTerm] = useState("");
  
  // Selected account data
  const [selectedAccountData, setSelectedAccountData] = useState<{
    account: number;
    approvalRoute: string | null;
  } | null>(null);

  // Fetch department accounts
  useEffect(() => {
    const fetchDepartmentAccounts = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/department-accounts');
        const result = await response.json();
        
        if (result.success) {
          setDepartmentAccounts(result.data.departmentAccounts);
        } else {
          setError('Failed to fetch department accounts');
        }
      } catch (err) {
        setError('Error loading department accounts');
        console.error('Error fetching department accounts:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDepartmentAccounts();
  }, []);

  // Get unique BUs
  const uniqueBUs = [...new Set(departmentAccounts.map(da => da.bu))].sort();
  const filteredBUs = uniqueBUs.filter(bu => 
    bu.toLowerCase().includes(buSearchTerm.toLowerCase())
  );

  // Get departments for selected BU
  const departmentsForSelectedBU = departmentAccounts
    .filter(da => da.bu === selectedBU)
    .map(da => da.department)
    .sort();
  
  const filteredDepartments = departmentsForSelectedBU.filter(dept => 
    dept.toLowerCase().includes(departmentSearchTerm.toLowerCase())
  );

  // Handle BU selection
  const handleBUSelect = (bu: string) => {
    setSelectedBU(bu);
    setSelectedDepartment("");
    setSelectedAccountData(null);
    setIsBUSelectorOpen(false);
    setBuSearchTerm("");
    onSelectionChange({ bu, department: "", account: 0, approvalRoute: null });
  };

  // Handle department selection
  const handleDepartmentSelect = (department: string) => {
    setSelectedDepartment(department);
    setIsDepartmentSelectorOpen(false);
    setDepartmentSearchTerm("");
    
    // Find the account data for this BU and department
    const accountData = departmentAccounts.find(
      da => da.bu === selectedBU && da.department === department
    );
    
    if (accountData) {
      setSelectedAccountData({
        account: accountData.account,
        approvalRoute: accountData.approvalRoute
      });
      
      onSelectionChange({
        bu: selectedBU,
        department,
        account: accountData.account,
        approvalRoute: accountData.approvalRoute
      });
    }
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-gray-500">Loading department accounts...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="text-sm text-red-600">
          Error: {error}
        </div>
      </div>
    );
  }

    return (
    <div className={cn("space-y-3", className)}>
      {/* Business Unit and Department Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Business Unit Selector */}
        <div className="relative">
          <Label className="text-sm font-medium text-gray-700 mb-1 block">
            Đơn vị Kinh doanh *
          </Label>
          
          <div className="relative">
            <div
              className={cn(
                "flex items-center justify-between w-full px-2 py-1.5 border rounded-md bg-white cursor-pointer transition-colors",
                isBUSelectorOpen ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-300 hover:border-gray-400"
              )}
              onClick={() => setIsBUSelectorOpen(!isBUSelectorOpen)}
            >
              <div className="flex items-center space-x-1.5">
                <Building className="h-3.5 w-3.5 text-gray-400" />
                <span className={cn(
                  "text-sm truncate",
                  selectedBU ? "text-gray-900" : "text-gray-500"
                )}>
                  {selectedBU || "Chọn Đơn vị"}
                </span>
              </div>
              
              <ChevronDown className={cn(
                "h-3.5 w-3.5 text-gray-400 transition-transform flex-shrink-0",
                isBUSelectorOpen && "rotate-180"
              )} />
            </div>

            {isBUSelectorOpen && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
                {/* BU Search Input */}
                <div className="p-1.5 border-b border-gray-200">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Tìm kiếm..."
                      value={buSearchTerm}
                      onChange={(e) => setBuSearchTerm(e.target.value)}
                      className="pl-7 h-7 text-sm"
                      autoFocus
                    />
                  </div>
                </div>

                {/* BU Options */}
                <div className="max-h-48 overflow-y-auto">
                  {filteredBUs.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">
                      {buSearchTerm ? "Không tìm thấy" : "Không có đơn vị nào"}
                    </div>
                  ) : (
                    filteredBUs.map((bu) => (
                      <div
                        key={bu}
                        className={cn(
                          "px-2 py-1.5 text-sm cursor-pointer hover:bg-gray-100 transition-colors",
                          selectedBU === bu && "bg-blue-50 text-blue-700"
                        )}
                        onClick={() => handleBUSelect(bu)}
                      >
                        {bu}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Department Selector - Only show if BU is selected */}
        {selectedBU && (
          <div className="relative">
            <Label className="text-sm font-medium text-gray-700 mb-1 block">
              Phòng ban *
            </Label>
            
            <div className="relative">
              <div
                className={cn(
                  "flex items-center justify-between w-full px-2 py-1.5 border rounded-md bg-white cursor-pointer transition-colors",
                  isDepartmentSelectorOpen ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-300 hover:border-gray-400"
                )}
                onClick={() => setIsDepartmentSelectorOpen(!isDepartmentSelectorOpen)}
              >
                <div className="flex items-center space-x-1.5">
                  <Users className="h-3.5 w-3.5 text-gray-400" />
                  <span className={cn(
                    "text-sm truncate",
                    selectedDepartment ? "text-gray-900" : "text-gray-500"
                  )}>
                    {selectedDepartment || "Chọn Phòng ban"}
                  </span>
                </div>
                
                <ChevronDown className={cn(
                  "h-3.5 w-3.5 text-gray-400 transition-transform flex-shrink-0",
                  isDepartmentSelectorOpen && "rotate-180"
                )} />
              </div>

              {isDepartmentSelectorOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
                  {/* Department Search Input */}
                  <div className="p-1.5 border-b border-gray-200">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Tìm kiếm..."
                        value={departmentSearchTerm}
                        onChange={(e) => setDepartmentSearchTerm(e.target.value)}
                        className="pl-7 h-7 text-sm"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Department Options */}
                  <div className="max-h-48 overflow-y-auto">
                    {filteredDepartments.length === 0 ? (
                      <div className="p-2 text-sm text-gray-500">
                        {departmentSearchTerm ? "Không tìm thấy" : "Không có phòng ban nào"}
                      </div>
                    ) : (
                      filteredDepartments.map((department) => (
                        <div
                          key={department}
                          className={cn(
                            "px-2 py-1.5 text-sm cursor-pointer hover:bg-gray-100 transition-colors",
                            selectedDepartment === department && "bg-blue-50 text-blue-700"
                          )}
                          onClick={() => handleDepartmentSelect(department)}
                        >
                          {department}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Display Account and Approval Route */}
      {selectedAccountData && (
        <div className="flex items-center space-x-4 p-2 bg-gray-50 rounded-md border text-sm">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-700">Bộ môn:</span>
            <Badge variant="outline" className="font-mono text-xs">
              {selectedAccountData.account}
            </Badge>
          </div>
          
          {selectedAccountData.approvalRoute && (
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-700">Approval Form:</span>
              <Badge 
                variant="outline" 
                className={cn(
                  "capitalize text-xs",
                  selectedAccountData.approvalRoute === "MANAGER" && "border-blue-300 text-blue-700",
                  selectedAccountData.approvalRoute === "DIRECTOR" && "border-purple-300 text-purple-700",
                  selectedAccountData.approvalRoute === "VP" && "border-orange-300 text-orange-700"
                )}
              >
                {selectedAccountData.approvalRoute}
              </Badge>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 