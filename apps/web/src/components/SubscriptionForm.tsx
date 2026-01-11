import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { subscriptionsApi, categoriesApi } from '../services/api';

interface SubscriptionFormProps {
  subscription?: any;
  onClose: () => void;
}

const BILLING_CYCLES = [
  { value: 'FREE', label: 'Free' },
  { value: 'TRIAL', label: 'Trial' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'YEARLY', label: 'Yearly' },
  { value: 'LIFETIME', label: 'Lifetime' },
];

const POPULAR_SERVICES = [
  { name: 'Netflix', category: 'Streaming', cost: 15.99 },
  { name: 'Spotify', category: 'Music', cost: 10.99 },
  { name: 'Disney+', category: 'Streaming', cost: 7.99 },
  { name: 'Amazon Prime', category: 'Streaming', cost: 14.99 },
  { name: 'YouTube Premium', category: 'Streaming', cost: 13.99 },
  { name: 'Apple Music', category: 'Music', cost: 10.99 },
  { name: 'Adobe Creative Cloud', category: 'Software', cost: 54.99 },
  { name: 'Microsoft 365', category: 'Software', cost: 9.99 },
  { name: 'ChatGPT Plus', category: 'Software', cost: 20.0 },
  { name: 'GitHub Pro', category: 'Software', cost: 4.0 },
  { name: 'Notion', category: 'Productivity', cost: 10.0 },
  { name: 'Dropbox', category: 'Cloud Storage', cost: 11.99 },
];

export default function SubscriptionForm({ subscription, onClose }: SubscriptionFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!subscription;

  const [formData, setFormData] = useState({
    name: subscription?.name || '',
    cost: subscription?.cost || '',
    billingCycle: subscription?.billingCycle || 'MONTHLY',
    categoryId: subscription?.categoryId || '',
    startDate: subscription?.startDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    nextBillingDate: subscription?.nextBillingDate?.slice(0, 10) || '',
    status: subscription?.status || 'ACTIVE',
    websiteUrl: subscription?.websiteUrl || '',
    notes: subscription?.notes || '',
  });

  const [suggestions, setSuggestions] = useState<typeof POPULAR_SERVICES>([]);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list().then((res) => res.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => subscriptionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => subscriptionsApi.update(subscription.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      onClose();
    },
  });

  const handleNameChange = (value: string) => {
    setFormData({ ...formData, name: value });
    if (value.length >= 2) {
      const matches = POPULAR_SERVICES.filter((s) =>
        s.name.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(matches);
    } else {
      setSuggestions([]);
    }
  };

  const selectSuggestion = (service: typeof POPULAR_SERVICES[0]) => {
    const matchingCategory = categories?.find(
      (c: any) => c.name.toLowerCase() === service.category.toLowerCase()
    );
    setFormData({
      ...formData,
      name: service.name,
      cost: service.cost.toString(),
      categoryId: matchingCategory?.id || '',
    });
    setSuggestions([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      cost: parseFloat(formData.cost),
      categoryId: formData.categoryId || null,
      nextBillingDate: formData.nextBillingDate || null,
      websiteUrl: formData.websiteUrl || null,
      notes: formData.notes || null,
    };

    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const error = createMutation.error || updateMutation.error;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Subscription' : 'Add Subscription'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {(error as any)?.response?.data?.error || 'An error occurred'}
            </div>
          )}

          {/* Name with autocomplete */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Netflix, Spotify, etc."
            />
            {suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {suggestions.map((s) => (
                  <button
                    key={s.name}
                    type="button"
                    onClick={() => selectSuggestion(s)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex justify-between"
                  >
                    <span>{s.name}</span>
                    <span className="text-gray-500 text-sm">${s.cost}/mo</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cost and Billing Cycle */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cost *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  required
                  className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="9.99"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Billing Cycle *
              </label>
              <select
                value={formData.billingCycle}
                onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {BILLING_CYCLES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select a category</option>
              {categories?.map((cat: any) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Next Billing
              </label>
              <input
                type="date"
                value={formData.nextBillingDate}
                onChange={(e) => setFormData({ ...formData, nextBillingDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="ACTIVE">Active</option>
              <option value="TRIAL">Trial</option>
              <option value="PAUSED">Paused</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Website URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website URL
            </label>
            <input
              type="url"
              value={formData.websiteUrl}
              onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="https://example.com"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              placeholder="Any additional notes..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : isEditing ? 'Update' : 'Add Subscription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
