import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private data: any[] = [];
  
  getData() {
    return this.data;
  }
  
  setData(newData: any[]) {
    this.data = newData;
  }
  
  clearData() {
    this.data = [];
  }
}
