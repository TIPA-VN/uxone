"use client";

import React, { useState, useEffect } from 'react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  getDepartmentOptions, 
  validateDepartmentSelection 
} from "@/config/app";

interface DepartmentRadioProps {
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  layout?: 'list' | 'grid' | 'cards';
  showDescription?: boolean;
  showIcons?: boolean;
  error?: string;
}

export function DepartmentRadio({
  value = '',
  onChange,
  className,
  disabled = false,
  required = false,
  layout = 'list',
  showDescription = true,
  showIcons = false,
  error
}: DepartmentRadioProps) {
  const [selectedValue, setSelectedValue] = useState<string>(value);
  const departments = getDepartmentOptions('radio');
  const validation = validateDepartmentSelection([selectedValue], 'radio');

  useEffect(() => {
    if (onChange) {
      onChange(selectedValue);
    }
  }, [selectedValue, onChange]);

  const handleSelect = (departmentValue: string) => {
    setSelectedValue(departmentValue);
  };

  const renderDepartments = () => {
    const departmentItems = departments.map((department) => {
      const isSelected = selectedValue === department.value;
      
      if (layout === 'cards') {
        return (
          <Card 
            key={department.value} 
            className={`cursor-pointer transition-all ${
              isSelected 
                ? 'ring-2 ring-primary border-primary' 
                : 'hover:border-primary/50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => !disabled && handleSelect(department.value)}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value={department.value}
                  id={department.value}
                  checked={isSelected}
                  disabled={disabled}
                  className="sr-only"
                />
                <div className="flex-1">
                  <Label 
                    htmlFor={department.value} 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {department.label}
                  </Label>
                  {showDescription && department.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {department.description}
                    </p>
                  )}
                </div>
                {showIcons && department.color && (
                  <div className={`w-4 h-4 rounded-full ${department.color}`} />
                )}
              </div>
            </CardContent>
          </Card>
        );
      }

      return (
        <div key={department.value} className="flex items-center space-x-2">
          <RadioGroupItem
            value={department.value}
            id={department.value}
            checked={isSelected}
            disabled={disabled}
          />
          <Label 
            htmlFor={department.value} 
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {department.label}
            {showDescription && department.description && (
              <span className="text-sm text-muted-foreground ml-2">
                - {department.description}
              </span>
            )}
          </Label>
          {showIcons && department.color && (
            <div className={`w-3 h-3 rounded-full ${department.color}`} />
          )}
        </div>
      );
    });

    switch (layout) {
      case 'grid':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {departmentItems}
          </div>
        );
      case 'cards':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departmentItems}
          </div>
        );
      case 'list':
      default:
        return (
          <div className="space-y-2">
            {departmentItems}
          </div>
        );
    }
  };

  return (
    <div className={className}>
      <RadioGroup
        value={selectedValue}
        onValueChange={handleSelect}
        disabled={disabled}
        className="space-y-2"
      >
        {renderDepartments()}
      </RadioGroup>

      {/* Selected Department Display */}
      {selectedValue && (
        <div className="mt-4">
          <Label className="text-sm font-medium">Selected Department:</Label>
          <div className="mt-1">
            {(() => {
              const dept = departments.find(d => d.value === selectedValue);
              return (
                <Badge variant="secondary" className="text-sm">
                  {dept?.label || selectedValue}
                </Badge>
              );
            })()}
          </div>
        </div>
      )}

      {/* Error Messages */}
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
      {validation.error && !error && (
        <p className="text-sm text-red-500 mt-1">{validation.error}</p>
      )}
    </div>
  );
}

export default DepartmentRadio;
