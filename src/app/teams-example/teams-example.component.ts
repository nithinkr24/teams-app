import { Component, OnInit } from '@angular/core';
import { app, authentication } from '@microsoft/teams-js';

@Component({
  selector: 'app-teams-example',
  template: `
    <div class="teams-example-container">
      <h2>Teams SDK Example</h2>
      
      <div class="teams-info">
        <h3>Teams Context</h3>
        <p><strong>Context Available:</strong> {{ teamsContext ? 'Yes' : 'No' }}</p>
        <p><strong>User Available:</strong> {{ userInfo ? 'Yes' : 'No' }}</p>
        
        <h3>User Info</h3>
        <p><strong>User ID:</strong> {{ userInfo?.objectId || 'Loading...' }}</p>
        <p><strong>Display Name:</strong> {{ userInfo?.displayName || 'Loading...' }}</p>
        <p><strong>User Principal Name:</strong> {{ userInfo?.userPrincipalName || 'Loading...' }}</p>
      </div>
      
      <div class="teams-actions">
        <h3>Teams Actions</h3>
        <button (click)="getContext()" [disabled]="isLoading">Get Context</button>
        <button (click)="getAuthToken()" [disabled]="isLoading">Get Auth Token</button>
        <button (click)="testTeamsFeatures()" [disabled]="isLoading">Test Teams Features</button>
      </div>
      
      <div class="status" *ngIf="statusMessage">
        <p>{{ statusMessage }}</p>
      </div>
    </div>
  `,
  styles: [`
    .teams-example-container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    
    .teams-info, .teams-actions {
      margin: 20px 0;
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 8px;
    }
    
    .teams-actions button {
      margin: 5px;
      padding: 10px 15px;
      background-color: #0078d4;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .teams-actions button:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }
    
    .teams-actions button:hover:not(:disabled) {
      background-color: #106ebe;
    }
    
    .status {
      margin-top: 20px;
      padding: 15px;
      background-color: #f0f0f0;
      border-radius: 4px;
    }
  `]
})
export class TeamsExampleComponent implements OnInit {
  teamsContext: any = null;
  userInfo: any = null;
  isLoading = false;
  statusMessage = '';

  constructor() {}

  ngOnInit() {
    this.initializeTeams();
  }

  private async initializeTeams() {
    try {
      this.isLoading = true;
      this.statusMessage = 'Initializing Teams SDK...';
      
      // Initialize Teams SDK
      await app.initialize();
      this.statusMessage = 'Teams SDK initialized successfully!';
      
      // Get initial context
      await this.getContext();
      
      // Get user info
      await this.getUserInfo();
      
    } catch (error) {
      console.error('Failed to initialize Teams:', error);
      this.statusMessage = `Failed to initialize Teams: ${error}`;
    } finally {
      this.isLoading = false;
    }
  }

  async getContext() {
    try {
      this.isLoading = true;
      this.statusMessage = 'Getting Teams context...';
      
      this.teamsContext = await app.getContext();
      this.statusMessage = 'Teams context retrieved successfully!';
      
      console.log('Teams context:', this.teamsContext);
    } catch (error) {
      console.error('Failed to get Teams context:', error);
      this.statusMessage = `Failed to get Teams context: ${error}`;
    } finally {
      this.isLoading = false;
    }
  }

  async getUserInfo() {
    try {
      this.isLoading = true;
      this.statusMessage = 'Getting user info...';
      
      const context = await app.getContext();
      if (!context.user) {
        console.error('User context is undefined');
        this.statusMessage = 'User context not available';
        return;
      }
      
      this.userInfo = {
        objectId: context.user.id,
        displayName: context.user.displayName,
        userPrincipalName: context.user.userPrincipalName
      };
      
      this.statusMessage = 'User info retrieved successfully!';
    } catch (error) {
      console.error('Failed to get user info:', error);
      this.statusMessage = `Failed to get user info: ${error}`;
    } finally {
      this.isLoading = false;
    }
  }

  async getAuthToken() {
    try {
      this.isLoading = true;
      this.statusMessage = 'Getting auth token...';
      
      // Example of getting an authentication token
      const token = await authentication.getAuthToken();
      
      this.statusMessage = `Auth token retrieved! (Length: ${token.length})`;
      console.log('Auth token:', token);
    } catch (error) {
      console.error('Failed to get auth token:', error);
      this.statusMessage = `Failed to get auth token: ${error}`;
    } finally {
      this.isLoading = false;
    }
  }

  async testTeamsFeatures() {
    try {
      this.isLoading = true;
      this.statusMessage = 'Testing Teams features...';
      
      // Test various Teams SDK capabilities
      const context = await app.getContext();
      const features = {
        contextKeys: Object.keys(context),
        appKeys: context.app ? Object.keys(context.app) : [],
        user: context.user ? {
          id: context.user.id,
          displayName: context.user.displayName
        } : null
      };
      
      this.statusMessage = `Teams features test completed! Available context keys: ${features.contextKeys.join(', ')}`;
      console.log('Teams features test:', features);
    } catch (error) {
      console.error('Failed to test Teams features:', error);
      this.statusMessage = `Failed to test Teams features: ${error}`;
    } finally {
      this.isLoading = false;
    }
  }
}
