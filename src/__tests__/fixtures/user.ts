// User model - should be renamed to user-model.ts when user.component.ts wants to become user.ts
export class User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  notifications: boolean;
}
