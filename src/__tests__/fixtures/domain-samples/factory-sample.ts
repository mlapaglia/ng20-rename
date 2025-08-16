// Sample factory file - should detect as -factory
export class UserFactory {
  static createUser(data: Partial<User>): User {
    return {
      id: data.id || 0,
      name: data.name || '',
      email: data.email || '',
      ...data
    };
  }

  static buildDefaultUser(): User {
    return this.createUser({
      name: 'Anonymous',
      email: 'anonymous@example.com'
    });
  }
}

export function createApiClient(config: any): any {
  return {
    get: () => {},
    post: () => {},
    ...config
  };
}

export function makeRequest(options: any): any {
  return { ...options };
}
