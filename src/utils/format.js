export const formatDateTime = (dateString) => {
  if (!dateString) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
};

export const formatCurrency = (amount, currency = 'UGX') => {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatPhone = (phone) => {
  if (!phone) return '—';
  // Simple Uganda format check
  if (phone.startsWith('0') && phone.length === 10) {
    return `${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}`;
  }
  return phone;
};
