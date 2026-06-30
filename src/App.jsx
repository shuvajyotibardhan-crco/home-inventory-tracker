import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { initializeApp } from 'firebase/app'
import {
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth'
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore'
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage'
import {
  LogIn,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  Camera,
  X,
  BarChart2,
  Download,
  RefreshCw,
  Search,
  Image,
  CheckSquare,
  Square,
  AlertCircle,
  Loader2,
} from 'lucide-react'

// ─── Firebase init ────────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const storage = getStorage(app)
const googleProvider = new GoogleAuthProvider()

// ─── Constants ────────────────────────────────────────────────────────────────

const ROOMS = [
  'Living Room',
  'Kitchen',
  'Master Bedroom',
  'Bedroom 2',
  'Bedroom 3',
  'Bathroom',
  'En-suite',
  'Dining Room',
  'Study / Office',
  'Garage',
  'Utility Room',
  'Loft / Attic',
  'Garden / Shed',
  'Hallway',
]

const DEFAULT_ITEMS = [
  { name: 'Sofa (3-seater)', room: 'Living Room', value: 1200 },
  { name: 'Coffee Table', room: 'Living Room', value: 250 },
  { name: 'TV (65")', room: 'Living Room', value: 900 },
  { name: 'TV Stand', room: 'Living Room', value: 180 },
  { name: 'Bookcase', room: 'Living Room', value: 150 },
  { name: 'Floor Lamp', room: 'Living Room', value: 80 },
  { name: 'Rug', room: 'Living Room', value: 200 },
  { name: 'Armchair', room: 'Living Room', value: 450 },
  { name: 'Curtains', room: 'Living Room', value: 120 },
  { name: 'Gaming Console', room: 'Living Room', value: 500 },
  { name: 'Refrigerator', room: 'Kitchen', value: 800 },
  { name: 'Washing Machine', room: 'Kitchen', value: 600 },
  { name: 'Dishwasher', room: 'Kitchen', value: 550 },
  { name: 'Microwave', room: 'Kitchen', value: 120 },
  { name: 'Toaster', room: 'Kitchen', value: 40 },
  { name: 'Kettle', room: 'Kitchen', value: 35 },
  { name: 'Coffee Machine', room: 'Kitchen', value: 180 },
  { name: 'Air Fryer', room: 'Kitchen', value: 90 },
  { name: 'Blender', room: 'Kitchen', value: 60 },
  { name: 'Stand Mixer', room: 'Kitchen', value: 350 },
  { name: 'Knife Set', room: 'Kitchen', value: 100 },
  { name: 'Dining Table', room: 'Dining Room', value: 700 },
  { name: 'Dining Chairs (×6)', room: 'Dining Room', value: 480 },
  { name: 'Sideboard', room: 'Dining Room', value: 350 },
  { name: 'King Bed Frame', room: 'Master Bedroom', value: 900 },
  { name: 'King Mattress', room: 'Master Bedroom', value: 1100 },
  { name: 'Wardrobe (2-door)', room: 'Master Bedroom', value: 600 },
  { name: 'Chest of Drawers', room: 'Master Bedroom', value: 280 },
  { name: 'Bedside Tables (×2)', room: 'Master Bedroom', value: 200 },
  { name: 'Dressing Table', room: 'Master Bedroom', value: 220 },
  { name: 'Full-length Mirror', room: 'Master Bedroom', value: 90 },
  { name: 'Double Bed Frame', room: 'Bedroom 2', value: 500 },
  { name: 'Double Mattress', room: 'Bedroom 2', value: 600 },
  { name: 'Single Wardrobe', room: 'Bedroom 2', value: 300 },
  { name: 'Chest of Drawers', room: 'Bedroom 2', value: 180 },
  { name: 'Single Bed Frame', room: 'Bedroom 3', value: 250 },
  { name: 'Single Mattress', room: 'Bedroom 3', value: 300 },
  { name: 'Wardrobe', room: 'Bedroom 3', value: 280 },
  { name: 'Desk', room: 'Bedroom 3', value: 150 },
  { name: 'Desk Chair', room: 'Bedroom 3', value: 120 },
  { name: 'Shower Enclosure', room: 'Bathroom', value: 400 },
  { name: 'Bathroom Cabinet', room: 'Bathroom', value: 100 },
  { name: 'Towel Rail', room: 'Bathroom', value: 60 },
  { name: 'Scales', room: 'Bathroom', value: 30 },
  { name: 'Electric Toothbrush', room: 'En-suite', value: 80 },
  { name: 'Hair Dryer', room: 'En-suite', value: 60 },
  { name: 'Straighteners', room: 'En-suite', value: 90 },
  { name: 'Desktop PC', room: 'Study / Office', value: 1200 },
  { name: 'Monitor (27")', room: 'Study / Office', value: 350 },
  { name: 'Office Desk', room: 'Study / Office', value: 300 },
  { name: 'Office Chair', room: 'Study / Office', value: 400 },
  { name: 'Printer', room: 'Study / Office', value: 150 },
  { name: 'Bookcase', room: 'Study / Office', value: 120 },
  { name: 'Shredder', room: 'Study / Office', value: 50 },
  { name: 'Lawnmower', room: 'Garage', value: 280 },
  { name: 'Power Drill Set', room: 'Garage', value: 120 },
  { name: 'Workbench', room: 'Garage', value: 200 },
  { name: 'Tool Cabinet', room: 'Garage', value: 180 },
  { name: 'Bicycle (×2)', room: 'Garage', value: 700 },
  { name: 'Pressure Washer', room: 'Garage', value: 180 },
  { name: 'Tumble Dryer', room: 'Utility Room', value: 500 },
  { name: 'Vacuum Cleaner', room: 'Utility Room', value: 250 },
  { name: 'Iron + Ironing Board', room: 'Utility Room', value: 80 },
  { name: 'Storage Shelving', room: 'Loft / Attic', value: 120 },
  { name: 'Christmas Decorations', room: 'Loft / Attic', value: null },
  { name: 'Suitcases (×3)', room: 'Loft / Attic', value: 300 },
  { name: 'Garden Furniture Set', room: 'Garden / Shed', value: 450 },
  { name: 'BBQ Grill', room: 'Garden / Shed', value: 200 },
  { name: 'Garden Tools Set', room: 'Garden / Shed', value: 120 },
  { name: 'Coat Rack', room: 'Hallway', value: 60 },
  { name: 'Hall Table', room: 'Hallway', value: 120 },
  { name: 'Mirror', room: 'Hallway', value: 80 },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function callGeminiWithBackoff(apiKey, requestBody) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`
  const delays = [1000, 2000, 4000, 8000, 16000]
  let lastError
  for (let i = 0; i <= delays.length; i++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })
      if (!res.ok) throw new Error(`Gemini API ${res.status}: ${await res.text()}`)
      return await res.json()
    } catch (err) {
      lastError = err
      if (i < delays.length) await new Promise(r => setTimeout(r, delays[i]))
    }
  }
  throw lastError
}

function exportCSV(items) {
  const header = ['Room', 'Item Name', 'Estimated Value', 'Photo URL']
  const rows = items.map(item => [
    item.room,
    item.name,
    item.value != null ? item.value : '',
    item.photoUrl || '',
  ])
  const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `home-inventory-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  // Auth
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Inventory
  const [items, setItems] = useState([])
  const [seeding, setSeeding] = useState(false)
  const [dataLoading, setDataLoading] = useState(false)

  // Filters
  const [searchText, setSearchText] = useState('')
  const [roomFilter, setRoomFilter] = useState('All Rooms')
  const [missingPricesOnly, setMissingPricesOnly] = useState(false)

  // UI tabs
  const [activeTab, setActiveTab] = useState('inventory') // 'inventory' | 'analytics'

  // Add/Edit modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formName, setFormName] = useState('')
  const [formRoom, setFormRoom] = useState(ROOMS[0])
  const [formValue, setFormValue] = useState('')
  const [formError, setFormError] = useState('')

  // Delete modal
  const [deletingItem, setDeletingItem] = useState(null)

  // Reset modal
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetting, setResetting] = useState(false)

  // AI scan
  const [geminiApiKey, setGeminiApiKey] = useState(import.meta.env.VITE_GEMINI_API_KEY || '')
  const [showKeyInput, setShowKeyInput] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState('')
  const [scannedItems, setScannedItems] = useState(null)
  const scanInputRef = useRef(null)

  // Photo upload
  const [selectedItemIds, setSelectedItemIds] = useState(new Set())
  const [uploadProgress, setUploadProgress] = useState(null)
  const [uploadError, setUploadError] = useState('')
  const photoInputRef = useRef(null)
  const multiPhotoInputRef = useRef(null)
  const [photoTargetId, setPhotoTargetId] = useState(null)
  const [viewerUrl, setViewerUrl] = useState(null)
  const [viewerItemId, setViewerItemId] = useState(null)

  // Merge loading
  const [merging, setMerging] = useState(false)

  // ── Auth listener ──────────────────────────────────────────────────────────

  useEffect(() => {
    return onAuthStateChanged(auth, u => {
      setUser(u)
      setAuthLoading(false)
    })
  }, [])

  // ── Firestore listener + seeding ───────────────────────────────────────────

  useEffect(() => {
    if (!user) {
      setItems([])
      return
    }
    setDataLoading(true)
    const itemsRef = collection(db, 'users', user.uid, 'items')
    const unsub = onSnapshot(itemsRef, async snapshot => {
      if (snapshot.empty && !seeding) {
        setSeeding(true)
        await seedDefaultData(user.uid)
        setSeeding(false)
      } else {
        const loaded = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
        loaded.sort((a, b) => (a.room > b.room ? 1 : a.room < b.room ? -1 : a.name > b.name ? 1 : -1))
        setItems(loaded)
        setDataLoading(false)
      }
    })
    return unsub
  }, [user])

  async function seedDefaultData(uid, force = false) {
    const itemsRef = collection(db, 'users', uid, 'items')
    if (!force) {
      const snap = await getDocs(itemsRef)
      if (!snap.empty) return
    }
    const batch = writeBatch(db)
    DEFAULT_ITEMS.forEach(item => {
      batch.set(doc(itemsRef), { ...item, photoUrl: null, createdAt: serverTimestamp() })
    })
    await batch.commit()
  }

  // ── CRUD ───────────────────────────────────────────────────────────────────

  function openAdd() {
    setFormName('')
    setFormRoom(ROOMS[0])
    setFormValue('')
    setFormError('')
    setEditingItem(null)
    setShowAddModal(true)
  }

  function openEdit(item) {
    setFormName(item.name)
    setFormRoom(item.room)
    setFormValue(item.value != null ? String(item.value) : '')
    setFormError('')
    setEditingItem(item)
    setShowAddModal(true)
  }

  async function handleSaveItem() {
    if (!formName.trim()) { setFormError('Item name is required.'); return }
    const payload = {
      name: formName.trim(),
      room: formRoom,
      value: formValue !== '' ? parseFloat(formValue) : null,
      updatedAt: serverTimestamp(),
    }
    if (editingItem) {
      await updateDoc(doc(db, 'users', user.uid, 'items', editingItem.id), payload)
    } else {
      await addDoc(collection(db, 'users', user.uid, 'items'), {
        ...payload,
        photoUrl: null,
        createdAt: serverTimestamp(),
      })
    }
    setShowAddModal(false)
  }

  async function handleDeleteItem() {
    await deleteDoc(doc(db, 'users', user.uid, 'items', deletingItem.id))
    setDeletingItem(null)
  }

  // ── Reset ──────────────────────────────────────────────────────────────────

  async function handleReset() {
    setResetting(true)
    const itemsRef = collection(db, 'users', user.uid, 'items')
    const snap = await getDocs(itemsRef)
    const batch = writeBatch(db)
    snap.docs.forEach(d => batch.delete(d.ref))
    await batch.commit()
    await seedDefaultData(user.uid, true)
    setResetting(false)
    setShowResetModal(false)
  }

  // ── Filters ────────────────────────────────────────────────────────────────

  const filteredItems = useMemo(() => {
    const q = searchText.toLowerCase()
    return items.filter(item => {
      if (q && !item.name.toLowerCase().includes(q) && !item.room.toLowerCase().includes(q)) return false
      if (roomFilter !== 'All Rooms' && item.room !== roomFilter) return false
      if (missingPricesOnly && item.value != null) return false
      return true
    })
  }, [items, searchText, roomFilter, missingPricesOnly])

  // ── Analytics ──────────────────────────────────────────────────────────────

  const dashboardStats = useMemo(() => {
    const total = items.reduce((s, i) => s + (i.value || 0), 0)
    const valued = items.filter(i => i.value != null).length
    return { total, totalItems: items.length, valued, pending: items.length - valued }
  }, [items])

  const roomStats = useMemo(() => {
    const map = {}
    items.forEach(i => {
      if (!map[i.room]) map[i.room] = 0
      map[i.room] += i.value || 0
    })
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1])
    const max = sorted[0]?.[1] || 1
    return sorted.map(([room, val]) => ({ room, val, pct: Math.round((val / (dashboardStats.total || 1)) * 100), width: Math.round((val / max) * 100) }))
  }, [items, dashboardStats.total])

  // ── AI Scan ────────────────────────────────────────────────────────────────

  async function handleScanFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!geminiApiKey) { setShowKeyInput(true); return }
    setScanning(true)
    setScanError('')
    try {
      const base64 = await fileToBase64(file)
      const requestBody = {
        contents: [{
          parts: [
            {
              inlineData: { mimeType: file.type, data: base64 },
            },
            {
              text: `You are a home inventory assistant. Extract every item visible in this image or document.
Return ONLY a JSON array (no markdown, no prose) with objects having these fields:
- "name": string (item name)
- "room": string (one of: ${ROOMS.join(', ')})
- "value": number or null (estimated GBP value if visible, otherwise null)

Example: [{"name":"Sofa","room":"Living Room","value":800}]`,
            },
          ],
        }],
        generationConfig: { responseMimeType: 'application/json' },
      }
      const data = await callGeminiWithBackoff(geminiApiKey, requestBody)
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]'
      const parsed = JSON.parse(text)
      setScannedItems(parsed.map((item, i) => ({ ...item, _id: i, room: ROOMS.includes(item.room) ? item.room : ROOMS[0] })))
    } catch (err) {
      setScanError(`Scan failed: ${err.message}`)
    } finally {
      setScanning(false)
      e.target.value = ''
    }
  }

  async function handleMergeScan() {
    if (!scannedItems?.length) return
    setMerging(true)
    const itemsRef = collection(db, 'users', user.uid, 'items')
    for (const item of scannedItems) {
      await addDoc(itemsRef, {
        name: item.name,
        room: item.room,
        value: item.value ?? null,
        photoUrl: null,
        createdAt: serverTimestamp(),
      })
    }
    setScannedItems(null)
    setMerging(false)
  }

  // ── Photo upload ───────────────────────────────────────────────────────────

  async function uploadPhoto(file, itemIds) {
    if (file.size > 10 * 1024 * 1024) { setUploadError('Photo must be under 10 MB.'); return }
    const ext = file.name.split('.').pop()
    const filename = `${Date.now()}.${ext}`
    const storageRef = ref(storage, `users/${user.uid}/photos/${filename}`)
    const task = uploadBytesResumable(storageRef, file)
    setUploadProgress(0)
    setUploadError('')
    await new Promise((resolve, reject) => {
      task.on(
        'state_changed',
        snap => setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
        err => { setUploadError(err.message); setUploadProgress(null); reject(err) },
        resolve,
      )
    })
    const url = await getDownloadURL(storageRef)
    for (const id of itemIds) {
      await updateDoc(doc(db, 'users', user.uid, 'items', id), { photoUrl: url })
    }
    setUploadProgress(null)
    setSelectedItemIds(new Set())
  }

  function handleSinglePhotoChange(e) {
    const file = e.target.files?.[0]
    if (!file || !photoTargetId) return
    uploadPhoto(file, [photoTargetId])
    setPhotoTargetId(null)
    e.target.value = ''
  }

  function handleMultiPhotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    uploadPhoto(file, [...selectedItemIds])
    e.target.value = ''
  }

  async function handleRemovePhoto(itemId) {
    await updateDoc(doc(db, 'users', user.uid, 'items', itemId), { photoUrl: null })
    setViewerUrl(null)
    setViewerItemId(null)
  }

  function toggleSelect(id) {
    setSelectedItemIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // ── Keyboard close ─────────────────────────────────────────────────────────

  useEffect(() => {
    function onKey(e) {
      if (e.key !== 'Escape') return
      setShowAddModal(false)
      setDeletingItem(null)
      setShowResetModal(false)
      setScannedItems(null)
      setViewerUrl(null)
      setViewerItemId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ── Render guards ──────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <BarChart2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Home Inventory</h1>
          <p className="text-slate-500 mb-8 text-sm">Track everything in your home. Sign in to get started.</p>
          <button
            onClick={() => signInWithPopup(auth, googleProvider)}
            className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition"
          >
            <LogIn className="w-5 h-5" />
            Sign in with Google
          </button>
        </div>
      </div>
    )
  }

  if (seeding || dataLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-slate-600 font-medium">{seeding ? 'Setting up your inventory…' : 'Loading…'}</p>
      </div>
    )
  }

  // ── Main UI ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <BarChart2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-800 text-lg hidden sm:block">Home Inventory</span>
          </div>
          <div className="flex items-center gap-2">
            {user.photoURL && <img src={user.photoURL} className="w-8 h-8 rounded-full" alt="avatar" />}
            <span className="text-sm text-slate-600 hidden sm:block">{user.displayName}</span>
            <button
              onClick={() => signOut(auth)}
              className="flex items-center gap-1 text-slate-500 hover:text-slate-800 text-sm px-3 py-1.5 rounded-lg hover:bg-slate-100 transition"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:block">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Upload progress bar */}
      {uploadProgress !== null && (
        <div className="bg-blue-600 h-1 transition-all" style={{ width: `${uploadProgress}%` }} />
      )}

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition ${activeTab === 'inventory' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
          >
            Inventory
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition flex items-center gap-1.5 ${activeTab === 'analytics' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
          >
            <BarChart2 className="w-4 h-4" />
            Analytics
          </button>
        </div>

        {/* ── ANALYTICS TAB ───────────────────────────────────────────────── */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Value', value: `£${dashboardStats.total.toLocaleString()}` },
                { label: 'Total Items', value: dashboardStats.totalItems },
                { label: 'Valued Items', value: dashboardStats.valued },
                { label: 'Pending Prices', value: dashboardStats.pending },
              ].map(card => (
                <div key={card.label} className="bg-white rounded-xl border border-slate-200 p-4">
                  <p className="text-xs text-slate-500 mb-1">{card.label}</p>
                  <p className="text-2xl font-bold text-slate-800">{card.value}</p>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-700 mb-4">Value by Room</h2>
              <div className="space-y-3">
                {roomStats.map(({ room, val, pct, width }) => (
                  <div key={room}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-700">{room}</span>
                      <span className="text-slate-500">{pct}% · £{val.toLocaleString()}</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── INVENTORY TAB ────────────────────────────────────────────────── */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap gap-3 items-center">
              {/* Search */}
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search items…"
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>

              {/* Room filter */}
              <select
                value={roomFilter}
                onChange={e => setRoomFilter(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                <option>All Rooms</option>
                {ROOMS.map(r => <option key={r}>{r}</option>)}
              </select>

              {/* Missing prices */}
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={missingPricesOnly}
                  onChange={e => setMissingPricesOnly(e.target.checked)}
                  className="rounded"
                />
                Missing prices only
              </label>

              <div className="flex gap-2 ml-auto flex-wrap">
                {/* Multi-photo attach */}
                {selectedItemIds.size > 0 && (
                  <button
                    onClick={() => multiPhotoInputRef.current?.click()}
                    className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition"
                  >
                    <Image className="w-4 h-4" />
                    Attach Photo to {selectedItemIds.size} selected
                  </button>
                )}

                {/* Scan */}
                <button
                  onClick={() => scanInputRef.current?.click()}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition"
                >
                  <Camera className="w-4 h-4" />
                  Scan
                </button>

                {/* Export */}
                <button
                  onClick={() => exportCSV(items)}
                  className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium px-3 py-2 rounded-lg transition"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>

                {/* Reset */}
                <button
                  onClick={() => setShowResetModal(true)}
                  className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium px-3 py-2 rounded-lg transition"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reset
                </button>

                {/* Add */}
                <button
                  onClick={openAdd}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
                >
                  <Plus className="w-4 h-4" />
                  Add Item
                </button>
              </div>
            </div>

            {/* Gemini key prompt */}
            {showKeyInput && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800 mb-2">Paste your Gemini API key to enable scanning</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="AIza…"
                      className="flex-1 border border-amber-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                      onKeyDown={e => { if (e.key === 'Enter') { setGeminiApiKey(e.target.value); setShowKeyInput(false) } }}
                    />
                    <button
                      onClick={e => { const v = e.target.previousSibling.value; setGeminiApiKey(v); setShowKeyInput(false) }}
                      className="bg-amber-600 text-white px-3 py-1.5 rounded-lg text-sm"
                    >Save</button>
                  </div>
                </div>
                <button onClick={() => setShowKeyInput(false)}><X className="w-4 h-4 text-amber-600" /></button>
              </div>
            )}

            {/* Scan error */}
            {scanError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {scanError}
                <button onClick={() => setScanError('')} className="ml-auto"><X className="w-4 h-4" /></button>
              </div>
            )}

            {/* Upload error */}
            {uploadError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {uploadError}
                <button onClick={() => setUploadError('')} className="ml-auto"><X className="w-4 h-4" /></button>
              </div>
            )}

            {/* Scanning overlay */}
            {scanning && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 flex items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                <span className="text-slate-600 font-medium">Analysing image with Gemini…</span>
              </div>
            )}

            {/* Items table */}
            {filteredItems.length === 0 && !scanning ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <p className="text-slate-400 text-sm mb-3">No items match your filters.</p>
                <button onClick={openAdd} className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1 mx-auto">
                  <Plus className="w-4 h-4" /> Add your first item
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="w-10 px-3 py-3">
                          <span className="sr-only">Select</span>
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-slate-600">Room</th>
                        <th className="text-left px-4 py-3 font-medium text-slate-600">Item</th>
                        <th className="text-right px-4 py-3 font-medium text-slate-600">Value</th>
                        <th className="w-14 px-3 py-3 font-medium text-slate-600 text-center">Photo</th>
                        <th className="px-3 py-3 font-medium text-slate-600 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map(item => (
                        <tr
                          key={item.id}
                          className={`border-b border-slate-100 hover:bg-slate-50 transition ${item.value == null ? 'bg-amber-50 hover:bg-amber-100' : ''}`}
                        >
                          <td className="px-3 py-2 text-center">
                            <button onClick={() => toggleSelect(item.id)}>
                              {selectedItemIds.has(item.id)
                                ? <CheckSquare className="w-4 h-4 text-blue-600" />
                                : <Square className="w-4 h-4 text-slate-300" />}
                            </button>
                          </td>
                          <td className="px-4 py-2 text-slate-500">{item.room}</td>
                          <td className="px-4 py-2 text-slate-800 font-medium">
                            {item.name}
                            {item.value == null && (
                              <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">No Price</span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-right text-slate-700">
                            {item.value != null ? `£${item.value.toLocaleString()}` : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {item.photoUrl ? (
                              <button onClick={() => { setViewerUrl(item.photoUrl); setViewerItemId(item.id) }}>
                                <img src={item.photoUrl} alt="thumb" className="w-9 h-9 rounded object-cover border border-slate-200 hover:opacity-80 transition" />
                              </button>
                            ) : (
                              <button
                                onClick={() => { setPhotoTargetId(item.id); photoInputRef.current?.click() }}
                                className="w-9 h-9 rounded border border-dashed border-slate-300 flex items-center justify-center mx-auto hover:border-blue-400 transition"
                              >
                                <Camera className="w-4 h-4 text-slate-400" />
                              </button>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => openEdit(item)}
                                className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeletingItem(item)}
                                className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-2 border-t border-slate-100 text-xs text-slate-400">
                  {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} shown
                  {items.length !== filteredItems.length && ` (of ${items.length} total)`}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Hidden file inputs ─────────────────────────────────────────────── */}
      <input ref={scanInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleScanFile} />
      <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic" className="hidden" onChange={handleSinglePhotoChange} />
      <input ref={multiPhotoInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic" className="hidden" onChange={handleMultiPhotoChange} />

      {/* ── Add/Edit Modal ─────────────────────────────────────────────────── */}
      {showAddModal && (
        <Modal title={editingItem ? 'Edit Item' : 'Add Item'} onClose={() => setShowAddModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Item Name *</label>
              <input
                type="text"
                value={formName}
                onChange={e => { setFormName(e.target.value); setFormError('') }}
                placeholder="e.g. Sofa (3-seater)"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                autoFocus
              />
              {formError && <p className="text-red-600 text-xs mt-1">{formError}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Room</label>
              <select
                value={formRoom}
                onChange={e => setFormRoom(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                {ROOMS.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Estimated Value (£)</label>
              <input
                type="number"
                value={formValue}
                onChange={e => setFormValue(e.target.value)}
                placeholder="Leave blank if unknown"
                min="0"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition">Cancel</button>
              <button onClick={handleSaveItem} className="px-4 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700 transition">
                {editingItem ? 'Save Changes' : 'Add Item'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Delete Modal ───────────────────────────────────────────────────── */}
      {deletingItem && (
        <Modal title="Delete Item" onClose={() => setDeletingItem(null)}>
          <p className="text-sm text-slate-600 mb-6">
            Are you sure you want to delete <strong>{deletingItem.name}</strong>? This can't be undone.
          </p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setDeletingItem(null)} className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition">Cancel</button>
            <button onClick={handleDeleteItem} className="px-4 py-2 rounded-lg text-sm bg-red-600 text-white hover:bg-red-700 transition">Delete</button>
          </div>
        </Modal>
      )}

      {/* ── Reset Modal ────────────────────────────────────────────────────── */}
      {showResetModal && (
        <Modal title="Reset to Defaults" onClose={() => setShowResetModal(false)}>
          <p className="text-sm text-slate-600 mb-2">
            This will <strong>delete all your current items</strong> and restore the 70-item default dataset. Photos in Firebase Storage are not deleted.
          </p>
          <p className="text-sm text-red-600 mb-6 font-medium">This action can't be undone.</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowResetModal(false)} className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition">Cancel</button>
            <button
              onClick={handleReset}
              disabled={resetting}
              className="px-4 py-2 rounded-lg text-sm bg-red-600 text-white hover:bg-red-700 transition flex items-center gap-2"
            >
              {resetting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Reset to Defaults
            </button>
          </div>
        </Modal>
      )}

      {/* ── Scan Review Modal ──────────────────────────────────────────────── */}
      {scannedItems && (
        <Modal title={`Review Scanned Items (${scannedItems.length})`} onClose={() => setScannedItems(null)} wide>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1 mb-4">
            {scannedItems.map((item, idx) => (
              <div key={item._id} className="flex gap-2 items-center bg-slate-50 rounded-lg p-2">
                <input
                  type="text"
                  value={item.name}
                  onChange={e => setScannedItems(prev => prev.map((it, i) => i === idx ? { ...it, name: e.target.value } : it))}
                  className="flex-1 border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                <select
                  value={item.room}
                  onChange={e => setScannedItems(prev => prev.map((it, i) => i === idx ? { ...it, room: e.target.value } : it))}
                  className="border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  {ROOMS.map(r => <option key={r}>{r}</option>)}
                </select>
                <input
                  type="number"
                  value={item.value ?? ''}
                  onChange={e => setScannedItems(prev => prev.map((it, i) => i === idx ? { ...it, value: e.target.value === '' ? null : parseFloat(e.target.value) } : it))}
                  placeholder="£ value"
                  className="w-24 border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                <button onClick={() => setScannedItems(prev => prev.filter((_, i) => i !== idx))}>
                  <X className="w-4 h-4 text-slate-400 hover:text-red-500" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setScannedItems(null)} className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition">Cancel</button>
            <button
              onClick={handleMergeScan}
              disabled={merging || scannedItems.length === 0}
              className="px-4 py-2 rounded-lg text-sm bg-emerald-600 text-white hover:bg-emerald-700 transition flex items-center gap-2"
            >
              {merging && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Merge into Inventory
            </button>
          </div>
        </Modal>
      )}

      {/* ── Photo Viewer Modal ─────────────────────────────────────────────── */}
      {viewerUrl && (
        <Modal title="Photo" onClose={() => { setViewerUrl(null); setViewerItemId(null) }}>
          <img src={viewerUrl} alt="Full size" className="w-full rounded-lg mb-4 max-h-96 object-contain" />
          <div className="flex justify-between">
            <button
              onClick={() => handleRemovePhoto(viewerItemId)}
              className="text-sm text-red-600 hover:underline"
            >
              Remove photo
            </button>
            <button onClick={() => { setViewerUrl(null); setViewerItemId(null) }} className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition">Close</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────

function Modal({ title, children, onClose, wide = false }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? 'max-w-2xl' : 'max-w-md'} p-6`}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-slate-800 text-lg">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}
