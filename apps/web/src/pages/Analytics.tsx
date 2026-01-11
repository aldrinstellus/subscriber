import { useQuery } from '@tanstack/react-query';
import { BarChart3 } from 'lucide-react';
import { analyticsApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';

export default function Analytics() {
  const { user } = useAuthStore();
  const currencySymbol = user?.currency === 'USD' ? '$' : user?.currency;

  const { data: summary, isLoading } = useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: () => analyticsApi.getSummary().then((res) => res.data.data),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500">Deep dive into your subscription spending</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">Monthly Spending</p>
          <p className="text-3xl font-bold text-gray-900">
            {currencySymbol}{summary?.totalMonthly?.toFixed(2) || '0.00'}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">Yearly Projection</p>
          <p className="text-3xl font-bold text-gray-900">
            {currencySymbol}{summary?.totalYearly?.toFixed(2) || '0.00'}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">Total Subscriptions</p>
          <p className="text-3xl font-bold text-gray-900">
            {(summary?.subscriptionCount?.active || 0) +
              (summary?.subscriptionCount?.trial || 0) +
              (summary?.subscriptionCount?.paused || 0)}
          </p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Spending by Category
        </h2>
        {summary?.byCategory?.length > 0 ? (
          <div className="space-y-4">
            {summary.byCategory.map((cat: any) => (
              <div key={cat.categoryId || 'uncategorized'} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {cat.categoryName}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({cat.count} {cat.count === 1 ? 'subscription' : 'subscriptions'})
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-gray-900">
                      {currencySymbol}{cat.amount.toFixed(2)}/mo
                    </span>
                    <span className="text-sm text-gray-500 ml-2">
                      ({cat.percentage}%)
                    </span>
                  </div>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-500"
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No data to display yet</p>
            <p className="text-sm">Add subscriptions to see analytics</p>
          </div>
        )}
      </div>

      {/* Status Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Subscription Status
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">
              {summary?.subscriptionCount?.active || 0}
            </p>
            <p className="text-sm text-green-700">Active</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">
              {summary?.subscriptionCount?.trial || 0}
            </p>
            <p className="text-sm text-blue-700">Trial</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">
              {summary?.subscriptionCount?.paused || 0}
            </p>
            <p className="text-sm text-yellow-700">Paused</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-600">
              {summary?.subscriptionCount?.cancelled || 0}
            </p>
            <p className="text-sm text-gray-700">Cancelled</p>
          </div>
        </div>
      </div>
    </div>
  );
}
