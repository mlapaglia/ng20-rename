// Sample interface file - should detect as -interface
export interface UserRepository {
  findById(id: number): Promise<User>;
  save(user: User): Promise<void>;
  delete(id: number): Promise<void>;
}

export interface PaymentGateway {
  processPayment(amount: number): Promise<boolean>;
  refund(transactionId: string): Promise<boolean>;
}

export interface Logger {
  info(message: string): void;
  error(message: string): void;
  warn(message: string): void;
}
