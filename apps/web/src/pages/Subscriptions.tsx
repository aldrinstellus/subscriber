import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Search, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { subscriptionsApi, categoriesApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import SubscriptionForm from '../components/SubscriptionForm';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

export default function Subscriptions() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const currencySymbol = user?.currency === 'USD' ? '$' : user?.currency;
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modal states
  const [editingSubscription, setEditingSubscription] = useState<any>(null);
  const [deletingSubscription, setDeletingSubscription] = useState<any>(null);

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ['subscriptions', statusFilter, categoryFilter],
    queryFn: () =>
      subscriptionsApi
        .list({
          status: statusFilter || undefined,
          categoryId: categoryFilter || undefined,
        })
        .then((res) => res.data.data),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list().then((res) => res.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => subscriptionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      setDeletingSubscription(null);
    },
  });

  const filteredSubs = subscriptions?.items?.filter((sub: any) =>
    sub.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (sub: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSubscription(sub);
  };

  const handleDelete = (sub: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingSubscription(sub);
  };

  const confirmDelete = () => {
    if (deletingSubscription) {
      deleteMutation.mutate(deletingSubscription.id);
    }
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
        <p className="text-gray-500">Manage all your subscriptions</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search subscriptions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="TRIAL">Trial</option>
          <option value="PAUSED">Paused</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Categories</option>
          {categories?.map((cat: any) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Subscriptions Grid */}
      {filteredSubs?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubs.map((sub: any) => (
            <div
              key={sub.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {sub.logoUrl ? (
                    <img
                      src={sub.logoUrl}
                      alt={sub.name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-primary-600" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">{sub.name}</h3>
                    <p className="text-sm text-gray-500">
                      {sub.category?.name || 'Uncategorized'}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    sub.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-700'
                      : sub.status === 'TRIAL'
                      ? 'bg-blue-100 text-blue-700'
                      : sub.status === 'PAUSED'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {sub.status}
                </span>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {currencySymbol}{Number(sub.cost).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500 capitalize">
                    /{sub.billingCycle.toLowerCase()}
                  </p>
                </div>
                {sub.nextBillingDate && (
                  <p className="text-sm text-gray-500">
                    Next: {new Date(sub.nextBillingDate).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={(e) => handleEdit(sub, e)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={(e) => handleDelete(sub, e)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No subscriptions found
          </h3>
          <p className="text-gray-500 mb-4">
            {search || statusFilter || categoryFilter
              ? 'Try adjusting your filters'
              : 'Add your first subscription to get started'}
          </p>
        </div>
      )}

      {/* Edit Subscription Modal */}
      {editingSubscription && (
        <SubscriptionForm
          subscription={editingSubscription}
          onClose={() => setEditingSubscription(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingSubscription && (
        <DeleteConfirmModal
          title="Delete Subscription"
          message="Are you sure you want to delete this subscription? This action cannot be undone."
          itemName={deletingSubscription.name}
          isLoading={deleteMutation.isPending}
          onConfirm={confirmDelete}
          onClose={() => setDeletingSubscription(null)}
        />
      )}
    </div>
  );
}
