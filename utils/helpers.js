function validateTrackingCode(code) {
  if (!code) return true;
  const pattern = /^[A-Z]{2}\d{9}[A-Z]{2}$/i;
  return pattern.test(code);
}

function formatPrice(amount) {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
}

module.exports = {
  validateTrackingCode,
  formatPrice
};