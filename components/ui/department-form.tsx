"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DepartmentSelector } from "./department-selector";
import { DepartmentCheckbox } from "./department-checkbox";
import { DepartmentRadio } from "./department-radio";
import { 
  getDepartmentOptions, 
  validateDepartmentSelection,
  getDepartmentsByCategory 
} from "@/config/app";

interface DepartmentFormProps {
  onSubmit?: (data: {
    singleDepartment: string;
    multipleDepartments: string[];
    radioDepartment: string;
    checkboxDepartments: string[];
  }) => void;
  initialData?: {
    singleDepartment?: string;
    multipleDepartments?: string[];
    radioDepartment?: string;
    checkboxDepartments?: string[];
  };
  className?: string;
}

export function DepartmentForm({
  onSubmit,
  initialData = {},
  className
}: DepartmentFormProps) {
  const [formData, setFormData] = useState({
    singleDepartment: initialData.singleDepartment || '',
    multipleDepartments: initialData.multipleDepartments || [],
    radioDepartment: initialData.radioDepartment || '',
    checkboxDepartments: initialData.checkboxDepartments || []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors: Record<string, string> = {};
    
    // Validate single department
    const singleValidation = validateDepartmentSelection([formData.singleDepartment], 'dropdown');
    if (!singleValidation.isValid) {
      newErrors.singleDepartment = singleValidation.error || 'Please select a department';
    }

    // Validate multiple departments
    const multipleValidation = validateDepartmentSelection(formData.multipleDepartments, 'checkbox');
    if (!multipleValidation.isValid) {
      newErrors.multipleDepartments = multipleValidation.error || 'Please select at least one department';
    }

    // Validate radio department
    const radioValidation = validateDepartmentSelection([formData.radioDepartment], 'radio');
    if (!radioValidation.isValid) {
      newErrors.radioDepartment = radioValidation.error || 'Please select a department';
    }

    // Validate checkbox departments
    const checkboxValidation = validateDepartmentSelection(formData.checkboxDepartments, 'checkbox');
    if (!checkboxValidation.isValid) {
      newErrors.checkboxDepartments = checkboxValidation.error || 'Please select at least one department';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0 && onSubmit) {
      onSubmit(formData);
    }
  };

  const handleSingleDepartmentChange = (value: string | string[]) => {
    const departmentValue = Array.isArray(value) ? value[0] || '' : value;
    setFormData(prev => ({ ...prev, singleDepartment: departmentValue }));
    if (errors.singleDepartment) {
      setErrors(prev => ({ ...prev, singleDepartment: '' }));
    }
  };

  const handleMultipleDepartmentsChange = (value: string | string[]) => {
    const departmentsValue = Array.isArray(value) ? value : [value];
    setFormData(prev => ({ ...prev, multipleDepartments: departmentsValue }));
    if (errors.multipleDepartments) {
      setErrors(prev => ({ ...prev, multipleDepartments: '' }));
    }
  };

  const handleRadioDepartmentChange = (value: string | string[]) => {
    const radioValue = Array.isArray(value) ? value[0] || '' : value;
    setFormData(prev => ({ ...prev, radioDepartment: radioValue }));
    if (errors.radioDepartment) {
      setErrors(prev => ({ ...prev, radioDepartment: '' }));
    }
  };

  const handleCheckboxDepartmentsChange = (value: string | string[]) => {
    const checkboxValue = Array.isArray(value) ? value : [value];
    setFormData(prev => ({ ...prev, checkboxDepartments: checkboxValue }));
    if (errors.checkboxDepartments) {
      setErrors(prev => ({ ...prev, checkboxDepartments: '' }));
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Department Selection Examples</CardTitle>
        <CardDescription>
          Examples of different department selection components using centralized configuration
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="dropdown" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="dropdown">Dropdown</TabsTrigger>
              <TabsTrigger value="checkbox">Checkbox</TabsTrigger>
              <TabsTrigger value="radio">Radio</TabsTrigger>
              <TabsTrigger value="form">Form</TabsTrigger>
            </TabsList>

            <TabsContent value="dropdown" className="space-y-4">
              <div>
                <Label htmlFor="single-department">Single Department (Dropdown)</Label>
                <DepartmentSelector
                  value={formData.singleDepartment}
                  onChange={handleSingleDepartmentChange}
                  type="dropdown"
                  placeholder="Select a department..."
                  error={errors.singleDepartment}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="multiple-departments">Multiple Departments (Dropdown)</Label>
                <DepartmentSelector
                  value={formData.multipleDepartments}
                  onChange={handleMultipleDepartmentsChange}
                  type="dropdown"
                  multiple={true}
                  placeholder="Select departments..."
                  error={errors.multipleDepartments}
                  className="mt-1"
                />
              </div>
            </TabsContent>

            <TabsContent value="checkbox" className="space-y-4">
              <div>
                <Label>Multiple Departments (Checkbox)</Label>
                <DepartmentCheckbox
                  value={formData.checkboxDepartments}
                  onChange={handleCheckboxDepartmentsChange}
                  layout="grid"
                  maxSelections={5}
                  error={errors.checkboxDepartments}
                  className="mt-1"
                />
              </div>
            </TabsContent>

            <TabsContent value="radio" className="space-y-4">
              <div>
                <Label>Single Department (Radio)</Label>
                <DepartmentRadio
                  value={formData.radioDepartment}
                  onChange={handleRadioDepartmentChange}
                  layout="cards"
                  showDescription={true}
                  showIcons={true}
                  error={errors.radioDepartment}
                  className="mt-1"
                />
              </div>
            </TabsContent>

            <TabsContent value="form" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="form-single">Single Department</Label>
                  <DepartmentSelector
                    value={formData.singleDepartment}
                    onChange={handleSingleDepartmentChange}
                    type="form"
                    error={errors.singleDepartment}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="form-multiple">Multiple Departments</Label>
                  <DepartmentCheckbox
                    value={formData.multipleDepartments}
                    onChange={handleMultipleDepartmentsChange}
                    layout="list"
                    maxSelections={3}
                    error={errors.multipleDepartments}
                    className="mt-1"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setFormData({
              singleDepartment: '',
              multipleDepartments: [],
              radioDepartment: '',
              checkboxDepartments: []
            })}>
              Reset
            </Button>
            <Button type="submit">
              Submit
            </Button>
          </div>
        </form>

        {/* Form Data Display */}
        {(formData.singleDepartment || formData.multipleDepartments.length > 0 || 
          formData.radioDepartment || formData.checkboxDepartments.length > 0) && (
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Form Data:</h4>
            <pre className="text-sm">
              {JSON.stringify(formData, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default DepartmentForm;
