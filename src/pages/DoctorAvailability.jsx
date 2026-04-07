import { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Trash2, X, AlertCircle, Info } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const DoctorAvailability = () => {
  const [availabilitySlots, setAvailabilitySlots] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBlockDate, setShowBlockDate] = useState(false);
  const [editingDay, setEditingDay] = useState(null);

  const [newBlockedDate, setNewBlockedDate] = useState({
    date: '',
    reason: ''
  });

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const timeSlots = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      const [slotsRes, blockedRes] = await Promise.all([
        api.get('/availability/slots'),
        api.get('/availability/blocked-dates')
      ]);

      setAvailabilitySlots(slotsRes.data.slots || []);
      setBlockedDates(blockedRes.data.blocked_dates || []);
    } catch (error) {
      console.error('Error fetching availability:', error);
      toast.error('Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlot = async (day, startTime, endTime) => {
    if (startTime >= endTime) {
      toast.error('End time must be after start time');
      return;
    }

    try {
      await api.post('/availability/slots', {
        day_of_week: day,
        start_time: startTime,
        end_time: endTime,
        max_appointments: 10
      });

      toast.success('Availability added successfully!');
      fetchAvailability();
      setEditingDay(null);
    } catch (error) {
      console.error('Error adding slot:', error);
      toast.error(error.response?.data?.message || 'Failed to add availability');
    }
  };

  const handleDeleteSlot = async (slotId, e) => {
    e.stopPropagation();
    
    try {
      await api.delete(`/availability/slots/${slotId}`);
      toast.success('Availability removed');
      fetchAvailability();
    } catch (error) {
      console.error('Error deleting slot:', error);
      toast.error('Failed to remove availability');
    }
  };

  const handleBlockDate = async () => {
    if (!newBlockedDate.date) {
      toast.error('Please select a date');
      return;
    }

    try {
      await api.post('/availability/block-date', newBlockedDate);
      toast.success('Date blocked successfully!');
      setShowBlockDate(false);
      setNewBlockedDate({ date: '', reason: '' });
      fetchAvailability();
    } catch (error) {
      console.error('Error blocking date:', error);
      toast.error(error.response?.data?.message || 'Failed to block date');
    }
  };

  const handleUnblockDate = async (dateId, e) => {
    e.stopPropagation();
    
    try {
      await api.delete(`/availability/blocked-dates/${dateId}`);
      toast.success('Date unblocked');
      fetchAvailability();
    } catch (error) {
      console.error('Error unblocking date:', error);
      toast.error('Failed to unblock date');
    }
  };

  const getDaySlots = (day) => {
    return availabilitySlots.filter(slot => slot.day_of_week === day);
  };

  const QuickAddModal = ({ day, onClose }) => {
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-fadeIn">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Add Availability</h3>
                <p className="text-sm text-gray-500 mt-1">{day}</p>
              </div>
              <button 
                onClick={onClose} 
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Start Time</label>
                <select
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                >
                  {timeSlots.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">End Time</label>
                <select
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                >
                  {timeSlots.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700">
                You can add multiple time slots for the same day if needed.
              </p>
            </div>
          </div>

          <div className="p-6 bg-gray-50 rounded-b-2xl flex gap-3">
            <button
              onClick={() => handleAddSlot(day, startTime, endTime)}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition shadow-sm"
            >
              Add Availability
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 font-semibold transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading availability...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-8 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">My Availability</h1>
          <p className="text-gray-600">Manage your weekly schedule and blocked dates</p>
        </div>

        {/* Action Bar */}
        <div className="mb-6 bg-white rounded-2xl shadow-sm p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span>Click on any day to add your availability</span>
          </div>
          <button
            onClick={() => setShowBlockDate(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition font-semibold shadow-sm w-full sm:w-auto justify-center"
          >
            <Calendar className="w-4 h-4" />
            Block Date
          </button>
        </div>

        {/* Desktop Weekly Calendar Grid */}
        <div className="hidden lg:block bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
          <div className="grid grid-cols-7 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            {daysOfWeek.map((day) => (
              <div
                key={day}
                className="p-4 text-center border-r border-gray-200 last:border-r-0"
              >
                <div className="font-bold text-gray-900 text-lg">{day.substring(0, 3)}</div>
                <div className="text-xs text-gray-600 mt-1">{day}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {daysOfWeek.map((day) => {
              const slots = getDaySlots(day);
              return (
                <div
                  key={day}
                  className="min-h-[320px] p-4 border-r border-gray-100 last:border-r-0 hover:bg-gray-50 transition"
                >
                  {slots.length === 0 ? (
                    <button
                      onClick={() => setEditingDay(day)}
                      className="w-full h-full flex flex-col items-center justify-center text-gray-400 hover:text-blue-600 transition group rounded-xl hover:bg-blue-50"
                    >
                      <div className="w-16 h-16 rounded-full bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center mb-3 transition">
                        <Plus className="w-8 h-8 group-hover:scale-110 transition" />
                      </div>
                      <span className="text-sm font-semibold">Add hours</span>
                    </button>
                  ) : (
                    <div className="space-y-2">
                      {slots.map((slot) => (
                        <div
                          key={slot.id}
                          className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-3 group hover:shadow-md transition cursor-pointer"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-1.5 text-blue-900 font-bold text-sm">
                                <Clock className="w-4 h-4" />
                                <span>{slot.start_time}</span>
                              </div>
                              <div className="text-blue-700 text-xs mt-1 font-medium">
                                to {slot.end_time}
                              </div>
                              <div className="text-blue-600 text-xs mt-2 bg-white bg-opacity-50 rounded-lg px-2 py-1 inline-block">
                                Max {slot.max_appointments} appointments
                              </div>
                            </div>
                            <button
                              onClick={(e) => handleDeleteSlot(slot.id, e)}
                              className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg p-1.5 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => setEditingDay(day)}
                        className="w-full py-2.5 text-sm text-blue-600 hover:text-blue-700 font-semibold hover:bg-blue-50 rounded-xl transition border-2 border-dashed border-blue-200 hover:border-blue-300"
                      >
                        + Add more hours
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile/Tablet List View */}
        <div className="lg:hidden space-y-3 mb-6">
          {daysOfWeek.map((day) => {
            const slots = getDaySlots(day);
            return (
              <div key={day} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-gray-200">
                  <h3 className="font-bold text-gray-900 text-lg">{day}</h3>
                </div>
                <div className="p-4">
                  {slots.length === 0 ? (
                    <button
                      onClick={() => setEditingDay(day)}
                      className="w-full py-8 flex flex-col items-center justify-center text-gray-400 hover:text-blue-600 transition group rounded-xl hover:bg-blue-50 border-2 border-dashed border-gray-200 hover:border-blue-300"
                    >
                      <Plus className="w-8 h-8 mb-2 group-hover:scale-110 transition" />
                      <span className="text-sm font-semibold">Add availability</span>
                    </button>
                  ) : (
                    <div className="space-y-2">
                      {slots.map((slot) => (
                        <div
                          key={slot.id}
                          className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-4 group hover:shadow-md transition"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 text-blue-900 font-bold">
                                <Clock className="w-5 h-5" />
                                <span className="text-lg">{slot.start_time} - {slot.end_time}</span>
                              </div>
                              <div className="text-blue-600 text-sm mt-2 bg-white bg-opacity-50 rounded-lg px-3 py-1.5 inline-block">
                                Max {slot.max_appointments} appointments
                              </div>
                            </div>
                            <button
                              onClick={(e) => handleDeleteSlot(slot.id, e)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg p-2 transition"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => setEditingDay(day)}
                        className="w-full py-3 text-sm text-blue-600 hover:text-blue-700 font-semibold hover:bg-blue-50 rounded-xl transition border-2 border-dashed border-blue-200 hover:border-blue-300"
                      >
                        + Add more hours
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Blocked Dates Section */}
        {blockedDates.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <h2 className="text-xl font-bold text-gray-900">Blocked Dates</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {blockedDates.map((blocked) => (
                <div
                  key={blocked.id}
                  className="flex items-center justify-between p-4 bg-red-50 border-2 border-red-200 rounded-xl hover:shadow-md transition"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900">
                      {new Date(blocked.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                    {blocked.reason && (
                      <div className="text-sm text-gray-600 mt-1 truncate">{blocked.reason}</div>
                    )}
                  </div>
                  <button
                    onClick={(e) => handleUnblockDate(blocked.id, e)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-100 rounded-lg p-2 transition ml-2 flex-shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick Add Modal */}
      {editingDay && (
        <QuickAddModal
          day={editingDay}
          onClose={() => setEditingDay(null)}
        />
      )}

      {/* Block Date Modal */}
      {showBlockDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-fadeIn">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Block Date</h3>
                  <p className="text-sm text-gray-500 mt-1">Mark a date as unavailable</p>
                </div>
                <button 
                  onClick={() => setShowBlockDate(false)} 
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={newBlockedDate.date}
                  onChange={(e) => setNewBlockedDate({ ...newBlockedDate, date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Reason (Optional)</label>
                <textarea
                  value={newBlockedDate.reason}
                  onChange={(e) => setNewBlockedDate({ ...newBlockedDate, reason: e.target.value })}
                  placeholder="e.g., On vacation, Conference, Personal day..."
                  rows="3"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition resize-none"
                />
              </div>
            </div>

            <div className="p-6 bg-gray-50 rounded-b-2xl flex gap-3">
              <button
                onClick={handleBlockDate}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-semibold transition shadow-sm"
              >
                Block Date
              </button>
              <button
                onClick={() => setShowBlockDate(false)}
                className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 font-semibold transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAvailability;
