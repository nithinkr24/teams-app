import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-error-screen',
  template: `
    <div class="error-container">
      <div class="error-content">
        <div class="error-icon">⚠️</div>
        <h2 class="error-title">Something went wrong</h2>
        <p class="error-message">{{ errorMessage }}</p>
        <button class="retry-button" (click)="retry()">Try Again</button>
      </div>
    </div>
  `,
  styles: [`
    .error-container {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background-color: #faf9f8;
    }
    
    .error-content {
      text-align: center;
      max-width: 400px;
      padding: 32px;
    }
    
    .error-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    
    .error-title {
      color: #323130;
      margin-bottom: 16px;
      font-size: 24px;
      font-weight: 600;
    }
    
    .error-message {
      color: #605e5c;
      margin-bottom: 24px;
      line-height: 1.5;
    }
    
    .retry-button {
      background-color: #0078d4;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
      transition: background-color 0.2s;
    }
    
    .retry-button:hover {
      background-color: #106ebe;
    }
  `]
})
export class ErrorScreenComponent {
  @Input() errorMessage: string = 'An unexpected error occurred.';
  
  retry(): void {
    // Reload the page to retry
    window.location.reload();
  }
}
