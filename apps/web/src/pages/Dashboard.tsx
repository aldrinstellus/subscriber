import { useQuery } from '@tanstack/react-query';
import {
  DollarSign,
  CreditCard,
  TrendingUp,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { analyticsApi, subscriptionsApi } from '../services/api';
import { useUser } from '@clerk/clerk-react';

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useUser();
  const currencySymbol = '$';

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: () => analyticsApi.getSummary().then((res) => res.data.data),
  });

  const { data: subscriptions, isLoading: subsLoading } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => subscriptionsApi.list().then((res) => res.data.data),
  });

  if (summaryLoading || subsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back{user?.fullName || user?.firstName ? `, ${user.firstName}` : ''}!
        </h1>
        <p className="text-gray-500">Here's your subscription overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Monthly Spend"
          value={`${currencySymbol}${summary?.totalMonthly?.toFixed(2) || '0.00'}`}
          icon={DollarSign}
          color="bg-green-500"
        />
        <StatCard
          label="Yearly Spend"
          value={`${currencySymbol}${summary?.totalYearly?.toFixed(2) || '0.00'}`}
          icon={TrendingUp}
          color="bg-blue-500"
        />
        <StatCard
          label="Active Subscriptions"
          value={String(summary?.subscriptionCount?.active || 0)}
          icon={CreditCard}
          color="bg-purple-500"
        />
        <StatCard
          label="Due This Month"
          value={String(summary?.upcomingRenewals?.length || 0)}
          icon={Calendar}
          color="bg-orange-500"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Renewals */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Upcoming Renewals
          </h2>
          {summary?.upcomingRenewals?.length > 0 ? (
            <div className="space-y-3">
              {summary.upcomingRenewals.slice(0, 5).map((renewal: any) => (
                <div
                  key={renewal.subscriptionId}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{renewal.name}</p>
                    <p className="text-sm text-gray-500">
                      {renewal.daysUntil === 0
                        ? 'Today'
                        : renewal.daysUntil === 1
                        ? 'Tomorrow'
                        : `In ${renewal.daysUntil} days`}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {currencySymbol}{renewal.cost.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No upcoming renewals in the next 30 days</p>
            </div>
          )}
        </div>

        {/* Spending by Category */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Spending by Category
          </h2>
          {summary?.byCategory?.length > 0 ? (
            <div className="space-y-3">
              {summary.byCategory.map((cat: any) => (
                <div key={cat.categoryId || 'uncategorized'}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">{cat.categoryName}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {currencySymbol}{cat.amount.toFixed(2)}/mo
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No subscriptions yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Subscriptions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Subscriptions
        </h2>
        {subscriptions?.items?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b border-gray-200">
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Category</th>
                  <th className="pb-3 font-medium">Cost</th>
                  <th className="pb-3 font-medium">Cycle</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subscriptions.items.slice(0, 5).map((sub: any) => (
                  <tr key={sub.id} className="text-sm">
                    <td className="py-3 font-medium text-gray-900">{sub.name}</td>
                    <td className="py-3 text-gray-500">
                      {sub.category?.name || 'Uncategorized'}
                    </td>
                    <td className="py-3 text-gray-900">
                      {currencySymbol}{Number(sub.cost).toFixed(2)}
                    </td>
                    <td className="py-3 text-gray-500 capitalize">
                      {sub.billingCycle.toLowerCase()}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          sub.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-700'
                            : sub.status === 'TRIAL'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {sub.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No subscriptions added yet</p>
            <p className="text-sm">Click "Add Subscription" to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
