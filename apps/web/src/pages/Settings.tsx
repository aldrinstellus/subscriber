import { useState, useEffect } from 'react';
import { User, Bell, Download, Trash2, Mail, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useUser } from '../components/AuthProvider';
import { CURRENCIES } from 'shared';
import { userApi, authApi } from '../services/api';

interface ConnectedAccount {
  id: string;
  provider: string;
  email: string;
  status: string;
  lastSyncAt: string | null;
  syncStatus: string | null;
}

export default function Settings() {
  const { user } = useUser();
  const [name, setName] = useState(user?.fullName || '');
  const [currency, setCurrency] = useState('USD');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Connected accounts state
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);

  // Fetch connected accounts on mount
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await userApi.getConnectedAccounts();
        if (response.data?.data?.accounts) {
          setConnectedAccounts(response.data.data.accounts);
        }
      } catch (error) {
        console.error('Failed to fetch connected accounts:', error);
      } finally {
        setLoadingAccounts(false);
      }
    };
    fetchAccounts();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await userApi.updateSettings({ name, currency });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleConnectGmail = async () => {
    try {
      const response = await authApi.getGmailOAuthUrl();
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Failed to get Gmail OAuth URL:', error);
    }
  };

  const handleConnectOutlook = async () => {
    try {
      const response = await authApi.getOutlookOAuthUrl();
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Failed to get Outlook OAuth URL:', error);
    }
  };

  const handleScanEmails = async () => {
    setScanning(true);
    setScanResult(null);
    try {
      const response = await userApi.scanEmails();
      if (response.data?.data?.message) {
        setScanResult(response.data.data.message);
        // Refresh connected accounts to show updated sync status
        const accountsResponse = await userApi.getConnectedAccounts();
        if (accountsResponse.data?.data?.accounts) {
          setConnectedAccounts(accountsResponse.data.data.accounts);
        }
      }
    } catch (error) {
      console.error('Failed to scan emails:', error);
      setScanResult('Scan failed. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    if (!confirm('Are you sure you want to disconnect this account?')) return;
    try {
      await authApi.disconnectAccount(accountId);
      setConnectedAccounts(prev => prev.filter(a => a.id !== accountId));
    } catch (error) {
      console.error('Failed to disconnect account:', error);
    }
  };

  const userEmail = user?.primaryEmailAddress?.emailAddress || '';
  const hasGmail = connectedAccounts.some(a => a.provider === 'GMAIL');
  const hasOutlook = connectedAccounts.some(a => a.provider === 'OUTLOOK');

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage your account preferences</p>
      </div>

      {/* Connected Accounts Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Mail className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Connected Email Accounts</h2>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Connect your email to automatically find and track subscriptions from receipts.
        </p>

        {/* Connected accounts list */}
        {loadingAccounts ? (
          <div className="text-gray-500 text-sm">Loading accounts...</div>
        ) : connectedAccounts.length > 0 ? (
          <div className="space-y-3 mb-4">
            {connectedAccounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    account.provider === 'GMAIL' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {account.provider === 'GMAIL' ? 'G' : 'O'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{account.email}</p>
                    <p className="text-xs text-gray-500">
                      {account.status === 'ACTIVE' ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-3 h-3" /> Connected
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600">
                          <AlertCircle className="w-3 h-3" /> {account.status}
                        </span>
                      )}
                      {account.lastSyncAt && (
                        <span className="ml-2">
                          Last scan: {new Date(account.lastSyncAt).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                    {account.syncStatus && (
                      <p className="text-xs text-gray-400">{account.syncStatus}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDisconnect(account.id)}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Disconnect
                </button>
              </div>
            ))}
          </div>
        ) : null}

        {/* Connect buttons */}
        <div className="flex flex-wrap gap-3 mb-4">
          {!hasGmail && (
            <button
              onClick={handleConnectGmail}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="w-5 h-5 flex items-center justify-center text-red-500 font-bold">G</span>
              Connect Gmail
            </button>
          )}
          {!hasOutlook && (
            <button
              onClick={handleConnectOutlook}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="w-5 h-5 flex items-center justify-center text-blue-600 font-bold">O</span>
              Connect Outlook
            </button>
          )}
        </div>

        {/* Scan button */}
        {connectedAccounts.length > 0 && (
          <div>
            <button
              onClick={handleScanEmails}
              disabled={scanning}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
              {scanning ? 'Scanning...' : 'Scan Emails for Subscriptions'}
            </button>
            {scanResult && (
              <p className="mt-2 text-sm text-gray-600">{scanResult}</p>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <User className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={userEmail}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {CURRENCIES.map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.symbol} {curr.code} - {curr.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
        </div>
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Renewal Reminders</p>
              <p className="text-sm text-gray-500">Get notified before subscriptions renew</p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-gray-300 text-primary-600" />
          </label>
          <label className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Price Change Alerts</p>
              <p className="text-sm text-gray-500">Get notified when subscription prices change</p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-gray-300 text-primary-600" />
          </label>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Download className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Data Management</h2>
        </div>
        <div className="space-y-4">
          <button className="w-full px-4 py-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50">
            <p className="font-medium text-gray-900">Export Data</p>
            <p className="text-sm text-gray-500">Download all your subscription data as CSV</p>
          </button>
          <button className="w-full px-4 py-3 text-left border border-red-200 rounded-lg hover:bg-red-50">
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-500" />
              <p className="font-medium text-red-600">Delete Account</p>
            </div>
            <p className="text-sm text-gray-500">Permanently delete your account and all data</p>
          </button>
        </div>
      </div>
    </div>
  );
}
