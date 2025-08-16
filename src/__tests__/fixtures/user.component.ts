import { Component } from '@angular/core';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent {
  user: any;
  
  constructor() {}
  
  ngOnInit() {
    // Component logic here
  }
}
