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
    // Initialize Teams integration
    this.initializeTeams();
  }

  private async initializeTeams() {
    try {
      // Initialize Teams SDK
      await app.initialize();
      console.log('Teams SDK initialized successfully');
      
      // Get Teams context
      const context = await app.getContext();
      console.log('Teams context:', context);
    } catch (error) {
      console.error('Failed to initialize Teams SDK:', error);
    }
  }
}
