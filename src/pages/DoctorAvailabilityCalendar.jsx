import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, Clock, Plus, Trash2, X, ChevronLeft, ChevronRight, 
  Copy, Save, AlertCircle, Check, Eye, Edit2
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const DoctorAvailabilityCalendar = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // 'month' or 'week'
  const [availabilityData, setAvailabilityData] = useState({});
  const [weeklyTemplate, setWeeklyTemplate] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedDate, setSelectedDate] = useState(null);
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [showCopyWeek, setShowCopyWeek] = useState(false);
  const [showBlockDate, setShowBlockDate] = useState(false);
  
  const [newSlot, setNewSlot] = useState({
    start_time: '09:00',
    end_time: '17:00',
    max_appointments: 10
  });

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const timeSlots = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

  useEffect(() => {
    fetchAvailability();
  }, [currentDate]);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const response = await api.get('/availability/calendar-slots', {
        params: {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0]
        }
      });

      // Organize date-specific slots by date
      const organized = {};
      (response.data.slots || []).forEach(slot => {
        if (slot.date) {
          if (!organized[slot.date]) organized[slot.date] = [];
          organized[slot.date].push(slot);
        }
      });

      setAvailabilityData(organized);
      setWeeklyTemplate(response.data.weekly_template || []);
      setBlockedDates(response.data.blocked_dates || []);
    } catch (error) {
      console.error('Error fetching availability:', error);
      toast.error('Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }

    // Next month days
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }

    return days;
  };

  const formatDateKey = (date) => {
    return date.toISOString().split('T')[0];
  };

  const isDateBlocked = (date) => {
    const dateKey = formatDateKey(date);
    return blockedDates.some(blocked => blocked.date === dateKey);
  };

  const isDatePast = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const getSlotsForDate = (date) => {
    const dateKey = formatDateKey(date);
    return availabilityData[dateKey] || [];
  };

  const hasAvailability = (date) => {
    // Check if date has specific slots
    const dateKey = formatDateKey(date);
    if (availabilityData[dateKey] && availabilityData[dateKey].length > 0) {
      return true;
    }
    
    // Check if date matches weekly template
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    const hasTemplate = weeklyTemplate.some(slot => slot.day_of_week === dayName);
    
    return hasTemplate;
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateClick = (date) => {
    if (!date.isCurrentMonth) return;
    setSelectedDate(date.date);
    setShowAddSlot(true);
  };

  const getDisplaySlotsForDate = (date) => {
    // Get date-specific slots
    const dateKey = formatDateKey(date);
    const dateSlots = availabilityData[dateKey] || [];
    
    // If no date-specific slots, check weekly template
    if (dateSlots.length === 0) {
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      const templateSlots = weeklyTemplate.filter(slot => slot.day_of_week === dayName);
      return templateSlots.map(slot => ({ ...slot, isTemplate: true }));
    }
    
    return dateSlots.map(slot => ({ ...slot, isTemplate: false }));
  };

  const handleAddSlot = async () => {
    if (!selectedDate) return;

    try {
      await api.post('/availability/calendar-slots', {
        date: formatDateKey(selectedDate),
        start_time: newSlot.start_time,
        end_time: newSlot.end_time,
        max_appointments: newSlot.max_appointments
      });

      toast.success('Availability added!');
      setShowAddSlot(false);
      setNewSlot({ start_time: '09:00', end_time: '17:00', max_appointments: 10 });
      fetchAvailability();
    } catch (error) {
      console.error('Error adding slot:', error);
      toast.error(error.response?.data?.message || 'Failed to add availability');
    }
  };

  const handleDeleteSlot = async (slotId) => {
    try {
      await api.delete(`/availability/calendar-slots/${slotId}`);
      toast.success('Slot removed');
      fetchAvailability();
    } catch (error) {
      console.error('Error deleting slot:', error);
      toast.error('Failed to remove slot');
    }
  };

  const handleCopyWeekTemplate = async (targetDate) => {
    try {
      await api.post('/availability/apply-template', {
        start_date: formatDateKey(targetDate),
        weeks: 1
      });

      toast.success('Weekly template applied!');
      setShowCopyWeek(false);
      fetchAvailability();
    } catch (error) {
      console.error('Error applying template:', error);
      toast.error('Failed to apply template');
    }
  };

  const handleBlockDate = async (date, reason) => {
    try {
      await api.post('/availability/block-date', {
        date: formatDateKey(date),
        reason
      });

      toast.success('Date blocked');
      setShowBlockDate(false);
      fetchAvailability();
    } catch (error) {
      console.error('Error blocking date:', error);
      toast.error('Failed to block date');
    }
  };

  const days = getDaysInMonth();

  return (
    <div className="min-h-screen pt-20 pb-8 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Availability Calendar</h1>
            <p className="text-gray-600">Manage your schedule for months ahead</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCopyWeek(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition"
            >
              <Copy className="w-4 h-4" />
              Apply Template
            </button>
            <button
              onClick={() => navigate('/doctor-availability')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
            >
              <Edit2 className="w-4 h-4" />
              Weekly View
            </button>
          </div>
        </div>

        {/* Calendar Navigation */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={handlePreviousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-gray-900">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <button
                onClick={handleToday}
                className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition font-semibold"
              >
                Today
              </button>
            </div>

            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            {daysOfWeek.map((day) => (
              <div key={day} className="p-3 text-center font-semibold text-gray-700 text-sm">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {days.map((day, index) => {
              const slots = getSlotsForDate(day.date);
              const isBlocked = isDateBlocked(day.date);
              const isPast = isDatePast(day.date);
              const isToday = formatDateKey(day.date) === formatDateKey(new Date());

              const hasSlots = hasAvailability(day.date);

              return (
                <div
                  key={index}
                  onClick={() => !isPast && day.isCurrentMonth && handleDateClick(day)}
                  className={`min-h-[120px] p-2 border-r border-b border-gray-100 transition ${
                    !day.isCurrentMonth ? 'bg-gray-50' : 
                    isPast ? 'bg-gray-50 cursor-not-allowed' :
                    isBlocked ? 'bg-red-50 cursor-pointer' :
                    hasSlots ? 'bg-green-50 hover:bg-green-100 cursor-pointer' :
                    'hover:bg-blue-50 cursor-pointer'
                  } ${isToday ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-sm font-semibold ${
                        !day.isCurrentMonth ? 'text-gray-400' :
                        isPast ? 'text-gray-400' :
                        isToday ? 'text-blue-600' :
                        'text-gray-900'
                      }`}>
                        {day.date.getDate()}
                      </span>
                      {day.isCurrentMonth && hasSlots && !isBlocked && (
                        <div className="w-1.5 h-1.5 rounded-full bg-green-600 shadow-sm" title="Has availability"></div>
                      )}
                    </div>
                    {isBlocked && (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>

                  {day.isCurrentMonth && !isBlocked && slots.length > 0 && (
                    <div className="space-y-1">
                      {slots.slice(0, 2).map((slot) => (
                        <div
                          key={slot.id}
                          className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium truncate"
                        >
                          {slot.start_time}-{slot.end_time}
                        </div>
                      ))}
                      {slots.length > 2 && (
                        <div className="text-xs text-gray-500 font-medium">
                          +{slots.length - 2} more
                        </div>
                      )}
                    </div>
                  )}

                  {day.isCurrentMonth && isBlocked && (
                    <div className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-medium">
                      Blocked
                    </div>
                  )}

                  {day.isCurrentMonth && !isBlocked && !isPast && slots.length === 0 && (
                    <div className="flex items-center justify-center h-16 opacity-0 hover:opacity-100 transition">
                      <Plus className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-50 rounded border border-green-200 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-green-600"></div>
            </div>
            <span className="text-gray-600">Has Availability</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-50 rounded border border-red-200"></div>
            <span className="text-gray-600">Blocked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-50 ring-2 ring-blue-500 rounded"></div>
            <span className="text-gray-600">Today</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-50 rounded border border-gray-200"></div>
            <span className="text-gray-600">Past/Other Month</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white rounded border border-gray-200"></div>
            <span className="text-gray-600">No Availability</span>
          </div>
        </div>
      </div>

      {/* Add Slot Modal */}
      {showAddSlot && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">Availability</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedDate.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <button onClick={() => setShowAddSlot(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Show existing slots */}
              {(() => {
                const displaySlots = getDisplaySlotsForDate(selectedDate);
                return displaySlots.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <p className="text-sm font-semibold text-blue-900">
                        {displaySlots[0].isTemplate ? 'Weekly Template Slots' : 'Saved Availability'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      {displaySlots.map((slot, idx) => (
                        <div key={slot.id || idx} className="flex items-center justify-between bg-white rounded-lg p-3 border border-blue-100">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 text-blue-900 font-semibold">
                              <span>{slot.start_time} - {slot.end_time}</span>
                            </div>
                            <div className="text-xs text-blue-600 mt-1">
                              Max {slot.max_appointments} appointments
                            </div>
                            {slot.isTemplate && (
                              <div className="text-xs text-blue-500 mt-1 italic">
                                From weekly template
                              </div>
                            )}
                          </div>
                          {!slot.isTemplate && (
                            <button
                              onClick={() => handleDeleteSlot(slot.id)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg p-2 transition ml-2"
                              title="Delete this slot"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {displaySlots[0].isTemplate && (
                      <div className="mt-3 text-xs text-blue-700 bg-blue-100 rounded-lg p-2">
                        💡 These are from your weekly template. Add a new slot below to override for this specific date.
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Add new slot form */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Add New Time Slot</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Start Time</label>
                    <select
                      value={newSlot.start_time}
                      onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      {timeSlots.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">End Time</label>
                    <select
                      value={newSlot.end_time}
                      onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      {timeSlots.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-semibold mb-2">Max Appointments</label>
                  <input
                    type="number"
                    value={newSlot.max_appointments}
                    onChange={(e) => setNewSlot({ ...newSlot, max_appointments: parseInt(e.target.value) })}
                    min="1"
                    max="50"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 rounded-b-2xl flex gap-3 sticky bottom-0">
              <button
                onClick={handleAddSlot}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold"
              >
                Add Slot
              </button>
              <button
                onClick={() => setShowAddSlot(false)}
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-100 font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAvailabilityCalendar;
