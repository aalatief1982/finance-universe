export function storeTransaction(txn: any): void {
  const key = 'transactions';
  const raw = localStorage.getItem(key);
  const items = raw ? JSON.parse(raw) : [];
  const index = items.findIndex((t: any) => t.id === txn.id);
  if (index >= 0) {
    items[index] = txn;
  } else {
    items.push(txn);
  }
  localStorage.setItem(key, JSON.stringify(items));
}
