/* Master contoh untuk TES — item = SKU polybag yang sama dengan Config.gs (DUMMY_ITEM),
   supplier/customer diisi nama contoh. TIDAK dipakai di deploy sungguhan. */
DUMMY_SUPPLIER = [
  ['SUP-001','PT Sumber Biji Plastik',   'Biji plastik KW / Super / Super Plus','YA'],
  ['SUP-002','CV Warna Pigmen Jaya',     'Pigmen & antifoam',                  'YA'],
  ['SUP-003','UD Daur Ulang Makmur',     'Jasa chassen (BS → biji plastik)',   'YA'],
  ['SUP-004','Toko Kimia Sentosa',       'Antifoam & bahan pembantu',          'YA']
];
DUMMY_CUSTOMER = [
  ['CUS-001','PT Nursery Hijau Lestari', 'Polybag pembibitan',   'YA'],
  ['CUS-002','Toko Tani Sejahtera',      'Grosir polybag',       'YA'],
  ['CUS-003','Koperasi Perkebunan Sawit','Polybag bibit sawit',  'YA'],
  ['CUS-004','Ekspor — Green Trading',   'Ekspor curah',         'YA']
];

/* v11.1: akun bawaan tidak punya Staff Gudang lagi; tes peran STAF tetap memakai akun ini */
DUMMY_PENGGUNA = [
  ['', 'Admin',        PERAN.ADMIN,      'HQ',       '1234', 'YA', ''],
  ['', 'Direktur',     PERAN.ADMIN,      'HQ',       '2468', 'YA', ''],
  ['', 'Manager',      PERAN.SUPERVISOR, 'GBJ',      '1357', 'YA', ''],
  ['', 'Yansen',       PERAN.SUPERVISOR, 'Purchasing','2211', 'YA', 'PO,SO,GUDANG'],
  ['', 'Deny',         PERAN.SUPERVISOR, 'Sales',    '3322', 'YA', 'SO'],
  ['', 'Bastari',      PERAN.SUPERVISOR, 'Produksi', '4433', 'YA', 'PRODUKSI'],
  ['', 'Staff Gudang', PERAN.STAF,       'GBJ',      '1111', 'YA', 'GUDANG']
];
