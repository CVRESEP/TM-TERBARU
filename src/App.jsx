import React, { useState, useEffect } from 'react';
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
import { syncDataToTurso, fetchDataFromTurso } from './services/tursoService';

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
  DEFAULT_KAS_UMUM
} from './data/initialData';
import { normalizeAllData, normalizeKasUmumList } from './utils/dataNormalizer';

const LOCAL_STORAGE_KEY = 'tani_makmur_baru_db_clean_v6';
const SESSION_KEY = 'tani_makmur_baru_session';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedBranch, setSelectedBranch] = useState('ALL');

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

  // Restore session on first load
  useEffect(() => {
    const savedSession = sessionStorage.getItem(SESSION_KEY);
    if (savedSession) {
      try {
        setCurrentUser(JSON.parse(savedSession));
      } catch {}
    }
  }, []);

  // Load app data whenever user logs in (Primary: Turso Cloud, Secondary: localStorage cache)
  useEffect(() => {
    if (!currentUser) return;

    const loadLocalData = () => {
      const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          setSettings(parsed.settings || DEFAULT_SETTINGS);
          setUsersList(parsed.usersList && parsed.usersList.length > 0 ? parsed.usersList : DEFAULT_USERS);
          setFertilizers(parsed.fertilizers || DEFAULT_FERTILIZERS);
          setSuppliers(parsed.suppliers || DEFAULT_SUPPLIERS);
          setDrivers(parsed.drivers || DEFAULT_DRIVERS);
          setKiosks(parsed.kiosks || DEFAULT_KIOSKS);
          setPenebusanList(parsed.penebusanList || DEFAULT_PENEBUSAN);
          setDoList(parsed.doList || DEFAULT_DO_EXPENSES);
          setPenyaluranList(parsed.penyaluranList || DEFAULT_PENYALURAN_KIOS);
          setPayments(parsed.payments || []);
          setDeposits(parsed.deposits || []);
          setKasAngkutanList(parsed.kasAngkutanList || []);
          setKasUmumList(normalizeKasUmumList(parsed.kasUmumList && parsed.kasUmumList.length > 0 ? parsed.kasUmumList : DEFAULT_KAS_UMUM));
          setActivityLogs(parsed.activityLogs || []);
          if (parsed.activeTab) setActiveTab(parsed.activeTab);
          if (parsed.selectedBranch && currentUser.role !== 'admin') setSelectedBranch(parsed.selectedBranch);
        } catch {
          loadDefaults();
        }
      } else {
        setKasUmumList(normalizeKasUmumList(DEFAULT_KAS_UMUM));
      }
    };

    fetchDataFromTurso()
      .then((res) => {
        if (res && res.success && res.data) {
          const d = res.data;
          const hasTursoData =
            (d.penebusanList && d.penebusanList.length > 0) ||
            (d.penyaluranList && d.penyaluranList.length > 0) ||
            (d.kiosks && d.kiosks.length > 0) ||
            (d.kasAngkutanList && d.kasAngkutanList.length > 0);

          if (hasTursoData) {
            if (d.settings && Object.keys(d.settings).length > 0) setSettings(d.settings);
            if (d.usersList && d.usersList.length > 0) setUsersList(d.usersList);
            if (d.fertilizers && d.fertilizers.length > 0) setFertilizers(d.fertilizers);
            if (d.suppliers && d.suppliers.length > 0) setSuppliers(d.suppliers);
            if (d.drivers && d.drivers.length > 0) setDrivers(d.drivers);
            if (d.kiosks && d.kiosks.length > 0) setKiosks(d.kiosks);
            if (d.penebusanList && d.penebusanList.length > 0) setPenebusanList(d.penebusanList);
            if (d.doList && d.doList.length > 0) setDoList(d.doList);
            if (d.penyaluranList && d.penyaluranList.length > 0) setPenyaluranList(d.penyaluranList);
            if (d.payments && d.payments.length > 0) setPayments(d.payments);
            if (d.deposits && d.deposits.length > 0) setDeposits(d.deposits);
            if (d.kasAngkutanList && d.kasAngkutanList.length > 0) setKasAngkutanList(d.kasAngkutanList);
            setKasUmumList(normalizeKasUmumList(d.kasUmumList && d.kasUmumList.length > 0 ? d.kasUmumList : DEFAULT_KAS_UMUM));
            if (d.activityLogs && d.activityLogs.length > 0) setActivityLogs(d.activityLogs);

            console.log('✅ Data berhasil dimuat langsung dari Turso Cloud Database!');
            return;
          }
        }
        loadLocalData();
      })
      .catch((err) => {
        console.warn('⚠️ Gagal mengambil dari Turso Cloud Database, menggunakan cache lokal:', err.message);
        loadLocalData();
      });

    // Lock branch for admin role
    if (currentUser.role === 'admin' && currentUser.branch !== 'ALL') {
      setSelectedBranch(currentUser.branch);
    }
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
    newKasUmum = kasUmumList
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
      syncDataToTurso(payload).catch((err) => console.log('Turso background sync:', err.message));
    } catch (e) {
      console.error('Gagal menyimpan ke database lokal:', e);
    }
  };

  const logActionAndSave = (actionType, details, overrides = {}) => {
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
      overrides.newBranch || selectedBranch
    );
  };

  const loadDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    setUsersList(DEFAULT_USERS);
    setFertilizers(DEFAULT_FERTILIZERS);
    setSuppliers(DEFAULT_SUPPLIERS);
    setDrivers(DEFAULT_DRIVERS);
    setKiosks(DEFAULT_KIOSKS);
    setPenebusanList(DEFAULT_PENEBUSAN);
    setDoList(DEFAULT_DO_EXPENSES);
    setPenyaluranList(DEFAULT_PENYALURAN_KIOS);
    setPayments([]);
    setDeposits([]);
    saveData(DEFAULT_SETTINGS, DEFAULT_FERTILIZERS, DEFAULT_SUPPLIERS, DEFAULT_KIOSKS, DEFAULT_PENEBUSAN, DEFAULT_DO_EXPENSES, DEFAULT_PENYALURAN_KIOS, [], [], DEFAULT_DRIVERS, DEFAULT_USERS);
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
    const newPen = normalized.penebusanList && normalized.penebusanList.length > 0 ? normalized.penebusanList : penebusanList;
    const newDO = normalized.doList && normalized.doList.length > 0 ? normalized.doList : doList;
    const newSalur = normalized.penyaluranList && normalized.penyaluranList.length > 0 ? normalized.penyaluranList : penyaluranList;
    const newPay = normalized.payments && normalized.payments.length > 0 ? normalized.payments : payments;
    const newKasAngkut = normalized.kasAngkutanList && normalized.kasAngkutanList.length > 0 ? normalized.kasAngkutanList : kasAngkutanList;
    const newKasUmum = normalized.kasUmumList && normalized.kasUmumList.length > 0 ? normalized.kasUmumList : kasUmumList;

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
        const drv = item.driverName || '';
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
          doNo: item.doNo || '',
          penyaluranNo: refNo,
          penyaluranId: item.id,
          kabupaten: bName,
          branch: item.branch,
          kiosName: item.kiosName || '-',
          driverName: drv || '-',
          uraian: `BIAYA ANGKUTAN - ${refNo} - ${prodName} - ${kN} - ${qty} TON`,
          amount: totalCost,
          admin: adminVal,
          uangMakan: uangMakanVal,
          palang: palangVal,
          solar: solarVal,
          upahSopir: upahSopirVal,
          lembur: lemburVal,
          helper: helperVal,
          lainLain: 0
        };

        setKasAngkutanList(prev => [autoKasItem, ...prev]);
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

    saveData(settings, fertilizers, s, k, p, d, sl, payments, deposits, drv);
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
      const targetSalur = sl.find(i => i.id === id);
      if (!targetSalur) return;

      const linkedPayments = pay.filter(item => item.penyaluranId === id);

      const confirmMsg = linkedPayments.length > 0
        ? `⚠️ Menghapus data penyaluran kios ini akan menghapus ${linkedPayments.length} log pelunasan terkait. Lanjutkan?`
        : `Apakah Anda yakin ingin menghapus data penyaluran kios ini?`;

      setConfirmConfig({
        title: 'Konfirmasi Hapus Penyaluran',
        variant: 'danger',
        message: confirmMsg,
        confirmText: 'Ya, Hapus Data',
        onConfirm: () => {
          sl = sl.filter(i => i.id !== id);
          pay = pay.filter(i => i.penyaluranId !== id);

          setPenyaluranList(sl);
          setPayments(pay);
          saveData(settings, fertilizers, s, k, p, d, sl, pay, deposits, drv);
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
  const handleAddPayment = (newPay) => {
    const updatedPay = [newPay, ...payments];
    setPayments(updatedPay);

    // If payment is linked to a specific penyaluran, check if total payments now cover the total tagihan
    let updatedSalur = [...penyaluranList];
    if (newPay.penyaluranId) {
      const targetPenyaluran = updatedSalur.find(p => p.id === newPay.penyaluranId);
      if (targetPenyaluran) {
        const itemPayments = updatedPay.filter(pm => pm.penyaluranId === targetPenyaluran.id);
        const paidSum = itemPayments.reduce((s, pm) => s + Number(pm.amount || 0), 0);
        if (paidSum >= Number(targetPenyaluran.totalAmount || 0)) {
          targetPenyaluran.paymentStatus = 'Lunas';
        }
      }
      setPenyaluranList(updatedSalur);
    }

    saveData(settings, fertilizers, suppliers, kiosks, penebusanList, doList, updatedSalur, updatedPay, deposits, drivers);
  };

  const handleDeletePayment = (id) => {
    setConfirmConfig({
      title: 'Konfirmasi Hapus Pelunasan',
      variant: 'danger',
      message: 'Apakah Anda yakin ingin menghapus catatan pelunasan ini?',
      confirmText: 'Ya, Hapus Pelunasan',
      onConfirm: () => {
        const updatedPay = payments.filter(p => p.id !== id);
        setPayments(updatedPay);
        saveData(settings, fertilizers, suppliers, kiosks, penebusanList, doList, penyaluranList, updatedPay, deposits, drivers);
      setConfirmConfig(null);
      }
    });
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
  const handleAddKasAngkutan = (item, isEdit = false) => {
    const updated = isEdit 
      ? kasAngkutanList.map(i => i.id === item.id ? item : i)
      : [item, ...kasAngkutanList];
    setKasAngkutanList(updated);
    logActionAndSave(isEdit ? 'EDIT_KAS_ANGKUTAN' : 'TAMBAH_KAS_ANGKUTAN', `Kas Angkutan: ${item.category} (Rp ${item.amount})`, { newKasAngkut: updated });
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
        logActionAndSave('HAPUS_KAS_ANGKUTAN', `Hapus Kas Angkutan ID: ${id}`, { newKasAngkut: updated });
        setConfirmConfig(null);
      }
    });
  };

  // Kas Umum Handlers
  const handleAddKasUmum = (item, isEdit = false) => {
    const updated = isEdit 
      ? kasUmumList.map(i => i.id === item.id ? item : i)
      : [item, ...kasUmumList];
    setKasUmumList(updated);
    logActionAndSave(isEdit ? 'EDIT_KAS_UMUM' : 'TAMBAH_KAS_UMUM', `Kas Umum: ${item.category} (Rp ${item.amount})`, { newKasUmum: updated });
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
        logActionAndSave('HAPUS_KAS_UMUM', `Hapus Kas Umum ID: ${id}`, { newKasUmum: updated });
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
      />

      <main className="main-container">
        {activeTab === 'dashboard' && (
          <DashboardView 
            selectedBranch={selectedBranch} penebusanList={penebusanList}
            doList={doList} penyaluranList={penyaluranList}
            fertilizers={fertilizers} onNavigate={(tab) => setActiveTab(tab)}
            onAddNew={handleOpenNewTransaction}
            onOpenPrint={handleOpenPrint} settings={settings}
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
          />
        )}
        {activeTab === 'penyaluran_kios' && (
          <PenyaluranKiosView 
            selectedBranch={selectedBranch} penyaluranList={penyaluranList}
            kiosks={kiosks} payments={payments} deposits={deposits} onAddNew={handleOpenNewTransaction}
            onEdit={(type, item) => handleOpenEditItem(type, item)}
            onDelete={handleDeleteItem} onDeleteMultiple={handleDeleteMultiple} onOpenPrint={handleOpenPrint} settings={settings}
            onNavigate={(tab) => setActiveTab(tab)}
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
              onDeleteMultiple={handleDeleteMultiple}
              settings={settings}
              onNavigate={(tab) => setActiveTab(tab)}
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
          />
        )}
        {activeTab === 'kas_umum' && (
          <KasUmumView 
            selectedBranch={selectedBranch}
            kasUmumList={kasUmumList}
            onAddKasUmum={handleAddKasUmum}
            onDeleteKasUmum={handleDeleteKasUmum}
            settings={settings}
          />
        )}
        {activeTab === 'stok_mutasi' && (
          <StokMutasiView 
            selectedBranch={selectedBranch} penebusanList={penebusanList}
            doList={doList} penyaluranList={penyaluranList} fertilizers={fertilizers}
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
    </div>
  );
}
