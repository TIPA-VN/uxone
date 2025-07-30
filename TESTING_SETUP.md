# Testing Setup for Procurement Department

## Overview
This document explains how to test the procurement department functionality using test accounts and department switching features.

## Test Accounts Available

### 1. Admin Account
- **Username**: `admin`
- **Password**: `admin123`
- **Role**: ADMIN
- **Department**: IT
- **Access**: Full system access, can switch departments

### 2. Procurement Manager
- **Username**: `procurement`
- **Password**: `proc123`
- **Role**: MANAGER
- **Department**: PROC (Procurement)
- **Access**: Procurement department access

### 3. Procurement Staff
- **Username**: `procurement_staff`
- **Password**: `proc123`
- **Role**: STAFF
- **Department**: PROC (Procurement)
- **Access**: Basic procurement access

## How to Test

### Method 1: Using Test Accounts
1. Log out of your current session
2. Go to `/lvm/test-accounts` (if you're an admin) to see all available test accounts
3. Use one of the test account credentials to log in
4. You'll be automatically redirected to the appropriate department home page

### Method 2: Department Switcher (Admin Only)
1. Log in as admin (`admin` / `admin123`)
2. Look for the department switcher in the top navigation bar
3. Click on it to see available departments
4. Select "Procurement" to switch to the procurement department
5. The page will reload and show the procurement interface

## Testing the Procurement Section

### Available Pages
- **Dashboard**: `/lvm/procurement` - Main procurement overview
- **Inventory**: `/lvm/procurement/inventory` - Inventory management
- **Purchase Orders**: `/lvm/procurement/purchase-orders` - PO management
- **AI Agent**: `/lvm/procurement/ai-agent` - AI-powered procurement assistant
- **Analytics**: `/lvm/procurement/analytics` - Procurement analytics (placeholder)
- **Reports**: `/lvm/procurement/reports` - Reports section (placeholder)
- **Financial**: `/lvm/procurement/financial` - Financial section (placeholder)

### Features to Test
1. **Dashboard Overview**
   - Stats cards showing procurement metrics
   - Urgent alerts and notifications
   - Quick action buttons

2. **Inventory Management**
   - View inventory items
   - Search and filter functionality
   - Stock status indicators

3. **Purchase Orders**
   - View purchase order list
   - Status and priority filtering
   - PO details and actions

4. **AI Agent**
   - Chat interface with procurement AI
   - Quick action buttons for common queries
   - Integration with existing AI webhook

## Security Notes

- Test accounts only work when the central authentication service is unavailable
- In production, these accounts will not be accessible
- The department switcher is only available to admin users
- All test functionality is clearly marked as "Testing"

## Troubleshooting

### If test accounts don't work:
1. Check if the central authentication service is running
2. Test accounts only work when central auth is down
3. Try logging in with admin credentials first

### If department switcher doesn't appear:
1. Make sure you're logged in as an admin user
2. Check if you're in development mode (not production)
3. Refresh the page after logging in

### If procurement pages show access denied:
1. Make sure you're logged in with a procurement department account
2. Or use the department switcher to switch to procurement
3. Check that the user has the appropriate role permissions

## Development Notes

- Test accounts are defined in `app/api/auth/[...nextauth]/auth.config.ts`
- Department switcher component is in `components/DepartmentSwitcher.tsx`
- Test accounts page is at `/lvm/test-accounts`
- All procurement pages follow the existing design patterns
- AI agent integrates with the existing webhook at `http://10.116.2.72:5678/webhook/pr-agent-prompt` 