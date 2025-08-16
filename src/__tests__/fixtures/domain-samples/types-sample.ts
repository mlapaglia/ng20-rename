// Sample types file - should detect as -types
export type UserRole = 'admin' | 'user' | 'guest';

export type ApiResponse<T> = {
  data: T;
  status: number;
  message?: string;
};

export type PaymentMethod = 'credit_card' | 'paypal' | 'bank_transfer';

export type EventHandler<T> = (event: T) => void;
