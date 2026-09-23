import React, { useState, useEffect, useRef } from 'react';
import TopNavbar from './components/TopNavbar';
import LoginPage from './components/LoginPage';
import DashboardView from './components/DashboardView';
import PenebusanView from './components/PenebusanView';
import PengeluaranDoView from './components/PengeluaranDoView';
import PenyaluranKiosView from './components/PenyaluranKiosView';
import PembayaranKiosView from './components/PembayaranKiosView';
import StokMutasiView from './components/StokMutasiView';
import MasterDataView from './components/MasterDataView';
import LaporanView from './components/LaporanView';
import SettingsView from './components/SettingsView';
import DaftarProdukView from './components/DaftarProdukView';
import KasAngkutanView from './components/KasAngkutanView';
import KasUmumView from './components/KasUmumView';
import ModalTransaction from './components/ModalTransaction';
import PrintPreviewModal from './components/PrintPreviewModal';
import ModalNotification from './components/ModalNotification';
import ImportProgressModal from './components/ImportProgressModal';
import SyncProgressModal from './components/SyncProgressModal';
import { syncDataToTurso, fetchDataFromTurso, syncPartialDataToTurso } from './services/tursoService';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '30px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', margin: '20px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 800 }}>⚠️ Terjadi Kesalahan Tampilan pada Modul Ini</h3>
          <p style={{ fontFamily: 'monospace', fontSize: '13px', backgroundColor: '#ffffff', padding: '12px', borderRadius: '4px', border: '1px solid #fee2e2', color: '#dc2626' }}>
            {this.state.error && this.state.error.toString()}
          </p>
          <button className="btn-primary" onClick={() => this.setState({ hasError: false, error: null })}>Muat Ulang Modul</button>
        </div>
      );
    }
    return this.props.children;
  }
}

import {
  DEFAULT_SETTINGS,
  DEFAULT_USERS,
  DEFAULT_FERTILIZERS,
  DEFAULT_SUPPLIERS,
  DEFAULT_DRIVERS,
  DEFAULT_KIOSKS,
  DEFAULT_PENEBUSAN,
  DEFAULT_DO_EXPENSES,
  DEFAULT_PENYALURAN_KIOS,
  DEFAULT_PAYMENTS,
  DEFAULT_KAS_ANGKUTAN,
  DEFAULT_KAS_UMUM
} from './data/initialData';
import { 
  normalizeAllData, 
  normalizeKasUmumList,
  normalizePenebusanList,
  normalizeDoList,
  normalizePenyaluranList,
  normalizeKasAngkutanList,
  normalizePayments,
  normalizeKiosks,
  normalizeSuppliers,
  normalizeDrivers,
  normalizeFertilizers
} from './utils/dataNormalizer';
import { getPenyaluranPaymentStats } from './utils/paymentStats';


