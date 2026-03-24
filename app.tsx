import React, { useState, useMemo, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  FileText, 
  AlertCircle, 
  Clock, 
  CheckCircle,
  TrendingUp,
  DollarSign,
  Calendar,
  Building,
  Sparkles,
  Mail,
  Loader2,
  X,
  Copy,
  Check,
  Truck,
  CalendarDays,
  Lock,
  Plus,
  Trash2,
  AlertTriangle,
  Activity,
  Unlock,
  User,
  Wallet,
  Send,
  Edit3,
  Menu,
  Database,
  ShieldCheck
} from 'lucide-react';

// --- Firebase Initialization ---
const firebaseConfig = {
  apiKey: "AIzaSyACvR7KEzJs719E0JJtFiDpiZk0kHYnQyE",
  authDomain: "elev8-be0f4.firebaseapp.com",
  projectId: "elev8-be0f4",
  storageBucket: "elev8-be0f4.firebasestorage.app",
  messagingSenderId: "939507136986",
  appId: "1:939507136986:web:8a8d417cbbc80921eda8e3",
  measurementId: "G-C98765TPWP"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'my-procurement-app'; 

// --- Mock Data ---
const TODAY = new Date('2026-03-24T00:00:00'); 

const INITIAL_PURCHASES = [
  { id: 'PO-2026-001', processorName: 'Alex Reyes', prReceivedDate: '2026-02-25', date: '2026-03-01', expectedDelivery: '2026-03-10', receivedDate: '2026-03-09', vendor: 'TechCorp Supplies', description: 'Engineering Laptops', amount: 150000, status: 'Invoiced' },
  { id: 'PO-2026-002', processorName: 'Maria Santos', prReceivedDate: '2026-02-10', date: '2026-02-15', expectedDelivery: '2026-02-25', receivedDate: '2026-02-26', vendor: 'OfficeWorld', description: 'Ergonomic Chairs', amount: 25000, status: 'Invoiced' },
  { id: 'PO-2026-003', processorName: 'Juan Dela Cruz', prReceivedDate: '2026-03-15', date: '2026-03-20', expectedDelivery: '2026-04-05', receivedDate: null, vendor: 'Global Logistics', description: 'Q1 Shipping Retainer', amount: 8000, status: 'Pending' },
  { id: 'PO-2026-004', processorName: 'Alex Reyes', prReceivedDate: '2025-12-28', date: '2026-01-05', expectedDelivery: '2026-01-20', receivedDate: '2026-01-18', vendor: 'OfficeWorld', description: 'Desks & Cabinets', amount: 45000, status: 'Invoiced' },
  { id: 'PO-2025-099', processorName: 'Maria Santos', prReceivedDate: '2025-11-05', date: '2025-11-10', expectedDelivery: '2025-11-20', receivedDate: '2025-11-20', vendor: 'Global Logistics', description: 'Q4 Shipping Overage', amount: 18000, status: 'Invoiced' },
  { id: 'PO-2025-085', processorName: 'Juan Dela Cruz', prReceivedDate: '2025-09-30', date: '2025-10-05', expectedDelivery: '2025-10-15', receivedDate: '2025-10-14', vendor: 'TechCorp Supplies', description: 'Server Racks', amount: 145000, status: 'Invoiced' },
  { id: 'PO-2025-120', processorName: 'Alex Reyes', prReceivedDate: '2025-12-10', date: '2025-12-15', expectedDelivery: '2025-12-30', receivedDate: '2025-12-28', vendor: 'PrintCo', description: 'Marketing Materials', amount: 31000, status: 'Invoiced' },
  { id: 'PO-2026-005', processorName: 'Maria Santos', prReceivedDate: '2026-03-08', date: '2026-03-10', expectedDelivery: '2026-03-15', receivedDate: null, vendor: 'TechCorp Supplies', description: 'Office Monitors', amount: 55000, status: 'Pending' }, 
];

const INITIAL_APVS = [
  { id: 'APV-26-001', poId: 'PO-2026-001', vendor: 'TechCorp Supplies', invoiceDate: '2026-03-05', dueDate: '2026-04-04', amount: 150000, status: 'Unpaid', funded: true, settledDate: null }, 
  { id: 'APV-26-002', poId: 'PO-2026-002', vendor: 'OfficeWorld', invoiceDate: '2026-02-16', dueDate: '2026-03-18', amount: 25000, status: 'Unpaid', funded: false, settledDate: null }, 
  { id: 'APV-26-005', poId: 'PO-2026-004', vendor: 'OfficeWorld', invoiceDate: '2026-01-10', dueDate: '2026-02-09', amount: 45000, status: 'Unpaid', funded: false, settledDate: null }, 
  { id: 'APV-25-120', poId: 'PO-2025-120', vendor: 'PrintCo', invoiceDate: '2025-12-20', dueDate: '2026-01-19', amount: 31000, status: 'Unpaid', funded: false, settledDate: null }, 
  { id: 'APV-25-099', poId: 'PO-2025-099', vendor: 'Global Logistics', invoiceDate: '2025-11-15', dueDate: '2025-12-15', amount: 18000, status: 'Unpaid', funded: false, settledDate: null }, 
  { id: 'APV-25-085', poId: 'PO-2025-085', vendor: 'TechCorp Supplies', invoiceDate: '2025-10-10', dueDate: '2025-11-09', amount: 145000, status: 'Unpaid', funded: false, settledDate: null }, 
];

// --- Gemini API Helper ---
const callGeminiAPI = async (prompt: string) => {
  const apiKey = "";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: "You are an expert financial analyst and accounts payable manager." }] }
  };

  let retries = 5;
  let delay = 1000;

  while (retries > 0) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
    } catch (error) {
      retries--;
      if (retries === 0) return "Failed to generate AI content after multiple attempts. Please try again later.";
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
};

// --- Helper Functions ---
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
};

const getAgingCategory = (dueDate: string, status: string) => {
  if (status === 'Paid') return 'Paid';
  const due = new Date(dueDate);
  const diffTime = TODAY.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'Current';
  if (diffDays <= 30) return '1-30 Days';
  if (diffDays <= 60) return '31-60 Days';
  if (diffDays <= 90) return '61-90 Days';
  return '> 90 Days';
};

