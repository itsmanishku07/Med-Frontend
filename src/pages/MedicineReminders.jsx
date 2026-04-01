import { useState, useEffect, useRef, useCallback } from 'react'
import { Pill, Plus, Trash2, Bell, BellOff, Clock, Edit3, Save, X, AlarmCheck, VolumeX, Smartphone } from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../services/api'
import { subscribeToPush, unsubscribeFromPush, registerServiceWorker } from '../services/pushSubscription'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const emptyForm = { medicine_name: '', dosage: '', reminder_time: '', days: [], notes: '' }

// ── Continuous alarm — beeps every 2 s until stop() is called ────────────────
function startContinuousAlarm() {
  let stopped = false

  const beep = () => {
    if (stopped) return
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      ;[0, 0.35, 0.7].forEach(t => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.value = 880
        osc.type = 'sine'
        gain.gain.setValueAtTime(0.5, ctx.currentTime + t)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.3)
        osc.start(ctx.currentTime + t)
        osc.stop(ctx.currentTime + t + 0.3)
      })
    } catch (_) {}
  }

  beep()
  const id = setInterval(beep, 2000)
  return () => { stopped = true; clearInterval(id) }
}

async function requestNotifPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission()
  }
}

function showBrowserNotif(medicine, dosage) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('💊 Medicine Reminder', {
      body: `Time to take ${medicine}${dosage ? ` — ${dosage}` : ''}`,
      icon: '/favicon.ico',
    })
  }
}

