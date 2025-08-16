// Sample API file - should detect as -api
import { HttpClient } from '@angular/common/http';

export const userApi = {
  getUsers: () => fetch('/api/users'),
  createUser: (user: any) => fetch('/api/users', {
    method: 'POST',
    body: JSON.stringify(user)
  }),
  updateUser: (id: string, user: any) => fetch(`/api/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(user)
  }),
  deleteUser: (id: string) => fetch(`/api/users/${id}`, {
    method: 'DELETE'
  })
};

export function requestData(endpoint: string): Promise<any> {
  return fetch(`/api/${endpoint}`).then(response => response.json());
}

export const apiClient = {
  get: (url: string) => fetch(url),
  post: (url: string, data: any) => fetch(url, { method: 'POST', body: JSON.stringify(data) })
};
