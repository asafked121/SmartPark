import { useState, useEffect } from 'react';
import { api } from '../api';

export default function AdminPage() {
  const [tab, setTab] = useState('reservations');
  const [occupancy, setOccupancy] = useState([]);
  const [revenue, setRevenue] = useState([]);
  const [lots, setLots] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resFilter, setResFilter] = useState({ status: '', lot_id: '' });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (tab === 'reservations') {
      loadReservations();
    }
  }, [tab, resFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [occ, rev, lotsData, res] = await Promise.all([
        api.getOccupancy(),
        api.getRevenue(),
        api.getLots(),
        api.getAllReservations(resFilter),
      ]);
      setOccupancy(occ);
      setRevenue(rev);
      setLots(lotsData);
      setReservations(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadReservations = async () => {
    try {
      const res = await api.getAllReservations(resFilter);
      setReservations(res);
    } catch (err) {
      console.error(err);
    }
  };

  const tabs = [
    { id: 'reservations', label: 'All Reservations' },
    { id: 'occupancy', label: 'Occupancy' },
    { id: 'revenue', label: 'Revenue' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-500 mt-1">Manage parking lots and view system analytics</p>
      </div>

      <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'occupancy' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {occupancy.map((lot) => {
            const occupied = parseInt(lot.currently_occupied);
            const available = parseInt(lot.currently_available);
            const total = parseInt(lot.total_capacity);
            const pct = total > 0 ? Math.round((occupied / total) * 100) : 0;

            return (
              <div key={lot.lot_id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{lot.name}</h3>
                <div className="mb-3">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>{occupied} occupied</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-amber-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-green-600">{available}</div>
                    <div className="text-xs text-green-600 font-medium">Available</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-gray-600">{total}</div>
                    <div className="text-xs text-gray-500 font-medium">Total</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'revenue' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {revenue.map((lot, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{lot.lot_name}</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Total Transactions</span>
                  <span className="text-lg font-bold text-gray-900">{lot.total_transactions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Revenue Collected</span>
                  <span className="text-lg font-bold text-green-600">${parseFloat(lot.total_revenue).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Pending Revenue</span>
                  <span className="text-lg font-bold text-amber-600">${parseFloat(lot.pending_revenue).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'reservations' && (
        <div>
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600">Status</label>
              <select
                value={resFilter.status}
                onChange={(e) => setResFilter((f) => ({ ...f, status: e.target.value }))}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600">Lot</label>
              <select
                value={resFilter.lot_id}
                onChange={(e) => setResFilter((f) => ({ ...f, lot_id: e.target.value }))}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Lots</option>
                {lots.map((l) => (
                  <option key={l.lot_id} value={l.lot_id}>{l.name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={loadReservations}
              className="px-3 py-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
            >
              Refresh
            </button>
            <span className="text-sm text-gray-500 ml-auto">
              {reservations.length} reservation{reservations.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lot / Slot</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reservations.map((r) => (
                  <tr key={r.reservation_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">#{r.reservation_id}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{r.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-mono">{r.license_plate}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{r.lot_name} / {r.slot_number}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div>{new Date(r.start_time).toLocaleString()}</div>
                      <div className="text-gray-400">to {new Date(r.end_time).toLocaleString()}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.status === 'active' ? 'bg-green-100 text-green-700'
                        : r.status === 'cancelled' ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-600'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {r.amount ? `$${parseFloat(r.amount).toFixed(2)}` : '-'}
                      {r.payment_status && (
                        <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          r.payment_status === 'paid' ? 'bg-green-100 text-green-700'
                          : r.payment_status === 'pending' ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-700'
                        }`}>
                          {r.payment_status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {reservations.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                      No reservations found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
