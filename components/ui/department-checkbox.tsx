"use client";

import React, { useState, useEffect } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  getDepartmentOptions, 
  validateDepartmentSelection 
} from "@/config/app";

interface DepartmentCheckboxProps {
  value?: string[];
  onChange?: (value: string[]) => void;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  showSelectAll?: boolean;
  showClearAll?: boolean;
  layout?: 'grid' | 'list' | 'columns';
  maxSelections?: number;
  error?: string;
}

export function DepartmentCheckbox({
  value = [],
  onChange,
  className,
  disabled = false,
  required = false,
  showSelectAll = true,
  showClearAll = true,
  layout = 'grid',
  maxSelections = 10,
  error
}: DepartmentCheckboxProps) {
  const [selectedValues, setSelectedValues] = useState<string[]>(value);
  const departments = getDepartmentOptions('checkbox');
  const validation = validateDepartmentSelection(selectedValues, 'checkbox');

  useEffect(() => {
    if (onChange) {
      onChange(selectedValues);
    }
  }, [selectedValues, onChange]);

  const handleSelect = (departmentValue: string, checked: boolean) => {
    if (checked) {
      if (selectedValues.length >= maxSelections) {
        return; // Don't allow more selections
      }
      setSelectedValues(prev => [...prev, departmentValue]);
    } else {
      setSelectedValues(prev => prev.filter(v => v !== departmentValue));
    }
  };

  const handleSelectAll = () => {
    if (selectedValues.length === departments.length) {
      setSelectedValues([]);
    } else {
      const allValues = departments.map(dept => dept.value).slice(0, maxSelections);
      setSelectedValues(allValues);
    }
  };

  const handleClearAll = () => {
    setSelectedValues([]);
  };

  const renderDepartments = () => {
    const departmentItems = departments.map((department) => (
      <div key={department.value} className="flex items-center space-x-2">
        <Checkbox
          id={department.value}
          checked={selectedValues.includes(department.value)}
          onCheckedChange={(checked) => handleSelect(department.value, checked as boolean)}
          disabled={disabled || (!selectedValues.includes(department.value) && selectedValues.length >= maxSelections)}
        />
        <Label 
          htmlFor={department.value} 
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {department.label}
        </Label>
      </div>
    ));

    switch (layout) {
      case 'list':
        return (
          <div className="space-y-2">
            {departmentItems}
          </div>
        );
      case 'columns':
        return (
          <div className="grid grid-cols-2 gap-2">
            {departmentItems}
          </div>
        );
      case 'grid':
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {departmentItems}
          </div>
        );
    }
  };

  return (
    <div className={className}>
      {/* Action Buttons */}
      {(showSelectAll || showClearAll) && (
        <div className="flex gap-2 mb-4">
          {showSelectAll && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              disabled={disabled}
            >
              {selectedValues.length === departments.length ? 'Deselect All' : 'Select All'}
            </Button>
          )}
          {showClearAll && selectedValues.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              disabled={disabled}
            >
              Clear All
            </Button>
          )}
        </div>
      )}

      {/* Selected Departments Display */}
      {selectedValues.length > 0 && (
        <div className="mb-4">
          <Label className="text-sm font-medium">Selected Departments:</Label>
          <div className="flex flex-wrap gap-1 mt-1">
            {selectedValues.map((value) => {
              const dept = departments.find(d => d.value === value);
              return (
                <Badge key={value} variant="secondary" className="text-xs">
                  {dept?.label || value}
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Department Checkboxes */}
      <div className="space-y-2">
        {renderDepartments()}
      </div>

      {/* Error Messages */}
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
      {validation.error && !error && (
        <p className="text-sm text-red-500 mt-1">{validation.error}</p>
      )}

      {/* Selection Limit Warning */}
      {selectedValues.length >= maxSelections && (
        <p className="text-sm text-amber-600 mt-1">
          Maximum {maxSelections} departments can be selected.
        </p>
      )}
    </div>
  );
}

export default DepartmentCheckbox;
