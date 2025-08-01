"use client";

import { useState, useEffect } from "react";
import { useGLClasses } from "@/hooks/useGLClasses";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface GLClassSelectorProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export default function GLClassSelector({
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
  className
}: GLClassSelectorProps) {
  const { data: glClasses, isLoading, error: fetchError } = useGLClasses();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredClasses, setFilteredClasses] = useState<string[]>([]);

  useEffect(() => {
    if (glClasses) {
      const filtered = glClasses.filter(glClass =>
        glClass.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredClasses(filtered);
    }
  }, [glClasses, searchTerm]);

  const handleSelect = (glClass: string) => {
    onChange(glClass);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setSearchTerm("");
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && filteredClasses.length > 0) {
      handleSelect(filteredClasses[0]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setSearchTerm("");
    }
  };

  return (
    <div className={cn("relative", className)}>
      <Label className="text-sm font-medium text-gray-700 mb-1 block">
        Mã GL *
      </Label>
      
      <div className="relative">
        <div
          className={cn(
            "flex items-center justify-between w-48 px-2 py-1.5 border rounded-md bg-white cursor-pointer transition-colors",
            error ? "border-red-500" : "border-gray-300",
            disabled ? "bg-gray-50 cursor-not-allowed" : "hover:border-gray-400",
            isOpen && "border-blue-500 ring-2 ring-blue-200"
          )}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          tabIndex={disabled ? -1 : 0}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span className={cn(
            "text-sm truncate",
            value ? "text-gray-900" : "text-gray-500"
          )}>
            {value || "Chọn Mã GL"}
          </span>
          
          <div className="flex items-center space-x-1">
            {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />}
            <ChevronDown className={cn(
              "h-3.5 w-3.5 text-gray-400 transition-transform flex-shrink-0",
              isOpen && "rotate-180"
            )} />
          </div>
        </div>

        {isOpen && !disabled && (
          <div className="absolute z-50 w-48 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
            {/* Search Input */}
            <div className="p-1.5 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <Input
                  type="text"
                                      placeholder="Tìm kiếm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 h-7 text-sm"
                  autoFocus
                />
              </div>
            </div>

            {/* Options List */}
            <div className="max-h-48 overflow-y-auto">
              {fetchError ? (
                <div className="p-2 text-sm text-red-600">
                  Lỗi tải mã GL. Vui lòng thử lại.
                </div>
              ) : filteredClasses.length === 0 ? (
                <div className="p-2 text-sm text-gray-500">
                  {searchTerm ? "Không tìm thấy" : "Không có mã GL nào"}
                </div>
              ) : (
                filteredClasses.map((glClass) => (
                  <div
                    key={glClass}
                    className={cn(
                      "px-2 py-1.5 text-sm cursor-pointer hover:bg-gray-100 transition-colors",
                      value === glClass && "bg-blue-50 text-blue-700"
                    )}
                    onClick={() => handleSelect(glClass)}
                  >
                    {glClass}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
} 