import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isLoggedIn = false;
  
  login(credentials: any) {
    this.isLoggedIn = true;
    return true;
  }
  
  logout() {
    this.isLoggedIn = false;
  }
  
  isAuthenticated() {
    return this.isLoggedIn;
  }
}
