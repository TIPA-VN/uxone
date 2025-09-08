"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Home,
  Copy,
  CheckCircle,
  AlertTriangle,
  Clock,
  Server,
  Bell,
  Code,
  Terminal,
  Lightbulb,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

export default function ExpirationMonitoringSetupPage() {
  const [copiedCode, setCopiedCode] = useState<string>('');

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const cronExamples = [
    {
      id: 'daily-check',
      schedule: '0 8 * * *',
      description: 'Daily expiration check at 8 AM',
      command: 'node /path/to/uxone/scripts/contract-monitoring-cron.js check-expirations'
    },
    {
      id: 'weekly-renewal',
      schedule: '0 2 * * 0',
      description: 'Weekly auto-renewal process on Sundays at 2 AM',
      command: 'node /path/to/uxone/scripts/contract-monitoring-cron.js process-renewals'
    },
    {
      id: 'full-monitoring',
      schedule: '0 8 * * *',
      description: 'Complete monitoring (recommended)',
      command: 'node /path/to/uxone/scripts/contract-monitoring-cron.js full-monitoring'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href="/lvm/documentation" className="flex items-center text-gray-600 hover:text-gray-900">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Documentation
                </Link>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <div className="flex items-center space-x-2">
                  <Settings className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-gray-900">Expiration Monitoring Setup</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Link href="/lvm" className="flex items-center text-gray-600 hover:text-gray-900">
                  <Home className="w-4 h-4 mr-2" />
                  Back to LVM
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Introduction */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-8">
            <h1 className="text-3xl font-bold mb-4 text-white">Contract Expiration Monitoring Setup</h1>
            <p className="text-xl text-blue-100 mb-6">
              Configure automated contract expiration monitoring, including cron job setup and notification management.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-blue-500 hover:bg-blue-400 text-white">Advanced</Badge>
              <Badge className="bg-blue-500 hover:bg-blue-400 text-white">System Administration</Badge>
              <Badge className="bg-blue-500 hover:bg-blue-400 text-white">Automation</Badge>
            </div>
          </div>

          {/* Prerequisites */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
                Prerequisites
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                  UXOne application deployed and running
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                  Database schema updated with lifecycle management tables
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                  Server access for cron job configuration
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                  Node.js environment available for script execution
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Environment Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2 text-blue-600" />
                Environment Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                First, configure the necessary environment variables for automated monitoring:
              </p>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Required Environment Variables</h4>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg relative">
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2 text-xs"
                      onClick={() => copyToClipboard(`# Application URL for cron jobs
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Optional: Secure cron job endpoint
CRON_SECRET_TOKEN=your-secret-token-here

# Database connection (if not already set)
UXONE_DATABASE_URL=postgresql://username:password@localhost:5432/uxone`, 'env-vars')}
                    >
                      {copiedCode === 'env-vars' ? (
                        <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                      ) : (
                        <Copy className="w-3 h-3 mr-1" />
                      )}
                      Copy
                    </Button>
                    <pre className="text-sm">
{`# Application URL for cron jobs
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Optional: Secure cron job endpoint
CRON_SECRET_TOKEN=your-secret-token-here

# Database connection (if not already set)
UXONE_DATABASE_URL=postgresql://username:password@localhost:5432/uxone`}
                    </pre>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-start">
                    <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 mr-2" />
                    <div>
                      <strong className="text-blue-800">Security Note:</strong>
                      <p className="text-blue-700 mt-1">
                        The <code>CRON_SECRET_TOKEN</code> is optional but recommended for production environments. 
                        It prevents unauthorized access to the automated monitoring endpoints.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cron Job Setup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2 text-green-600" />
                Cron Job Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-gray-700">
                Set up automated monitoring using cron jobs. Choose one of the following configurations:
              </p>

              {cronExamples.map((example) => (
                <div key={example.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">{example.description}</h4>
                    <Badge variant="outline" className="font-mono text-xs">
                      {example.schedule}
                    </Badge>
                  </div>
                  
                  <div className="bg-gray-900 text-gray-100 p-3 rounded-md relative">
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-1 right-1 text-xs"
                      onClick={() => copyToClipboard(`${example.schedule} ${example.command}`, example.id)}
                    >
                      {copiedCode === example.id ? (
                        <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                      ) : (
                        <Copy className="w-3 h-3 mr-1" />
                      )}
                      Copy
                    </Button>
                    <code className="text-sm">
                      {example.schedule} {example.command}
                    </code>
                  </div>
                </div>
              ))}

              <div className="mt-6">
                <h4 className="font-semibold text-gray-900 mb-3">Setting Up Cron Jobs</h4>
                <ol className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">1</span>
                    <div>
                      <strong>Open crontab editor:</strong>
                      <div className="bg-gray-100 rounded p-2 mt-1 font-mono text-sm">
                        crontab -e
                      </div>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">2</span>
                    <div>
                      <strong>Add your chosen cron job line</strong> (copy from examples above)
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">3</span>
                    <div>
                      <strong>Save and exit</strong> (Ctrl+X, then Y, then Enter in nano)
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">4</span>
                    <div>
                      <strong>Verify cron job is scheduled:</strong>
                      <div className="bg-gray-100 rounded p-2 mt-1 font-mono text-sm">
                        crontab -l
                      </div>
                    </div>
                  </li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* Manual Testing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Terminal className="w-5 h-5 mr-2 text-purple-600" />
                Manual Testing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Before setting up automated cron jobs, test the monitoring script manually:
              </p>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Test Expiration Check</h4>
                  <div className="bg-gray-900 text-gray-100 p-3 rounded-lg relative">
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-1 right-1 text-xs"
                      onClick={() => copyToClipboard('node scripts/contract-monitoring-cron.js check-expirations', 'test-expiration')}
                    >
                      {copiedCode === 'test-expiration' ? (
                        <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                      ) : (
                        <Copy className="w-3 h-3 mr-1" />
                      )}
                      Copy
                    </Button>
                    <code className="text-sm">
                      node scripts/contract-monitoring-cron.js check-expirations
                    </code>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Test Auto-Renewal</h4>
                  <div className="bg-gray-900 text-gray-100 p-3 rounded-lg relative">
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-1 right-1 text-xs"
                      onClick={() => copyToClipboard('node scripts/contract-monitoring-cron.js process-renewals', 'test-renewal')}
                    >
                      {copiedCode === 'test-renewal' ? (
                        <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                      ) : (
                        <Copy className="w-3 h-3 mr-1" />
                      )}
                      Copy
                    </Button>
                    <code className="text-sm">
                      node scripts/contract-monitoring-cron.js process-renewals
                    </code>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Test Full Monitoring</h4>
                  <div className="bg-gray-900 text-gray-100 p-3 rounded-lg relative">
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-1 right-1 text-xs"
                      onClick={() => copyToClipboard('node scripts/contract-monitoring-cron.js full-monitoring', 'test-full')}
                    >
                      {copiedCode === 'test-full' ? (
                        <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                      ) : (
                        <Copy className="w-3 h-3 mr-1" />
                      )}
                      Copy
                    </Button>
                    <code className="text-sm">
                      node scripts/contract-monitoring-cron.js full-monitoring
                    </code>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-2" />
                  <div>
                    <strong className="text-green-800">Expected Output:</strong>
                    <p className="text-green-700 mt-1">
                      The script should output JSON results showing contracts checked, notifications sent, 
                      and any errors encountered. Check the logs for detailed information.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monitoring and Logs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Server className="w-5 h-5 mr-2 text-gray-600" />
                Monitoring and Logs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Monitor the automated system and review logs for proper operation:
              </p>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Cron Job Logs</h4>
                  <div className="bg-gray-100 rounded p-3">
                    <p className="text-sm text-gray-700 mb-2">View cron job execution logs:</p>
                    <code className="text-sm font-mono">tail -f /var/log/cron</code>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Application Logs</h4>
                  <div className="bg-gray-100 rounded p-3">
                    <p className="text-sm text-gray-700 mb-2">Monitor application logs for monitoring results:</p>
                    <code className="text-sm font-mono">tail -f logs/contract-monitoring.log</code>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Success Indicators</h4>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                      Contracts are being checked regularly
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                      Notifications are being sent to users
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                      Auto-renewals are processing correctly
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                      No errors in the logs
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Troubleshooting */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-red-600" />
                Troubleshooting Common Issues
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="border-l-4 border-red-500 pl-4">
                  <h4 className="font-semibold text-gray-900 mb-1">Cron Job Not Running</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Check if cron service is running: <code>systemctl status cron</code></li>
                    <li>• Verify cron job syntax: <code>crontab -l</code></li>
                    <li>• Check file permissions on the script</li>
                    <li>• Ensure Node.js path is correct in cron environment</li>
                  </ul>
                </div>

                <div className="border-l-4 border-yellow-500 pl-4">
                  <h4 className="font-semibold text-gray-900 mb-1">Notifications Not Sent</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Verify email configuration in application settings</li>
                    <li>• Check user notification preferences</li>
                    <li>• Review application logs for email errors</li>
                    <li>• Test manual notification sending</li>
                  </ul>
                </div>

                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold text-gray-900 mb-1">Database Connection Issues</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Verify database connection string</li>
                    <li>• Check database server status</li>
                    <li>• Ensure database schema is up to date</li>
                    <li>• Test database connectivity from cron environment</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-8 border-t border-gray-200">
            <Link href="/lvm/documentation/api/contracts" className="flex items-center text-blue-600 hover:text-blue-700">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous: API Reference
            </Link>
            <Link href="/lvm/documentation/system/troubleshooting" className="flex items-center text-blue-600 hover:text-blue-700">
              Next: Troubleshooting
              <ChevronRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
