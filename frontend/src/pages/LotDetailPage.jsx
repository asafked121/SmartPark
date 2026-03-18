import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import ConfirmModal from '../components/ConfirmModal';

function formatDateTime(d) {
  const date = new Date(d);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const mins = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${mins}`;
}

export default function LotDetailPage() {
  const { lotId } = useParams();
  const [lot, setLot] = useState(null);
  const [slots, setSlots] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ratePerHour, setRatePerHour] = useState(2.50);

  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
  const [startTime, setStartTime] = useState(formatDateTime(now));
  const [endTime, setEndTime] = useState(formatDateTime(oneHourLater));

  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [reserving, setReserving] = useState(false);
  const [reserveError, setReserveError] = useState('');
  const [reserveSuccess, setReserveSuccess] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    const startISO = new Date(startTime).toISOString();
    const endISO = new Date(endTime).toISOString();
    Promise.all([
      api.getLot(lotId),
      api.getSlots(lotId, startISO, endISO),
      api.getVehicles(),
      api.getConfig(),
    ])
      .then(([lotData, slotsData, vehiclesData, config]) => {
        setLot(lotData);
        setSlots(slotsData);
        setVehicles(vehiclesData);
        if (config.rate_per_hour) setRatePerHour(config.rate_per_hour);
        if (vehiclesData.length > 0) setSelectedVehicle(vehiclesData[0].vehicle_id);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [lotId]);

  const refreshSlots = (startVal = startTime, endVal = endTime) => {
    const startISO = new Date(startVal).toISOString();
    const endISO = new Date(endVal).toISOString();
    api.getSlots(lotId, startISO, endISO)
      .then(setSlots)
      .catch((err) => setError(err.message));
  };

  const handleCheckAvailability = (e) => {
    e.preventDefault();
    const form = e.target;
    const start = form.elements.start_time?.value;
    const end = form.elements.end_time?.value;
    if (start && end) {
      setStartTime(start);
      setEndTime(end);
      refreshSlots(start, end);
    }
  };

  const handleReserve = async () => {
    setConfirmOpen(false);
    if (!selectedSlot || !selectedVehicle) return;
    setReserving(true);
    setReserveError('');
    setReserveSuccess('');

    try {
      await api.createReservation({
        vehicle_id: parseInt(selectedVehicle),
        lot_id: parseInt(lotId),
        slot_number: selectedSlot,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
      });
      setReserveSuccess(`Slot ${selectedSlot} reserved successfully!`);
      setSelectedSlot(null);
      refreshSlots();
    } catch (err) {
      setReserveError(err.message);
    } finally {
      setReserving(false);
    }
  };

  const estimatedCost = () => {
    const hours = Math.ceil((new Date(endTime) - new Date(startTime)) / (1000 * 60 * 60));
    return (hours * ratePerHour).toFixed(2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error) {
    return <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>;
  }

  const floors = [...new Set(slots.map((s) => s.floor_level))].sort();

  return (
    <div>
      <ConfirmModal
        open={confirmOpen}
        title="Confirm Reservation"
        message={`Reserve slot ${selectedSlot} for $${estimatedCost()}? This will be charged at $${ratePerHour.toFixed(2)}/hr.`}
        confirmLabel="Reserve"
        variant="primary"
        onConfirm={handleReserve}
        onCancel={() => setConfirmOpen(false)}
      />

      <div className="mb-6">
        <Link to="/" className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center mb-2">
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Lots
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{lot?.name}</h1>
        <p className="text-gray-500 mt-1">{lot?.total_capacity} total spaces</p>
      </div>

      {/* Time Range Filter */}
      <form onSubmit={handleCheckAvailability} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Select Time Range</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Start Time</label>
            <input
              name="start_time"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">End Time</label>
            <input
              name="end_time"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            Check Availability
          </button>
        </div>
      </form>

      {reserveSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          {reserveSuccess}
        </div>
      )}
      {reserveError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {reserveError}
        </div>
      )}

      {/* Slot Map */}
      {floors.map((floor) => (
        <div key={floor} className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Floor {floor}</h3>
          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
            {slots
              .filter((s) => s.floor_level === floor)
              .map((slot) => {
                const isAvailable = slot.availability_status === 'available';
                const isSelected = selectedSlot === slot.slot_number;

                return (
                  <button
                    key={slot.slot_number}
                    onClick={() => isAvailable && setSelectedSlot(isSelected ? null : slot.slot_number)}
                    disabled={!isAvailable}
                    className={`relative p-3 rounded-lg border-2 text-center transition-all ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                        : isAvailable
                        ? 'border-green-300 bg-green-50 hover:border-green-400 hover:bg-green-100 cursor-pointer'
                        : 'border-red-300 bg-red-50 cursor-not-allowed opacity-70'
                    }`}
                  >
                    <div className={`text-xs font-bold ${
                      isSelected ? 'text-primary-700' : isAvailable ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {slot.slot_number}
                    </div>
                    <div className={`text-[10px] mt-1 ${
                      isSelected ? 'text-primary-500' : isAvailable ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {isSelected ? 'Selected' : isAvailable ? 'Open' : 'Taken'}
                    </div>
                  </button>
                );
              })}
          </div>
        </div>
      ))}

      {/* Legend */}
      <div className="flex items-center space-x-6 mb-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded border-2 border-green-300 bg-green-50" />
          <span className="text-gray-600">Available</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded border-2 border-red-300 bg-red-50" />
          <span className="text-gray-600">Reserved / Occupied</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded border-2 border-primary-500 bg-primary-50" />
          <span className="text-gray-600">Your Selection</span>
        </div>
      </div>

      {/* Reservation Form */}
      {selectedSlot && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Reserve Slot {selectedSlot}
          </h2>
          {vehicles.length === 0 ? (
            <div className="text-gray-500">
              You need to{' '}
              <Link to="/vehicles" className="text-primary-600 font-medium hover:underline">
                add a vehicle
              </Link>{' '}
              before making a reservation.
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
                <select
                  value={selectedVehicle}
                  onChange={(e) => setSelectedVehicle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                >
                  {vehicles.map((v) => (
                    <option key={v.vehicle_id} value={v.vehicle_id}>
                      {v.license_plate} — {v.make} {v.model}
                    </option>
                  ))}
                </select>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                <div className="flex justify-between mb-1">
                  <span>Time:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(startTime).toLocaleString()} — {new Date(endTime).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>Rate:</span>
                  <span className="font-medium text-gray-900">${ratePerHour.toFixed(2)}/hr</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Cost:</span>
                  <span className="font-medium text-gray-900">${estimatedCost()}</span>
                </div>
              </div>
              <button
                onClick={() => setConfirmOpen(true)}
                disabled={reserving}
                className="w-full py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 focus:ring-4 focus:ring-primary-200 transition-all disabled:opacity-50"
              >
                {reserving ? 'Reserving...' : 'Confirm Reservation'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