// ── Full-screen alarm modal ───────────────────────────────────────────────────
function AlarmModal({ alarm, onStop }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
        <div className="relative mx-auto w-24 h-24 mb-6">
          <div className="absolute inset-0 rounded-full bg-blue-400 opacity-30 animate-ping" />
          <div className="relative w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center">
            <Pill className="w-10 h-10 text-blue-600" />
          </div>
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-500 mb-1">Medicine Reminder</p>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">{alarm.medicine_name}</h2>
        {alarm.dosage && <p className="text-base text-gray-500 mb-1">{alarm.dosage}</p>}
        {alarm.notes && <p className="text-sm text-gray-400 italic mb-2">{alarm.notes}</p>}
        <p className="text-sm text-gray-500 mb-8">Take your medicine and stop the alarm.</p>
        <button
          onClick={onStop}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold text-lg transition-colors shadow-lg shadow-red-500/30"
        >
          <VolumeX className="w-5 h-5" />
          Stop Alarm
        </button>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MedicineReminders() {
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [activeAlarm, setActiveAlarm] = useState(null)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushLoading, setPushLoading] = useState(false)
  const firedRef = useRef(new Set())
  const stopAlarmRef = useRef(null)

  const fetchReminders = useCallback(async () => {
    try {
      const res = await api.get('/medicine-reminders/')
      setReminders(res.data.reminders || [])
    } catch {
      toast.error('Failed to load reminders')
    } finally {
      setLoading(false)
    }
  }, [])

  // Check current push subscription state on mount
  useEffect(() => {
    fetchReminders()
    registerServiceWorker().then(async (reg) => {
      if (!reg) return
      const sub = await reg.pushManager.getSubscription()
      setPushEnabled(!!sub)
    })
  }, [fetchReminders])

  const handleTogglePush = async () => {
    setPushLoading(true)
    try {
      if (pushEnabled) {
        await unsubscribeFromPush()
        setPushEnabled(false)
        toast.success('Background reminders disabled')
      } else {
        const ok = await subscribeToPush()
        if (ok) {
          setPushEnabled(true)
          toast.success('Background reminders enabled — you\'ll get alarms even when the site is closed')
        } else {
          toast.error('Could not enable background reminders. Check notification permissions.')
        }
      }
    } finally {
      setPushLoading(false)
    }
  }

  // ── Scheduler: checks every 30 s ──────────────────────────────────────────
  useEffect(() => {
    const check = () => {
      const now = new Date()
      const hh = String(now.getHours()).padStart(2, '0')
      const mm = String(now.getMinutes()).padStart(2, '0')
      const hhmm = hh + ':' + mm
      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()]

      reminders.forEach(r => {
        if (!r.is_active) return
        if (r.reminder_time !== hhmm) return
        if (r.days && r.days.length > 0 && !r.days.includes(dayName)) return

        const fireKey = r.id + '-' + hhmm
        if (firedRef.current.has(fireKey)) return
        firedRef.current.add(fireKey)

        // Stop any previous alarm, start new continuous one
        if (stopAlarmRef.current) stopAlarmRef.current()
        stopAlarmRef.current = startContinuousAlarm()
        setActiveAlarm(r)
        showBrowserNotif(r.medicine_name, r.dosage)
      })

      // Reset fired set at the top of each hour (allows next-day re-fire)
      if (now.getMinutes() === 0 && now.getSeconds() < 35) {
        firedRef.current.clear()
      }
    }

    check()
    const id = setInterval(check, 30000)
    return () => clearInterval(id)
  }, [reminders])

  const stopAlarm = useCallback(() => {
    if (stopAlarmRef.current) { stopAlarmRef.current(); stopAlarmRef.current = null }
    setActiveAlarm(null)
  }, [])

  // ── Form helpers ──────────────────────────────────────────────────────────
  const toggleDay = (day) =>
    setForm(p => ({ ...p, days: p.days.includes(day) ? p.days.filter(d => d !== day) : [...p.days, day] }))

  const openAdd = () => { setForm(emptyForm); setEditId(null); setShowForm(true) }

  const openEdit = (r) => {
    setForm({ medicine_name: r.medicine_name, dosage: r.dosage || '', reminder_time: r.reminder_time, days: r.days || [], notes: r.notes || '' })
    setEditId(r.id)
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.medicine_name.trim()) return toast.error('Medicine name is required')
    if (!form.reminder_time) return toast.error('Reminder time is required')
    setSaving(true)
    try {
      const payload = {
        medicine_name: form.medicine_name.trim(),
        dosage: form.dosage.trim() || null,
        reminder_time: form.reminder_time,
        days: form.days.length > 0 ? form.days : null,
        notes: form.notes.trim() || null,
      }
      if (editId) {
        const res = await api.put('/medicine-reminders/' + editId, payload)
        setReminders(prev => prev.map(r => r.id === editId ? res.data.reminder : r))
        toast.success('Reminder updated')
      } else {
        const res = await api.post('/medicine-reminders/', payload)
        setReminders(prev => [...prev, res.data.reminder])
        toast.success('Reminder added')
      }
      setShowForm(false)
    } catch {
      toast.error('Failed to save reminder')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this reminder?')) return
    try {
      await api.delete('/medicine-reminders/' + id)
      setReminders(prev => prev.filter(r => r.id !== id))
      toast.success('Reminder deleted')
    } catch { toast.error('Failed to delete') }
  }

  const handleToggleActive = async (r) => {
    try {
      const res = await api.put('/medicine-reminders/' + r.id, { is_active: !r.is_active })
      setReminders(prev => prev.map(x => x.id === r.id ? res.data.reminder : x))
    } catch { toast.error('Failed to update') }
  }

  const formatTime = (hhmm) => {
    const [h, m] = hhmm.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    return (h % 12 || 12) + ':' + String(m).padStart(2, '0') + ' ' + ampm
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <>
      {/* Continuous alarm modal */}
      {activeAlarm && <AlarmModal alarm={activeAlarm} onStop={stopAlarm} />}

      <div className="max-w-3xl mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 rounded-xl">
              <Pill className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Medicine Reminders</h1>
              <p className="text-sm text-gray-500">Alarm rings until you stop it</p>
            </div>
          </div>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Reminder
          </button>
        </div>

        {/* Browser notification hint */}
        {'Notification' in window && Notification.permission !== 'granted' && (
          <div className="mb-4 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <Bell className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800">
              Enable browser notifications for pop-up alerts.{' '}
              <button onClick={requestNotifPermission} className="underline font-medium">Enable now</button>
            </p>
          </div>
        )}

        {/* Background push toggle */}
        {'serviceWorker' in navigator && 'PushManager' in window && (
          <div className={`mb-4 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${pushEnabled ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center gap-2">
              <Smartphone className={`w-4 h-4 shrink-0 ${pushEnabled ? 'text-green-600' : 'text-gray-400'}`} />
              <div>
                <p className="text-sm font-medium text-gray-800">Background alarms</p>
                <p className="text-xs text-gray-500">
                  {pushEnabled ? 'You\'ll get alarms even when this site is closed' : 'Enable to get alarms when the site is closed'}
                </p>
              </div>
            </div>
            <button
              onClick={handleTogglePush}
              disabled={pushLoading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${pushEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${pushEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        )}

        {/* Add / Edit Form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">{editId ? 'Edit Reminder' : 'New Reminder'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Medicine Name *</label>
                <input type="text" value={form.medicine_name}
                  onChange={e => setForm(p => ({ ...p, medicine_name: e.target.value }))}
                  placeholder="e.g. Metformin"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Dosage</label>
                <input type="text" value={form.dosage}
                  onChange={e => setForm(p => ({ ...p, dosage: e.target.value }))}
                  placeholder="e.g. 500mg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Reminder Time *</label>
                <input type="time" value={form.reminder_time}
                  onChange={e => setForm(p => ({ ...p, reminder_time: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <input type="text" value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="e.g. Take after meals"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Repeat on days <span className="text-gray-400">(leave empty = every day)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map(day => (
                  <button key={day} type="button" onClick={() => toggleDay(day)}
                    className={'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ' +
                      (form.days.includes(day) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400')}>
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50">
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Reminder'}
              </button>
            </div>
          </div>
        )}

        {/* Reminders list */}
        {reminders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
            <AlarmCheck className="w-14 h-14 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No reminders yet</p>
            <p className="text-sm text-gray-400 mt-1">Add your first medicine reminder above</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reminders.map(r => (
              <div key={r.id}
                className={'bg-white rounded-2xl border shadow-sm p-4 flex items-center gap-4 transition-opacity ' +
                  (r.is_active ? 'border-gray-200' : 'border-gray-100 opacity-60')}>
                {/* Time badge */}
                <div className={'shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-xl font-bold text-sm ' +
                  (r.is_active ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-400')}>
                  <Clock className="w-4 h-4 mb-0.5" />
                  {formatTime(r.reminder_time)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 truncate">{r.medicine_name}</p>
                    {r.dosage && <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">{r.dosage}</span>}
                    {!r.is_active && <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">Paused</span>}
                  </div>
                  {r.days && r.days.length > 0
                    ? <p className="text-xs text-gray-500 mt-0.5">{r.days.join(', ')}</p>
                    : <p className="text-xs text-gray-400 mt-0.5">Every day</p>}
                  {r.notes && <p className="text-xs text-gray-500 mt-0.5 italic">{r.notes}</p>}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => handleToggleActive(r)}
                    title={r.is_active ? 'Pause' : 'Enable'}
                    className={'p-2 rounded-lg transition-colors ' + (r.is_active ? 'text-blue-600 hover:bg-blue-50' : 'text-gray-400 hover:bg-gray-100')}>
                    {r.is_active ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                  </button>
                  <button onClick={() => openEdit(r)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(r.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
