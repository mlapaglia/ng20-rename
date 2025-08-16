// Sample enum file - should detect as -enum
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended'
}

export enum OrderType {
  ONLINE,
  OFFLINE,
  SUBSCRIPTION
}

export enum PaymentState {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}
