// This file may contain content made using generative AI. This comment satisfies requirements for this courses AI disclosure policys.
import { useState, useEffect } from 'react';
import { api } from '../api';

export default function ReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = () => {
    api.getReservations()
      .then(setReservations)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  const handleCancel = async (reservationId) => {
    if (!confirm('Are you sure you want to cancel this reservation?')) return;
    setActionLoading(reservationId);
    try {
      await api.cancelReservation(reservationId);
      loadReservations();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePay = async (paymentId) => {
    setActionLoading(paymentId);
    try {
      await api.processPayment(paymentId);
      loadReservations();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const statusColors = {
    active: 'bg-green-100 text-green-700',
    completed: 'bg-gray-100 text-gray-600',
    cancelled: 'bg-red-100 text-red-700',
  };

  const paymentColors = {
    pending: 'bg-amber-100 text-amber-700',
    paid: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
  };

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
        <h1 className="text-2xl font-bold text-gray-900">My Reservations</h1>
        <p className="text-gray-500 mt-1">View and manage your parking reservations</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      {reservations.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-600">No reservations yet</h3>
          <p className="text-gray-400 mt-1">Go to the dashboard to reserve a parking spot</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map((r) => (
            <div
              key={r.reservation_id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {r.lot_name} — Slot {r.slot_number}
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[r.status]}`}>
                      {r.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                    <div>
                      <span className="text-gray-400">Vehicle:</span>{' '}
                      {r.license_plate} ({r.make} {r.model})
                    </div>
                    <div>
                      <span className="text-gray-400">Start:</span>{' '}
                      {new Date(r.start_time).toLocaleString()}
                    </div>
                    <div>
                      <span className="text-gray-400">End:</span>{' '}
                      {new Date(r.end_time).toLocaleString()}
                    </div>
                    {r.amount && (
                      <div>
                        <span className="text-gray-400">Fee:</span>{' '}
                        ${parseFloat(r.amount).toFixed(2)}{' '}
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${paymentColors[r.payment_status]}`}>
                          {r.payment_status}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  {r.status === 'active' && r.payment_status === 'pending' && (
                    <button
                      onClick={() => handlePay(r.payment_id)}
                      disabled={actionLoading !== null}
                      className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      Pay Now
                    </button>
                  )}
                  {r.status === 'active' && (
                    <button
                      onClick={() => handleCancel(r.reservation_id)}
                      disabled={actionLoading !== null}
                      className="px-4 py-2 bg-red-50 text-red-600 text-sm rounded-lg font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
