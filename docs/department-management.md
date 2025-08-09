# Department Management Guide

This guide explains how to add, modify, and delete departments in the centralized configuration system.

## 📁 **Location of Department Configuration**

All department configurations are located in: `config/app.ts`

```typescript
// File: config/app.ts
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

## ➕ **Adding a New Department**

### **Step 1: Add to the Master List**

Add your new department to the `departments.list` array in `config/app.ts`:

```typescript
// Add this to the departments.list array
{
  value: "NEW_DEPT",           // Unique identifier (uppercase, no spaces)
  label: "New Department",     // Display name
  code: "NEW_DEPT",           // Department code (usually same as value)
  color: "bg-cyan-500",       // Tailwind CSS color class
  description: "Description of the new department", // Optional description
  isActive: true,             // Set to false to disable
  sortOrder: 18               // Order in lists (higher numbers appear later)
}
```

### **Step 2: Update Related Configurations**

#### **A. Department Codes** (if needed)
```typescript
// Add to departmentCodes object
departmentCodes: {
  // ... existing codes
  NEW_DEPT: "New Department",
}
```

#### **B. Department Home Pages** (if needed)
```typescript
// Add to departmentHomePages object
departmentHomePages: {
  // ... existing pages
  NEW_DEPT: "/lvm/new-department", // Route for the department
}
```

#### **C. Categories** (if needed)
```typescript
// Add to categories object
categories: {
  technical: ["IS", "HELPDESK", "QA", "QC", "PM", "FM", "NEW_DEPT"], // Add to appropriate category
  // ... other categories
}
```

#### **D. Permissions** (if needed)
```typescript
// Add to permissions object
permissions: {
  features: {
    // ... existing features
    newFeature: ["NEW_DEPT", "OTHER_DEPT"], // Add to relevant features
  },
  hierarchy: {
    // ... existing hierarchy
    level3: ["LOG", "PROC", "PC", "QA", "QC", "PM", "FM", "CS", "RD", "MKT", "SALES", "NEW_DEPT"], // Add to appropriate level
  }
}
```

### **Step 3: Example - Adding "Research & Development"**

```typescript
// In departments.list array
{
  value: "RD",
  label: "Research & Development",
  code: "RD",
  color: "bg-cyan-500",
  description: "Research and development activities",
  isActive: true,
  sortOrder: 13
}

// In departmentCodes object
departmentCodes: {
  // ... existing codes
  RD: "Research & Development",
}

// In departmentHomePages object
departmentHomePages: {
  // ... existing pages
  RD: "/lvm/research-development",
}

// In categories object
categories: {
  technical: ["IS", "HELPDESK", "QA", "QC", "PM", "FM", "RD"], // Add to technical
  // ... other categories
}

// In permissions object
permissions: {
  features: {
    // ... existing features
    research: ["RD", "IS"], // Add to research feature
  },
  hierarchy: {
    // ... existing hierarchy
    level3: ["LOG", "PROC", "PC", "QA", "QC", "PM", "FM", "CS", "RD", "MKT", "SALES"], // Add to level3
  }
}
```

## ✏️ **Modifying an Existing Department**

### **Step 1: Update the Department Object**

Find the department in `departments.list` and modify the desired fields:

```typescript
// Before
{
  value: "IS",
  label: "Information Systems",
  code: "IS",
  color: "bg-blue-600",
  description: "Information systems and IT management",
  isActive: true,
  sortOrder: 1
}

// After (example modifications)
{
  value: "IS",
  label: "Information Technology", // Changed label
  code: "IT",                     // Changed code
  color: "bg-indigo-600",         // Changed color
  description: "IT and technology management", // Updated description
  isActive: true,
  sortOrder: 1
}
```

### **Step 2: Update Related References**

If you changed the `value` or `code`, update all references:

```typescript
// Update departmentCodes
departmentCodes: {
  IT: "Information Technology", // Updated from IS
  // ... other codes
}

// Update departmentHomePages
departmentHomePages: {
  IT: "/lvm/information-technology", // Updated from IS
  // ... other pages
}

// Update categories
categories: {
  technical: ["IT", "HELPDESK", "QA", "QC", "PM", "FM"], // Updated from IS
  // ... other categories
}

// Update permissions
permissions: {
  features: {
    helpdesk: ["IT", "HELPDESK", "CS"], // Updated from IS
    // ... other features
  },
  hierarchy: {
    level1: ["ADMIN", "IT"], // Updated from IS
    // ... other levels
  }
}
```

## 🗑️ **Deleting a Department**

### **Step 1: Mark as Inactive (Recommended)**

Instead of completely removing a department, mark it as inactive:

```typescript
// In departments.list array
{
  value: "OLD_DEPT",
  label: "Old Department",
  code: "OLD_DEPT",
  color: "bg-gray-500",
  description: "This department is no longer active",
  isActive: false,  // Set to false to disable
  sortOrder: 99
}
```

### **Step 2: Remove from Active Lists**

Remove the department from active configurations:

```typescript
// Remove from categories
categories: {
  technical: ["IS", "HELPDESK", "QA", "QC", "PM", "FM"], // Removed OLD_DEPT
  // ... other categories
}