const getAgingColor = (category: string) => {
  switch (category) {
    case 'Current': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case '1-30 Days': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case '31-60 Days': return 'bg-orange-100 text-orange-800 border-orange-200';
    case '61-90 Days': return 'bg-red-100 text-red-800 border-red-200';
    case '> 90 Days': return 'bg-rose-600 text-white border-rose-700';
    case 'Paid': return 'bg-gray-100 text-gray-600 border-gray-200';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getAgingBgColor = (category: string) => {
  switch (category) {
    case 'Current': return 'bg-emerald-500';
    case '1-30 Days': return 'bg-yellow-400';
    case '31-60 Days': return 'bg-orange-500';
    case '61-90 Days': return 'bg-red-500';
    case '> 90 Days': return 'bg-rose-700';
    default: return 'bg-gray-300';
  }
};

const getDaysDiff = (startStr: string, endStr: string | null) => {
  if (!startStr || !endStr) return null;
  const s = new Date(startStr);
  const e = new Date(endStr);
  s.setHours(0,0,0,0);
  e.setHours(0,0,0,0);
  return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
};

const getDeliveryStatus = (expectedDelivery: string, receivedDate: string | null) => {
  if (receivedDate) {
     const expected = new Date(expectedDelivery);
     const received = new Date(receivedDate);
     return received <= expected 
       ? { label: 'Received', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' } 
       : { label: 'Received (Late)', color: 'bg-amber-100 text-amber-800 border-amber-200' };
  }
  
  const expected = new Date(expectedDelivery);
  const diffTime = Math.ceil((TODAY.getTime() - expected.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffTime > 0) {
    return { label: `Delayed (${diffTime} days)`, color: 'bg-rose-100 text-rose-800 border-rose-200' };
  }
  return { label: 'Pending Delivery', color: 'bg-blue-100 text-blue-800 border-blue-200' };
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // App States
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [apvs, setApvs] = useState<any[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  
  // Setup States
  const [setupError, setSetupError] = useState<{title: string, msg: string, code: string} | null>(null);

  // Admin & Security States
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState(false);

  // AI States
  const [insights, setInsights] = useState<string | null>(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [currentEmailDraft, setCurrentEmailDraft] = useState('');
  const [isDraftingEmail, setIsDraftingEmail] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  // Form States
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [isApvModalOpen, setIsApvModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [selectedPo, setSelectedPo] = useState<any>(null);
  
  const [newPo, setNewPo] = useState({ id: '', processorName: '', prReceivedDate: '', date: '', expectedDelivery: '', vendor: '', description: '', amount: '' });
  const [newApv, setNewApv] = useState({ id: '', poId: '', vendor: '', invoiceDate: '', dueDate: '', amount: '', funded: false, settledDate: null });
  const [receiveDate, setReceiveDate] = useState('');

  const [isPayApvModalOpen, setIsPayApvModalOpen] = useState(false);
  const [selectedApvToPay, setSelectedApvToPay] = useState<any>(null);
  const [settleDate, setSettleDate] = useState('');

  const [weeklyFund, setWeeklyFund] = useState(5000000);
  const [isFundModalOpen, setIsFundModalOpen] = useState(false);
  const [editFundAmount, setEditFundAmount] = useState('');

  // --- Firebase Authentication & Data Fetching ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
        setSetupError(null);
      } catch (error: any) {
        console.error("Authentication failed:", error);
        if (error.code === 'auth/configuration-not-found') {
          setSetupError({
            title: "Anonymous Auth Not Enabled",
            msg: "Go to Firebase Console > Authentication > Sign-in method, click 'Anonymous' and click Enable.",
            code: "AUTH_CONFIG"
          });
        } else {
          setSetupError({
            title: "Connection Failed",
            msg: error.message || "Could not connect to Firebase.",
            code: "UNKNOWN"
          });
        }
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const purchasesRef = collection(db, 'artifacts', appId, 'public', 'data', 'purchases');
    const apvsRef = collection(db, 'artifacts', appId, 'public', 'data', 'apvs');
    const settingsRef = collection(db, 'artifacts', appId, 'public', 'data', 'settings');

    const unsubSettings = onSnapshot(doc(settingsRef, 'treasury'), (docSnap) => {
      if (docSnap.exists()) {
        setWeeklyFund(docSnap.data().amount);
      } else {
        setDoc(doc(settingsRef, 'treasury'), { amount: 5000000 }).catch(e => {
           setSetupError({
             title: "Database Access Denied",
             msg: "Your Firestore Rules are blocking the app. Go to Firestore > Rules and set them to 'Test Mode' or allow all reads/writes.",
             code: "PERMISSION_DENIED"
           });
        });
      }
    });

    const unsubPurchases = onSnapshot(purchasesRef, (snapshot) => {
      if (snapshot.empty) {
        // Automatically populate with mock data if fresh project
        INITIAL_PURCHASES.forEach(p => setDoc(doc(purchasesRef, p.id), p));
      } else {
        const loadedData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPurchases(loadedData.sort((a, b) => a.id.localeCompare(b.id)));
      }
    });

    const unsubApvs = onSnapshot(apvsRef, (snapshot) => {
      if (snapshot.empty) {
        INITIAL_APVS.forEach(a => setDoc(doc(apvsRef, a.id), a));
      } else {
        const loadedData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setApvs(loadedData.sort((a, b) => a.id.localeCompare(b.id)));
      }
      setIsDataLoading(false);
    });

    return () => {
      unsubPurchases();
      unsubApvs();
      unsubSettings();
    };
  }, [user]);


  // --- Calculations ---
  const { totalPurchases, pendingDeliveriesCount, totalOutstanding, agingSummary, vendorAging, avgProcessingTime, onTimeRate, vendorDeliveryRates, totalFundedUnpaid, totalReleasedThisWeek, weeklyNeedToPay, endOfWeek } = useMemo(() => {
    let tPurchases = purchases.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    let pDeliveries = purchases.filter(p => !p.receivedDate).length;
    let tOutstanding = 0;
    
    let tFundedUnpaid = 0;
    let tReleasedThisWeek = 0;
    const startOfWeek = new Date(TODAY);
    startOfWeek.setDate(TODAY.getDate() - TODAY.getDay()); 
    startOfWeek.setHours(0,0,0,0);
    
    const endOfCurrentWeek = new Date(startOfWeek);
    endOfCurrentWeek.setDate(startOfWeek.getDate() + 6); 
    endOfCurrentWeek.setHours(23, 59, 59, 999);

    let totalProcessingDays = 0;
    let processedCount = 0;
    let onTimeCount = 0;
    let receivedCount = 0;
    
    const vDelivery: any = {};

    purchases.forEach(p => {
      if (p.prReceivedDate && p.date) {
        const diff = getDaysDiff(p.prReceivedDate, p.date);
        if (diff !== null && diff >= 0) {
          totalProcessingDays += diff;
          processedCount++;
        }
      }

      if (!vDelivery[p.vendor]) vDelivery[p.vendor] = { name: p.vendor, totalOrders: 0, onTime: 0 };

      if (p.receivedDate && p.expectedDelivery) {
        receivedCount++;
        vDelivery[p.vendor].totalOrders++;
        const diff = getDaysDiff(p.expectedDelivery, p.receivedDate);
        if (diff !== null && diff <= 0) {
          onTimeCount++; 
          vDelivery[p.vendor].onTime++;
        }
      }
    });

    const summary: any = { 'Current': 0, '1-30 Days': 0, '31-60 Days': 0, '61-90 Days': 0, '> 90 Days': 0 };
    const weeklyNeed: any = { 'Current': 0, '1-30 Days': 0, '31-60 Days': 0, '61-90 Days': 0, '> 90 Days': 0, total: 0 };
    const vAging: any = {};

    apvs.forEach(apv => {
      const amt = Number(apv.amount || 0);
      if (apv.status === 'Unpaid') {
        tOutstanding += amt;
        if (apv.funded) tFundedUnpaid += amt;

        const category = getAgingCategory(apv.dueDate, apv.status);
        if (summary[category] !== undefined) summary[category] += amt;
        
        const dueDateObj = new Date(apv.dueDate);
        if (dueDateObj <= endOfCurrentWeek) {
          if (weeklyNeed[category] !== undefined) weeklyNeed[category] += amt;
          weeklyNeed.total += amt;
        }

        if (!vAging[apv.vendor]) {
          vAging[apv.vendor] = { name: apv.vendor, total: 0, 'Current': 0, '1-30 Days': 0, '31-60 Days': 0, '61-90 Days': 0, '> 90 Days': 0 };
        }
        vAging[apv.vendor].total += amt;
        vAging[apv.vendor][category] += amt;
      } else if (apv.status === 'Paid' && apv.settledDate) {
        const settled = new Date(apv.settledDate);
        if (settled >= startOfWeek) {
          tReleasedThisWeek += amt;
        }
      }
    });

    return { 
      totalPurchases: tPurchases, 
      pendingDeliveriesCount: pDeliveries,
      totalOutstanding: tOutstanding, 
      agingSummary: summary,
      vendorAging: Object.values(vAging).sort((a: any, b: any) => b.total - a.total),
      avgProcessingTime: processedCount > 0 ? (totalProcessingDays / processedCount).toFixed(1) : 0,
      onTimeRate: receivedCount > 0 ? ((onTimeCount / receivedCount) * 100).toFixed(0) : 0,
      vendorDeliveryRates: Object.values(vDelivery).map((v: any) => ({
        ...v,
        onTimeRate: v.totalOrders > 0 ? ((v.onTime / v.totalOrders) * 100).toFixed(0) : 0
      })).sort((a, b) => b.totalOrders - a.totalOrders),
      totalFundedUnpaid: tFundedUnpaid,
      totalReleasedThisWeek: tReleasedThisWeek,
      weeklyNeedToPay: weeklyNeed,
      endOfWeek: endOfCurrentWeek
    };
  }, [purchases, apvs, weeklyFund]);

  const toggleFunded = async (apv: any) => {
    if (!user || !isAdmin) return;
    try {
      const apvRef = doc(db, 'artifacts', appId, 'public', 'data', 'apvs', apv.id);
      await updateDoc(apvRef, { funded: !apv.funded });
    } catch (error) {
      console.error("Error toggling funded status:", error);
    }
  };

  const openPayModal = (apv: any) => {
    setSelectedApvToPay(apv);
    setSettleDate(TODAY.toISOString().split('T')[0]);
    setIsPayApvModalOpen(true);
  };

  const handlePayApv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isAdmin || !selectedApvToPay) return;
    try {
      const apvRef = doc(db, 'artifacts', appId, 'public', 'data', 'apvs', selectedApvToPay.id);
      await updateDoc(apvRef, { status: 'Paid', settledDate: settleDate });
      setIsPayApvModalOpen(false);
      setSelectedApvToPay(null);
    } catch (error) {
      console.error("Error updating status to Paid:", error);
    }
  };

  const handleUpdateFund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isAdmin) return;
    try {
      const settingsRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'treasury');
      await setDoc(settingsRef, { amount: Number(editFundAmount) });
      setIsFundModalOpen(false);
    } catch (error) {
      console.error("Error updating treasury fund:", error);
    }
  };

  const handleAddPo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isAdmin) return;
    try {
      const poRef = doc(db, 'artifacts', appId, 'public', 'data', 'purchases', newPo.id);
      await setDoc(poRef, { 
        ...newPo, 
        amount: Number(newPo.amount), 
        status: 'Pending', 
        receivedDate: null 
      });
      setIsPoModalOpen(false);
      setNewPo({ id: '', processorName: '', prReceivedDate: '', date: '', expectedDelivery: '', vendor: '', description: '', amount: '' });
    } catch (error) {
      console.error("Error adding PO:", error);
    }
  };

  const handleAddApv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isAdmin) return;
    try {
      const apvRef = doc(db, 'artifacts', appId, 'public', 'data', 'apvs', newApv.id);
      await setDoc(apvRef, { 
        ...newApv, 
        amount: Number(newApv.amount), 
        status: 'Unpaid',
        funded: false,
        settledDate: null
      });
      setIsApvModalOpen(false);
      setNewApv({ id: '', poId: '', vendor: '', invoiceDate: '', dueDate: '', amount: '', funded: false, settledDate: null });
    } catch (error) {
      console.error("Error adding APV:", error);
    }
  };

  const handleReceivePo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedPo || !isAdmin) return;
    try {
      const poRef = doc(db, 'artifacts', appId, 'public', 'data', 'purchases', selectedPo.id);
      await updateDoc(poRef, { 
        receivedDate: receiveDate, 
        status: 'Invoiced' 
      });
      setIsReceiveModalOpen(false);
      setSelectedPo(null);
    } catch (error) {
      console.error("Error receiving PO:", error);
    }
  };

  const openReceiveModal = (po: any) => {
    setSelectedPo(po);
    setReceiveDate(TODAY.toISOString().split('T')[0]);
    setIsReceiveModalOpen(true);
  };

  const handleDeletePo = async (id: string) => {
    if (!user || !isAdmin) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'purchases', id));
    } catch (error) {
      console.error("Error deleting PO:", error);
    }
  };

  const handleDeleteApv = async (id: string) => {
    if (!user || !isAdmin) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'apvs', id));
    } catch (error) {
      console.error("Error deleting APV:", error);
    }
  };

  const handleClearAllData = async () => {
    if (!user || !isAdmin) return;
    setIsClearing(true);
    try {
      for (const po of purchases) {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'purchases', po.id));
      }
      for (const apv of apvs) {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'apvs', apv.id));
      }
    } catch (error) {
      console.error("Error clearing data:", error);
    }
    setIsClearing(false);
    setIsClearModalOpen(false);
  };

  const generateInsights = async () => {
    setIsGeneratingInsights(true);
    const dataSummary = `
      Total Outstanding: ${formatCurrency(totalOutstanding)}
      Current: ${formatCurrency(agingSummary['Current'])}
      1-30 Days: ${formatCurrency(agingSummary['1-30 Days'])}
      31-60 Days: ${formatCurrency(agingSummary['31-60 Days'])}
      61-90 Days: ${formatCurrency(agingSummary['61-90 Days'])}
      Over 90 Days: ${formatCurrency(agingSummary['> 90 Days'])}
    `;
    
    const prompt = `Review this Accounts Payable Aging Summary:\n${dataSummary}\nProvide a concise, 3-sentence actionable financial insight. Highlight any risks with older payables and suggest a quick strategy. Do not use formatting like bolding or asterisks.`;
    
    const result = await callGeminiAPI(prompt);
    setInsights(result);
    setIsGeneratingInsights(false);
  };

  const draftVendorEmail = async (vendorData: any) => {
    setSelectedVendor(vendorData.name);
    setEmailModalOpen(true);
    setIsDraftingEmail(true);
    setCurrentEmailDraft('');
    setCopySuccess(false);

    const vendorSummary = `
      Vendor: ${vendorData.name}
      Total Due: ${formatCurrency(vendorData.total)}
      Current: ${formatCurrency(vendorData['Current'])}
      1-30 Days: ${formatCurrency(vendorData['1-30 Days'])}
      31-60 Days: ${formatCurrency(vendorData['31-60 Days'])}
      61-90 Days: ${formatCurrency(vendorData['61-90 Days'])}
      Over 90 Days: ${formatCurrency(vendorData['> 90 Days'])}
    `;

    const prompt = `Write a professional email to our vendor, ${vendorData.name}, regarding our outstanding balance.
    Here is the aging breakdown: \n${vendorSummary}\n
    Acknowledge the delayed payments (especially anything over 60 days), apologize briefly for the delay, and assure them that we are actively reviewing our payables and will provide a payment schedule shortly. Politeness is key. Body only.`;

    const result = await callGeminiAPI(prompt);
    setCurrentEmailDraft(result);
    setIsDraftingEmail(false);
  };

  const draftPaymentNotification = async (apv: any) => {
    setSelectedVendor(apv.vendor);
    setEmailModalOpen(true);
    setIsDraftingEmail(true);
    setCurrentEmailDraft('');
    setCopySuccess(false);

    const prompt = `Write a professional payment advice email to ${apv.vendor}. Inform them that the payment for APV reference ${apv.id} amounting to ${formatCurrency(apv.amount)} has been successfully funded by Treasury and settled on ${apv.settledDate}. Body only.`;

    const result = await callGeminiAPI(prompt);
    setCurrentEmailDraft(result);
    setIsDraftingEmail(false);
  };

  const handleCopy = () => {
    const textArea = document.createElement("textarea");
    textArea.value = currentEmailDraft;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
    document.body.removeChild(textArea);
  };

  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'admin123') {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setAdminPassword('');
      setAdminError(false);
    } else {
      setAdminError(true);
    }
  };

  const handleTabSwitch = (tab: string) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  // --- Setup Error Assistant UI ---
  if (setupError) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 p-6">
        <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
          <div className={`p-8 text-center ${setupError.code === 'AUTH_CONFIG' ? 'bg-amber-50' : 'bg-rose-50'}`}>
            {setupError.code === 'AUTH_CONFIG' ? (
               <ShieldCheck size={64} className="text-amber-500 mx-auto mb-4 animate-pulse" />
            ) : (
               <Database size={64} className="text-rose-500 mx-auto mb-4 animate-pulse" />
            )}
            <h2 className="text-2xl font-black text-slate-800 mb-2">{setupError.title}</h2>
            <p className="text-slate-600 font-medium leading-relaxed">{setupError.msg}</p>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">How to fix it</h3>
              <div className="flex items-start space-x-3 bg-slate-50 p-4 rounded-xl">
                 <div className="bg-slate-200 text-slate-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
                 <p className="text-sm text-slate-700">Open your <strong>Firebase Console</strong> for project <code>elev8-be0f4</code>.</p>
              </div>
              {setupError.code === 'AUTH_CONFIG' ? (
                <div className="flex items-start space-x-3 bg-slate-50 p-4 rounded-xl">
                  <div className="bg-slate-200 text-slate-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
                  <p className="text-sm text-slate-700">Go to <strong>Authentication</strong> &gt; <strong>Sign-in method</strong>, enable <strong>Anonymous</strong>.</p>
                </div>
              ) : (
                <div className="flex items-start space-x-3 bg-slate-50 p-4 rounded-xl">
                  <div className="bg-slate-200 text-slate-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
                  <p className="text-sm text-slate-700">Go to <strong>Firestore Database</strong> &gt; <strong>Rules</strong> and set them to allow access.</p>
                </div>
              )}
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
            >
              Verify Fix & Restart
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isDataLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 flex-col px-4 text-center">
        <Loader2 size={48} className="animate-spin text-blue-600 mb-4" />
        <h2 className="text-xl font-semibold text-gray-800">Finalizing Connection...</h2>
        <p className="text-gray-500 text-sm mt-2 flex items-center justify-center italic">
          <Lock size={14} className="mr-1" /> Handshaking with elev8-be0f4
        </p>
      </div>
    );
  }

  const renderDashboard = () => (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6 animate-in fade-in duration-500 items-start">
      <div className="space-y-4 md:space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Activity className="mr-2 text-indigo-500" size={20} /> Procurement Timeline
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          <div className="p-4 md:p-5 rounded-xl bg-blue-50 border border-blue-100 flex items-center space-x-3 md:space-x-4">
            <div className="p-2 md:p-3 bg-blue-100 rounded-lg text-blue-600"><FileText size={20} /></div>
            <div>
              <div className="text-xs text-blue-600 font-medium">Avg PR-to-PO</div>
              <div className="text-lg md:text-xl font-bold text-blue-900">{avgProcessingTime} <span className="text-xs md:text-sm font-normal text-blue-700">Days</span></div>
            </div>
          </div>
          <div className="p-4 md:p-5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center space-x-3 md:space-x-4">
            <div className="p-2 md:p-3 bg-emerald-100 rounded-lg text-emerald-600"><CheckCircle size={20} /></div>
            <div>
              <div className="text-xs text-emerald-600 font-medium">On-Time Delivery</div>
              <div className="text-lg md:text-xl font-bold text-emerald-900">{onTimeRate}%</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead className="sticky top-0 bg-gray-50 z-10">
                <tr className="border-b border-gray-200 text-[10px] uppercase tracking-wider text-gray-500">
                  <th className="p-3 font-semibold">PO Info</th>
                  <th className="p-3 font-semibold border-l border-gray-200">Processing</th>
                  <th className="p-3 font-semibold border-l border-gray-200">Delivery</th>
                  <th className="p-3 font-semibold text-center border-l border-gray-200">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {purchases.length === 0 ? (
                  <tr><td colSpan={4} className="p-4 text-center text-sm text-gray-500">No data available.</td></tr>
                ) : purchases.map((po) => {
                  const processingDays = getDaysDiff(po.prReceivedDate, po.date);
                  const deliveryVariance = getDaysDiff(po.expectedDelivery, po.receivedDate);
                  const status = getDeliveryStatus(po.expectedDelivery, po.receivedDate);
                  return (
                    <tr key={po.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-3">
                        <div className="font-medium text-xs text-gray-900">{po.id}</div>
                        <div className="text-[10px] text-gray-500 truncate max-w-[100px]">{po.vendor}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5 flex items-center"><User size={10} className="mr-1"/> {po.processorName || 'Unassigned'}</div>
                      </td>
                      <td className="p-3 border-l border-gray-100">
                        <div className="text-[10px] text-gray-500 mb-1">PR: <strong className="text-gray-900">{po.prReceivedDate || 'N/A'}</strong><br/>PO: <strong className="text-gray-900">{po.date}</strong></div>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium inline-block ${processingDays !== null && processingDays > 5 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>{processingDays !== null ? `${processingDays}d` : 'N/A'}</span>
                      </td>
                      <td className="p-3 border-l border-gray-100">
                        <div className="text-[10px] text-gray-500 mb-1">Exp: <strong className="text-gray-900">{po.expectedDelivery}</strong><br/>Rcv: <strong className={po.receivedDate ? 'text-gray-900' : 'text-gray-400 italic'}>{po.receivedDate || 'Pending'}</strong></div>
                        {po.receivedDate && <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium inline-block ${deliveryVariance !== null && deliveryVariance > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{deliveryVariance !== null && deliveryVariance > 0 ? `${deliveryVariance}d late` : 'On-time'}</span>}
                      </td>
                      <td className="p-3 border-l border-gray-100 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border inline-block ${status.color}`}>{status.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="space-y-4 md:space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center pt-4 xl:pt-0">
          <LayoutDashboard className="mr-2 text-blue-500" size={20} /> Financial Overview
        </h3>
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-5 md:p-6 rounded-xl shadow-md border border-slate-700 text-white relative overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start mb-4 md:mb-6 relative z-10">
            <div className="mb-4 sm:mb-0">
              <p className="text-slate-400 font-medium text-xs md:text-sm flex items-center uppercase tracking-wider mb-1"><Wallet size={16} className="mr-2"/> designated fund</p>
              <div className="flex items-end">
                <h3 className="text-2xl md:text-3xl font-bold text-white">{formatCurrency(weeklyFund)}</h3>
                {isAdmin && <button onClick={() => {setEditFundAmount(weeklyFund.toString()); setIsFundModalOpen(true);}} className="ml-3 mb-1 text-slate-400 hover:text-white transition-colors p-2 -m-2"><Edit3 size={16} /></button>}
              </div>
            </div>
            <div className="text-left sm:text-right w-full sm:w-auto">
               <p className="text-slate-400 font-medium text-xs md:text-sm uppercase tracking-wider mb-1">Available</p>
               <h3 className="text-xl md:text-2xl font-bold text-emerald-400">{formatCurrency(weeklyFund - totalReleasedThisWeek - totalFundedUnpaid)}</h3>
            </div>
          </div>
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 md:gap-4 relative z-10">
            <div className="bg-slate-800/80 p-3 md:p-4 rounded-lg border border-slate-700/50">
              <p className="text-slate-400 text-[10px] md:text-xs uppercase tracking-wider mb-1">Released</p>
              <h4 className="text-lg md:text-xl font-semibold text-white">{formatCurrency(totalReleasedThisWeek)}</h4>
            </div>
            <div className="bg-slate-800/80 p-3 md:p-4 rounded-lg border border-slate-700/50">
              <p className="text-slate-400 text-[10px] md:text-xs uppercase tracking-wider mb-1">Earmarked</p>
              <h4 className="text-lg md:text-xl font-semibold text-amber-400">{formatCurrency(totalFundedUnpaid)}</h4>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <div className="bg-white p-4 md:p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center sm:space-x-4">
            <div className="p-2 md:p-3 bg-blue-50 rounded-lg text-blue-600 mb-2 sm:mb-0"><ShoppingCart size={20} /></div>
            <div>
              <p className="text-[10px] md:text-xs text-gray-500 font-medium uppercase">Purchases YTD</p>
              <h3 className="text-sm md:text-xl font-bold text-gray-900 break-all">{formatCurrency(totalPurchases)}</h3>
            </div>
          </div>
          <div className="bg-white p-4 md:p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center sm:space-x-4">
            <div className="p-2 md:p-3 bg-rose-50 rounded-lg text-rose-600 mb-2 sm:mb-0"><DollarSign size={20} /></div>
            <div>
              <p className="text-[10px] md:text-xs text-gray-500 font-medium uppercase">Outstanding APV</p>
              <h3 className="text-sm md:text-xl font-bold text-gray-900 break-all">{formatCurrency(totalOutstanding)}</h3>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 md:p-6 rounded-xl border border-indigo-100 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-3 sm:space-y-0">
            <h3 className="text-base md:text-lg font-semibold text-indigo-900 flex items-center"><Sparkles className="mr-2 text-indigo-600" size={18} /> AI Strategy</h3>
            <button onClick={generateInsights} disabled={isGeneratingInsights} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors flex items-center justify-center disabled:opacity-50">
              {isGeneratingInsights ? <Loader2 size={14} className="animate-spin mr-2" /> : <Sparkles size={14} className="mr-2" />} {insights ? 'Update' : 'Generate'}
            </button>
          </div>
          <div className="bg-white/60 p-3 md:p-4 rounded-lg min-h-[80px] flex items-center text-indigo-900 text-xs md:text-sm leading-relaxed border border-indigo-100/50">
            {isGeneratingInsights ? <span className="flex items-center text-indigo-600"><Loader2 size={16} className="animate-spin mr-2" /> Reviewing payables...</span> : insights ? <p>{insights}</p> : <span className="text-indigo-400 italic">Generate AI insights to review aging risk.</span>}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPurchases = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-500">
      <div className="px-4 md:px-6 py-4 md:py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <h3 className="text-base md:text-lg font-semibold text-gray-900">Purchase Orders</h3>
        {isAdmin && <button onClick={() => setIsPoModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors flex items-center"><Plus size={16} className="mr-1 md:mr-2" /> New PO</button>}
      </div>
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-white border-b border-gray-200 text-[10px] md:text-xs uppercase tracking-wider text-gray-500">
              <th className="p-3 md:p-4 font-semibold">PO Details</th>
              <th className="p-3 md:p-4 font-semibold">Vendor & Description</th>
              <th className="p-3 md:p-4 font-semibold">Delivery</th>
              <th className="p-3 md:p-4 font-semibold text-center">Status</th>
              <th className="p-3 md:p-4 font-semibold text-right">Amount</th>
              {isAdmin && <th className="p-3 md:p-4 font-semibold text-center">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {purchases.length === 0 ? <tr><td colSpan={isAdmin ? 6 : 5} className="p-8 text-center text-sm text-gray-500">No records found.</td></tr> : purchases.map((po) => {
              const deliveryStatus = getDeliveryStatus(po.expectedDelivery, po.receivedDate);
              return (
              <tr key={po.id} className="hover:bg-gray-50 transition-colors text-xs md:text-sm">
                <td className="p-3 md:p-4">
                  <div className="font-medium text-blue-600">{po.id}</div>
                  <div className="text-[10px] text-gray-500 mt-1 flex items-center"><CalendarDays size={10} className="mr-1"/> PO: {po.date}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5 flex items-center"><User size={10} className="mr-1"/> {po.processorName || 'N/A'}</div>
                </td>
                <td className="p-3 md:p-4">
                  <div className="text-gray-900 font-medium truncate max-w-[150px]">{po.vendor}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5 truncate max-w-[150px]">{po.description}</div>
                </td>
                <td className="p-3 md:p-4">
                  <div className="text-[10px] text-gray-500"><span className="hidden md:inline">Expected: </span>{po.expectedDelivery}</div>
                  <div className={`text-[10px] font-medium mt-0.5 ${po.receivedDate ? 'text-emerald-600' : 'text-amber-500 italic'}`}>{po.receivedDate ? `Received ${po.receivedDate}` : 'Pending'}</div>
                </td>
                <td className="p-3 md:p-4 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border block mb-1 ${deliveryStatus.color}`}>{deliveryStatus.label}</span>
                </td>
                <td className="p-3 md:p-4 text-right font-medium text-gray-900">{formatCurrency(po.amount)}</td>
                {isAdmin && (
                  <td className="p-3 md:p-4 text-center flex items-center justify-center space-x-2">
                    {!po.receivedDate && <button onClick={() => openReceiveModal(po)} className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors">Receive</button>}
                    <button onClick={() => handleDeletePo(po.id)} className="text-gray-400 hover:text-red-600 transition-colors p-1"><Trash2 size={16} /></button>
                  </td>
                )}
              </tr>
            )})}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAPVs = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-500">
      <div className="px-4 md:px-6 py-4 md:py-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
        <h3 className="text-base md:text-lg font-semibold text-gray-900">Accounts Payable Records</h3>
        {isAdmin && <button onClick={() => setIsApvModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors flex items-center"><Plus size={16} className="mr-1 md:mr-2" /> Add APV</button>}
      </div>
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse min-w-[750px]">
          <thead>
            <tr className="bg-white border-b border-gray-200 text-[10px] md:text-xs uppercase tracking-wider text-gray-500">
              <th className="p-3 md:p-4 font-semibold">APV No.</th>
              <th className="p-3 md:p-4 font-semibold">Vendor & PO</th>
              <th className="p-3 md:p-4 font-semibold">Due Date</th>
              <th className="p-3 md:p-4 font-semibold text-right">Amount</th>
              <th className="p-3 md:p-4 font-semibold text-center">Status</th>
              {isAdmin && <th className="p-3 md:p-4 font-semibold text-center">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {apvs.length === 0 ? <tr><td colSpan={isAdmin ? 6 : 5} className="p-8 text-center text-sm text-gray-500">No APVs found.</td></tr> : apvs.map((apv) => {
              const agingCat = getAgingCategory(apv.dueDate, apv.status);
              return (
                <tr key={apv.id} className="hover:bg-gray-50 transition-colors text-xs md:text-sm">
                  <td className="p-3 md:p-4 font-medium text-gray-900">{apv.id}</td>
                  <td className="p-3 md:p-4">
                    <div className="text-gray-900 truncate max-w-[150px]">{apv.vendor}</div>
                    <div className="text-blue-600 text-[10px] md:text-xs mt-0.5">{apv.poId}</div>
                  </td>
                  <td className="p-3 md:p-4 text-gray-600">{apv.dueDate}</td>
                  <td className="p-3 md:p-4 text-right font-medium text-gray-900">{formatCurrency(apv.amount)}</td>
                  <td className="p-3 md:p-4 text-center">
                    <div className="flex flex-col items-center justify-center space-y-1">
                      <span className={`px-2 py-0.5 md:px-2.5 md:py-1 rounded-full text-[10px] font-medium border w-full max-w-[90px] ${getAgingColor(agingCat)}`}>{agingCat}</span>
                      {apv.status === 'Paid' ? <div className="text-[9px] text-gray-400 italic">Settled: {apv.settledDate}</div> : <button onClick={() => toggleFunded(apv)} disabled={!isAdmin} className={`px-2 py-0.5 rounded-full text-[10px] font-medium border w-full max-w-[90px] transition-colors ${apv.funded ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>{apv.funded ? 'Funded' : 'Pending'}</button>}
                    </div>
                  </td>
                  {isAdmin && (
                    <td className="p-3 md:p-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        {apv.status === 'Unpaid' ? <button onClick={() => openPayModal(apv)} disabled={!apv.funded} className={`text-[10px] px-2 py-1 rounded-lg font-bold uppercase transition-colors ${apv.funded ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-300'}`}>Pay</button> : <button onClick={() => draftPaymentNotification(apv)} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-lg font-bold uppercase flex items-center"><Send size={10} className="mr-1" /> Notify</button>}
                        <button onClick={() => handleDeleteApv(apv.id)} className="text-gray-400 hover:text-red-600 p-1"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAgingReport = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-500">
      <div className="px-4 md:px-6 py-4 md:py-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
        <div>
          <h3 className="text-base md:text-lg font-semibold text-gray-900">APV Aging Breakdown</h3>
          <p className="text-[10px] text-gray-500">Treasury Requirements for {TODAY.toLocaleDateString()}</p>
        </div>
      </div>
      <div className="p-4 md:p-6 bg-slate-50 border-b border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Required This Week</p>
            <h4 className="text-xl font-bold text-gray-900">{formatCurrency(weeklyNeedToPay.total)}</h4>
            {weeklyNeedToPay.total > (weeklyFund - totalReleasedThisWeek) && <p className="text-[9px] text-rose-600 font-medium mt-1">Allocation Exceeded</p>}
          </div>
          <div className="md:col-span-1 lg:col-span-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm overflow-hidden">
             <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-3">Weekly Risk Distribution</p>
             <div className="flex h-3 w-full rounded-full overflow-hidden bg-gray-100 mb-2">
               {['Current', '1-30 Days', '31-60 Days', '61-90 Days', '> 90 Days'].map(cat => {
                 const percentage = (weeklyNeedToPay[cat] / (weeklyNeedToPay.total || 1) * 100).toFixed(0);
                 if (percentage === '0') return null;
                 return <div key={cat} style={{ width: `${percentage}%` }} className={getAgingBgColor(cat)} title={cat} />
               })}
             </div>
             <div className="flex flex-wrap gap-3">
               {['Current', '1-30 Days', '31-60 Days', '61-90 Days', '> 90 Days'].map(cat => (
                 <div key={cat} className="flex items-center space-x-1.5">
                   <div className={`w-2 h-2 rounded-full ${getAgingBgColor(cat)}`} />
                   <span className="text-[9px] text-gray-600 font-medium uppercase">{cat}: {formatCurrency(weeklyNeedToPay[cat])}</span>
                 </div>
               ))}
             </div>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-white border-b border-gray-200 text-[10px] uppercase tracking-wider text-gray-500">
              <th className="p-3 md:p-4 font-semibold text-left">Vendor</th>
              <th className="p-3 md:p-4 font-semibold">Current</th>
              <th className="p-3 md:p-4 font-semibold">1-30d</th>
              <th className="p-3 md:p-4 font-semibold">31-60d</th>
              <th className="p-3 md:p-4 font-semibold">61-90d</th>
              <th className="p-3 md:p-4 font-semibold">&gt; 90d</th>
              <th className="p-3 md:p-4 font-bold bg-gray-50">Total</th>
              <th className="p-3 md:p-4 text-center bg-gray-50">Email</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {vendorAging.map((v: any, i: number) => (
              <tr key={i} className="hover:bg-gray-50 text-xs transition-colors">
                <td className="p-3 md:p-4 text-left font-medium text-gray-900">{v.name}</td>
                <td className="p-3 md:p-4 text-gray-400">{v['Current'] > 0 ? formatCurrency(v['Current']) : '-'}</td>
                <td className="p-3 md:p-4 text-gray-400">{v['1-30 Days'] > 0 ? formatCurrency(v['1-30 Days']) : '-'}</td>
                <td className="p-3 md:p-4 text-gray-400">{v['31-60 Days'] > 0 ? formatCurrency(v['31-60 Days']) : '-'}</td>
                <td className="p-3 md:p-4 text-gray-400">{v['61-90 Days'] > 0 ? formatCurrency(v['61-90 Days']) : '-'}</td>
                <td className="p-3 md:p-4 text-rose-600 font-bold">{v['> 90 Days'] > 0 ? formatCurrency(v['> 90 Days']) : '-'}</td>
                <td className="p-3 md:p-4 font-bold bg-gray-50/50">{formatCurrency(v.total)}</td>
                <td className="p-3 md:p-4 text-center bg-gray-50/50"><button onClick={() => draftVendorEmail(v)} className="text-indigo-600 hover:text-indigo-900 transition-colors p-2"><Mail size={16}/></button></td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-100 border-t-2 border-gray-200 font-bold text-xs">
            <tr>
              <td className="p-3 md:p-4 text-left">GRAND TOTAL</td>
              <td className="p-3 md:p-4">{formatCurrency(agingSummary['Current'])}</td>
              <td className="p-3 md:p-4">{formatCurrency(agingSummary['1-30 Days'])}</td>
              <td className="p-3 md:p-4">{formatCurrency(agingSummary['31-60 Days'])}</td>
              <td className="p-3 md:p-4">{formatCurrency(agingSummary['61-90 Days'])}</td>
              <td className="p-3 md:p-4 text-rose-700">{formatCurrency(agingSummary['> 90 Days'])}</td>
              <td className="p-3 md:p-4 text-lg bg-slate-900 text-white">{formatCurrency(totalOutstanding)}</td>
              <td className="bg-slate-900"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden w-full relative">
      {isMobileMenuOpen && <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm md:hidden" onClick={() => setIsMobileMenuOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col shadow-2xl md:shadow-xl transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex justify-between items-center border-b border-slate-800">
          <h1 className="text-xl font-bold text-white flex items-center"><TrendingUp className="mr-3 text-blue-500" /> ProcureDesk</h1>
          <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}><X size={24} /></button>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-6 overflow-y-auto">
          <button onClick={() => handleTabSwitch('dashboard')} className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}><LayoutDashboard className="mr-3" size={20} /> Dashboard</button>
          <button onClick={() => handleTabSwitch('purchases')} className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${activeTab === 'purchases' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}><ShoppingCart className="mr-3" size={20} /> Purchase Orders</button>
          <button onClick={() => handleTabSwitch('apvs')} className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${activeTab === 'apvs' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}><FileText className="mr-3" size={20} /> APV Records</button>
          <button onClick={() => handleTabSwitch('aging')} className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${activeTab === 'aging' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}><Clock className="mr-3" size={20} /> Aging Analysis</button>
        </nav>
        <div className="p-6 bg-slate-950 mt-auto">
          {isAdmin ? (
            <div className="space-y-3">
              <button onClick={() => { setIsClearModalOpen(true); setIsMobileMenuOpen(false); }} className="w-full flex items-center justify-center px-4 py-2 bg-slate-800 hover:bg-red-900/40 text-slate-400 rounded-lg transition-colors text-xs font-bold uppercase"><Trash2 size={16} className="mr-2" /> Wipe Data</button>
              <button onClick={() => setIsAdmin(false)} className="w-full flex items-center justify-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors text-xs font-bold uppercase"><Lock size={16} className="mr-2" /> Logout Admin</button>
            </div>
          ) : (
            <button onClick={() => { setShowAdminLogin(true); setIsMobileMenuOpen(false); }} className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 rounded-lg transition-colors text-xs font-bold uppercase"><Unlock size={16} className="mr-2" /> Super User</button>
          )}
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto relative w-full flex flex-col">
        <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-3 md:py-5 sticky top-0 z-10 flex justify-between items-center shadow-sm">
          <div className="flex items-center">
            <button className="md:hidden mr-3 text-slate-600" onClick={() => setIsMobileMenuOpen(true)}><Menu size={24} /></button>
            <h2 className="text-lg md:text-2xl font-bold text-gray-800 capitalize">{activeTab.replace('-', ' ')}</h2>
          </div>
          <div className="flex items-center space-x-2 text-[10px] md:text-xs">
            {isAdmin ? <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg border border-emerald-100 flex items-center font-bold uppercase tracking-tight"><Check size={12} className="mr-1"/> Super User Mode</span> : <span className="bg-slate-50 text-slate-600 px-2 py-1 rounded-lg border border-slate-200 flex items-center font-bold uppercase tracking-tight"><Lock size={12} className="mr-1"/> Viewer Mode</span>}
          </div>
        </header>
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full flex-1">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'purchases' && renderPurchases()}
          {activeTab === 'apvs' && renderAPVs()}
          {activeTab === 'aging' && renderAgingReport()}
        </div>
      </main>

      {/* Modals */}
      {showAdminLogin && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50"><h3 className="font-semibold text-gray-900 flex items-center"><Unlock size={18} className="mr-2 text-indigo-600"/> Super User Access</h3><button onClick={() => setShowAdminLogin(false)}><X size={20} className="text-gray-400"/></button></div>
            <form onSubmit={handleAdminLoginSubmit} className="p-6 space-y-4">
              <input type="password" autoFocus placeholder="Enter Passcode" value={adminPassword} onChange={e => {setAdminPassword(e.target.value); setAdminError(false);}} className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 ${adminError ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'}`} />
              <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-colors">Unlock Dashboard</button>
            </form>
          </div>
        </div>
      )}

      {emailModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50"><h3 className="font-semibold text-gray-900 flex items-center"><Mail size={16} className="mr-2 text-indigo-600" /> Draft for {selectedVendor}</h3><button onClick={() => setEmailModalOpen(false)}><X size={20} /></button></div>
            <div className="p-6 bg-white flex-1 overflow-y-auto">
              {isDraftingEmail ? <div className="flex flex-col items-center justify-center py-12"><Loader2 size={32} className="animate-spin text-indigo-600 mb-4" /><p className="font-medium text-gray-700">Gemini is drafting your message...</p></div> : <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 text-gray-800 whitespace-pre-wrap text-sm leading-relaxed">{currentEmailDraft}</div>}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3">
              <button onClick={handleCopy} className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold flex items-center transition-colors hover:bg-indigo-700">{copySuccess ? <Check size={16} className="mr-2" /> : <Copy size={16} className="mr-2" />} {copySuccess ? 'Copied' : 'Copy Content'}</button>
            </div>
          </div>
        </div>
      )}

      {isPoModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[95vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50"><h3 className="font-semibold text-gray-900">Add Purchase Order</h3><button onClick={() => setIsPoModalOpen(false)}><X size={20} /></button></div>
            <form onSubmit={handleAddPo} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <input required type="text" placeholder="PO Number" value={newPo.id} onChange={e => setNewPo({...newPo, id: e.target.value})} className="w-full px-4 py-2.5 border rounded-lg text-sm" />
                <input required type="date" value={newPo.date} onChange={e => setNewPo({...newPo, date: e.target.value})} className="w-full px-4 py-2.5 border rounded-lg text-sm" />
              </div>
              <input required type="text" placeholder="Vendor" value={newPo.vendor} onChange={e => setNewPo({...newPo, vendor: e.target.value})} className="w-full px-4 py-2.5 border rounded-lg text-sm" />
              <input required type="number" placeholder="Amount" value={newPo.amount} onChange={e => setNewPo({...newPo, amount: e.target.value})} className="w-full px-4 py-2.5 border rounded-lg text-sm" />
              <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold">Save PO</button>
            </form>
          </div>
        </div>
      )}

      {isPayApvModalOpen && selectedApvToPay && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col border-t-4 border-emerald-500">
            <div className="px-6 py-4 border-b border-gray-100 bg-emerald-50 text-emerald-900 font-bold">Confirm Settlement</div>
            <form onSubmit={handlePayApv} className="p-6 space-y-4">
              <p className="text-sm text-gray-600">Settling payment for <strong>{selectedApvToPay.id}</strong> amounting to {formatCurrency(selectedApvToPay.amount)}.</p>
              <input required type="date" value={settleDate} onChange={e => setSettleDate(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
              <button type="submit" className="w-full py-3 bg-emerald-600 text-white rounded-lg font-bold">Execute Payment</button>
            </form>
          </div>
        </div>
      )}

      {isFundModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 bg-slate-50 font-bold">Update Weekly Allocation</div>
            <form onSubmit={handleUpdateFund} className="p-6 space-y-4">
              <input required type="number" placeholder="Enter amount" value={editFundAmount} onChange={e => setEditFundAmount(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
              <button type="submit" className="w-full py-3 bg-slate-800 text-white rounded-lg font-bold">Set Fund</button>
            </form>
          </div>
        </div>
      )}

      {isReceiveModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6">
            <h3 className="font-bold mb-4">Mark as Received</h3>
            <input type="date" value={receiveDate} onChange={e => setReceiveDate(e.target.value)} className="w-full p-2 border rounded mb-4" />
            <button onClick={handleReceivePo} className="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold">Confirm</button>
          </div>
        </div>
      )}

      {isClearModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
            <h3 className="font-bold mb-2">Wipe Database?</h3>
            <p className="text-sm text-gray-500 mb-6">This will delete all PO and APV records permanently.</p>
            <div className="flex space-x-3">
              <button onClick={() => setIsClearModalOpen(false)} className="flex-1 py-2 bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleClearAllData} className="flex-1 py-2 bg-red-600 text-white rounded-lg">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
