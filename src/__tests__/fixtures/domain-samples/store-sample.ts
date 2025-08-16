// Sample store file - should detect as -store
import { signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export const userStore = signal<User[]>([]);
export const loading$ = new BehaviorSubject<boolean>(false);

export class AppStore {
  private state$ = new BehaviorSubject<any>({});

  select(key: string) {
    return this.state$.value[key];
  }

  dispatch(action: any) {
    // Store dispatch logic
  }

  update(newState: any) {
    this.state$.next({ ...this.state$.value, ...newState });
  }

  getState() {
    return this.state$.value;
  }
}

export const cartStore = {
  items: signal([]),
  total: signal(0)
};
