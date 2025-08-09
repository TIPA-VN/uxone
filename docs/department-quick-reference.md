# Department Management - Quick Reference

## 🎯 **Quick Actions**

### **Add a New Department**

1. **Open the config file:**
   ```bash
   code config/app.ts
   ```

2. **Add to `departments.list` array:**
   ```typescript
   {
     value: "NEW_DEPT",           // Unique identifier (UPPERCASE)
     label: "New Department",     // Display name
     code: "NEW_DEPT",           // Department code
     color: "bg-cyan-500",       // Tailwind color class
     description: "Description",  // Optional description
     isActive: true,             // Set to false to disable
     sortOrder: 18               // Order in lists
   }
   ```

3. **Update related configurations** (if needed):
   - `departmentCodes` - Add code mapping
   - `departmentHomePages` - Add route mapping
   - `categories` - Add to appropriate category
   - `permissions` - Add to features and hierarchy

### **Modify an Existing Department**

1. **Find the department in `departments.list`**
2. **Update the desired fields:**
   ```typescript
   {
     value: "IS",
     label: "Information Technology", // Changed label
     code: "IT",                     // Changed code
     color: "bg-indigo-600",         // Changed color
     description: "Updated description",
     isActive: true,
     sortOrder: 1
   }
   ```

3. **Update all references** if you changed `value` or `code`

### **Delete/Disable a Department**

1. **Mark as inactive (recommended):**
   ```typescript
   {
     value: "OLD_DEPT",
     label: "Old Department",
     code: "OLD_DEPT",
     color: "bg-gray-500",
     description: "This department is no longer active",
     isActive: false,  // Set to false
     sortOrder: 99
   }
   ```

2. **Remove from active configurations:**
   - Remove from `categories`
   - Remove from `permissions`

## 🎨 **Available Colors**

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

## 📝 **Example: Adding "Legal" Department**

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
  support: ["RD", "MKT", "SALES", "OPS", "ADMIN", "LEGAL"],
}

// 5. Add to permissions
permissions: {
  features: {
    legal: ["LEGAL", "ADMIN"],
  },
  hierarchy: {
    level2: ["HR", "FIN", "OPS", "LEGAL"],
  }
}
```

## 🔄 **Best Practices**

### **Naming Conventions**
- ✅ Use **UPPERCASE** for `value` and `code`
- ✅ Use **Title Case** for `label`
- ✅ Keep `value` and `code` consistent

### **Sort Order**
- ✅ Use increments of 1, 5, or 10
- ✅ Leave gaps for future additions
- ✅ Example: 1, 5, 10, 15, 20, 25...

### **Validation**
- ✅ Ensure `value` is unique
- ✅ Ensure `code` is unique
- ✅ Validate `color` is a valid Tailwind class

## 🛠️ **Quick Commands**

### **Add Department**
```bash
# 1. Open config
code config/app.ts

# 2. Add to departments.list
# 3. Update related configs
# 4. Restart server
npm run dev
```

### **Modify Department**
```bash
# 1. Find in departments.list
# 2. Update fields
# 3. Update references
# 4. Test changes
```

### **Disable Department**
```bash
# 1. Set isActive: false
# 2. Remove from active configs
# 3. Test dropdowns
```

## 🆘 **Troubleshooting**

### **Department not appearing**
- ✅ Check `isActive: true`
- ✅ Verify in correct categories
- ✅ Restart development server

### **TypeScript errors**
- ✅ Ensure all required fields
- ✅ Check `value` and `code` are unique
- ✅ Verify color class exists

### **Component not updating**
- ✅ Clear browser cache
- ✅ Restart development server
- ✅ Check console errors

## 📁 **File Locations**

- **Main config:** `config/app.ts`
- **Documentation:** `docs/department-configuration.md`
- **Management UI:** `app/(tipa)/admin/departments/page.tsx`
- **Components:** `components/ui/department-*.tsx`

## 🎯 **Next Steps**

1. **Test the changes** in your application
2. **Update existing forms** to use new components
3. **Verify permissions** work correctly
4. **Check all dropdowns** display correctly

---

**Need help?** Check the full documentation in `docs/department-configuration.md`
