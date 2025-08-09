"use client";

import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { 
  getDepartmentOptions, 
  validateDepartmentSelection,
  type Department 
} from "@/config/app";

interface DepartmentSelectorProps {
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  type?: 'dropdown' | 'checkbox' | 'radio' | 'form';
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  multiple?: boolean;
  showDescription?: boolean;
  error?: string;
}

export function DepartmentSelector({
  value = '',
  onChange,
  type = 'dropdown',
  placeholder = "Select department...",
  className,
  disabled = false,
  required = false,
  multiple = false,
  showDescription = false,
  error
}: DepartmentSelectorProps) {
  const [open, setOpen] = useState(false);
  const [selectedValues, setSelectedValues] = useState<string[]>(
    Array.isArray(value) ? value : value ? [value] : []
  );

  const departments = getDepartmentOptions(type);
  const validation = validateDepartmentSelection(selectedValues, type);

  useEffect(() => {
    if (onChange) {
      if (multiple) {
        onChange(selectedValues);
      } else {
        onChange(selectedValues[0] || '');
      }
    }
  }, [selectedValues, onChange, multiple]);

  const handleSelect = (departmentValue: string) => {
    if (multiple) {
      setSelectedValues(prev => {
        if (prev.includes(departmentValue)) {
          return prev.filter(v => v !== departmentValue);
        } else {
          return [...prev, departmentValue];
        }
      });
    } else {
      setSelectedValues([departmentValue]);
      setOpen(false);
    }
  };

  const getSelectedLabels = () => {
    return selectedValues.map(value => {
      const dept = departments.find(d => d.value === value);
      return dept?.label || value;
    });
  };

  const renderSelectedValue = () => {
    if (selectedValues.length === 0) {
      return placeholder;
    }

    if (multiple) {
      return (
        <div className="flex flex-wrap gap-1">
          {getSelectedLabels().map((label, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {label}
            </Badge>
          ))}
        </div>
      );
    }

    return getSelectedLabels()[0];
  };

  return (
    <div className={cn("w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between",
              error && "border-red-500",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            disabled={disabled}
          >
            {renderSelectedValue()}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search departments..." />
            <CommandList>
              <CommandEmpty>No department found.</CommandEmpty>
              <CommandGroup>
                {departments.map((department) => (
                  <CommandItem
                    key={department.value}
                    value={department.value}
                    onSelect={() => handleSelect(department.value)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedValues.includes(department.value) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{department.label}</span>
                      {showDescription && department.description && (
                        <span className="text-sm text-muted-foreground">
                          {department.description}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
      {validation.error && !error && (
        <p className="text-sm text-red-500 mt-1">{validation.error}</p>
      )}
    </div>
  );
}

export default DepartmentSelector;
