export const formatUGX = (amount) => {
  if (amount === null || amount === undefined) return 'UGX 0';
  const rounded = Math.round(amount);
  return `UGX ${rounded.toLocaleString('en-UG')}`;
};
