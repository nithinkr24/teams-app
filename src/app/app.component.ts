import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { app } from '@microsoft/teams-js';
import { CommonService } from './services/common.service';

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
  constructor(
    private router: Router,
    private commonService: CommonService
  ) {
    this.commonService.removeCookie('RedirectURL');
  }

  ngOnInit() {
    this.initializeTeams();

    window.addEventListener('storage', (event: StorageEvent) => {
      if (event.key === 'allCookies' && event.newValue) {

         const allCookies = JSON.parse(event.newValue);
        
        this.handleAuthentication(allCookies);
      }
    });
  }

  private async initializeTeams() {
    try {
      await app.initialize();
    } catch (error) {
      console.error('Failed to initialize Teams SDK:', error);
    }
  }

  private handleAuthentication(allCookies: any) {
     for (const key in allCookies) {
      if (Object.prototype.hasOwnProperty.call(allCookies, key)) {
        document.cookie = `${key}=${allCookies[key]}; path=/; Secure; SameSite=Lax` ;
      }
    }
    // document.cookie = `AuthToken=${token}; path=/; Secure; SameSite=Lax`;

    console.log('Cookie has been set successfully.');

    // Clear localStorage
    localStorage.removeItem('allCookies');
    console.log('Local storage value has been cleared.');

    // Re-initialize Teams app if needed
    this.initializeTeams();
  }
}
