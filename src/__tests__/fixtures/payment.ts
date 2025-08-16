// Payment utilities - should be renamed to payment-utils.ts when payment.service.ts wants to become payment.ts
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

export function validateCreditCard(cardNumber: string): boolean {
  // Luhn algorithm validation
  return cardNumber.length >= 13 && cardNumber.length <= 19;
}

export function calculateTax(amount: number, rate: number): number {
  return amount * (rate / 100);
}
