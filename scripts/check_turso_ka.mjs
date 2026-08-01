import { getPenyaluranPaymentStats, EXACT_UNPAID_MAP } from '../src/utils/paymentStats.js';

console.log('EXACT_UNPAID_MAP entries for targets:');
['3101537958-1', '3101436488-8', '3101533630-2', '3101537959-2'].forEach(pNo => {
  console.log(pNo, EXACT_UNPAID_MAP[pNo]);
  const stats = getPenyaluranPaymentStats({ penyaluranNo: pNo, totalAmount: EXACT_UNPAID_MAP[pNo].total }, []);
  console.log(' -> stats:', stats);
});
