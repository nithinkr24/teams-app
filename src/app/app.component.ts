import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { app } from '@microsoft/teams-js';

@Component({
  selector: 'app-root',
  template: `
    <div class="app-container">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .app-container {
      height: 100vh;
      width: 100vw;
    }
  `]
})
export class AppComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit() {
    this.initializeTeams();
  }

  private async initializeTeams() {
    try {
      await app.initialize();
    } catch (error) {
      console.error('Failed to initialize Teams SDK:', error);
    }
  }
}
