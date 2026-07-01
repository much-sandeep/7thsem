export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-NP', {
    style: 'currency',
    currency: 'NPR',
  }).format(Number(amount) || 0);

export default formatCurrency;