const LOCAL_STORAGE_KEY = 'tani_makmur_baru_db_clean_v6';
const SESSION_KEY = 'tani_makmur_baru_session';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('tani_makmur_last_tab') || 'dashboard');
  const [selectedBranch, setSelectedBranch] = useState('ALL');

  // Persist last opened tab on browser reload
  useEffect(() => {
    if (activeTab) {
      localStorage.setItem('tani_makmur_last_tab', activeTab);
    }
  }, [activeTab]);

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [usersList, setUsersList] = useState(DEFAULT_USERS);
  const [fertilizers, setFertilizers] = useState(DEFAULT_FERTILIZERS);
  const [suppliers, setSuppliers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [kiosks, setKiosks] = useState([]);
  const [penebusanList, setPenebusanList] = useState([]);
  const [doList, setDoList] = useState([]);
  const [penyaluranList, setPenyaluranList] = useState([]);
  const [payments, setPayments] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [kasAngkutanList, setKasAngkutanList] = useState([]);
  const [kasUmumList, setKasUmumList] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);

  const [isTrxModalOpen, setIsTrxModalOpen] = useState(false);
  const [trxFormType, setTrxFormType] = useState('penebusan');
  const [editingItem, setEditingItem] = useState(null);
  const [initialPenebusanId, setInitialPenebusanId] = useState('');
  const [initialDoRefId, setInitialDoRefId] = useState('');

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printData, setPrintData] = useState(null);
  const [printType, setPrintType] = useState('');

  const [confirmConfig, setConfirmConfig] = useState(null);

  const [importModalState, setImportModalState] = useState({
    isOpen: false,
    moduleName: '',
    fileName: '',
    data: null,
    totalRows: 0,
    stage: 'preview',
    percent: 0,
    message: '',
    batchInfo: '',
    error: null,
    summary: null
  });

  const [tursoSyncState, setTursoSyncState] = useState({
    status: 'idle',
    lastSyncedAt: null,
    errorMessage: null
  });
  const [syncModalState, setSyncModalState] = useState({
    isOpen: false,
    stage: 'syncing',
    title: 'Sinkronisasi Pembayaran ke Turso',
    message: '',
    details: null
  });
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const isSyncingRef = useRef(false);

  // Restore session on first load
  useEffect(() => {
    const savedSession = sessionStorage.getItem(SESSION_KEY);
    if (savedSession) {
      try {
        setCurrentUser(JSON.parse(savedSession));
      } catch {}
    }
  }, []);

  const loadLocalData = () => {
    const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setSettings(parsed.settings || DEFAULT_SETTINGS);
        setUsersList(parsed.usersList && parsed.usersList.length > 0 ? parsed.usersList : DEFAULT_USERS);
        setFertilizers(parsed.fertilizers || DEFAULT_FERTILIZERS);
        setSuppliers(parsed.suppliers || []);
        setDrivers(parsed.drivers || []);
        setKiosks(parsed.kiosks || []);
        setPenebusanList(Array.isArray(parsed.penebusanList) ? parsed.penebusanList : []);
        setDoList(Array.isArray(parsed.doList) ? parsed.doList : []);
        setPenyaluranList(Array.isArray(parsed.penyaluranList) ? parsed.penyaluranList : []);
        setPayments(Array.isArray(parsed.payments) ? parsed.payments : []);
        setDeposits(Array.isArray(parsed.deposits) ? parsed.deposits : []);
        setKasAngkutanList(Array.isArray(parsed.kasAngkutanList) ? parsed.kasAngkutanList : []);
        setKasUmumList(normalizeKasUmumList(Array.isArray(parsed.kasUmumList) ? parsed.kasUmumList : []));
        setActivityLogs(Array.isArray(parsed.activityLogs) ? parsed.activityLogs : []);
        if (parsed.activeTab) setActiveTab(parsed.activeTab);
        if (parsed.selectedBranch && currentUser?.role !== 'admin') setSelectedBranch(parsed.selectedBranch);
        setIsDataLoaded(true);
      } catch {
        loadDefaults();
      }
    } else {
      loadDefaults();
    }
  };

  const pullDataFromTurso = async (isSilent = false) => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    if (!isSilent) {
      setTursoSyncState(prev => ({ ...prev, status: 'syncing' }));
    }

    try {
      const res = await fetchDataFromTurso();
      if (res && res.success && res.data) {
        const d = res.data;

        // Turso Cloud is the Single Source of Truth:
        // Transaction tables in web directly mirror Turso. An empty table is []!
        const rawPen = Array.isArray(d.penebusanList) ? d.penebusanList : [];
        const rawDO = Array.isArray(d.doList) ? d.doList : [];
        const rawSalur = Array.isArray(d.penyaluranList) ? d.penyaluranList : [];

        // ── Cross-module enrichment ──
        // When DO/Penyaluran rows come from Turso with minimal data (e.g. only noDo+qty),
        // backfill fertilizerName, branch, etc. from the linked penebusan record.
        const newPen = rawPen;
        const newDO = normalizeDoList(rawDO, rawPen);
        const newPay = Array.isArray(d.payments) ? d.payments : [];
        const rawNormalizedSalur = normalizePenyaluranList(rawSalur, rawPen, rawDO);
        const newSalur = rawNormalizedSalur.map(item => {
          const stats = getPenyaluranPaymentStats(item, newPay);
          return {
            ...item,
            paymentStatus: stats.statusDisplay,
            remainingAmount: stats.sisa,
            kurangBayar: stats.sisa,
            dpAmount: stats.terbayar,
            paidAmount: stats.terbayar,
            keterangan: stats.statusDisplay === 'Lunas' ? 'LUNAS' : 'BELUM LUNAS'
          };
        });
        const newDep = Array.isArray(d.deposits) ? d.deposits : [];
        const newKasAngkut = Array.isArray(d.kasAngkutanList) ? d.kasAngkutanList : [];
        const newKasUmum = Array.isArray(d.kasUmumList) ? normalizeKasUmumList(d.kasUmumList) : [];
        const newLogs = Array.isArray(d.activityLogs) ? d.activityLogs : [];

        // Master data
        const newSet = (d.settings && Object.keys(d.settings).length > 0) ? d.settings : settings;
        const newUsers = (d.usersList && d.usersList.length > 0) ? d.usersList : usersList;
        const newFert = (d.fertilizers && d.fertilizers.length > 0) ? d.fertilizers : fertilizers;
        const newSup = (d.suppliers && d.suppliers.length > 0) ? d.suppliers : suppliers;
        const newDrv = (d.drivers && d.drivers.length > 0) ? d.drivers : drivers;
        const newKios = (d.kiosks && d.kiosks.length > 0) ? d.kiosks : kiosks;

        setPenebusanList(newPen);
        setDoList(newDO);
        setPenyaluranList(newSalur);
        setPayments(newPay);
        setDeposits(newDep);
        setKasAngkutanList(newKasAngkut);
        setKasUmumList(newKasUmum);
        setActivityLogs(newLogs);

        if (d.settings && Object.keys(d.settings).length > 0) setSettings(newSet);
        if (d.usersList && d.usersList.length > 0) setUsersList(newUsers);
        if (d.fertilizers && d.fertilizers.length > 0) setFertilizers(newFert);
        if (d.suppliers && d.suppliers.length > 0) setSuppliers(newSup);
        if (d.drivers && d.drivers.length > 0) setDrivers(newDrv);
        if (d.kiosks && d.kiosks.length > 0) setKiosks(newKios);

        // Keep local storage cache up-to-date with Turso
        const payloadToCache = {
          settings: newSet,
          usersList: newUsers,
          fertilizers: newFert,
          suppliers: newSup,
          kiosks: newKios,
          penebusanList: newPen,
          doList: newDO,
          penyaluranList: newSalur,
          payments: newPay,
          deposits: newDep,
          drivers: newDrv,
          kasAngkutanList: newKasAngkut,
          kasUmumList: newKasUmum,
          activityLogs: newLogs,
          lastSavedAt: new Date().toISOString()
        };
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payloadToCache));
        } catch (e) {
          console.warn('Gagal update local cache:', e);
        }

        setTursoSyncState({
          status: 'connected',
          lastSyncedAt: new Date(),
          errorMessage: null
        });
        setIsDataLoaded(true);
      }
    } catch (err) {
      console.warn('⚠️ [Realtime Turso] Gagal sinkronisasi:', err.message);
      setTursoSyncState(prev => ({
        status: 'error',
        lastSyncedAt: prev.lastSyncedAt,
        errorMessage: err.message
      }));
      if (!isDataLoaded) {
        loadLocalData();
      }
    } finally {
      isSyncingRef.current = false;
    }
  };

  const handleManualSync = async (customTitle = 'Sinkronisasi Turso Cloud') => {
    setTursoSyncState(prev => ({ ...prev, status: 'syncing' }));
    setSyncModalState({
      isOpen: true,
      stage: 'syncing',
      title: customTitle,
      message: 'Mengunduh dan menyinkronkan seluruh data transaksi terbaru dari Turso Cloud...',
      details: null
    });

    try {
      await pullDataFromTurso(true);
      setSyncModalState({
        isOpen: true,
        stage: 'completed',
        title: `${customTitle} Berhasil`,
        message: 'Seluruh data transaksi dan master di semua halaman telah berhasil disinkronkan dengan Turso Cloud.',
        details: {
          info: `Waktu Sinkron: ${new Date().toLocaleTimeString('id-ID')}`
        }
      });
    } catch (err) {
      setSyncModalState({
        isOpen: true,
        stage: 'error',
        title: `${customTitle} Terkendala`,
        message: err.message || 'Gagal menyinkronkan data ke Turso Cloud.',
        details: null
      });
    }
  };

  // Realtime Polling & Focus/Visibility Synchronization
  useEffect(() => {
    if (!currentUser) return;

    if (currentUser.role === 'admin' && currentUser.branch !== 'ALL') {
      setSelectedBranch(currentUser.branch);
    }

    // 1. Initial pull from Turso
    pullDataFromTurso(false);

    // 2. Poll every 8 seconds when document is visible
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        pullDataFromTurso(true);
      }
    }, 8000);

    // 3. Sync immediately when tab is focused
    const handleFocus = () => {
      pullDataFromTurso(true);
    };

    // 4. Sync immediately when switching tabs back
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        pullDataFromTurso(true);
      }
    };

    // 5. Sync when back online
    const handleOnline = () => {
      pullDataFromTurso(false);
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, [currentUser]);

  const saveData = (
    newSet = settings,
    newFert = fertilizers,
    newSup = suppliers,
    newKios = kiosks,
    newPen = penebusanList,
    newDO = doList,
    newSalur = penyaluranList,
    newPay = payments,
    newDep = deposits,
    newDrv = drivers,
    newUsers = usersList,
    newLogs = activityLogs,
    newTab = activeTab,
    newBranch = selectedBranch,
    newKasAngkut = kasAngkutanList,
    newKasUmum = kasUmumList,
    syncOptions = null
  ) => {
    const payload = {
      settings: newSet,
      usersList: newUsers,
      fertilizers: newFert,
      suppliers: newSup,
      kiosks: newKios,
      penebusanList: newPen,
      doList: newDO,
      penyaluranList: newSalur,
      payments: newPay,
      deposits: newDep,
      drivers: newDrv,
      kasAngkutanList: newKasAngkut,
      kasUmumList: newKasUmum,
      activityLogs: newLogs,
      activeTab: newTab,
      selectedBranch: newBranch,
      lastSavedAt: new Date().toISOString()
    };
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
      if (isDataLoaded) {
        setTursoSyncState(prev => ({ ...prev, status: 'syncing' }));

        const showModal = syncOptions?.showModal === true;
        if (showModal) {
          setSyncModalState({
            isOpen: true,
            stage: 'syncing',
            title: syncOptions?.title || 'Sinkronisasi Data ke Turso',
            message: syncOptions?.message || 'Menyimpan perubahan dan menyinkronkan data ke Cloud Database Turso...',
            details: null
          });
        }

        const changedTables = [];
        if (newSet !== settings) changedTables.push('settings');
        if (newUsers !== usersList) changedTables.push('users');
        if (newFert !== fertilizers) changedTables.push('fertilizers');
        if (newSup !== suppliers) changedTables.push('suppliers');
        if (newKios !== kiosks) changedTables.push('kiosks');
        if (newPen !== penebusanList) changedTables.push('penebusan');
        if (newDO !== doList) changedTables.push('do_expenses');
        if (newSalur !== penyaluranList) changedTables.push('penyaluran');
        if (newPay !== payments) changedTables.push('payments');
        if (newDep !== deposits) changedTables.push('deposits');
        if (newDrv !== drivers) changedTables.push('drivers');
        if (newKasAngkut !== kasAngkutanList) changedTables.push('kas_angkutan');
        if (newKasUmum !== kasUmumList) changedTables.push('kas_umum');
        if (newLogs !== activityLogs) changedTables.push('activity_logs');

        syncDataToTurso(payload, {}, changedTables)
          .then(() => {
            setTursoSyncState({
              status: 'connected',
              lastSyncedAt: new Date(),
              errorMessage: null
            });
            if (showModal) {
              setSyncModalState({
                isOpen: true,
                stage: 'completed',
                title: syncOptions?.title ? `${syncOptions.title} Berhasil` : 'Sinkronisasi Berhasil',
                message: syncOptions?.successMessage || 'Perubahan data berhasil disimpan dan disinkronkan ke Turso Cloud.',
                details: syncOptions?.details || {
                  info: `Waktu Sinkron: ${new Date().toLocaleTimeString('id-ID')}`
                }
              });
            }
          })
          .catch((err) => {
            console.log('Turso background sync:', err.message);
            setTursoSyncState(prev => ({
              status: 'error',
              lastSyncedAt: prev.lastSyncedAt,
              errorMessage: err.message
            }));
            if (showModal) {
              setSyncModalState({
                isOpen: true,
                stage: 'error',
                title: 'Sinkronisasi Terkendala',
                message: `Perubahan tersimpan di lokal. Sinkronisasi Turso terkendala: ${err.message}`,
                details: null
              });
            }
          });
      }
    } catch (e) {
      console.error('Gagal menyimpan ke database lokal:', e);
    }
  };

  const saveLocalOnly = (payloadOverrides = {}) => {
    const payload = {
      settings, usersList, fertilizers, suppliers, kiosks,
      penebusanList, doList, penyaluranList, payments, deposits,
      drivers, kasAngkutanList, kasUmumList, activityLogs,
      activeTab, selectedBranch,
      ...payloadOverrides,
      lastSavedAt: new Date().toISOString()
    };
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error('Gagal menyimpan ke database lokal (local only):', e);
    }
  };

  const logActionAndSave = (actionType, details, overrides = {}, syncOptions = null) => {
    const logEntry = {
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      timestamp: new Date().toISOString(),
      user: currentUser?.name || currentUser?.username || 'Sistem',
      role: currentUser?.role || '-',
      action: actionType,
      details
    };
    const updatedLogs = [logEntry, ...(overrides.newLogs || activityLogs)].slice(0, 500);
    setActivityLogs(updatedLogs);

    const resolvedSyncOptions = syncOptions || {
      title: `Sinkronisasi ${actionType.replace(/_/g, ' ')}`,
      message: `Menyimpan data dan menyinkronkan perubahan ke Cloud Turso...`,
      successMessage: `Data berhasil disimpan dan disinkronkan ke Turso Cloud.`
    };

    saveData(
      overrides.newSet || settings,
      overrides.newFert || fertilizers,
      overrides.newSup || suppliers,
      overrides.newKios || kiosks,
      overrides.newPen || penebusanList,
      overrides.newDO || doList,
      overrides.newSalur || penyaluranList,
      overrides.newPay || payments,
      overrides.newDep || deposits,
      overrides.newDrv || drivers,
      overrides.newUsers || usersList,
      updatedLogs,
      overrides.newTab || activeTab,
      overrides.newBranch || selectedBranch,
      overrides.newKasAngkut || kasAngkutanList,
      overrides.newKasUmum || kasUmumList,
      resolvedSyncOptions
    );
  };

  const loadDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    setUsersList(DEFAULT_USERS);
    setFertilizers(DEFAULT_FERTILIZERS);
    setSuppliers(DEFAULT_SUPPLIERS);
    setDrivers(DEFAULT_DRIVERS);
    setKiosks(DEFAULT_KIOSKS);
    setPenebusanList([]);
    setDoList([]);
    setPenyaluranList([]);
    setPayments([]);
    setDeposits([]);
    setKasAngkutanList([]);
    setKasUmumList([]);
    setIsDataLoaded(true);
    saveLocalOnly({
      settings: DEFAULT_SETTINGS,
      fertilizers: DEFAULT_FERTILIZERS,
      suppliers: DEFAULT_SUPPLIERS,
      kiosks: DEFAULT_KIOSKS,
      penebusanList: [],
      doList: [],
      penyaluranList: [],
      payments: [],
      deposits: [],
      drivers: DEFAULT_DRIVERS,
      usersList: DEFAULT_USERS,
      activityLogs: [],
      kasAngkutanList: [],
      kasUmumList: []
    });
  };

  const handleSaveUsers = (newUsers) => {
    setUsersList(newUsers);
    saveData(settings, fertilizers, suppliers, kiosks, penebusanList, doList, penyaluranList, payments, deposits, drivers, newUsers);
  };

  const handleImportAllData = (rawImportedData) => {
    if (!rawImportedData || typeof rawImportedData !== 'object') return false;

    const normalized = normalizeAllData(rawImportedData);

    const newSet = { ...settings, ...(rawImportedData.settings || {}) };
    const newUsers = normalized.usersList && normalized.usersList.length > 0 ? normalized.usersList : usersList;
    const newFert = normalized.fertilizers && normalized.fertilizers.length > 0 ? normalized.fertilizers : fertilizers;
    const newSup = normalized.suppliers && normalized.suppliers.length > 0 ? normalized.suppliers : suppliers;
    const newDrv = normalized.drivers && normalized.drivers.length > 0 ? normalized.drivers : drivers;
    const newKios = normalized.kiosks && normalized.kiosks.length > 0 ? normalized.kiosks : kiosks;
    const newPen = Array.isArray(normalized.penebusanList) ? normalized.penebusanList : [];
    const newDO = Array.isArray(normalized.doList) ? normalized.doList : [];
    const newSalur = Array.isArray(normalized.penyaluranList) ? normalized.penyaluranList : [];
    const newPay = Array.isArray(normalized.payments) ? normalized.payments : [];
    const newKasAngkut = Array.isArray(normalized.kasAngkutanList) ? normalized.kasAngkutanList : [];
    const newKasUmum = Array.isArray(normalized.kasUmumList) ? normalized.kasUmumList : [];

    setSettings(newSet);
    setUsersList(newUsers);
    setFertilizers(newFert);
    setSuppliers(newSup);
    setDrivers(newDrv);
    setKiosks(newKios);
    setPenebusanList(newPen);
    setDoList(newDO);
    setPenyaluranList(newSalur);
    setPayments(newPay);
    setDeposits(newDep);
    setKasAngkutanList(newKasAngkut);
    setKasUmumList(newKasUmum);

    saveData(newSet, newFert, newSup, newKios, newPen, newDO, newSalur, newPay, newDep, newDrv, newUsers, activityLogs, activeTab, selectedBranch, newKasAngkut, newKasUmum);
    return true;
  };

  const handleImportModuleData = (moduleName, data, fileName = '') => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      alert('Data pada file Excel/CSV kosong atau tidak dapat dibaca.');
      return;
    }
    setImportModalState({
      isOpen: true,
      moduleName,
      fileName: fileName || `${moduleName}.csv`,
      data,
      totalRows: data.length,
      stage: 'preview',
      percent: 0,
      message: `Ditemukan ${data.length} baris data siap diimport.`,
      batchInfo: '',
      error: null,
      summary: null
    });
  };

  const handleExecuteImport = async (mode) => {
    const { moduleName, data, fileName } = importModalState;
    if (!data || !Array.isArray(data) || data.length === 0) return;

    setImportModalState(prev => ({
      ...prev,
      stage: 'uploading',
      percent: 10,
      message: 'Mempersiapkan data dan memeriksa relasi...',
      batchInfo: 'Memulai proses upload ke Turso Cloud...'
    }));

    try {
      let processedData = [];

      if (moduleName === 'penebusan') {
        processedData = normalizePenebusanList(data, doList, penyaluranList);
      } else if (moduleName === 'pengeluaran_do') {
        processedData = normalizeDoList(data, penebusanList);
      } else if (moduleName === 'penyaluran_kios') {
        processedData = normalizePenyaluranList(data, penebusanList, doList);
      } else if (moduleName === 'payments') {
        processedData = normalizePayments(data);
      } else if (moduleName === 'kas_angkutan') {
        processedData = normalizeKasAngkutanList(data);
      } else if (moduleName === 'kas_umum') {
        processedData = normalizeKasUmumList(data);
      } else if (moduleName === 'fertilizers') {
        processedData = normalizeFertilizers(data);
      } else if (moduleName === 'kiosks') {
        processedData = normalizeKiosks(data);
      } else if (moduleName === 'suppliers') {
        processedData = normalizeSuppliers(data);
      } else if (moduleName === 'drivers') {
        processedData = normalizeDrivers(data);
      } else {
        processedData = data.map((item, idx) => ({
          ...item,
          id: item.id || `${moduleName.toUpperCase()}-${Date.now()}-${idx}`
        }));
      }

      const moduleToTableMap = {
        'penebusan': 'penebusan',
        'pengeluaran_do': 'do_expenses',
        'penyaluran_kios': 'penyaluran',
        'payments': 'payments',
        'deposits': 'deposits',
        'kas_angkutan': 'kas_angkutan',
        'kas_umum': 'kas_umum',
        'fertilizers': 'fertilizers',
        'kiosks': 'kiosks',
        'suppliers': 'suppliers',
        'drivers': 'drivers'
      };
      const tableName = moduleToTableMap[moduleName] || moduleName;

      await syncPartialDataToTurso(tableName, processedData, mode, {}, (progress) => {
        setImportModalState(prev => ({
          ...prev,
          percent: progress.percent,
          message: progress.message,
          batchInfo: progress.batchInfo || ''
        }));
      });

      // Sinkronisasi realtime
      setImportModalState(prev => ({
        ...prev,
        percent: 98,
        message: 'Menyinkronkan data aplikasi secara realtime...',
        batchInfo: 'Memperbarui tampilan'
      }));

      await pullDataFromTurso(false);

      setImportModalState(prev => ({
        ...prev,
        stage: 'completed',
        percent: 100,
        message: 'Upload selesai!',
        summary: {
          totalItems: processedData.length,
          tableName,
          mode
        }
      }));

    } catch (err) {
      console.error('Error during handleExecuteImport:', err);
      setImportModalState(prev => ({
        ...prev,
        stage: 'error',
        error: err.message || 'Terjadi kesalahan saat mengunggah data ke Turso.'
      }));
    }
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  };

  const handleLogout = () => {
    setConfirmConfig({
      title: 'Konfirmasi Keluar Akses',
      variant: 'warning',
      message: 'Apakah Anda yakin ingin keluar dari akun Anda?',
      confirmText: 'Ya, Keluar Akun',
      onConfirm: () => {
        setCurrentUser(null);
        sessionStorage.removeItem(SESSION_KEY);
        setActiveTab('dashboard');
        setConfirmConfig(null);
      }
    });
  };

  const handleSetBranch = (branch) => {
    if (currentUser?.role === 'admin') return; // Locked
    setSelectedBranch(branch);
  };

  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
    saveData(newSettings, fertilizers, suppliers, kiosks, penebusanList, doList, penyaluranList, payments, deposits, drivers);
  };

  const handleAddFertilizer = (newProd) => {
    const updated = [...fertilizers, newProd];
    setFertilizers(updated);
    saveData(settings, updated, suppliers, kiosks, penebusanList, doList, penyaluranList, payments, deposits, drivers);
  };

  const handleEditFertilizer = (updatedProd) => {
    const updated = fertilizers.map(f => f.id === updatedProd.id ? updatedProd : f);
    setFertilizers(updated);
    saveData(settings, updated, suppliers, kiosks, penebusanList, doList, penyaluranList, payments, deposits, drivers);
  };

  const handleDeleteFertilizer = (id) => {
    setConfirmConfig({
      title: 'Konfirmasi Hapus Produk',
      variant: 'danger',
      message: 'Apakah Anda yakin ingin menghapus produk pupuk ini?',
      confirmText: 'Ya, Hapus Produk',
      onConfirm: () => {
        const updated = fertilizers.filter(f => f.id !== id);
        setFertilizers(updated);
        saveData(settings, updated, suppliers, kiosks, penebusanList, doList, penyaluranList, payments, deposits, drivers);
        setConfirmConfig(null);
      }
    });
  };

  const handleOpenNewTransaction = (type = 'penebusan') => {
    setEditingItem(null);
    setInitialPenebusanId('');
    setInitialDoRefId('');
    setTrxFormType(type);
    setIsTrxModalOpen(true);
  };

  const handleOpenEditItem = (type, item) => {
    setEditingItem(item);
    setInitialPenebusanId('');
    setInitialDoRefId('');
    setTrxFormType(type);
    setIsTrxModalOpen(true);
  };

  const handleOpenNextStage = (nextStageType, parentItem) => {
    setEditingItem(null);
    setTrxFormType(nextStageType);
    if (nextStageType === 'do') {
      setInitialPenebusanId(parentItem.id);
    } else if (nextStageType === 'penyaluran') {
      setInitialDoRefId(parentItem.id);
    }
    setIsTrxModalOpen(true);
  };

  const handleSaveItem = (type, item, isEdit = false) => {
    let s = [...suppliers], k = [...kiosks], p = [...penebusanList], d = [...doList], sl = [...penyaluranList], drv = [...drivers];
    let ka = [...kasAngkutanList];
    let ku = [...kasUmumList];

    if (type === 'penebusan') {
      p = isEdit ? p.map(x => x.id === item.id ? item : x) : [item, ...p];
      setPenebusanList(p);
    } else if (type === 'do') {
      d = isEdit ? d.map(x => x.id === item.id ? item : x) : [item, ...d];
      setDoList(d);
    } else if (type === 'penyaluran') {
      sl = isEdit ? sl.map(x => x.id === item.id ? item : x) : [item, ...sl];
      setPenyaluranList(sl);

      if (!isEdit && item) {
        const bName = (item.branch || 'MAGETAN').toUpperCase();
        const refNo = item.penyaluranNo || item.nomorPenyaluran || item.doNo || item.id;
        const qty = Number(item.qtyTon || item.qty || 0);
        const prodName = (item.fertilizerName || 'PUPUK').toUpperCase();
        const kN = (item.kiosName || '').toUpperCase();
        const drvName = item.driverName || '';
        const dt = item.date || new Date().toISOString().split('T')[0];

        const ratesObj = settings?.transportRates?.[bName] || {
          admin: { rate: 2000, calcType: 'perTon', tripCapacityTon: 8 },
          uangMakan: { rate: 40000, calcType: 'perDriverDay', tripCapacityTon: 8 },
          palang: { rate: 0, calcType: 'perTon', tripCapacityTon: 8 },
          solar: { rate: bName.includes('SRAGEN') ? 5000 : 4166.625, calcType: 'perTon', tripCapacityTon: 8 },
          upahSopir: { rate: 3500, calcType: 'perTon', tripCapacityTon: 8 },
          lembur: { rate: 0, calcType: 'perTon', tripCapacityTon: 8 },
          helper: { rate: 0, calcType: 'perTon', tripCapacityTon: 8 }
        };

        const calcC = (itemKey) => {
          const cfg = ratesObj[itemKey] || {};
          const r = Number(cfg.rate || 0);
          const t = cfg.calcType || 'perTon';
          if (t === 'perTon') return Math.round(r * qty);
          return Math.round(r);
        };

        const adminVal = calcC('admin');
        const uangMakanVal = calcC('uangMakan');
        const palangVal = calcC('palang');
        const solarVal = calcC('solar');
        const upahSopirVal = calcC('upahSopir');
        const lemburVal = calcC('lembur');
        const helperVal = calcC('helper');
        const totalCost = adminVal + uangMakanVal + palangVal + solarVal + upahSopirVal + lemburVal + helperVal;

        const autoKasItem = {
          id: `KA-${Date.now()}`,
          date: dt,
          type: 'PENGELUARAN',
          transactionType: 'PENGELUARAN',
          doNo: item.doNo || '',
          penyaluranNo: refNo,
          penyaluranId: item.id,
          kabupaten: bName,
          branch: item.branch || bName,
          kiosName: item.kiosName || '-',
          driverName: drvName || '-',
          uraian: `BIAYA ANGKUTAN - ${refNo} - ${prodName} - ${kN} - ${qty} TON`,
          description: `BIAYA ANGKUTAN - ${refNo} - ${prodName} - ${kN} - ${qty} TON`,
          amount: totalCost,
          admin: adminVal,
          adminFee: adminVal,
          uangMakan: uangMakanVal,
          mealFee: uangMakanVal,
          palang: palangVal,
          palangFee: palangVal,
          solar: solarVal,
          solarFee: solarVal,
          upahSopir: upahSopirVal,
          driverWage: upahSopirVal,
          lembur: lemburVal,
          overtimeFee: lemburVal,
          helper: helperVal,
          helperFee: helperVal,
          lainLain: 0,
          otherFee: 0
        };

        ka = [autoKasItem, ...ka];
        setKasAngkutanList(ka);
      }
    } else if (type === 'kios') {
      k = isEdit ? k.map(x => x.id === item.id ? item : x) : [item, ...k];
      setKiosks(k);
    } else if (type === 'supplier') {
      s = isEdit ? s.map(x => x.id === item.id ? item : x) : [item, ...s];
      setSuppliers(s);
    } else if (type === 'driver') {
      drv = isEdit ? drv.map(x => x.id === item.id ? item : x) : [item, ...drv];
      setDrivers(drv);
    }

    logActionAndSave(
      isEdit ? `EDIT_${type.toUpperCase()}` : `TAMBAH_${type.toUpperCase()}`,
      `Transaksi ${type}: ${item.id || item.doNo}`,
      {
        newSet: settings, newFert: fertilizers, newSup: s, newKios: k,
        newPen: p, newDO: d, newSalur: sl, newPay: payments, newDep: deposits,
        newDrv: drv, newKasAngkut: ka, newKasUmum: ku
      }
    );
  };

  const handleDeleteItem = (type, id) => {
    let s = [...suppliers], k = [...kiosks], p = [...penebusanList], d = [...doList], sl = [...penyaluranList], drv = [...drivers], pay = [...payments];

    if (type === 'penebusan') {
      const targetPenebusan = p.find(i => i.id === id);
      if (!targetPenebusan) return;

      const targetDoNo = targetPenebusan.doNo;

      // Find all linked DOs
      const linkedDos = d.filter(item => item.penebusanId === id || (targetDoNo && item.doNo === targetDoNo));
      const linkedDoIds = new Set(linkedDos.map(item => item.id));

      // Find all linked Penyaluran
      const linkedSalur = sl.filter(item => 
        (item.doRefId && linkedDoIds.has(item.doRefId)) || (targetDoNo && item.doNo === targetDoNo)
      );
      const linkedSalurIds = new Set(linkedSalur.map(item => item.id));

      // Find all linked Payments
      const linkedPayments = pay.filter(item => 
        (item.penyaluranId && linkedSalurIds.has(item.penyaluranId)) || (targetDoNo && item.doNo === targetDoNo)
      );

      const confirmMsg = linkedDos.length > 0 || linkedSalur.length > 0 || linkedPayments.length > 0
        ? `⚠️ MENGHAPUS PENEBUSAN NO. DO "${targetDoNo || id}" AKAN MENGHAPUS SEMUA DATA TURUNAN BERIKUT:\n\n` +
          `• ${linkedDos.length} Data Pengeluaran DO Gudang\n` +
          `• ${linkedSalur.length} Data Penyaluran Kios\n` +
          `• ${linkedPayments.length} Log Pelunasan Tagihan\n\n` +
          `Apakah Anda yakin ingin menghapus data Penebusan ini beserta seluruh riwayat turunannya?`
        : `Apakah Anda yakin ingin menghapus data penebusan ini?`;

      setConfirmConfig({
        title: 'Konfirmasi Penghapusan Penebusan',
        variant: 'danger',
        message: confirmMsg,
        confirmText: 'Ya, Hapus Semua Data Linked',
        onConfirm: () => {
          p = p.filter(i => i.id !== id);
          d = d.filter(i => !linkedDoIds.has(i.id) && i.doNo !== targetDoNo);
          sl = sl.filter(i => !linkedSalurIds.has(i.id) && i.doNo !== targetDoNo);
          pay = pay.filter(i => !linkedSalurIds.has(i.penyaluranId) && i.doNo !== targetDoNo);

          setPenebusanList(p);
          setDoList(d);
          setPenyaluranList(sl);
          setPayments(pay);
          saveData(settings, fertilizers, s, k, p, d, sl, pay, deposits, drv);
          setConfirmConfig(null);
        }
      });
    } 
    else if (type === 'do') {
      const targetDO = d.find(i => i.id === id);
      if (!targetDO) return;

      const targetDoNo = targetDO.doNo;

      // Find all linked Penyaluran
      const linkedSalur = sl.filter(item => item.doRefId === id || (targetDoNo && item.doNo === targetDoNo));
      const linkedSalurIds = new Set(linkedSalur.map(item => item.id));

      // Find all linked Payments
      const linkedPayments = pay.filter(item => 
        (item.penyaluranId && linkedSalurIds.has(item.penyaluranId)) || (targetDoNo && item.doNo === targetDoNo)
      );

      const confirmMsg = linkedSalur.length > 0 || linkedPayments.length > 0
        ? `⚠️ MENGHAPUS DO GUDANG NO "${targetDoNo || id}" AKAN MENGHAPUS DATA TURUNAN BERIKUT:\n\n` +
          `• ${linkedSalur.length} Data Penyaluran Kios\n` +
          `• ${linkedPayments.length} Log Pelunasan Tagihan\n\n` +
          `Apakah Anda yakin ingin menghapus DO ini beserta riwayat turunannya?`
        : `Apakah Anda yakin ingin menghapus data pengeluaran DO ini?`;

      setConfirmConfig({
        title: 'Konfirmasi Penghapusan DO Gudang',
        variant: 'danger',
        message: confirmMsg,
        confirmText: 'Ya, Hapus DO & Data Linked',
        onConfirm: () => {
          d = d.filter(i => i.id !== id);
          sl = sl.filter(i => !linkedSalurIds.has(i.id) && i.doNo !== targetDoNo);
          pay = pay.filter(i => !linkedSalurIds.has(i.penyaluranId) && i.doNo !== targetDoNo);

          setDoList(d);
          setPenyaluranList(sl);
          setPayments(pay);
          saveData(settings, fertilizers, s, k, p, d, sl, pay, deposits, drv);
          setConfirmConfig(null);
        }
      });
    } 
    else if (type === 'penyaluran') {
      const targetSalur = sl.find(i => i.id === id || i.penyaluranNo === id || i.nomorPenyaluran === id);
      if (!targetSalur) return;

      const targetSalurNo = targetSalur.penyaluranNo || targetSalur.nomorPenyaluran || targetSalur.sjNo || targetSalur.id;

      const linkedPayments = pay.filter(item => 
        item.penyaluranId === id || 
        item.penyaluranId === targetSalurNo ||
        item.nomorPenyaluran === targetSalurNo ||
        item.penyaluranNo === targetSalurNo
      );

      const confirmMsg = linkedPayments.length > 0
        ? `⚠️ Menghapus data penyaluran kios ini akan menghapus ${linkedPayments.length} log pelunasan terkait. Lanjutkan?`
        : `Apakah Anda yakin ingin menghapus data penyaluran kios ini?`;

      setConfirmConfig({
        title: 'Konfirmasi Hapus Penyaluran',
        variant: 'danger',
        message: confirmMsg,
        confirmText: 'Ya, Hapus Data',
        onConfirm: () => {
          sl = sl.filter(i => i.id !== id && i.penyaluranNo !== targetSalurNo && i.nomorPenyaluran !== targetSalurNo);
          pay = pay.filter(i => 
            i.penyaluranId !== id && 
            i.penyaluranId !== targetSalurNo &&
            i.nomorPenyaluran !== targetSalurNo &&
            i.penyaluranNo !== targetSalurNo
          );

          setPenyaluranList(sl);
          setPayments(pay);
          logActionAndSave('HAPUS_PENYALURAN', `Hapus Penyaluran ${targetSalurNo}`, { newSalur: sl, newPay: pay });
          setConfirmConfig(null);
        }
      });
    } 
    else if (type === 'kios') {
      setConfirmConfig({
        title: 'Konfirmasi Hapus Kios',
        variant: 'danger',
        message: 'Apakah Anda yakin ingin menghapus data kios ini?',
        confirmText: 'Ya, Hapus Kios',
        onConfirm: () => {
          k = k.filter(i => i.id !== id);
          setKiosks(k);
          saveData(settings, fertilizers, s, k, p, d, sl, pay, deposits, drv);
          setConfirmConfig(null);
        }
      });
    } 
    else if (type === 'supplier') {
      setConfirmConfig({
        title: 'Konfirmasi Hapus Supplier',
        variant: 'danger',
        message: 'Apakah Anda yakin ingin menghapus data supplier ini?',
        confirmText: 'Ya, Hapus Supplier',
        onConfirm: () => {
          s = s.filter(i => i.id !== id);
          setSuppliers(s);
          saveData(settings, fertilizers, s, k, p, d, sl, pay, deposits, drv);
          setConfirmConfig(null);
        }
      });
    } 
    else if (type === 'driver') {
      setConfirmConfig({
        title: 'Konfirmasi Hapus Supir',
        variant: 'danger',
        message: 'Apakah Anda yakin ingin menghapus data supir ini?',
        confirmText: 'Ya, Hapus Supir',
        onConfirm: () => {
          drv = drv.filter(i => i.id !== id);
          setDrivers(drv);
          saveData(settings, fertilizers, s, k, p, d, sl, pay, deposits, drv);
          setConfirmConfig(null);
        }
      });
    }
  };

  // Payment Handlers
  const handleAddPayment = async (newPay) => {
    const updatedPay = [newPay, ...payments];
    setPayments(updatedPay);

    // Update penyaluran status linked to this payment
    let updatedSalur = penyaluranList.map(item => {
      const stats = getPenyaluranPaymentStats(item, updatedPay);
      return {
        ...item,
        paymentStatus: stats.statusDisplay,
        remainingAmount: stats.sisa,
        kurangBayar: stats.sisa,
        dpAmount: stats.terbayar,
        paidAmount: stats.terbayar,
        keterangan: stats.statusDisplay === 'Lunas' ? 'LUNAS' : 'BELUM LUNAS'
      };
    });
    setPenyaluranList(updatedSalur);

    saveData(
      settings, fertilizers, suppliers, kiosks, penebusanList, doList,
      updatedSalur, updatedPay, deposits, drivers, usersList, activityLogs,
      activeTab, selectedBranch, kasAngkutanList, kasUmumList,
      { showModal: false }
    );

    // Buka Pop Up Screen Sinkronisasi
    setSyncModalState({
      isOpen: true,
      stage: 'syncing',
      title: 'Sinkronisasi Pelunasan Kios',
      message: `Menyimpan pelunasan dan menyinkronkan data DO ke Cloud Database Turso...`,
      details: null
    });

    // Direct partial sync to Turso table 'payments' and 'penyaluran'
    try {
      await syncPartialDataToTurso('payments', [newPay], 'append');
      const affectedSalur = updatedSalur.filter(p => 
        p.id === newPay.penyaluranId || 
        p.penyaluranNo === newPay.penyaluranId || 
        (newPay.doNo && p.doNo === newPay.doNo)
      );
      if (affectedSalur.length > 0) {
        await syncPartialDataToTurso('penyaluran', affectedSalur, 'append');
      }

      setSyncModalState({
        isOpen: true,
        stage: 'completed',
        title: 'Pelunasan Berhasil Disinkronkan',
        message: `Pembayaran sebesar Rp ${Number(newPay.amount || 0).toLocaleString('id-ID')} untuk ${newPay.kiosName || 'Kios'} berhasil disimpan dan disinkronkan ke Turso.`,
        details: {
          info: `Terkait DO: ${newPay.doNo || '-'}`
        }
      });
    } catch (err) {
      console.warn('Background sync payment to Turso:', err.message);
      setSyncModalState({
        isOpen: true,
        stage: 'error',
        title: 'Sinkronisasi Turso Terkendala',
        message: err.message || 'Gagal menyambung ke Turso. Data tetap tersimpan secara offline.',
        details: null
      });
    }
  };

  const handleDeletePayment = (id) => {
    setConfirmConfig({
      title: 'Konfirmasi Hapus Pelunasan',
      variant: 'danger',
      message: 'Apakah Anda yakin ingin menghapus catatan pelunasan ini?',
      confirmText: 'Ya, Hapus Pelunasan',
      onConfirm: async () => {
        const deletedPay = payments.find(p => p.id === id);
        const updatedPay = payments.filter(p => p.id !== id);
        setPayments(updatedPay);

        // Recalculate penyaluran status after deletion
        let updatedSalur = penyaluranList.map(item => {
          const stats = getPenyaluranPaymentStats(item, updatedPay);
          return {
            ...item,
            paymentStatus: stats.statusDisplay,
            remainingAmount: stats.sisa,
            kurangBayar: stats.sisa,
            dpAmount: stats.terbayar,
            paidAmount: stats.terbayar,
            keterangan: stats.statusDisplay === 'Lunas' ? 'LUNAS' : 'BELUM LUNAS'
          };
        });
        setPenyaluranList(updatedSalur);

        saveData(
          settings, fertilizers, suppliers, kiosks, penebusanList, doList,
          updatedSalur, updatedPay, deposits, drivers, usersList, activityLogs,
          activeTab, selectedBranch, kasAngkutanList, kasUmumList,
          { showModal: false }
        );
        setConfirmConfig(null);

        // Buka Pop Up Screen Sinkronisasi
        setSyncModalState({
          isOpen: true,
          stage: 'syncing',
          title: 'Sinkronisasi Hapus Pelunasan',
          message: 'Memperbarui status pembayaran penyaluran di database Turso...',
          details: null
        });

        try {
          if (deletedPay) {
            const affectedSalur = updatedSalur.filter(p => 
              p.id === deletedPay.penyaluranId || 
              p.penyaluranNo === deletedPay.penyaluranId || 
              (deletedPay.doNo && p.doNo === deletedPay.doNo)
            );
            if (affectedSalur.length > 0) {
              await syncPartialDataToTurso('penyaluran', affectedSalur, 'append');
            }
          }
          setSyncModalState({
            isOpen: true,
            stage: 'completed',
            title: 'Hapus Pelunasan Selesai',
            message: 'Catatan pelunasan dihapus dan status penyaluran diperbarui.',
            details: null
          });
        } catch (err) {
          console.warn('Sync updated penyaluran after delete payment:', err.message);
          setSyncModalState({
            isOpen: true,
            stage: 'error',
            title: 'Sinkronisasi Turso Terkendala',
            message: err.message,
            details: null
          });
        }
      }
    });
  };

  const handleEditPayment = async (updatedPayment) => {
    const updatedPay = payments.map(p => p.id === updatedPayment.id ? { ...p, ...updatedPayment } : p);
    setPayments(updatedPay);

    // Recalculate penyaluran status
    const updatedSalur = penyaluranList.map(item => {
      const stats = getPenyaluranPaymentStats(item, updatedPay);
      return {
        ...item,
        paymentStatus: stats.statusDisplay,
        remainingAmount: stats.sisa,
        kurangBayar: stats.sisa,
        dpAmount: stats.terbayar,
        paidAmount: stats.terbayar,
        keterangan: stats.statusDisplay === 'Lunas' ? 'LUNAS' : 'BELUM LUNAS'
      };
    });
    setPenyaluranList(updatedSalur);

    saveData(
      settings, fertilizers, suppliers, kiosks, penebusanList, doList,
      updatedSalur, updatedPay, deposits, drivers, usersList, activityLogs,
      activeTab, selectedBranch, kasAngkutanList, kasUmumList,
      { showModal: false }
    );

    // Buka Pop Up Screen Sinkronisasi
    setSyncModalState({
      isOpen: true,
      stage: 'syncing',
      title: 'Sinkronisasi Perubahan Pelunasan',
      message: 'Menyimpan perubahan nominal/tanggal pelunasan ke Turso Cloud...',
      details: null
    });

    try {
      await syncPartialDataToTurso('payments', [updatedPayment], 'append');
      const affectedSalur = updatedSalur.filter(p => 
        p.id === updatedPayment.penyaluranId || 
        p.penyaluranNo === updatedPayment.penyaluranId || 
        (updatedPayment.doNo && p.doNo === updatedPayment.doNo)
      );
      if (affectedSalur.length > 0) {
        await syncPartialDataToTurso('penyaluran', affectedSalur, 'append');
      }
      setSyncModalState({
        isOpen: true,
        stage: 'completed',
        title: 'Perubahan Pelunasan Berhasil Disinkronkan',
        message: 'Data pelunasan dan kalkulasi tagihan DO berhasil diperbarui di Turso.',
        details: {
          info: `Nominal Baru: Rp ${Number(updatedPayment.amount || 0).toLocaleString('id-ID')}`
        }
      });
    } catch (err) {
      console.warn('Sync edited payment to Turso:', err.message);
      setSyncModalState({
        isOpen: true,
        stage: 'error',
        title: 'Sinkronisasi Turso Terkendala',
        message: err.message,
        details: null
      });
    }
  };

  const handleEditDeposit = async (updatedDeposit) => {
    const updatedDep = deposits.map(d => d.id === updatedDeposit.id ? { ...d, ...updatedDeposit } : d);
    setDeposits(updatedDep);
    saveData(settings, fertilizers, suppliers, kiosks, penebusanList, doList, penyaluranList, payments, updatedDep, drivers);
    try {
      await syncPartialDataToTurso('deposits', [updatedDeposit], 'append');
    } catch (err) {
      console.warn('Sync edited deposit to Turso:', err.message);
    }
  };

  // Mass Payment Synchronization between Penyaluran Kios & Pembayaran Kios
  const handleSyncPaymentStatus = async (silent = false) => {
    let changedCount = 0;
    let lunasCount = 0;
    let tempoCount = 0;

    const updatedSalur = penyaluranList.map(item => {
      const stats = getPenyaluranPaymentStats(item, payments);
      const isLunasNow = stats.statusDisplay === 'Lunas';
      if (isLunasNow) lunasCount++;
      else tempoCount++;

      const isChanged = item.paymentStatus !== stats.statusDisplay || 
                        item.remainingAmount !== stats.sisa ||
                        item.dpAmount !== stats.terbayar;
      if (isChanged) changedCount++;

      return {
        ...item,
        paymentStatus: stats.statusDisplay,
        remainingAmount: stats.sisa,
        kurangBayar: stats.sisa,
        dpAmount: stats.terbayar,
        paidAmount: stats.terbayar,
        keterangan: isLunasNow ? 'LUNAS' : 'BELUM LUNAS'
      };
    });

    setPenyaluranList(updatedSalur);

    saveData(
      settings, fertilizers, suppliers, kiosks,
      penebusanList, doList, updatedSalur, payments, deposits,
      drivers, usersList, activityLogs, activeTab, selectedBranch,
      kasAngkutanList, kasUmumList,
      { showModal: false }
    );

    if (!silent) {
      setSyncModalState({
        isOpen: true,
        stage: 'syncing',
        title: 'Sinkronisasi Pembayaran Massal',
        message: `Menganalisis ${updatedSalur.length} data penyaluran dan mengunggah status ke Turso...`,
        details: null
      });
    }

    try {
      await syncPartialDataToTurso('penyaluran', updatedSalur, 'append');
      if (!silent) {
        setSyncModalState({
          isOpen: true,
          stage: 'completed',
          title: 'Sinkronisasi Pembayaran Selesai',
          message: 'Status seluruh transaksi penyaluran dan pelunasan kini 100% cocok dengan Turso.',
          details: {
            lunas: `${lunasCount} Transaksi`,
            tempo: `${tempoCount} Transaksi`,
            info: `${changedCount} Data Penyaluran diperbarui`
          }
        });
      }
    } catch (err) {
      console.warn('Sync payment status to Turso:', err.message);
      if (!silent) {
        setSyncModalState({
          isOpen: true,
          stage: 'error',
          title: 'Sinkronisasi Turso Terkendala',
          message: err.message,
          details: null
        });
      }
    }
  };

  // Transfer Saldo Antar Kas Umum <-> Kas Angkutan
  const handleTransferKas = async ({ from, to, amount, date, branch, notes }) => {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      alert('Masukkan nominal transfer kas yang valid!');
      return;
    }
    const now = Date.now();
    const cleanBranch = branch || (selectedBranch !== 'ALL' ? selectedBranch : 'Magetan');
    const trfDate = date || new Date().toISOString().split('T')[0];

    setSyncModalState({
      isOpen: true,
      stage: 'syncing',
      title: 'Memproses Transfer Kas',
      message: `Mentransfer Rp ${numAmount.toLocaleString('id-ID')} antara Kas Umum dan Kas Angkutan...`,
      details: null
    });

    // 1. Dari Kas Umum ke Kas Angkutan
    if (from === 'kas_umum' && to === 'kas_angkutan') {
      const pengeluaranUmum = {
        id: `KU-TRF-${now}`,
        branch: cleanBranch,
        date: trfDate,
        type: 'Pengeluaran',
        category: 'Transfer Kas',
        description: `Transfer Kas ke Kas Angkutan${notes ? ' (' + notes + ')' : ''}`,
        amount: numAmount,
        notes: notes || 'Transfer ke Kas Angkutan'
      };

      const pemasukanAngkutan = {
        id: `KA-TRF-${now}`,
        branch: cleanBranch,
        date: trfDate,
        transactionType: 'Pemasukan',
        description: `Penerimaan Transfer dari Kas Umum Kantor${notes ? ' (' + notes + ')' : ''}`,
        amount: numAmount,
        notes: notes || 'Transfer dari Kas Umum'
      };

      const updatedUmum = [pengeluaranUmum, ...kasUmumList];
      const updatedAngkut = [pemasukanAngkutan, ...kasAngkutanList];
      setKasUmumList(updatedUmum);
      setKasAngkutanList(updatedAngkut);

      logActionAndSave('TRANSFER_KAS', `Transfer Rp ${numAmount} dari Kas Umum ke Kas Angkutan`, {
        newKasUmum: updatedUmum,
        newKasAngkut: updatedAngkut
      }, { showModal: false });

      try {
        await syncPartialDataToTurso('kas_umum', [pengeluaranUmum], 'append');
        await syncPartialDataToTurso('kas_angkutan', [pemasukanAngkutan], 'append');
        setSyncModalState({
          isOpen: true,
          stage: 'completed',
          title: 'Transfer Kas Berhasil',
          message: `Berhasil mentransfer Rp ${numAmount.toLocaleString('id-ID')} dari Kas Umum ke Kas Angkutan.`,
          details: {
            info: `Cabang: ${cleanBranch} • Tanggal: ${trfDate}`
          }
        });
      } catch (err) {
        console.warn('Sync transfer kas to Turso:', err.message);
        setSyncModalState({
          isOpen: true,
          stage: 'completed',
          title: 'Transfer Disimpan (Offline)',
          message: `Transfer berhasil dicatat pada aplikasi.`,
          details: null
        });
      }
    }

    // 2. Dari Kas Angkutan ke Kas Umum
    if (from === 'kas_angkutan' && to === 'kas_umum') {
      const pengeluaranAngkutan = {
        id: `KA-TRF-${now}`,
        branch: cleanBranch,
        date: trfDate,
        transactionType: 'Pengeluaran',
        description: `Transfer Kas ke Kas Umum Kantor${notes ? ' (' + notes + ')' : ''}`,
        amount: numAmount,
        notes: notes || 'Transfer ke Kas Umum'
      };

      const pemasukanUmum = {
        id: `KU-TRF-${now}`,
        branch: cleanBranch,
        date: trfDate,
        type: 'Pemasukan',
        category: 'Transfer Kas',
        description: `Penerimaan Transfer dari Kas Angkutan${notes ? ' (' + notes + ')' : ''}`,
        amount: numAmount,
        notes: notes || 'Transfer dari Kas Angkutan'
      };

      const updatedAngkut = [pengeluaranAngkutan, ...kasAngkutanList];
      const updatedUmum = [pemasukanUmum, ...kasUmumList];
      setKasAngkutanList(updatedAngkut);
      setKasUmumList(updatedUmum);

      logActionAndSave('TRANSFER_KAS', `Transfer Rp ${numAmount} dari Kas Angkutan ke Kas Umum`, {
        newKasUmum: updatedUmum,
        newKasAngkut: updatedAngkut
      }, { showModal: false });

      try {
        await syncPartialDataToTurso('kas_angkutan', [pengeluaranAngkutan], 'append');
        await syncPartialDataToTurso('kas_umum', [pemasukanUmum], 'append');
        setSyncModalState({
          isOpen: true,
          stage: 'completed',
          title: 'Transfer Kas Berhasil',
          message: `Berhasil mentransfer Rp ${numAmount.toLocaleString('id-ID')} dari Kas Angkutan ke Kas Umum.`,
          details: {
            info: `Cabang: ${cleanBranch} • Tanggal: ${trfDate}`
          }
        });
      } catch (err) {
        console.warn('Sync transfer kas to Turso:', err.message);
        setSyncModalState({
          isOpen: true,
          stage: 'completed',
          title: 'Transfer Disimpan (Offline)',
          message: `Transfer berhasil dicatat pada aplikasi.`,
          details: null
        });
      }
    }
  };

  // Deposit Handlers
  const handleAddDeposit = (newDep) => {
    const updatedDep = [newDep, ...deposits];
    setDeposits(updatedDep);
    saveData(settings, fertilizers, suppliers, kiosks, penebusanList, doList, penyaluranList, payments, updatedDep, drivers);
  };

  const handleDeleteDeposit = (id) => {
    setConfirmConfig({
      title: 'Konfirmasi Hapus Deposit',
      variant: 'danger',
      message: 'Apakah Anda yakin ingin menghapus catatan deposit ini?',
      confirmText: 'Ya, Hapus Deposit',
      onConfirm: () => {
        const updatedDep = deposits.filter(d => d.id !== id);
        setDeposits(updatedDep);
        saveData(settings, fertilizers, suppliers, kiosks, penebusanList, doList, penyaluranList, payments, updatedDep, drivers);
        setConfirmConfig(null);
      }
    });
  };

  // Bulk Delete Handler
  const handleDeleteMultiple = (type, ids = []) => {
    if (!ids || ids.length === 0) return;
    const idSet = new Set(ids);

    setConfirmConfig({
      title: `Konfirmasi Hapus ${ids.length} Data Terpilih`,
      variant: 'danger',
      message: `Apakah Anda yakin ingin menghapus ${ids.length} data terpilih? Data yang dihapus akan terhapus secara permanen dari Turso & Sistem.`,
      confirmText: `Ya, Hapus ${ids.length} Data Terpilih`,
      onConfirm: () => {
        let p = penebusanList;
        let d = doList;
        let sl = penyaluranList;
        let pay = payments;
        let dep = deposits;

        if (type === 'penebusan') {
          p = p.filter(item => !idSet.has(item.id));
        } else if (type === 'do') {
          d = d.filter(item => !idSet.has(item.id));
        } else if (type === 'penyaluran') {
          sl = sl.filter(item => !idSet.has(item.id));
        } else if (type === 'payment_deposit') {
          pay = pay.filter(item => !idSet.has(item.id));
          dep = dep.filter(item => !idSet.has(item.id));
        }

        setPenebusanList(p);
        setDoList(d);
        setPenyaluranList(sl);
        setPayments(pay);
        setDeposits(dep);
        saveData(settings, fertilizers, suppliers, kiosks, p, d, sl, pay, dep, drivers);
        setConfirmConfig(null);
      }
    });
  };

  // Kas Angkutan Handlers
  const handleAddKasAngkutan = async (item, isEdit = false) => {
    const updated = isEdit 
      ? kasAngkutanList.map(i => i.id === item.id ? item : i)
      : [item, ...kasAngkutanList];
    setKasAngkutanList(updated);
    
    // Quick local save
    saveLocalOnly({ kasAngkutanList: updated });

    setSyncModalState({
      isOpen: true,
      stage: 'syncing',
      title: isEdit ? 'Menyimpan Edit Kas Angkutan' : 'Menyimpan Kas Angkutan',
      message: 'Menyinkronkan sebagian data ke Turso Cloud...',
      details: null
    });

    try {
      await syncPartialDataToTurso('kas_angkutan', [item], 'append');
      
      const logEntry = {
        id: `LOG-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        timestamp: new Date().toISOString(),
        user: currentUser?.name || currentUser?.username || 'Sistem',
        role: currentUser?.role || '-',
        action: isEdit ? 'EDIT_KAS_ANGKUTAN' : 'TAMBAH_KAS_ANGKUTAN',
        details: `Kas Angkutan: ${item.uraian || item.description || ''} (Rp ${item.amount || item.nominal || 0})`
      };
      
      const updatedLogs = [logEntry, ...activityLogs].slice(0, 500);
      setActivityLogs(updatedLogs);
      saveLocalOnly({ activityLogs: updatedLogs });
      syncPartialDataToTurso('activity_logs', [logEntry], 'append').catch(()=>null);

      setSyncModalState({
        isOpen: true,
        stage: 'completed',
        title: 'Berhasil',
        message: 'Data kas angkutan berhasil disimpan dengan cepat.',
        details: null
      });
    } catch (err) {
      // Fallback to full sync if partial fails
      logActionAndSave(isEdit ? 'EDIT_KAS_ANGKUTAN' : 'TAMBAH_KAS_ANGKUTAN', `Kas Angkutan (Fallback)`, { newKasAngkut: updated });
    }
  };

  const handleDeleteKasAngkutan = (id) => {
    setConfirmConfig({
      title: 'Konfirmasi Hapus Kas Angkutan',
      variant: 'danger',
      message: 'Apakah Anda yakin ingin menghapus catatan transaksi Kas Angkutan ini?',
      confirmText: 'Ya, Hapus Data',
      onConfirm: () => {
        const updated = kasAngkutanList.filter(i => i.id !== id);
        setKasAngkutanList(updated);
        // Delete requires full sync to clean up Turso records, do it in background
        logActionAndSave('HAPUS_KAS_ANGKUTAN', `Hapus Kas Angkutan ID: ${id}`, { newKasAngkut: updated }, { showModal: false });
        
        // Give immediate UI feedback
        setSyncModalState({
          isOpen: true,
          stage: 'completed',
          title: 'Hapus Berhasil',
          message: 'Data telah dihapus. Sinkronisasi Turso berjalan di latar belakang.',
          details: null
        });
        setConfirmConfig(null);
      }
    });
  };

  // Kas Umum Handlers
  const handleAddKasUmum = async (item, isEdit = false) => {
    const updated = isEdit 
      ? kasUmumList.map(i => i.id === item.id ? item : i)
      : [item, ...kasUmumList];
    setKasUmumList(updated);
    
    // Quick local save
    saveLocalOnly({ kasUmumList: updated });

    setSyncModalState({
      isOpen: true,
      stage: 'syncing',
      title: isEdit ? 'Menyimpan Edit Kas Umum' : 'Menyimpan Kas Umum',
      message: 'Menyinkronkan sebagian data ke Turso Cloud...',
      details: null
    });

    try {
      await syncPartialDataToTurso('kas_umum', [item], 'append');
      
      const logEntry = {
        id: `LOG-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        timestamp: new Date().toISOString(),
        user: currentUser?.name || currentUser?.username || 'Sistem',
        role: currentUser?.role || '-',
        action: isEdit ? 'EDIT_KAS_UMUM' : 'TAMBAH_KAS_UMUM',
        details: `Kas Umum: ${item.description || item.category || ''} (Rp ${item.amount || 0})`
      };
      
      const updatedLogs = [logEntry, ...activityLogs].slice(0, 500);
      setActivityLogs(updatedLogs);
      saveLocalOnly({ activityLogs: updatedLogs });
      syncPartialDataToTurso('activity_logs', [logEntry], 'append').catch(()=>null);

      setSyncModalState({
        isOpen: true,
        stage: 'completed',
        title: 'Berhasil',
        message: 'Data kas umum berhasil disimpan dengan cepat.',
        details: null
      });
    } catch (err) {
      logActionAndSave(isEdit ? 'EDIT_KAS_UMUM' : 'TAMBAH_KAS_UMUM', `Kas Umum (Fallback)`, { newKasUmum: updated });
    }
  };

  const handleDeleteKasUmum = (id) => {
    setConfirmConfig({
      title: 'Konfirmasi Hapus Kas Umum',
      variant: 'danger',
      message: 'Apakah Anda yakin ingin menghapus catatan transaksi Kas Umum ini?',
      confirmText: 'Ya, Hapus Data',
      onConfirm: () => {
        const updated = kasUmumList.filter(i => i.id !== id);
        setKasUmumList(updated);
        // Delete requires full sync, do it in background
        logActionAndSave('HAPUS_KAS_UMUM', `Hapus Kas Umum ID: ${id}`, { newKasUmum: updated }, { showModal: false });
        
        setSyncModalState({
          isOpen: true,
          stage: 'completed',
          title: 'Hapus Berhasil',
          message: 'Data telah dihapus. Sinkronisasi Turso berjalan di latar belakang.',
          details: null
        });
        setConfirmConfig(null);
      }
    });
  };

  const handleOpenPrint = (data, type) => {
    setPrintData(data);
    setPrintType(type);
    setIsPrintModalOpen(true);
  };

  // ── SHOW LOGIN if not authenticated ──
  if (!currentUser) {
    return <LoginPage usersList={usersList} onLogin={handleLogin} />;
  }

  const counts = {
    penebusan: penebusanList.length,
    do: doList.length,
    penyaluran: penyaluranList.length,
    kios: kiosks.length,
    fertilizers: fertilizers.length,
  };

  return (
    <div>
      <TopNavbar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedBranch={selectedBranch}
        setSelectedBranch={handleSetBranch}
        onOpenNewTransaction={() => handleOpenNewTransaction('penebusan')}
        counts={counts}
        settings={settings}
        currentUser={currentUser}
        onLogout={handleLogout}
        tursoSyncState={tursoSyncState}
        onManualSync={() => handleManualSync('Sinkronisasi Turso Realtime')}
      />

      <main className="main-container">
        {activeTab === 'dashboard' && (
          <DashboardView 
            selectedBranch={selectedBranch} penebusanList={penebusanList}
            doList={doList} penyaluranList={penyaluranList}
            fertilizers={fertilizers} onNavigate={(tab) => setActiveTab(tab)}
            onAddNew={handleOpenNewTransaction}
            onOpenPrint={handleOpenPrint} settings={settings}
            onSyncData={handleManualSync}
          />
        )}
        {activeTab === 'penebusan' && (
          <PenebusanView 
            selectedBranch={selectedBranch} penebusanList={penebusanList}
            doList={doList} onAddNew={handleOpenNewTransaction}
            onEdit={(type, item) => handleOpenEditItem(type, item)}
            onOpenNextStage={handleOpenNextStage}
            onDelete={handleDeleteItem} onDeleteMultiple={handleDeleteMultiple} onOpenPrint={handleOpenPrint} settings={settings}
            onNavigate={(tab) => setActiveTab(tab)}
            onImportModuleData={settings?.migrationMode ? handleImportModuleData : null}
            onSyncData={handleManualSync}
          />
        )}
        {activeTab === 'pengeluaran_do' && (
          <PengeluaranDoView 
            selectedBranch={selectedBranch} doList={doList}
            penebusanList={penebusanList} penyaluranList={penyaluranList}
            onAddNew={handleOpenNewTransaction}
            onEdit={(type, item) => handleOpenEditItem(type, item)}
            onOpenNextStage={handleOpenNextStage}
            onDelete={handleDeleteItem} onDeleteMultiple={handleDeleteMultiple} onOpenPrint={handleOpenPrint} settings={settings}
            onNavigate={(tab) => setActiveTab(tab)}
            onImportModuleData={settings?.migrationMode ? handleImportModuleData : null}
            onSyncData={handleManualSync}
          />
        )}
        {activeTab === 'penyaluran_kios' && (
          <PenyaluranKiosView 
            selectedBranch={selectedBranch} penyaluranList={penyaluranList}
            kiosks={kiosks} payments={payments} deposits={deposits} onAddNew={handleOpenNewTransaction}
            onEdit={(type, item) => handleOpenEditItem(type, item)}
            onDelete={handleDeleteItem} onDeleteMultiple={handleDeleteMultiple} onOpenPrint={handleOpenPrint} settings={settings}
            onNavigate={(tab) => setActiveTab(tab)}
            onImportModuleData={settings?.migrationMode ? handleImportModuleData : null}
            onSyncPaymentStatus={handleSyncPaymentStatus}
            onSyncData={handleManualSync}
          />
        )}
        {activeTab === 'pembayaran_kios' && (
          <ErrorBoundary>
            <PembayaranKiosView 
              selectedBranch={selectedBranch}
              penyaluranList={penyaluranList}
              kiosks={kiosks}
              payments={payments}
              deposits={deposits}
              onAddPayment={handleAddPayment}
              onAddDeposit={handleAddDeposit}
              onDeletePayment={handleDeletePayment}
              onDeleteDeposit={handleDeleteDeposit}
              onEditPayment={handleEditPayment}
              onEditDeposit={handleEditDeposit}
              onDeleteMultiple={handleDeleteMultiple}
              settings={settings}
              onNavigate={(tab) => setActiveTab(tab)}
              onImportModuleData={settings?.migrationMode ? handleImportModuleData : null}
              onSyncPaymentStatus={handleSyncPaymentStatus}
              onSyncData={handleManualSync}
            />
          </ErrorBoundary>
        )}
        {activeTab === 'kas_angkutan' && (
          <KasAngkutanView 
            selectedBranch={selectedBranch}
            kasAngkutanList={kasAngkutanList}
            drivers={drivers}
            penyaluranList={penyaluranList}
            doList={doList}
            onAddKasAngkutan={handleAddKasAngkutan}
            onDeleteKasAngkutan={handleDeleteKasAngkutan}
            settings={settings}
            onSaveSettings={(newSet) => {
              setSettings(newSet);
              saveData(newSet);
            }}
            onImportModuleData={settings?.migrationMode ? handleImportModuleData : null}
            onTransferKas={handleTransferKas}
            onSyncData={handleManualSync}
          />
        )}
        {activeTab === 'kas_umum' && (
          <KasUmumView 
            selectedBranch={selectedBranch}
            kasUmumList={kasUmumList}
            onAddKasUmum={handleAddKasUmum}
            onDeleteKasUmum={handleDeleteKasUmum}
            settings={settings}
            onImportModuleData={settings?.migrationMode ? handleImportModuleData : null}
            onTransferKas={handleTransferKas}
            onSyncData={handleManualSync}
          />
        )}
        {activeTab === 'stok_mutasi' && (
          <StokMutasiView 
            selectedBranch={selectedBranch} penebusanList={penebusanList}
            doList={doList} penyaluranList={penyaluranList} fertilizers={fertilizers}
            onSyncData={handleManualSync}
          />
        )}
        {activeTab === 'produk' && (
          <DaftarProdukView 
            selectedBranch={selectedBranch}
            settings={settings}
            fertilizers={fertilizers}
            onAddFertilizer={handleAddFertilizer}
            onEditFertilizer={handleEditFertilizer}
            onDeleteFertilizer={handleDeleteFertilizer}
            onImportModuleData={settings?.migrationMode ? handleImportModuleData : null}
            onSyncData={handleManualSync}
          />
        )}
        {activeTab === 'master_data' && (
          <MasterDataView 
            selectedBranch={selectedBranch} kiosks={kiosks} suppliers={suppliers} drivers={drivers}
            penyaluranList={penyaluranList} payments={payments} deposits={deposits}
            onAddKios={() => handleOpenNewTransaction('kios')}
            onAddSupplier={() => handleOpenNewTransaction('supplier')}
            onAddDriver={() => handleOpenNewTransaction('driver')}
            onEditKios={(item) => handleOpenEditItem('kios', item)}
            onEditSupplier={(item) => handleOpenEditItem('supplier', item)}
            onEditDriver={(item) => handleOpenEditItem('driver', item)}
            onDeleteKios={(id) => handleDeleteItem('kios', id)}
            onDeleteSupplier={(id) => handleDeleteItem('supplier', id)}
            onDeleteDriver={(id) => handleDeleteItem('driver', id)}
            onImportModuleData={settings?.migrationMode ? handleImportModuleData : null}
            onSyncData={handleManualSync}
          />
        )}
        {activeTab === 'laporan' && (
          <LaporanView 
            selectedBranch={selectedBranch} 
            penebusanList={penebusanList}
            doList={doList} 
            penyaluranList={penyaluranList} 
            fertilizers={fertilizers}
            payments={payments}
            onSyncData={handleManualSync}
          />
        )}
        {activeTab === 'settings' && (currentUser?.role === 'owner' || currentUser?.role === 'developer') && (
          <SettingsView
            settings={settings}
            onSaveSettings={handleSaveSettings}
            usersList={usersList}
            onSaveUsers={handleSaveUsers}
            currentUser={currentUser}
            allAppData={{
              fertilizers,
              suppliers,
              drivers,
              kiosks,
              penebusanList,
              doList,
              penyaluranList,
              payments,
              deposits,
            }}
            onImportData={handleImportAllData}
            onSyncData={handleManualSync}
          />
        )}
      </main>

      <ModalTransaction 
        isOpen={isTrxModalOpen} onClose={() => setIsTrxModalOpen(false)}
        formType={trxFormType}
        defaultBranch={currentUser.role === 'admin' ? currentUser.branch : selectedBranch}
        suppliers={suppliers} kiosks={kiosks} fertilizers={fertilizers} drivers={drivers}
        penebusanList={penebusanList} doList={doList} penyaluranList={penyaluranList}
        onSave={handleSaveItem}
        editData={editingItem}
        initialPenebusanId={initialPenebusanId}
        initialDoRefId={initialDoRefId}
      />
      <PrintPreviewModal 
        isOpen={isPrintModalOpen} onClose={() => setIsPrintModalOpen(false)}
        printData={printData} printType={printType}
      />

      {/* GLOBAL CUSTOM CONFIRM / ALERT NOTIFICATION */}
      {confirmConfig && (
        <ModalNotification
          isOpen={Boolean(confirmConfig)}
          type="confirm"
          variant={confirmConfig.variant || 'danger'}
          title={confirmConfig.title}
          message={confirmConfig.message}
          confirmText={confirmConfig.confirmText || 'Ya, Lanjutkan'}
          cancelText="Batal"
          onConfirm={confirmConfig.onConfirm}
          onCancel={() => setConfirmConfig(null)}
          onClose={() => setConfirmConfig(null)}
        />
      )}

      {/* MODAL SLIDE LOADING IMPORT PROGRESS */}
      <ImportProgressModal
        isOpen={importModalState.isOpen}
        onClose={() => setImportModalState(prev => ({ ...prev, isOpen: false }))}
        moduleName={importModalState.moduleName}
        fileName={importModalState.fileName}
        totalRows={importModalState.totalRows}
        stage={importModalState.stage}
        percent={importModalState.percent}
        message={importModalState.message}
        batchInfo={importModalState.batchInfo}
        error={importModalState.error}
        summary={importModalState.summary}
        onConfirmUpload={handleExecuteImport}
      />

      {/* POP UP SCREEN SINKRONISASI OTOMATIS */}
      <SyncProgressModal
        isOpen={syncModalState.isOpen}
        onClose={() => setSyncModalState(prev => ({ ...prev, isOpen: false }))}
        title={syncModalState.title}
        stage={syncModalState.stage}
        message={syncModalState.message}
        details={syncModalState.details}
      />
    </div>
  );
}
