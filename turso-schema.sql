-- ============================================================
-- SKEMA DATABASE TURSO (SQLite Edge) - TANI MAKMUR BARU
-- ============================================================

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  branch TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS fertilizers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  priceBuy REAL DEFAULT 0,
  priceSell REAL DEFAULT 0,
  stock REAL DEFAULT 0,
  supplier TEXT,
  branch TEXT
);

CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT
);

CREATE TABLE IF NOT EXISTS drivers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  truckNumber TEXT,
  branch TEXT
);

CREATE TABLE IF NOT EXISTS kiosks (
  id TEXT PRIMARY KEY,
  code TEXT,
  name TEXT NOT NULL,
  owner TEXT,
  address TEXT,
  phone TEXT,
  branch TEXT
);

CREATE TABLE IF NOT EXISTS penebusan (
  id TEXT PRIMARY KEY,
  doNo TEXT NOT NULL,
  spjbNo TEXT,
  date TEXT NOT NULL,
  supplierId TEXT,
  supplierName TEXT,
  fertilizerId TEXT,
  fertilizerName TEXT,
  qtyTon REAL DEFAULT 0,
  pricePerTon REAL DEFAULT 0,
  totalAmount REAL DEFAULT 0,
  status TEXT DEFAULT 'Aktif',
  notes TEXT,
  branch TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS do_expenses (
  id TEXT PRIMARY KEY,
  doNo TEXT NOT NULL,
  penebusanId TEXT,
  date TEXT NOT NULL,
  fertilizerId TEXT,
  fertilizerName TEXT,
  qtyTon REAL DEFAULT 0,
  driverName TEXT,
  vehiclePlate TEXT,
  targetWarehouse TEXT,
  status TEXT,
  notes TEXT,
  branch TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS penyaluran (
  id TEXT PRIMARY KEY,
  penyaluranNo TEXT NOT NULL,
  nomorPenyaluran TEXT,
  sjNo TEXT,
  doRefId TEXT,
  doNo TEXT NOT NULL,
  date TEXT NOT NULL,
  kiosId TEXT,
  kiosName TEXT NOT NULL,
  fertilizerId TEXT,
  fertilizerName TEXT,
  qtyTon REAL DEFAULT 0,
  pricePerTon REAL DEFAULT 0,
  totalAmount REAL DEFAULT 0,
  dpAmount REAL DEFAULT 0,
  paymentStatus TEXT DEFAULT 'Tempo',
  driverName TEXT,
  vehiclePlate TEXT,
  deliveryStatus TEXT DEFAULT 'Tersalurkan',
  notes TEXT,
  branch TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  penyaluranId TEXT,
  doRefId TEXT,
  doNo TEXT,
  kiosName TEXT NOT NULL,
  date TEXT NOT NULL,
  amount REAL DEFAULT 0,
  paymentMethod TEXT DEFAULT 'Transfer Bank',
  notes TEXT,
  branch TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS deposits (
  id TEXT PRIMARY KEY,
  kiosId TEXT,
  kiosName TEXT NOT NULL,
  date TEXT NOT NULL,
  amount REAL DEFAULT 0,
  notes TEXT,
  branch TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS kas_angkutan (
  id TEXT PRIMARY KEY,
  branch TEXT NOT NULL,
  date TEXT NOT NULL,
  doNo TEXT,
  penyaluranNo TEXT,
  kiosName TEXT,
  driverName TEXT,
  transactionType TEXT DEFAULT 'Pengeluaran Kas Angkutan',
  description TEXT,
  amount REAL DEFAULT 0,
  adminFee REAL DEFAULT 0,
  mealFee REAL DEFAULT 0,
  palangFee REAL DEFAULT 0,
  solarFee REAL DEFAULT 0,
  driverWage REAL DEFAULT 0,
  overtimeFee REAL DEFAULT 0,
  helperFee REAL DEFAULT 0,
  otherFee REAL DEFAULT 0,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS kas_umum (
  id TEXT PRIMARY KEY,
  branch TEXT NOT NULL,
  date TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Keluar',
  category TEXT DEFAULT 'Operasional',
  description TEXT,
  amount REAL DEFAULT 0,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  user TEXT NOT NULL,
  role TEXT,
  action TEXT NOT NULL,
  details TEXT
);
