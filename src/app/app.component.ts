import { Component, OnInit } from '@angular/core';
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
    private commonService: CommonService
  ) {
    this.commonService.removeCookie('RedirectURL');
  }

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