// Remove from permissions
permissions: {
  features: {
    helpdesk: ["IS", "HELPDESK", "CS"], // Removed OLD_DEPT
    // ... other features
  },
  hierarchy: {
    level3: ["LOG", "PROC", "PC", "QA", "QC", "PM", "FM", "CS", "RD", "MKT", "SALES"], // Removed OLD_DEPT
  }
}
```

### **Step 3: Complete Removal (If Necessary)**

If you need to completely remove a department:

1. **Remove from `departments.list`**
2. **Remove from `departmentCodes`**
3. **Remove from `departmentHomePages`**
4. **Remove from `categories`**
5. **Remove from `permissions`**

## 🎨 **Available Color Options**

Use Tailwind CSS color classes for the `color` field:

```typescript
// Blue variants
"bg-blue-500", "bg-blue-600", "bg-blue-700"

// Green variants
"bg-green-500", "bg-green-600", "bg-emerald-500"

// Purple variants
"bg-purple-500", "bg-violet-500", "bg-indigo-500"

// Red variants
"bg-red-500", "bg-rose-500", "bg-pink-500"

// Yellow/Orange variants
"bg-yellow-500", "bg-orange-500", "bg-amber-500"

// Gray variants
"bg-gray-500", "bg-slate-500", "bg-zinc-500"

// Teal/Cyan variants
"bg-teal-500", "bg-cyan-500"
```

## 🔄 **Best Practices**

### **1. Naming Conventions**
- Use **UPPERCASE** for `value` and `code` fields
- Use **Title Case** for `label` field
- Keep `value` and `code` consistent (usually the same)

### **2. Sort Order**
- Use increments of 1, 5, or 10 for easier reordering
- Leave gaps for future additions
- Example: 1, 5, 10, 15, 20, 25...

### **3. Validation**
- Ensure `value` is unique across all departments
- Ensure `code` is unique across all departments
- Validate that `color` is a valid Tailwind CSS class

### **4. Testing**
After making changes:
1. **Restart your development server**
2. **Test the components** that use departments
3. **Check for TypeScript errors**
4. **Verify the changes** in the UI

## 🛠️ **Quick Commands**

### **Add a New Department**
```bash
# 1. Open the config file
code config/app.ts

# 2. Add the new department to departments.list
# 3. Update related configurations
# 4. Restart the development server
npm run dev
```

### **Modify an Existing Department**
```bash
# 1. Find the department in departments.list
# 2. Update the desired fields
# 3. Update related references
# 4. Test the changes
```

### **Disable a Department**
```bash
# 1. Set isActive: false in the department object
# 2. Remove from active categories and permissions
# 3. Test that it no longer appears in dropdowns
```

## 🆘 **Troubleshooting**

### **Common Issues**

1. **Department not appearing in dropdowns**
   - Check that `isActive: true`
   - Verify the department is in the correct categories
   - Restart the development server

2. **TypeScript errors**
   - Ensure all required fields are present
   - Check that `value` and `code` are unique
   - Verify color class exists in Tailwind CSS

3. **Component not updating**
   - Clear browser cache
   - Restart the development server
   - Check for console errors

### **Getting Help**

If you encounter issues:
1. Check the console for errors
2. Verify the department configuration is correct
3. Test with a simple department first
4. Review the TypeScript types in `config/app.ts`

## 📝 **Example: Complete Department Addition**

Here's a complete example of adding a new "Legal" department:

```typescript
// 1. Add to departments.list
{
  value: "LEGAL",
  label: "Legal",
  code: "LEGAL",
  color: "bg-slate-600",
  description: "Legal affairs and compliance",
  isActive: true,
  sortOrder: 18
}

// 2. Add to departmentCodes
departmentCodes: {
  // ... existing codes
  LEGAL: "Legal",
}

// 3. Add to departmentHomePages
departmentHomePages: {
  // ... existing pages
  LEGAL: "/lvm/legal",
}

// 4. Add to categories
categories: {
  support: ["RD", "MKT", "SALES", "OPS", "ADMIN", "LEGAL"], // Add to support
  // ... other categories
}

// 5. Add to permissions
permissions: {
  features: {
    legal: ["LEGAL", "ADMIN"], // New legal feature
    // ... other features
  },
  hierarchy: {
    level2: ["HR", "FIN", "OPS", "LEGAL"], // Add to level2
    // ... other levels
  }
}
```

This completes the department management guide! 🎉
