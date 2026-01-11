import { useState } from 'react';
import { User, Bell, Download, Trash2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { CURRENCIES } from 'shared';

export default function Settings() {
  const { user, updateUser } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [currency, setCurrency] = useState(user?.currency || 'USD');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateUser({ name, currency });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage your account preferences</p>
      </div>

      {/* Profile Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <User className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Currency
            </label>
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
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Renewal Reminders</p>
              <p className="text-sm text-gray-500">
                Get notified before subscriptions renew
              </p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
          </label>

          <label className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Price Change Alerts</p>
              <p className="text-sm text-gray-500">
                Get notified when subscription prices change
              </p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
          </label>

          <label className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Monthly Report</p>
              <p className="text-sm text-gray-500">
                Receive a monthly spending summary
              </p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
          </label>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Download className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Data Management</h2>
        </div>

        <div className="space-y-4">
          <button className="w-full px-4 py-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <p className="font-medium text-gray-900">Export Data</p>
            <p className="text-sm text-gray-500">
              Download all your subscription data as CSV
            </p>
          </button>

          <button className="w-full px-4 py-3 text-left border border-red-200 rounded-lg hover:bg-red-50 transition-colors group">
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-500" />
              <p className="font-medium text-red-600">Delete Account</p>
            </div>
            <p className="text-sm text-gray-500">
              Permanently delete your account and all data
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
