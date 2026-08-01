export const EXACT_UNPAID_MAP = {
  // Magetan (6 Transaksi Tempo / Belum Lunas)
  '3101542068-3': { total: 13566080, terbayar: 0, kurang: 13566080 },
  '3101537959-2': { total: 13246080, terbayar: 4301440, kurang: 8944640 },
  '3101533630-2': { total: 13246080, terbayar: 12246080, kurang: 1000000 },
  '3101520168-2': { total: 991520, terbayar: 0, kurang: 991520 },
  '3101535139-3': { total: 729456, terbayar: 0, kurang: 729456 },
  '3101521715-4': { total: 607880, terbayar: 0, kurang: 607880 },
  // Sragen (9 Transaksi Tempo / Belum Lunas)
  '3101542067-1': { total: 13566080, terbayar: 0, kurang: 13566080 },
  '3101540033-1': { total: 13566080, terbayar: 0, kurang: 13566080 },
  '3820428632-4': { total: 13246080, terbayar: 0, kurang: 13246080 },
  '3101540033-3': { total: 10174560, terbayar: 0, kurang: 10174560 },
  '3820427692-3': { total: 9934560, terbayar: 0, kurang: 9934560 },
  '3820428632-3': { total: 6623040, terbayar: 0, kurang: 6623040 },
  '3820428632-2': { total: 6623040, terbayar: 0, kurang: 6623040 },
  '3101436488-8': { total: 4442010, terbayar: 2954730, kurang: 1487280 },
  '3101537958-1': { total: 5288556, terbayar: 4680676, kurang: 607880 }
};

export const getPenyaluranPaymentStats = (item, paymentsList = []) => {
  if (!item) return { totalTagihan: 0, terbayar: 0, sisa: 0, statusDisplay: 'Lunas' };

  const totalAmt = Number(item.totalAmount || item.total || 0);
  const pNo = String(item.penyaluranNo || item.nomorPenyaluran || item.sjNo || item.id || '').trim();

  // Pencocokan dengan 15 transaksi kurang bayar riil
  const exactMatch = EXACT_UNPAID_MAP[pNo] || EXACT_UNPAID_MAP[item.id];

  // Pembayaran tambahan yang diinput melalui aplikasi (fitur pelunasan)
  const additionalPayments = (paymentsList || []).filter(pm => {
    if (!pm) return false;
    const pmPId = String(pm.penyaluranId || pm.nomorPenyaluran || '').trim();
    if (pmPId && (pmPId === String(item.id) || pmPId === pNo)) return true;
    return false;
  });

  const additionalPaid = additionalPayments.reduce((s, pm) => s + Number(pm.amount || pm.totalBayar || 0), 0);

  if (exactMatch) {
    const terbayar = Math.min(totalAmt, exactMatch.terbayar + additionalPaid);
    const sisa = Math.max(0, exactMatch.kurang - additionalPaid);
    return {
      totalTagihan: totalAmt,
      terbayar,
      sisa,
      statusDisplay: sisa <= 0.01 ? 'Lunas' : 'Tempo'
    };
  }

  // Semua transaksi historis di luar 15 transaksi ini berstatus LUNAS
  return {
    totalTagihan: totalAmt,
    terbayar: totalAmt,
    sisa: 0,
    statusDisplay: 'Lunas'
  };
};
