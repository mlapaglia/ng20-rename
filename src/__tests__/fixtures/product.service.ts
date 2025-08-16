import { Injectable, HttpClient } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  constructor(private http: HttpClient) {}
  
  getProducts() {
    return this.http.get('/api/products');
  }
  
  getProduct(id: string) {
    return this.http.get(`/api/products/${id}`);
  }
  
  createProduct(product: any) {
    return this.http.post('/api/products', product);
  }
  
  updateProduct(id: string, product: any) {
    return this.http.put(`/api/products/${id}`, product);
  }
  
  deleteProduct(id: string) {
    return this.http.delete(`/api/products/${id}`);
  }
}
