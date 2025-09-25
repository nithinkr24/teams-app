import { Injectable } from '@angular/core';
import { app, authentication } from '@microsoft/teams-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TeamsAuthService {
  private isInitialized = false;

  constructor( ) {
    this.initializeTeams();
  }

  private async initializeTeams() {
    if (this.isInitialized) return;
    
    try {
      await app.initialize();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Teams SDK:', error);
    }
  }

  async openLoginDialog(): Promise<string> {
    try {
      await this.initializeTeams();
      
      
      const loginUrl = new URL(environment.loginPath);
      return new Promise((resolve) => {
        authentication.authenticate({
          url: loginUrl.toString(),
          width: 500,
          height: 600,
          successCallback: (result: string) => {
            const response = JSON.parse(result);
            resolve(response?.jenneToken);
          },
          failureCallback: (reason: string) => {
            console.error('Login dialog was cancelled or failed:', reason);
            resolve('');
          }
        });
      });
    } catch (error) {
      console.error('Failed to open login dialog:', error);
      return '';
    }
  }

}
