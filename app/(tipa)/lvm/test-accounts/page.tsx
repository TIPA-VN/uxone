"use client";
import { useSession } from 'next-auth/react';
import { Copy, CheckCircle, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

const TEST_ACCOUNTS = [
  {
    username: 'admin',
    password: 'admin123',
    role: 'ADMIN',
    department: 'IT',
    description: 'Full system administrator access',
    color: 'bg-red-100 text-red-800 border-red-200'
  },
  {
    username: 'procurement',
    password: 'proc123',
    role: 'MANAGER',
    department: 'PROC',
    description: 'Procurement department manager',
    color: 'bg-green-100 text-green-800 border-green-200'
  },
  {
    username: 'procurement_staff',
    password: 'proc123',
    role: 'STAFF',
    department: 'PROC',
    description: 'Procurement department staff',
    color: 'bg-blue-100 text-blue-800 border-blue-200'
  }
];

export default function TestAccountsPage() {
  const { data: session } = useSession();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  // Only show for admin users or in development
  if (!session?.user || (session.user.role !== 'ADMIN' && process.env.NODE_ENV === 'production')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">This page is only available to administrators.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Test Accounts</h1>
          <p className="mt-2 text-sm text-gray-600">
            Use these test accounts to access different departments and roles for development and testing purposes.
          </p>
        </div>

        {/* Current User Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Session</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Username</p>
              <p className="text-sm text-gray-900">{session.user.username}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Name</p>
              <p className="text-sm text-gray-900">{session.user.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Role</p>
              <p className="text-sm text-gray-900">{session.user.role}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Department</p>
              <p className="text-sm text-gray-900">{session.user.department} - {session.user.departmentName}</p>
            </div>
          </div>
        </div>

        {/* Test Accounts */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Available Test Accounts</h2>
          
          {TEST_ACCOUNTS.map((account, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{account.description}</h3>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${account.color}`}>
                    {account.department} - {account.role}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Username</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={account.username}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
                    />
                    <button
                      onClick={() => copyToClipboard(account.username, `username-${index}`)}
                      className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {copiedField === `username-${index}` ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Password</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="password"
                      value={account.password}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
                    />
                    <button
                      onClick={() => copyToClipboard(account.password, `password-${index}`)}
                      className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {copiedField === `password-${index}` ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">How to Use Test Accounts</h3>
          <div className="space-y-3 text-sm text-blue-800">
            <div className="flex items-start space-x-2">
              <span className="font-medium">1.</span>
              <span>Log out of your current session</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="font-medium">2.</span>
              <span>Use one of the test account credentials above to log in</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="font-medium">3.</span>
              <span>You'll be automatically redirected to the appropriate department home page</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="font-medium">4.</span>
              <span>Use the department switcher in the navbar (if you're an admin) to test different departments</span>
            </div>
          </div>
        </div>

        {/* Department Switcher Info */}
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-4">Department Switcher</h3>
          <p className="text-sm text-green-800 mb-3">
            If you're logged in as an admin, you can use the department switcher in the navbar to quickly switch between departments without logging out.
          </p>
          <div className="flex items-center space-x-2 text-sm text-green-700">
            <CheckCircle className="w-4 h-4" />
            <span>Look for the department dropdown in the top navigation bar</span>
          </div>
        </div>
      </div>
    </div>
  );
} 