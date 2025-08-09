# Department Configuration System

This document explains how to use the centralized department configuration system that consolidates all department lists across the application.

## Overview

The department configuration system provides a single source of truth for all department-related data, including:
- Department lists for dropdowns, checkboxes, and forms
- Department permissions and access control
- Department categories and grouping
- Validation rules and error messages

## Configuration Structure

### 1. Master Department List

All departments are defined in `config/app.ts` under `APP_CONFIG.departments.list`:

```typescript
departments: {
  list: [
    {
      value: "IS",
      label: "Information Systems", 
      code: "IS",
      color: "bg-blue-600",
      description: "Information systems and IT management",
      isActive: true,
      sortOrder: 1
    },
    // ... more departments
  ]
}
```

### 2. Selection Configurations

Different selection types have their own configurations:

```typescript
selection: {
  dropdown: {
    includeAll: true,
    allLabel: "All Departments",
    allValue: "ALL",
    placeholder: "Select Department",
    showDescription: false,
    validation: {
      required: true,
      minLength: 1,
      maxLength: 1
    }
  },
  checkbox: {
    maxSelections: 10,
    showSelectAll: true,
    showClearAll: true,
    layout: "grid"
  },
  // ... more configurations
}
```

### 3. Categories and Permissions

```typescript
categories: {
  technical: ["IS", "HELPDESK", "QA", "QC", "PM", "FM"],
  business: ["LOG", "PROC", "PC", "HR", "CS", "FIN"],
  support: ["RD", "MKT", "SALES", "OPS", "ADMIN"]
},
permissions: {
  features: {
    helpdesk: ["IS", "HELPDESK", "CS"],
    procurement: ["PROC", "LOG", "PC"],
    // ... more features
  }
}
```

## Usage Examples

### 1. Basic Department Selection

```tsx
import { DepartmentSelector } from "@/components/ui/department-selector";

function MyComponent() {
  const [department, setDepartment] = useState("");

  return (
    <DepartmentSelector
      value={department}
      onChange={setDepartment}
      type="dropdown"
      placeholder="Select a department..."
    />
  );
}
```

### 2. Multiple Department Selection

```tsx
import { DepartmentCheckbox } from "@/components/ui/department-checkbox";

function MyComponent() {
  const [departments, setDepartments] = useState<string[]>([]);

  return (
    <DepartmentCheckbox
      value={departments}
      onChange={setDepartments}
      layout="grid"
      maxSelections={5}
      showSelectAll={true}
      showClearAll={true}
    />
  );
}
```

### 3. Radio Button Selection

```tsx
import { DepartmentRadio } from "@/components/ui/department-radio";

function MyComponent() {
  const [department, setDepartment] = useState("");

  return (
    <DepartmentRadio
      value={department}
      onChange={setDepartment}
      layout="cards"
      showDescription={true}
      showIcons={true}
    />
  );
}
```

### 4. Form Integration

```tsx
import { DepartmentForm } from "@/components/ui/department-form";

function MyComponent() {
  const handleSubmit = (data) => {
    console.log("Form data:", data);
  };

  return (
    <DepartmentForm
      onSubmit={handleSubmit}
      initialData={{
        singleDepartment: "IS",
        multipleDepartments: ["LOG", "PROC"]
      }}
    />
  );
}
```

## Utility Functions

### 1. Getting Department Options

```typescript
import { getDepartmentOptions, getActiveDepartments } from "@/config/app";

// Get all active departments
const activeDepts = getActiveDepartments();

// Get departments for specific selection type
const dropdownOptions = getDepartmentOptions('dropdown');
const checkboxOptions = getDepartmentOptions('checkbox');
```

### 2. Validation

```typescript
import { validateDepartmentSelection } from "@/config/app";

const validation = validateDepartmentSelection(['IS', 'LOG'], 'checkbox');
if (!validation.isValid) {
  console.error(validation.error);
}
```

### 3. Permissions and Access Control

```typescript
import { 
  canDepartmentAccessFeature, 
  getDepartmentPermissions 
} from "@/config/app";

// Check if department can access a feature
const canAccess = canDepartmentAccessFeature('IS', 'helpdesk');

// Get all permissions for a department
const permissions = getDepartmentPermissions('IS');
```

## Migration Guide

### From Hardcoded Arrays

**Before:**
```typescript
const DEPARTMENTS = [
  { value: "logistics", label: "Logistics" },
  { value: "procurement", label: "Procurement" },
  // ... hardcoded list
];
```

**After:**
```typescript
import { getDepartmentOptions } from "@/config/app";

const departments = getDepartmentOptions('dropdown');
```

### From Environment Variables

**Before:**
```typescript
const departments = process.env.DEPARTMENTS?.split(',') || [];
```

**After:**
```typescript
import { getActiveDepartments } from "@/config/app";

const departments = getActiveDepartments();
```

## Best Practices

### 1. Always Use Utility Functions

Instead of accessing the config directly, use the provided utility functions:

```typescript
// ✅ Good
import { getDepartmentOptions } from "@/config/app";
const departments = getDepartmentOptions('dropdown');

// ❌ Avoid
const departments = APP_CONFIG.departments.list;
```

### 2. Validate User Input

Always validate department selections:

```typescript
import { validateDepartmentSelection } from "@/config/app";

const validation = validateDepartmentSelection(selectedDepts, 'checkbox');
if (!validation.isValid) {
  // Handle validation error
}
```

### 3. Use Type-Safe Components

Use the provided components instead of building custom ones:

```typescript
// ✅ Good
import { DepartmentSelector } from "@/components/ui/department-selector";

// ❌ Avoid
<select>
  {departments.map(dept => (
    <option key={dept.value} value={dept.value}>
      {dept.label}
    </option>
  ))}
</select>
```

### 4. Handle Loading States

```typescript
import { getDepartmentOptions } from "@/config/app";

function MyComponent() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const depts = getDepartmentOptions('dropdown');
    setDepartments(depts);
    setLoading(false);
  }, []);

  if (loading) return <div>Loading departments...</div>;

  return <DepartmentSelector options={departments} />;
}
```

## Troubleshooting

### Common Issues

1. **TypeScript Errors**: Make sure to import types correctly:
   ```typescript
   import type { Department } from "@/config/app";
   ```

2. **Validation Errors**: Check that you're using the correct validation type:
   ```typescript
   // For single selection
   validateDepartmentSelection([value], 'dropdown');
   
   // For multiple selection
   validateDepartmentSelection(values, 'checkbox');
   ```

3. **Component Not Found**: Ensure you've imported the correct component:
   ```typescript
   import { DepartmentSelector } from "@/components/ui/department-selector";
   ```

### Getting Help

If you encounter issues:

1. Check the console for TypeScript errors
2. Verify that the department exists in the config
3. Ensure you're using the latest version of the components
4. Check the validation rules for your use case

## Future Enhancements

- [ ] Department hierarchy visualization
- [ ] Department-specific themes and branding
- [ ] Advanced filtering and search
- [ ] Department analytics and reporting
- [ ] Integration with external systems
