import { useState, useEffect, useMemo, useRef } from 'react'
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
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  getDocs,
  query,
  where,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore'
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage'
import {
  LogIn, LogOut, Plus, Pencil, Trash2, X,
  BarChart2, Download, Search, Image,
  CheckSquare, Square, AlertCircle, Loader2,
  Home, ChevronDown, Users, Share2,
  MapPin, Check, Edit3,
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
  'Laundry Room', 'Kids Room', 'Guest Room', 'Flex Room', 'Master Bed',
  'Loft', 'Living Room', 'Dining Room', 'Kitchen', 'Garage',
  'Backyard', 'Front Yard', 'Front Porch',
]

// Real inventory for 158 N Edge Cliff St — used once during initFirstHouse migration
const MIGRATION_ITEMS = [
  { name: 'Washer', room: 'Laundry Room', value: null },
  { name: 'Dryer', room: 'Laundry Room', value: null },
  { name: 'Bed', room: 'Kids Room', value: 500 },
  { name: 'L Shaped Table', room: 'Kids Room', value: 350 },
  { name: 'Monitor', room: 'Kids Room', value: null },
  { name: 'Book Case', room: 'Kids Room', value: 150 },
  { name: 'Wall Decor', room: 'Kids Room', value: 200 },
  { name: 'Books', room: 'Kids Room', value: 500 },
  { name: 'Bed', room: 'Guest Room', value: 1500 },
  { name: 'Table', room: 'Guest Room', value: 100 },
  { name: 'Cot', room: 'Guest Room', value: 250 },
  { name: 'Lamp', room: 'Guest Room', value: 20 },
  { name: 'Embroidery Wall Hanging', room: 'Flex Room', value: 200 },
  { name: 'Antique Entry Table', room: 'Flex Room', value: 500 },
  { name: 'Trundle Bed', room: 'Flex Room', value: 1000 },
  { name: 'L-shaped Table', room: 'Flex Room', value: 250 },
  { name: 'Monitor', room: 'Flex Room', value: null },
  { name: 'Bed', room: 'Master Bed', value: 800 },
  { name: 'Dresser with Mirror', room: 'Master Bed', value: 500 },
  { name: 'Tall Dresser', room: 'Master Bed', value: 750 },
  { name: 'Side Table', room: 'Master Bed', value: 250 },
  { name: 'Lamp', room: 'Master Bed', value: 100 },
  { name: 'Couch', room: 'Master Bed', value: 300 },
  { name: 'Reclining Sofa', room: 'Loft', value: 1000 },
  { name: 'Temple', room: 'Loft', value: 500 },
  { name: 'Marble Vases', room: 'Loft', value: 200 },
  { name: 'Wood Cabinet', room: 'Loft', value: 350 },
  { name: 'Brass Objects', room: 'Loft', value: 500 },
  { name: 'TV', room: 'Loft', value: 150 },
  { name: 'Embroidered Wall Hanging', room: 'Loft', value: 150 },
  { name: 'Wall Decor', room: 'Loft', value: 350 },
  { name: 'Lamp', room: 'Loft', value: 60 },
  { name: 'TV Stand', room: 'Loft', value: 150 },
  { name: 'Sofa Set', room: 'Living Room', value: 1000 },
  { name: 'Centre & Side Table', room: 'Living Room', value: 750 },
  { name: 'Television', room: 'Living Room', value: 750 },
  { name: 'Light Fixture', room: 'Living Room', value: 150 },
  { name: 'Fireplace', room: 'Living Room', value: 500 },
  { name: 'Wall Decor', room: 'Living Room', value: 750 },
  { name: 'Lamp Shades', room: 'Living Room', value: 350 },
  { name: 'Collectives Shelf', room: 'Living Room', value: 200 },
  { name: 'Collectives', room: 'Living Room', value: 500 },
  { name: 'Dining Table & Chairs', room: 'Dining Room', value: 1200 },
  { name: 'Buffet', room: 'Dining Room', value: 600 },
  { name: 'Crockery/cups/glasses', room: 'Dining Room', value: 500 },
  { name: 'Crockery', room: 'Kitchen', value: 2000 },
  { name: 'Cuisinart Toaster', room: 'Kitchen', value: 40 },
  { name: 'Ninja Blender', room: 'Kitchen', value: 200 },
  { name: 'Instapots', room: 'Kitchen', value: 150 },
  { name: 'Airfryer', room: 'Kitchen', value: 110 },
  { name: 'Dishwasher', room: 'Kitchen', value: null },
  { name: 'Fridge', room: 'Kitchen', value: null },
  { name: 'Microwave', room: 'Kitchen', value: null },
  { name: 'GX', room: 'Garage', value: 75000 },
  { name: 'Nissan Versa', room: 'Garage', value: 15000 },
  { name: 'Shoes', room: 'Garage', value: 750 },
  { name: 'Snow Blower', room: 'Garage', value: 250 },
  { name: 'Fridge', room: 'Garage', value: 200 },
  { name: 'Pergola', room: 'Backyard', value: 3000 },
  { name: 'Patio Set', room: 'Backyard', value: 800 },
  { name: 'Artificial Grass', room: 'Backyard', value: 10000 },
  { name: 'Dog Gates', room: 'Backyard', value: 600 },
  { name: 'Trees', room: 'Backyard', value: 3000 },
  { name: 'Bar-b-cue', room: 'Backyard', value: 250 },
  { name: 'Landscaping', room: 'Backyard', value: 15000 },
  { name: 'Landscaping', room: 'Front Yard', value: 10000 },
  { name: 'Swing Chair', room: 'Front Porch', value: 250 },
  { name: 'Decor', room: 'Front Porch', value: 250 },
  { name: 'Ring Camera', room: 'Front Porch', value: null },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getItemPhotos(item) {
  return item.photoUrls || (item.photoUrl ? [item.photoUrl] : [])
}

function exportCSV(items) {
  const header = ['Room', 'Item Name', 'Estimated Value', 'Photo URLs']
  const rows = items.map(i => [i.room, i.name, i.value ?? '', getItemPhotos(i).join('; ')])
  const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `home-inventory-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  // ── Houses ──────────────────────────────────────────────────────────────────
  const [houses, setHouses] = useState([])
  const [housesLoaded, setHousesLoaded] = useState(false)
  const [activeHouseId, _setActiveHouseId] = useState(() => localStorage.getItem('activeHouseId') || null)
  const [houseMembers, setHouseMembers] = useState([])
  const [pendingInvites, setPendingInvites] = useState([])
  const houseListeners = useRef({})
  const initRan = useRef(false)

  function setActiveHouseId(id) {
    _setActiveHouseId(id)
    id ? localStorage.setItem('activeHouseId', id) : localStorage.removeItem('activeHouseId')
  }

  // ── House management UI ──────────────────────────────────────────────────────
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showCreateHouseModal, setShowCreateHouseModal] = useState(false)
  const [newHouseName, setNewHouseName] = useState('')
  const [newHouseAddress, setNewHouseAddress] = useState('')
  const [createHouseError, setCreateHouseError] = useState('')
  const [creatingHouse, setCreatingHouse] = useState(false)
  const [editingHouseId, setEditingHouseId] = useState(null)
  const [editHouseName, setEditHouseName] = useState('')
  const [editHouseAddress, setEditHouseAddress] = useState('')
  const [savingHouseEdit, setSavingHouseEdit] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareHouseId, setShareHouseId] = useState(null)
  const [shareEmail, setShareEmail] = useState('')
  const [shareStatus, setShareStatus] = useState(null)
  const [shareLoading, setShareLoading] = useState(false)
  const [shareMembers, setShareMembers] = useState([])
  const [sharePending, setSharePending] = useState([])
  const [showHouseSwitcher, setShowHouseSwitcher] = useState(false)

  // ── Inventory ────────────────────────────────────────────────────────────────
  const [items, setItems] = useState([])
  const [dataLoading, setDataLoading] = useState(false)
  const [photos, setPhotos] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [roomFilter, setRoomFilter] = useState('All Rooms')
  const [missingPricesOnly, setMissingPricesOnly] = useState(false)
  const [activeTab, setActiveTab] = useState('inventory')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formName, setFormName] = useState('')
  const [formRoom, setFormRoom] = useState(ROOMS[0])
  const [formValue, setFormValue] = useState('')
  const [formError, setFormError] = useState('')
  const [deletingItem, setDeletingItem] = useState(null)

  const [uploadProgress, setUploadProgress] = useState(null)
  const [uploadError, setUploadError] = useState('')
  const galleryInputRef = useRef(null)
  const pickerInputRef = useRef(null)
  const [linkingItemIds, setLinkingItemIds] = useState(null)
  const [selectedItemIds, setSelectedItemIds] = useState(new Set())
  const [viewerUrl, setViewerUrl] = useState(null)
  const [viewerItemId, setViewerItemId] = useState(null)
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)

  // ── Auth listener ────────────────────────────────────────────────────────────

  useEffect(() => {
    return onAuthStateChanged(auth, async u => {
      if (!u) {
        setUser(null)
        setHouses([])
        setItems([])
        setPhotos([])
        setHousesLoaded(true)
        setAuthLoading(false)
        initRan.current = false
        return
      }
      await setDoc(doc(db, 'users', u.uid), {
        email: u.email,
        displayName: u.displayName,
        photoURL: u.photoURL,
        updatedAt: serverTimestamp(),
      }, { merge: true })
      setUser(u)
      setAuthLoading(false)
    })
  }, [])

  // ── Houses: listen to user doc → per-house listeners ─────────────────────────

  useEffect(() => {
    if (!user) return
    const userRef = doc(db, 'users', user.uid)

    const userUnsub = onSnapshot(userRef, async snap => {
      const houseIds = snap.data()?.houseIds || []

      // First load with no houses → run migration/create
      if (houseIds.length === 0 && !initRan.current) {
        initRan.current = true
        await initFirstHouse(user)
        // initFirstHouse writes houseIds → this listener fires again
        return
      }

      // Stop listeners for houses no longer in list
      Object.keys(houseListeners.current).forEach(id => {
        if (!houseIds.includes(id)) {
          houseListeners.current[id]()
          delete houseListeners.current[id]
          setHouses(prev => prev.filter(h => h.id !== id))
        }
      })

      // Start listeners for new houses
      houseIds.forEach(id => {
        if (houseListeners.current[id]) return
        houseListeners.current[id] = onSnapshot(
          doc(db, 'houses', id),
          hSnap => {
            if (!hSnap.exists()) return
            const house = { id: hSnap.id, ...hSnap.data() }
            setHouses(prev => {
              const idx = prev.findIndex(h => h.id === id)
              if (idx === -1) return [...prev, house]
              const next = [...prev]; next[idx] = house; return next
            })
            setHousesLoaded(true)
          },
          err => {
            console.warn(`Lost access to house ${id}:`, err.message)
            delete houseListeners.current[id]
            setHouses(prev => prev.filter(h => h.id !== id))
            updateDoc(userRef, { houseIds: arrayRemove(id) }).catch(() => {})
          },
        )
      })

      if (houseIds.length === 0) setHousesLoaded(true)
    }, err => {
      console.error('User doc error:', err)
      setHousesLoaded(true)
    })

    return () => {
      userUnsub()
      Object.values(houseListeners.current).forEach(unsub => unsub())
      houseListeners.current = {}
    }
  }, [user])

  // Ensure activeHouseId stays valid when houses list changes
  useEffect(() => {
    if (!housesLoaded || houses.length === 0) return
    if (!activeHouseId || !houses.some(h => h.id === activeHouseId)) {
      setActiveHouseId(houses[0].id)
    }
  }, [houses, housesLoaded])

  // ── Items listener ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user || !activeHouseId) { setItems([]); setDataLoading(false); return }
    setDataLoading(true)
    return onSnapshot(collection(db, 'houses', activeHouseId, 'items'), snap => {
      const loaded = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      loaded.sort((a, b) => (a.room > b.room ? 1 : a.room < b.room ? -1 : a.name > b.name ? 1 : -1))
      setItems(loaded)
      setDataLoading(false)
      setSelectedItemIds(new Set())
    }, err => {
      console.error('Items error:', err)
      setDataLoading(false)
    })
  }, [user, activeHouseId])

  // ── Photos listener ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user || !activeHouseId) { setPhotos([]); return }
    return onSnapshot(collection(db, 'houses', activeHouseId, 'photos'), snap => {
      const loaded = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      loaded.sort((a, b) => (b.uploadedAt?.seconds || 0) - (a.uploadedAt?.seconds || 0))
      setPhotos(loaded)
    }, err => console.error('Photos error:', err))
  }, [user, activeHouseId])

  // ── Members listener (active house) ───────────────────────────────────────────

  useEffect(() => {
    if (!user || !activeHouseId) { setHouseMembers([]); return }
    return onSnapshot(collection(db, 'houses', activeHouseId, 'members'), snap => {
      setHouseMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }, err => console.error('Members error:', err))
  }, [user, activeHouseId])

  // ── Pending invites for current user ──────────────────────────────────────────

  useEffect(() => {
    if (!user?.email) { setPendingInvites([]); return }
    const q = query(collection(db, 'invites'), where('inviteeEmail', '==', user.email))
    return onSnapshot(q, snap => {
      setPendingInvites(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }, err => console.error('Invites error:', err))
  }, [user])

  // ── First-house init (migration or creation) ──────────────────────────────────

  async function initFirstHouse(u) {
    try {
      const oldItemsSnap = await getDocs(collection(db, 'users', u.uid, 'items'))
      const oldPhotosSnap = await getDocs(collection(db, 'users', u.uid, 'photos'))
      const hasOldData = !oldItemsSnap.empty

      // Use the known address for migrated users; new users get an empty address
      const houseAddress = hasOldData ? '158 N Edge Cliff St, Castle Rock, CO 80104' : ''

      const houseRef = await addDoc(collection(db, 'houses'), {
        name: 'My Home',
        address: houseAddress,
        ownerId: u.uid,
        createdAt: serverTimestamp(),
      })
      const houseId = houseRef.id

      await setDoc(doc(db, 'houses', houseId, 'members', u.uid), {
        uid: u.uid,
        role: 'owner',
        displayName: u.displayName,
        email: u.email,
        joinedAt: serverTimestamp(),
      })

      if (hasOldData) {
        // Delete whatever was in the old path (incorrect placeholder data) and
        // write the real inventory for 158 N Edge Cliff St instead
        const deleteBatch = writeBatch(db)
        oldItemsSnap.docs.forEach(d => deleteBatch.delete(d.ref))
        await deleteBatch.commit()

        const seedBatch = writeBatch(db)
        MIGRATION_ITEMS.forEach(item => {
          seedBatch.set(doc(collection(db, 'houses', houseId, 'items')), {
            ...item, photoUrls: [], createdAt: serverTimestamp(),
          })
        })
        await seedBatch.commit()

        // Migrate photo metadata if any
        if (!oldPhotosSnap.empty) {
          const photoBatch = writeBatch(db)
          oldPhotosSnap.docs.forEach(d => {
            photoBatch.set(doc(collection(db, 'houses', houseId, 'photos')), d.data())
            photoBatch.delete(d.ref)
          })
          await photoBatch.commit()
        }
      }

      await updateDoc(doc(db, 'users', u.uid), { houseIds: arrayUnion(houseId) })
      setActiveHouseId(houseId)
    } catch (err) {
      console.error('initFirstHouse error:', err)
      setHousesLoaded(true)
    }
  }

  // ── House management ──────────────────────────────────────────────────────────

  async function createHouse() {
    if (!newHouseAddress.trim()) { setCreateHouseError('Address is required.'); return }
    setCreatingHouse(true)
    try {
      const name = newHouseName.trim() || newHouseAddress.trim()
      const houseRef = await addDoc(collection(db, 'houses'), {
        name, address: newHouseAddress.trim(), ownerId: user.uid, createdAt: serverTimestamp(),
      })
      const houseId = houseRef.id
      await setDoc(doc(db, 'houses', houseId, 'members', user.uid), {
        uid: user.uid, role: 'owner', displayName: user.displayName, email: user.email, joinedAt: serverTimestamp(),
      })
      await updateDoc(doc(db, 'users', user.uid), { houseIds: arrayUnion(houseId) })
      setActiveHouseId(houseId)
      setShowCreateHouseModal(false)
      setNewHouseName(''); setNewHouseAddress('')
    } catch (err) {
      setCreateHouseError(err.message)
    }
    setCreatingHouse(false)
  }

  async function saveHouseEdit() {
    if (!editHouseAddress.trim()) return
    setSavingHouseEdit(true)
    await updateDoc(doc(db, 'houses', editingHouseId), {
      name: editHouseName.trim() || editHouseAddress.trim(),
      address: editHouseAddress.trim(),
      updatedAt: serverTimestamp(),
    })
    setSavingHouseEdit(false)
    setEditingHouseId(null)
  }

  async function leaveHouse(houseId) {
    await deleteDoc(doc(db, 'houses', houseId, 'members', user.uid))
    await updateDoc(doc(db, 'users', user.uid), { houseIds: arrayRemove(houseId) })
    if (activeHouseId === houseId) setActiveHouseId(null)
  }

  // ── Sharing ───────────────────────────────────────────────────────────────────

  async function openShareModal(houseId) {
    setShareHouseId(houseId)
    setShareEmail(''); setShareStatus(null); setShareLoading(false)
    setShowShareModal(true)
    const [membersSnap, invSnap] = await Promise.all([
      getDocs(collection(db, 'houses', houseId, 'members')),
      getDocs(query(collection(db, 'invites'), where('houseId', '==', houseId))),
    ])
    setShareMembers(membersSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    setSharePending(invSnap.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  async function sendInvite() {
    if (!shareEmail.trim()) return
    setShareLoading(true); setShareStatus(null)
    const email = shareEmail.trim().toLowerCase()
    try {
      const usersSnap = await getDocs(query(collection(db, 'users'), where('email', '==', email)))
      if (!usersSnap.empty) {
        const inviteeDoc = usersSnap.docs[0]
        const inviteeUid = inviteeDoc.id
        if (shareMembers.some(m => m.id === inviteeUid)) {
          setShareStatus({ type: 'error', message: 'This person already has access.' })
          setShareLoading(false); return
        }
        const inviteeData = inviteeDoc.data()
        await setDoc(doc(db, 'houses', shareHouseId, 'members', inviteeUid), {
          uid: inviteeUid, role: 'member', displayName: inviteeData.displayName,
          email: inviteeData.email, joinedAt: serverTimestamp(),
        })
        await updateDoc(doc(db, 'users', inviteeUid), { houseIds: arrayUnion(shareHouseId) })
        setShareStatus({ type: 'success', message: `${inviteeData.displayName || email} now has access.` })
        const snap = await getDocs(collection(db, 'houses', shareHouseId, 'members'))
        setShareMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      } else {
        const house = houses.find(h => h.id === shareHouseId)
        const invRef = await addDoc(collection(db, 'invites'), {
          houseId: shareHouseId, houseName: house?.name || 'My Home',
          houseAddress: house?.address || '', inviterUid: user.uid,
          inviterName: user.displayName, inviteeEmail: email, createdAt: serverTimestamp(),
        })
        setSharePending(prev => [...prev, { id: invRef.id, inviteeEmail: email }])
        setShareStatus({ type: 'success', message: "Invite sent. They'll see it when they sign in." })
      }
      setShareEmail('')
    } catch (err) {
      setShareStatus({ type: 'error', message: err.message })
    }
    setShareLoading(false)
  }

  async function removeMember(houseId, memberId) {
    await deleteDoc(doc(db, 'houses', houseId, 'members', memberId))
    updateDoc(doc(db, 'users', memberId), { houseIds: arrayRemove(houseId) }).catch(() => {})
    setShareMembers(prev => prev.filter(m => m.id !== memberId))
  }

  async function revokeInvite(inviteId) {
    await deleteDoc(doc(db, 'invites', inviteId))
    setSharePending(prev => prev.filter(i => i.id !== inviteId))
  }

  async function acceptInvite(invite) {
    await setDoc(doc(db, 'houses', invite.houseId, 'members', user.uid), {
      uid: user.uid, role: 'member', displayName: user.displayName,
      email: user.email, joinedAt: serverTimestamp(),
    })
    await updateDoc(doc(db, 'users', user.uid), { houseIds: arrayUnion(invite.houseId) })
    await deleteDoc(doc(db, 'invites', invite.id))
    setActiveHouseId(invite.houseId)
    setShowProfileModal(false)
  }

  async function declineInvite(invite) {
    await deleteDoc(doc(db, 'invites', invite.id))
  }

  // ── Item CRUD ─────────────────────────────────────────────────────────────────

  function openAdd() {
    setFormName(''); setFormRoom(ROOMS[0]); setFormValue(''); setFormError(''); setEditingItem(null); setShowAddModal(true)
  }
  function openEdit(item) {
    setFormName(item.name); setFormRoom(item.room); setFormValue(item.value != null ? String(item.value) : '')
    setFormError(''); setEditingItem(item); setShowAddModal(true)
  }
  async function handleSaveItem() {
    if (!formName.trim()) { setFormError('Item name is required.'); return }
    const payload = { name: formName.trim(), room: formRoom, value: formValue !== '' ? parseFloat(formValue) : null, updatedAt: serverTimestamp() }
    if (editingItem) {
      await updateDoc(doc(db, 'houses', activeHouseId, 'items', editingItem.id), payload)
    } else {
      await addDoc(collection(db, 'houses', activeHouseId, 'items'), { ...payload, photoUrls: [], createdAt: serverTimestamp() })
    }
    setShowAddModal(false)
  }
  async function handleDeleteItem() {
    await deleteDoc(doc(db, 'houses', activeHouseId, 'items', deletingItem.id))
    setDeletingItem(null)
  }

  async function handleBulkDelete() {
    const batch = writeBatch(db)
    selectedItemIds.forEach(id => batch.delete(doc(db, 'houses', activeHouseId, 'items', id)))
    await batch.commit()
    setSelectedItemIds(new Set())
    setConfirmBulkDelete(false)
  }

  // ── Filters & analytics ───────────────────────────────────────────────────────

  const filteredItems = useMemo(() => {
    const q = searchText.toLowerCase()
    return items.filter(item => {
      if (q && !item.name.toLowerCase().includes(q) && !item.room.toLowerCase().includes(q)) return false
      if (roomFilter !== 'All Rooms' && item.room !== roomFilter) return false
      if (missingPricesOnly && item.value != null) return false
      return true
    })
  }, [items, searchText, roomFilter, missingPricesOnly])

  const dashboardStats = useMemo(() => {
    const total = items.reduce((s, i) => s + (i.value || 0), 0)
    const valued = items.filter(i => i.value != null).length
    return { total, totalItems: items.length, valued, pending: items.length - valued }
  }, [items])

  // All unique rooms: ROOMS constant + any custom rooms already in this house's items
  const allRooms = useMemo(() => {
    const extra = items.map(i => i.room).filter(r => !ROOMS.includes(r))
    return [...ROOMS, ...new Set(extra)]
  }, [items])

  const roomStats = useMemo(() => {
    const map = {}
    items.forEach(i => { if (!map[i.room]) map[i.room] = 0; map[i.room] += i.value || 0 })
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1])
    const max = sorted[0]?.[1] || 1
    return sorted.map(([room, val]) => ({
      room, val,
      pct: Math.round((val / (dashboardStats.total || 1)) * 100),
      width: Math.round((val / max) * 100),
    }))
  }, [items, dashboardStats.total])

  // ── Photos ────────────────────────────────────────────────────────────────────

  async function uploadPhoto(file) {
    if (file.size > 10 * 1024 * 1024) { setUploadError('Photo must be under 10 MB.'); return null }
    const ext = file.name.split('.').pop()
    // Path is scoped under this house's id — Storage rules only grant access to house members,
    // so a photo uploaded here can never be read or linked from another house.
    const storageRef = ref(storage, `houses/${activeHouseId}/photos/${Date.now()}.${ext}`)
    const task = uploadBytesResumable(storageRef, file)
    setUploadProgress(0); setUploadError('')
    await new Promise((resolve, reject) => {
      task.on('state_changed',
        snap => setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
        err => { setUploadError(err.message); setUploadProgress(null); reject(err) },
        resolve,
      )
    })
    const url = await getDownloadURL(storageRef)
    await addDoc(collection(db, 'houses', activeHouseId, 'photos'), { url, name: file.name, uploadedAt: serverTimestamp() })
    setUploadProgress(null)
    return url
  }

  async function handleGalleryFiles(files) {
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue
      await uploadPhoto(file)
    }
  }

  async function handleLinkPhoto(photoUrl) {
    if (!linkingItemIds?.length) return
    const batch = writeBatch(db)
    linkingItemIds.forEach(id => batch.update(doc(db, 'houses', activeHouseId, 'items', id), { photoUrls: arrayUnion(photoUrl) }))
    await batch.commit()
  }

  async function handleDeletePhoto(photoId, url) {
    await deleteDoc(doc(db, 'houses', activeHouseId, 'photos', photoId))
    // Strip the deleted photo from any items that still reference it so no broken thumbnails remain
    const linkedSnap = await getDocs(query(collection(db, 'houses', activeHouseId, 'items'), where('photoUrls', 'array-contains', url)))
    if (!linkedSnap.empty) {
      const batch = writeBatch(db)
      linkedSnap.docs.forEach(d => batch.update(d.ref, { photoUrls: arrayRemove(url) }))
      await batch.commit()
    }
  }

  async function handleRemovePhotoFromItem(itemId, url) {
    await updateDoc(doc(db, 'houses', activeHouseId, 'items', itemId), { photoUrls: arrayRemove(url) })
    setViewerUrl(null); setViewerItemId(null)
  }

  async function handlePickerUpload(e) {
    const files = [...(e.target.files || [])]
    if (!files.length || !linkingItemIds?.length) return
    for (const file of files) {
      const url = await uploadPhoto(file)
      if (url) await handleLinkPhoto(url)
    }
    e.target.value = ''
  }

  function handleDrop(e) {
    e.preventDefault(); setIsDragging(false)
    handleGalleryFiles([...e.dataTransfer.files])
  }

  function toggleSelect(id) {
    setSelectedItemIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
  }

  // ── Keyboard shortcuts ────────────────────────────────────────────────────────

  useEffect(() => {
    function onKey(e) {
      if (e.key !== 'Escape') return
      setShowAddModal(false); setDeletingItem(null); setConfirmBulkDelete(false)
      setViewerUrl(null); setViewerItemId(null)
      setLinkingItemIds(null); setShowProfileModal(false); setShowCreateHouseModal(false)
      setShowShareModal(false); setShowHouseSwitcher(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ── Derived ───────────────────────────────────────────────────────────────────

  const activeHouse = houses.find(h => h.id === activeHouseId)
  const myRole = houseMembers.find(m => m.id === user?.uid)?.role
  const isOwner = myRole === 'owner'

  // ── Render guards ─────────────────────────────────────────────────────────────

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
    </div>
  )

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Home className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Home Inventory</h1>
        <p className="text-slate-500 mb-8 text-sm">Track every item in your home. Sign in to get started.</p>
        <button
          onClick={() => signInWithPopup(auth, googleProvider)}
          className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition"
        >
          <LogIn className="w-5 h-5" /> Sign in with Google
        </button>
      </div>
    </div>
  )

  if (!housesLoaded) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
      <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      <p className="text-slate-600 font-medium">Setting up your home…</p>
    </div>
  )

  // ── Main UI ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50" onClick={() => setShowHouseSwitcher(false)}>
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Logo + house switcher */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <Home className="w-5 h-5 text-white" />
            </div>
            <div className="relative" onClick={e => e.stopPropagation()}>
              <button
                onClick={() => houses.length > 1 && setShowHouseSwitcher(v => !v)}
                className={`flex items-center gap-1.5 font-semibold text-slate-800 max-w-[200px] sm:max-w-sm ${houses.length > 1 ? 'hover:text-blue-600 cursor-pointer' : 'cursor-default'} transition`}
              >
                <span className="truncate text-sm sm:text-base leading-tight">
                  {activeHouse?.address || activeHouse?.name || 'My Home'}
                </span>
                {houses.length > 1 && <ChevronDown className="w-4 h-4 shrink-0 text-slate-400" />}
              </button>
              {showHouseSwitcher && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg min-w-[240px] z-30 overflow-hidden">
                  {houses.map(h => (
                    <button key={h.id} onClick={() => { setActiveHouseId(h.id); setShowHouseSwitcher(false) }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm hover:bg-slate-50 transition ${h.id === activeHouseId ? 'text-blue-600 font-medium' : 'text-slate-700'}`}>
                      <Home className="w-4 h-4 shrink-0 text-slate-400" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate">{h.address || h.name}</p>
                        {h.address && h.name !== h.address && <p className="text-xs text-slate-400 truncate">{h.name}</p>}
                      </div>
                      {h.id === activeHouseId && <Check className="w-4 h-4 shrink-0 text-blue-600" />}
                    </button>
                  ))}
                  <div className="border-t border-slate-100 px-4 py-2.5">
                    <button onClick={() => { setShowHouseSwitcher(false); setShowCreateHouseModal(true) }}
                      className="flex items-center gap-1.5 text-blue-600 text-sm font-medium hover:underline">
                      <Plus className="w-3.5 h-3.5" /> Add another house
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1 shrink-0">
            {pendingInvites.length > 0 && (
              <button onClick={() => setShowProfileModal(true)}
                className="relative p-2 rounded-lg hover:bg-slate-100 transition" title="Pending invitations">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>
            )}
            <button onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100 transition">
              {user.photoURL
                ? <img src={user.photoURL} className="w-7 h-7 rounded-full" alt="avatar" />
                : <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">{user.displayName?.[0]}</div>}
              <span className="text-sm text-slate-600 hidden sm:block max-w-[100px] truncate">{user.displayName}</span>
            </button>
            <button onClick={() => signOut(auth)} title="Sign out"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
        {/* Address sub-bar */}
        {activeHouse?.address && (
          <div className="max-w-7xl mx-auto px-4 pb-1.5 flex items-center gap-2 text-xs text-slate-400">
            <MapPin className="w-3 h-3" />
            <span>{activeHouse.address}</span>
            <span className="text-slate-300">·</span>
            <Users className="w-3 h-3" />
            <span>{houseMembers.length} member{houseMembers.length !== 1 ? 's' : ''}</span>
            {isOwner && (
              <>
                <span className="text-slate-300">·</span>
                <button onClick={() => openShareModal(activeHouseId)} className="flex items-center gap-1 text-blue-500 hover:underline">
                  <Share2 className="w-3 h-3" /> Share
                </button>
              </>
            )}
          </div>
        )}
      </header>

      {/* Upload progress */}
      {uploadProgress !== null && (
        <div className="bg-blue-600 h-1 transition-all" style={{ width: `${uploadProgress}%` }} />
      )}

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Pending invites banner */}
        {pendingInvites.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <Users className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-blue-900">
                {pendingInvites.length} pending house invitation{pendingInvites.length !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-blue-600 mt-0.5 truncate">
                {pendingInvites.map(i => i.houseAddress || i.houseName).join(', ')}
              </p>
            </div>
            <button onClick={() => setShowProfileModal(true)} className="shrink-0 text-sm font-medium text-blue-600 hover:underline">
              View
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { id: 'inventory', label: 'Inventory' },
            { id: 'analytics', label: 'Analytics', Icon: BarChart2 },
            { id: 'photos', label: `Photos${photos.length ? ` (${photos.length})` : ''}`, Icon: Image },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition flex items-center gap-1.5 ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}>
              {tab.Icon && <tab.Icon className="w-4 h-4" />}{tab.label}
            </button>
          ))}
        </div>

        {/* ── ANALYTICS ──────────────────────────────────────────────────────── */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Value', value: `$${dashboardStats.total.toLocaleString()}` },
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
                      <span className="text-slate-500">{pct}% · ${val.toLocaleString()}</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── PHOTOS ──────────────────────────────────────────────────────────── */}
        {activeTab === 'photos' && (
          <div className="space-y-6">
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => galleryInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'}`}
            >
              <Image className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-700 font-medium">Drop photos here or click to upload</p>
              <p className="text-slate-400 text-sm mt-1">JPEG · PNG · WEBP · HEIC · Max 10 MB each</p>
              {uploadProgress !== null && (
                <div className="mt-4 h-2 bg-slate-200 rounded-full overflow-hidden max-w-xs mx-auto">
                  <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              )}
            </div>
            {uploadError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />{uploadError}
                <button onClick={() => setUploadError('')} className="ml-auto"><X className="w-4 h-4" /></button>
              </div>
            )}
            {photos.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <Image className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No photos uploaded yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {photos.map(photo => {
                  const linkedCount = items.filter(i => getItemPhotos(i).includes(photo.url)).length
                  return (
                    <div key={photo.id} className="group relative bg-white rounded-xl border border-slate-200 overflow-hidden">
                      <img src={photo.url} alt={photo.name} className="w-full h-36 object-cover" />
                      <div className="p-2">
                        <p className="text-xs text-slate-500 truncate">{photo.name}</p>
                        {linkedCount > 0
                          ? <p className="text-xs text-blue-600 mt-0.5">{linkedCount} item{linkedCount !== 1 ? 's' : ''} linked</p>
                          : <p className="text-xs text-slate-300 mt-0.5">Not linked</p>}
                      </div>
                      <button onClick={e => { e.stopPropagation(); handleDeletePhoto(photo.id, photo.url) }}
                        className="absolute top-2 right-2 bg-white/90 rounded-lg p-1 opacity-0 group-hover:opacity-100 transition hover:bg-red-50">
                        <X className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── INVENTORY ────────────────────────────────────────────────────────── */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Search items…" value={searchText} onChange={e => setSearchText(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
              <select value={roomFilter} onChange={e => setRoomFilter(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
                <option>All Rooms</option>
                {ROOMS.map(r => <option key={r}>{r}</option>)}
              </select>
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
                <input type="checkbox" checked={missingPricesOnly} onChange={e => setMissingPricesOnly(e.target.checked)} className="rounded" />
                Missing prices only
              </label>
              <div className="flex gap-2 ml-auto flex-wrap">
                {selectedItemIds.size > 0 && (
                  <>
                    <button onClick={() => setLinkingItemIds([...selectedItemIds])}
                      className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition">
                      <Plus className="w-4 h-4" /> Add Photo to {selectedItemIds.size} selected
                    </button>
                    <button onClick={() => setConfirmBulkDelete(true)}
                      className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition">
                      <Trash2 className="w-4 h-4" /> Delete {selectedItemIds.size} selected
                    </button>
                  </>
                )}
                <button onClick={() => exportCSV(items)}
                  className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium px-3 py-2 rounded-lg transition">
                  <Download className="w-4 h-4" /> Export
                </button>
                <button onClick={openAdd}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
                  <Plus className="w-4 h-4" /> Add Item
                </button>
              </div>
            </div>

            {uploadError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />{uploadError}
                <button onClick={() => setUploadError('')} className="ml-auto"><X className="w-4 h-4" /></button>
              </div>
            )}

            {dataLoading && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 flex items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                <span className="text-slate-600 font-medium">Loading inventory…</span>
              </div>
            )}

            {!dataLoading && filteredItems.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <p className="text-slate-400 text-sm mb-3">No items match your filters.</p>
                <button onClick={openAdd} className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1 mx-auto">
                  <Plus className="w-4 h-4" /> Add your first item
                </button>
              </div>
            ) : !dataLoading && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="w-10 px-3 py-3">
                          <button onClick={() => {
                            if (selectedItemIds.size === filteredItems.length && filteredItems.length > 0) {
                              setSelectedItemIds(new Set())
                            } else {
                              setSelectedItemIds(new Set(filteredItems.map(i => i.id)))
                            }
                          }}>
                            {selectedItemIds.size > 0 && selectedItemIds.size === filteredItems.length
                              ? <CheckSquare className="w-4 h-4 text-blue-600" />
                              : <Square className="w-4 h-4 text-slate-300" />}
                          </button>
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-slate-600">Room</th>
                        <th className="text-left px-4 py-3 font-medium text-slate-600">Item</th>
                        <th className="text-right px-4 py-3 font-medium text-slate-600">Value</th>
                        <th className="w-24 px-3 py-3 font-medium text-slate-600 text-center">Photo</th>
                        <th className="px-3 py-3 font-medium text-slate-600 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map(item => (
                        <tr key={item.id} className={`border-b border-slate-100 hover:bg-slate-50 transition ${item.value == null ? 'bg-amber-50 hover:bg-amber-100' : ''}`}>
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
                            {item.value == null && <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">No Price</span>}
                          </td>
                          <td className="px-4 py-2 text-right text-slate-700">
                            {item.value != null ? `$${item.value.toLocaleString()}` : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {(() => {
                              const itemPhotos = getItemPhotos(item)
                              return itemPhotos.length > 0 ? (
                                <div className="flex items-center justify-center gap-1 flex-wrap max-w-[110px] mx-auto">
                                  {itemPhotos.slice(0, 3).map((url, idx) => (
                                    <button key={idx} onClick={() => { setViewerUrl(url); setViewerItemId(item.id) }}>
                                      <img src={url} alt="thumb" className="w-7 h-7 rounded object-cover border border-slate-200 hover:opacity-80 transition" />
                                    </button>
                                  ))}
                                  {itemPhotos.length > 3 && <span className="text-[10px] text-slate-400">+{itemPhotos.length - 3}</span>}
                                  <button onClick={() => setLinkingItemIds([item.id])} title="Add photo" className="p-1 rounded hover:bg-slate-100">
                                    <Plus className="w-3 h-3 text-slate-400" />
                                  </button>
                                </div>
                              ) : (
                                <button onClick={() => setLinkingItemIds([item.id])}
                                  className="flex items-center gap-1 mx-auto text-xs text-slate-400 hover:text-blue-600 border border-dashed border-slate-300 hover:border-blue-400 rounded-lg px-2 py-1.5 transition">
                                  <Plus className="w-3 h-3" /> Add
                                </button>
                              )
                            })()}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => openEdit(item)} className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => setDeletingItem(item)} className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition">
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

      {/* ── Hidden inputs ──────────────────────────────────────────────────────── */}
      <input ref={galleryInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic" multiple className="hidden"
        onChange={e => { handleGalleryFiles([...e.target.files]); e.target.value = '' }} />
      <input ref={pickerInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic" multiple className="hidden" onChange={handlePickerUpload} />

      {/* ── Profile Modal ─────────────────────────────────────────────────────── */}
      {showProfileModal && (
        <Modal title="Profile & Houses" onClose={() => { setShowProfileModal(false); setEditingHouseId(null) }} wide>
          <div className="flex items-center gap-3 pb-5 border-b border-slate-100 mb-5">
            {user.photoURL
              ? <img src={user.photoURL} className="w-12 h-12 rounded-full" alt="avatar" />
              : <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">{user.displayName?.[0]}</div>}
            <div>
              <p className="font-semibold text-slate-800">{user.displayName}</p>
              <p className="text-sm text-slate-500">{user.email}</p>
            </div>
          </div>

          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">My Houses</h3>
          <div className="space-y-3 mb-4">
            {houses.map(house => {
              const isActive = house.id === activeHouseId
              const memberRole = houseMembers.find(m => m.id === user.uid && isActive)?.role
              const amOwner = memberRole === 'owner'
              const isEditing = editingHouseId === house.id
              return (
                <div key={house.id} className={`rounded-xl border p-4 ${isActive ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-white'}`}>
                  {isEditing ? (
                    <div className="space-y-2">
                      <input type="text" value={editHouseName} onChange={e => setEditHouseName(e.target.value)}
                        placeholder="Nickname (optional, e.g. Beach House)"
                        className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                      <input type="text" value={editHouseAddress} onChange={e => setEditHouseAddress(e.target.value)}
                        placeholder="Full address *"
                        className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                      <div className="flex gap-2">
                        <button onClick={saveHouseEdit} disabled={savingHouseEdit || !editHouseAddress.trim()}
                          className="flex items-center gap-1.5 bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                          {savingHouseEdit ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Save
                        </button>
                        <button onClick={() => setEditingHouseId(null)} className="text-xs text-slate-500 px-3 py-1.5 rounded-lg hover:bg-slate-100">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-slate-800 text-sm">{house.name || 'My Home'}</p>
                          {isActive && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">Active</span>}
                        </div>
                        {house.address
                          ? <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3 shrink-0" />{house.address}</p>
                          : <p className="text-xs text-slate-400 mt-0.5 italic">No address — click edit to add one</p>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {!isActive && (
                          <button onClick={() => { setActiveHouseId(house.id); setShowProfileModal(false) }}
                            className="text-xs text-blue-600 px-2 py-1 rounded hover:bg-blue-50 transition font-medium">
                            Switch
                          </button>
                        )}
                        <button
                          onClick={() => { setEditingHouseId(house.id); setEditHouseName(house.name || ''); setEditHouseAddress(house.address || '') }}
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition" title="Edit">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {isActive && amOwner && (
                          <button onClick={() => { setShowProfileModal(false); openShareModal(house.id) }}
                            className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition" title="Share">
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {!amOwner && (
                          <button onClick={() => leaveHouse(house.id)}
                            className="text-xs text-red-500 px-2 py-1 rounded hover:bg-red-50 transition">
                            Leave
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <button onClick={() => { setShowProfileModal(false); setShowCreateHouseModal(true) }}
            className="flex items-center gap-1.5 text-blue-600 text-sm font-medium hover:underline mb-6">
            <Plus className="w-4 h-4" /> Add another house
          </button>

          {pendingInvites.length > 0 && (
            <>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Pending Invitations</h3>
              <div className="space-y-3 mb-4">
                {pendingInvites.map(invite => (
                  <div key={invite.id} className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="font-medium text-slate-800 text-sm">{invite.houseAddress || invite.houseName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Invited by {invite.inviterName}</p>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => acceptInvite(invite)}
                        className="flex-1 bg-blue-600 text-white text-sm py-1.5 rounded-lg hover:bg-blue-700 transition font-medium">
                        Accept
                      </button>
                      <button onClick={() => declineInvite(invite)}
                        className="flex-1 border border-slate-200 bg-white text-slate-600 text-sm py-1.5 rounded-lg hover:bg-slate-50 transition">
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <button onClick={() => signOut(auth)} className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 transition">
              <LogOut className="w-4 h-4" /> Sign out
            </button>
            <button onClick={() => { setShowProfileModal(false); setEditingHouseId(null) }}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition">Close</button>
          </div>
        </Modal>
      )}

      {/* ── Create House Modal ────────────────────────────────────────────────── */}
      {showCreateHouseModal && (
        <Modal title="Add a New House" onClose={() => { setShowCreateHouseModal(false); setCreateHouseError('') }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Address *</label>
              <input type="text" value={newHouseAddress} onChange={e => { setNewHouseAddress(e.target.value); setCreateHouseError('') }}
                placeholder="e.g. 42 Maple Street, Denver, CO 80203" autoFocus
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              {createHouseError && <p className="text-red-600 text-xs mt-1">{createHouseError}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nickname (optional)</label>
              <input type="text" value={newHouseName} onChange={e => setNewHouseName(e.target.value)}
                placeholder="e.g. Beach House, Rental Property"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              <p className="text-xs text-slate-400 mt-1">Defaults to the address if left blank.</p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => { setShowCreateHouseModal(false); setCreateHouseError('') }}
                className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition">Cancel</button>
              <button onClick={createHouse} disabled={creatingHouse}
                className="px-4 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-60">
                {creatingHouse && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Create House
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Share Modal ───────────────────────────────────────────────────────── */}
      {showShareModal && (
        <Modal title={`Share: ${houses.find(h => h.id === shareHouseId)?.address || 'House'}`} onClose={() => setShowShareModal(false)} wide>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Members</h3>
          <div className="space-y-2 mb-5">
            {shareMembers.map(member => (
              <div key={member.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-sm font-medium shrink-0">
                  {(member.displayName || member.email)?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{member.displayName || member.email}</p>
                  <p className="text-xs text-slate-500 truncate">{member.email}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${member.role === 'owner' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                  {member.role}
                </span>
                {member.role !== 'owner' && member.id !== user.uid && (
                  <button onClick={() => removeMember(shareHouseId, member.id)}
                    className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition">
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          {sharePending.length > 0 && (
            <>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Pending Invites</h3>
              <div className="space-y-2 mb-5">
                {sharePending.map(inv => (
                  <div key={inv.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 text-xs font-medium shrink-0">?</div>
                    <p className="flex-1 text-sm text-slate-600 min-w-0 truncate">{inv.inviteeEmail}</p>
                    <button onClick={() => revokeInvite(inv.id)}
                      className="text-xs text-slate-400 hover:text-red-500 px-2 py-1 rounded hover:bg-red-50 transition">
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Invite by Email</h3>
          <div className="flex gap-2">
            <input type="email" value={shareEmail} onChange={e => { setShareEmail(e.target.value); setShareStatus(null) }}
              placeholder="name@example.com" onKeyDown={e => e.key === 'Enter' && sendInvite()}
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            <button onClick={sendInvite} disabled={shareLoading || !shareEmail.trim()}
              className="flex items-center gap-1.5 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
              {shareLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />} Invite
            </button>
          </div>
          {shareStatus && (
            <div className={`mt-3 text-sm rounded-lg px-3 py-2 flex items-center gap-2 ${shareStatus.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {shareStatus.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              {shareStatus.message}
            </div>
          )}
          <div className="flex justify-end pt-4 mt-4 border-t border-slate-100">
            <button onClick={() => setShowShareModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition">Done</button>
          </div>
        </Modal>
      )}

      {/* ── Add/Edit Modal ─────────────────────────────────────────────────────── */}
      {showAddModal && (
        <Modal title={editingItem ? 'Edit Item' : 'Add Item'} onClose={() => setShowAddModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Item Name *</label>
              <input type="text" value={formName} onChange={e => { setFormName(e.target.value); setFormError('') }}
                placeholder="e.g. Sofa (3-seater)" autoFocus
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              {formError && <p className="text-red-600 text-xs mt-1">{formError}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Room</label>
              <input list="room-options" value={formRoom} onChange={e => setFormRoom(e.target.value)}
                placeholder="Select or type a room name"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              <datalist id="room-options">
                {allRooms.map(r => <option key={r} value={r} />)}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Estimated Value ($)</label>
              <input type="number" value={formValue} onChange={e => setFormValue(e.target.value)}
                placeholder="Leave blank if unknown" min="0"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
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

      {/* ── Bulk Delete Modal ─────────────────────────────────────────────────── */}
      {confirmBulkDelete && (
        <Modal title="Delete Selected Items" onClose={() => setConfirmBulkDelete(false)}>
          <p className="text-sm text-slate-600 mb-6">Delete <strong>{selectedItemIds.size} item{selectedItemIds.size !== 1 ? 's' : ''}</strong>? This can't be undone.</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setConfirmBulkDelete(false)} className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition">Cancel</button>
            <button onClick={handleBulkDelete} className="px-4 py-2 rounded-lg text-sm bg-red-600 text-white hover:bg-red-700 transition">Delete</button>
          </div>
        </Modal>
      )}

      {/* ── Delete Modal ───────────────────────────────────────────────────────── */}
      {deletingItem && (
        <Modal title="Delete Item" onClose={() => setDeletingItem(null)}>
          <p className="text-sm text-slate-600 mb-6">Delete <strong>{deletingItem.name}</strong>? This can't be undone.</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setDeletingItem(null)} className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition">Cancel</button>
            <button onClick={handleDeleteItem} className="px-4 py-2 rounded-lg text-sm bg-red-600 text-white hover:bg-red-700 transition">Delete</button>
          </div>
        </Modal>
      )}


      {/* ── Photo Viewer ───────────────────────────────────────────────────────── */}
      {viewerUrl && (
        <Modal title="Photo" onClose={() => { setViewerUrl(null); setViewerItemId(null) }}>
          <img src={viewerUrl} alt="Full size" className="w-full rounded-lg mb-4 max-h-96 object-contain" />
          <div className="flex justify-between items-center">
            <div className="flex gap-3">
              <button onClick={() => { setLinkingItemIds([viewerItemId]); setViewerUrl(null); setViewerItemId(null) }}
                className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Add another
              </button>
              <button onClick={() => handleRemovePhotoFromItem(viewerItemId, viewerUrl)} className="text-sm text-red-500 hover:underline">Remove from item</button>
            </div>
            <button onClick={() => { setViewerUrl(null); setViewerItemId(null) }} className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition">Close</button>
          </div>
        </Modal>
      )}

      {/* ── Photo Picker ───────────────────────────────────────────────────────── */}
      {linkingItemIds && (
        <Modal
          title={linkingItemIds.length === 1
            ? `Add photos to "${items.find(i => i.id === linkingItemIds[0])?.name || 'item'}"`
            : `Add photo to ${linkingItemIds.length} items`}
          onClose={() => setLinkingItemIds(null)}
          wide
        >
          {photos.length === 0 ? (
            <div className="text-center py-8">
              <Image className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm mb-4">No photos in your gallery yet.</p>
              <button onClick={() => { setActiveTab('photos'); setLinkingItemIds(null) }} className="text-blue-600 text-sm font-medium hover:underline">
                Go to Photos tab to upload some first
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-500 mb-4">Click photos to add them. You can add as many as you like.</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-72 overflow-y-auto mb-4">
                {photos.map(photo => {
                  const alreadyAdded = linkingItemIds.length === 1 &&
                    getItemPhotos(items.find(i => i.id === linkingItemIds[0]) || {}).includes(photo.url)
                  return (
                    <button key={photo.id} onClick={() => handleLinkPhoto(photo.url)}
                      className={`rounded-xl overflow-hidden border-2 transition group relative ${alreadyAdded ? 'border-blue-500' : 'border-transparent hover:border-blue-500'}`}>
                      <img src={photo.url} alt={photo.name} className="w-full h-24 object-cover" />
                      <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/10 transition" />
                      {alreadyAdded && (
                        <div className="absolute top-1 right-1 bg-blue-600 rounded-full p-0.5">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
              <div className="flex justify-between items-center border-t border-slate-100 pt-4">
                <button onClick={() => pickerInputRef.current?.click()}
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Upload new photo
                </button>
                <button onClick={() => setLinkingItemIds(null)} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Done</button>
              </div>
            </>
          )}
        </Modal>
      )}
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({ title, children, onClose, wide = false }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? 'max-w-2xl' : 'max-w-md'} p-6 max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-slate-800 text-lg">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}
