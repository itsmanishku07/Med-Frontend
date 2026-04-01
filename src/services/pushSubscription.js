import api from './api'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null
  try {
    const reg = await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready
    return reg
  } catch (e) {
    console.error('SW registration failed:', e)
    return null
  }
}

export async function subscribeToPush() {
  try {
    const reg = await registerServiceWorker()
    if (!reg) return false

    // Request notification permission
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return false

    // Check if already subscribed
    let sub = await reg.pushManager.getSubscription()
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
    }

    // Send subscription to backend
    const subJson = sub.toJSON()
    await api.post('/push/subscribe', {
      endpoint: subJson.endpoint,
      keys: { p256dh: subJson.keys.p256dh, auth: subJson.keys.auth },
    })
    return true
  } catch (e) {
    console.error('Push subscribe error:', e)
    return false
  }
}

export async function unsubscribeFromPush() {
  try {
    const reg = await navigator.serviceWorker.getRegistration('/sw.js')
    if (!reg) return
    const sub = await reg.pushManager.getSubscription()
    if (!sub) return
    await api.post('/push/unsubscribe', { endpoint: sub.endpoint })
    await sub.unsubscribe()
  } catch (e) {
    console.error('Push unsubscribe error:', e)
  }
}
