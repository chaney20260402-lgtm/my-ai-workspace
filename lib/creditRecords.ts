export interface CreditRecord {
  id: string;
  type: 'recharge' | 'consume' | 'refund';
  amount: number;
  balance: number;
  description: string;
  createdAt: string;
}

/**
 * 获取所有积分记录
 */
export function getCreditRecords(): CreditRecord[] {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem('creditRecords');
  return saved ? JSON.parse(saved) : [];
}

/**
 * 添加一条积分记录
 */
export function addCreditRecord(
  type: 'recharge' | 'consume' | 'refund',
  amount: number,
  balance: number,
  description: string
) {
  if (typeof window === 'undefined') return;
  const records = getCreditRecords();
  const newRecord: CreditRecord = {
    id: Date.now().toString(),
    type,
    amount,
    balance,
    description,
    createdAt: new Date().toISOString(),
  };
  records.unshift(newRecord);
  localStorage.setItem('creditRecords', JSON.stringify(records));
}