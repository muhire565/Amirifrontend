export const ORDER_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  SERVED: 'served',
  BILLED: 'billed',
  PAID: 'paid',
  CANCELLED: 'cancelled',
  VOIDED: 'voided'
};

export const STATUS_COLORS = {
  [ORDER_STATUSES.PENDING]: 'slate',
  [ORDER_STATUSES.CONFIRMED]: 'blue',
  [ORDER_STATUSES.PREPARING]: 'amber',
  [ORDER_STATUSES.READY]: 'teal',
  [ORDER_STATUSES.SERVED]: 'purple',
  [ORDER_STATUSES.BILLED]: 'orange',
  [ORDER_STATUSES.PAID]: 'green',
  [ORDER_STATUSES.CANCELLED]: 'red',
  [ORDER_STATUSES.VOIDED]: 'red'
};

export const STATUS_LABELS = {
  [ORDER_STATUSES.PENDING]: 'Pending',
  [ORDER_STATUSES.CONFIRMED]: 'Confirmed',
  [ORDER_STATUSES.PREPARING]: 'Preparing',
  [ORDER_STATUSES.READY]: 'Ready',
  [ORDER_STATUSES.SERVED]: 'Served',
  [ORDER_STATUSES.BILLED]: 'Billed',
  [ORDER_STATUSES.PAID]: 'Paid',
  [ORDER_STATUSES.CANCELLED]: 'Cancelled',
  [ORDER_STATUSES.VOIDED]: 'Voided'
};

const STATUS_ORDER = [
  ORDER_STATUSES.PENDING,
  ORDER_STATUSES.CONFIRMED,
  ORDER_STATUSES.PREPARING,
  ORDER_STATUSES.READY,
  ORDER_STATUSES.SERVED,
  ORDER_STATUSES.BILLED,
  ORDER_STATUSES.PAID
];

export const isValidTransition = (from, to) => {
  const fromIndex = STATUS_ORDER.indexOf(from);
  const toIndex = STATUS_ORDER.indexOf(to);
  
  if (from === ORDER_STATUSES.CANCELLED || from === ORDER_STATUSES.VOIDED) return false;
  if (to === ORDER_STATUSES.CANCELLED || to === ORDER_STATUSES.VOIDED) return true;
  
  return toIndex > fromIndex;
};

export const getNextStatus = (current) => {
  const index = STATUS_ORDER.indexOf(current);
  if (index === -1 || index === STATUS_ORDER.length - 1) return null;
  return STATUS_ORDER[index + 1];
};

export const isTerminal = (status) => {
  return [ORDER_STATUSES.PAID, ORDER_STATUSES.VOIDED, ORDER_STATUSES.CANCELLED].includes(status);
};
