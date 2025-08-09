"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { 
  Shield, 
  Database, 
  Mail, 
  Globe, 
  Bell,
  Save,
  RefreshCw
} from "lucide-react";
import { APP_CONFIG, canAccessPage } from "@/config/app";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


export default function AdminSettings() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Form state
  const [settings, setSettings] = useState({
    general: {
      appName: APP_CONFIG.name,
      defaultLanguage: "en",
      timezone: "Asia/Bangkok",
      maintenanceMode: false,
      debugMode: false
    },
    security: {
      sessionTimeout: 30,
      passwordPolicy: "strong",
      mfaEnabled: true,
      maxLoginAttempts: 5,
      lockoutDuration: 15,
      requirePasswordChange: 90
    },
    email: {
      smtpHost: "",
      smtpPort: 587,
      smtpUser: "",
      smtpPassword: "",
      fromEmail: "noreply@company.com",
      fromName: "System Administrator"
    },
    database: {
      backupEnabled: true,
      backupFrequency: "daily",
      backupRetention: 30,
      autoOptimization: true
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: false,
      systemAlerts: true,
      userActivityLogs: true
    }
  });

  // Check authentication and access
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    redirect("/auth/signin");
  }

  if (!canAccessPage(session.user.role, 'admin')) {
    redirect("/");
  }

  const handleSettingChange = (category: keyof typeof settings, key: string, value: string | number | boolean) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const handleSave = async (category: keyof typeof settings) => {
    setIsLoading(true);
    setSaveMessage("");
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log(`Saving ${category} settings:`, settings[category]);
      
      setSaveMessage(`${category} settings saved successfully!`);
      setTimeout(() => setSaveMessage(""), 3000);
    } catch {
      setSaveMessage(`Failed to save ${category} settings. Please try again.`);
      setTimeout(() => setSaveMessage(""), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAll = async () => {
    setIsLoading(true);
    setSaveMessage("");
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Saving all settings:', settings);
      
      setSaveMessage("All settings saved successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch {
      setSaveMessage("Failed to save settings. Please try again.");
      setTimeout(() => setSaveMessage(""), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = (category: keyof typeof settings) => {
    if (confirm(`Are you sure you want to reset ${category} settings to default values?`)) {
      // Reset to default values
      setSettings(prev => ({
        ...prev,
        [category]: {
          ...prev[category]
        }
      }));
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="mt-2 text-sm text-gray-600">
            Configure system-wide settings and preferences
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            disabled={isLoading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset All
          </Button>
          <Button
            onClick={handleSaveAll}
            disabled={isLoading}
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? "Saving..." : "Save All"}
          </Button>
        </div>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className={`p-4 rounded-lg ${
          saveMessage.includes('successfully') 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {saveMessage}
        </div>
      )}

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="w-5 h-5 mr-2" />
            General Settings
          </CardTitle>
          <CardDescription>
            Basic application configuration and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="appName">Application Name</Label>
              <Input
                id="appName"
                value={settings.general.appName}
                onChange={(e) => handleSettingChange('general', 'appName', e.target.value)}
                placeholder="Enter application name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="defaultLanguage">Default Language</Label>
              <Select
                value={settings.general.defaultLanguage}
                onValueChange={(value) => handleSettingChange('general', 'defaultLanguage', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="th">Thai</SelectItem>
                  <SelectItem value="zh">Chinese</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="timezone">Time Zone</Label>
              <Select
                value={settings.general.timezone}
                onValueChange={(value) => handleSettingChange('general', 'timezone', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Bangkok">Asia/Bangkok (GMT+7)</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">America/New_York</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
              <div className="flex items-center space-x-2">
                <input
                  id="maintenanceMode"
                  type="checkbox"
                  checked={settings.general.maintenanceMode}
                  onChange={(e) => handleSettingChange('general', 'maintenanceMode', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-600">
                  {settings.general.maintenanceMode ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => handleReset('general')}
              disabled={isLoading}
            >
              Reset
            </Button>
            <Button
              onClick={() => handleSave('general')}
              disabled={isLoading}
            >
              <Save className="w-4 h-4 mr-2" />
              Save General
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Security Settings
          </CardTitle>
          <CardDescription>
            Security policies and authentication settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={settings.security.sessionTimeout}
                onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
                min="5"
                max="480"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="passwordPolicy">Password Policy</Label>
              <Select
                value={settings.security.passwordPolicy}
                onValueChange={(value) => handleSettingChange('security', 'passwordPolicy', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select policy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard (8+ characters)</SelectItem>
                  <SelectItem value="strong">Strong (12+ characters, special chars)</SelectItem>
                  <SelectItem value="enterprise">Enterprise (16+ characters, complex)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
              <Input
                id="maxLoginAttempts"
                type="number"
                value={settings.security.maxLoginAttempts}
                onChange={(e) => handleSettingChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                min="3"
                max="10"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lockoutDuration">Lockout Duration (minutes)</Label>
              <Input
                id="lockoutDuration"
                type="number"
                value={settings.security.lockoutDuration}
                onChange={(e) => handleSettingChange('security', 'lockoutDuration', parseInt(e.target.value))}
                min="5"
                max="60"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="mfaEnabled">Multi-Factor Authentication</Label>
                <p className="text-sm text-gray-600">Require 2FA for all users</p>
              </div>
              <input
                id="mfaEnabled"
                type="checkbox"
                checked={settings.security.mfaEnabled}
                onChange={(e) => handleSettingChange('security', 'mfaEnabled', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="requirePasswordChange">Require Password Change</Label>
                <p className="text-sm text-gray-600">Force password change every N days</p>
              </div>
              <Input
                id="requirePasswordChange"
                type="number"
                value={settings.security.requirePasswordChange}
                onChange={(e) => handleSettingChange('security', 'requirePasswordChange', parseInt(e.target.value))}
                className="w-20"
                min="30"
                max="365"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => handleReset('security')}
              disabled={isLoading}
            >
              Reset
            </Button>
            <Button
              onClick={() => handleSave('security')}
              disabled={isLoading}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Security
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="w-5 h-5 mr-2" />
            Email Configuration
          </CardTitle>
          <CardDescription>
            SMTP server settings and email preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="smtpHost">SMTP Host</Label>
              <Input
                id="smtpHost"
                value={settings.email.smtpHost}
                onChange={(e) => handleSettingChange('email', 'smtpHost', e.target.value)}
                placeholder="smtp.gmail.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="smtpPort">SMTP Port</Label>
              <Input
                id="smtpPort"
                type="number"
                value={settings.email.smtpPort}
                onChange={(e) => handleSettingChange('email', 'smtpPort', parseInt(e.target.value))}
                placeholder="587"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="smtpUser">SMTP Username</Label>
              <Input
                id="smtpUser"
                value={settings.email.smtpUser}
                onChange={(e) => handleSettingChange('email', 'smtpUser', e.target.value)}
                placeholder="user@domain.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="smtpPassword">SMTP Password</Label>
              <Input
                id="smtpPassword"
                type="password"
                value={settings.email.smtpPassword}
                onChange={(e) => handleSettingChange('email', 'smtpPassword', e.target.value)}
                placeholder="Enter password"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fromEmail">From Email</Label>
              <Input
                id="fromEmail"
                type="email"
                value={settings.email.fromEmail}
                onChange={(e) => handleSettingChange('email', 'fromEmail', e.target.value)}
                placeholder="noreply@company.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fromName">From Name</Label>
              <Input
                id="fromName"
                value={settings.email.fromName}
                onChange={(e) => handleSettingChange('email', 'fromName', e.target.value)}
                placeholder="System Administrator"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => handleReset('email')}
              disabled={isLoading}
            >
              Reset
            </Button>
            <Button
              onClick={() => handleSave('email')}
              disabled={isLoading}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Email
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Database Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="w-5 h-5 mr-2" />
            Database Settings
          </CardTitle>
          <CardDescription>
            Database backup and optimization settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="backupFrequency">Backup Frequency</Label>
              <Select
                value={settings.database.backupFrequency}
                onValueChange={(value) => handleSettingChange('database', 'backupFrequency', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="backupRetention">Backup Retention (days)</Label>
              <Input
                id="backupRetention"
                type="number"
                value={settings.database.backupRetention}
                onChange={(e) => handleSettingChange('database', 'backupRetention', parseInt(e.target.value))}
                min="1"
                max="365"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="backupEnabled">Enable Automatic Backups</Label>
                <p className="text-sm text-gray-600">Automatically backup database</p>
              </div>
              <input
                id="backupEnabled"
                type="checkbox"
                checked={settings.database.backupEnabled}
                onChange={(e) => handleSettingChange('database', 'backupEnabled', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="autoOptimization">Auto Optimization</Label>
                <p className="text-sm text-gray-600">Automatically optimize database performance</p>
              </div>
              <input
                id="autoOptimization"
                type="checkbox"
                checked={settings.database.autoOptimization}
                onChange={(e) => handleSettingChange('database', 'autoOptimization', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => handleReset('database')}
              disabled={isLoading}
            >
              Reset
            </Button>
            <Button
              onClick={() => handleSave('database')}
              disabled={isLoading}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Database
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Configure system notifications and alerts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="emailNotifications">Email Notifications</Label>
                <p className="text-sm text-gray-600">Send notifications via email</p>
              </div>
              <input
                id="emailNotifications"
                type="checkbox"
                checked={settings.notifications.emailNotifications}
                onChange={(e) => handleSettingChange('notifications', 'emailNotifications', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="pushNotifications">Push Notifications</Label>
                <p className="text-sm text-gray-600">Send push notifications to devices</p>
              </div>
              <input
                id="pushNotifications"
                type="checkbox"
                checked={settings.notifications.pushNotifications}
                onChange={(e) => handleSettingChange('notifications', 'pushNotifications', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="systemAlerts">System Alerts</Label>
                <p className="text-sm text-gray-600">Show system-wide alerts</p>
              </div>
              <input
                id="systemAlerts"
                type="checkbox"
                checked={settings.notifications.systemAlerts}
                onChange={(e) => handleSettingChange('notifications', 'systemAlerts', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="userActivityLogs">User Activity Logs</Label>
                <p className="text-sm text-gray-600">Log user activities for audit</p>
              </div>
              <input
                id="userActivityLogs"
                type="checkbox"
                checked={settings.notifications.userActivityLogs}
                onChange={(e) => handleSettingChange('notifications', 'userActivityLogs', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => handleReset('notifications')}
              disabled={isLoading}
            >
              Reset
            </Button>
            <Button
              onClick={() => handleSave('notifications')}
              disabled={isLoading}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Notifications
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 