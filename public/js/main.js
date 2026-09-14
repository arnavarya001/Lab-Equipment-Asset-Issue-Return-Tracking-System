// Simple client-side helper to enhance user experience
document.addEventListener('DOMContentLoaded', () => {
  // Automatically restrict return date picker to today or future dates
  const returnDateInput = document.getElementById('expectedReturnDate');
  if (returnDateInput) {
    const today = new Date().toISOString().split('T')[0];
    returnDateInput.setAttribute('min', today);
  }

  // Real-time stock limit check on request form
  const quantityInput = document.getElementById('quantity');
  const availableSpan = document.getElementById('maxAvailable');
  if (quantityInput && availableSpan) {
    const max = parseInt(availableSpan.textContent, 10);
    quantityInput.addEventListener('input', () => {
      const val = parseInt(quantityInput.value, 10);
      if (val > max) {
        quantityInput.setCustomValidity(`Quantity cannot exceed available units (${max})`);
      } else {
        quantityInput.setCustomValidity('');
      }
    });
  }
});
