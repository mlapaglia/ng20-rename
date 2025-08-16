import { Injectable, HttpClient } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  constructor(private http: HttpClient) {}
  
  processPayment(paymentData: any) {
    return this.http.post('/api/payments/process', paymentData);
  }
  
  getPaymentHistory(userId: string) {
    return this.http.get(`/api/payments/history/${userId}`);
  }
  
  refundPayment(paymentId: string) {
    return this.http.post(`/api/payments/${paymentId}/refund`, {});
  }
}
