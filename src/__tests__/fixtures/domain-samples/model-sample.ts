// Sample model file - should detect as -model
export class User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
}

export class Order {
  id: number;
  customerId: number;
  items: OrderItem[];
}
