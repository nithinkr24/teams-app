import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';

@Component({
  selector: 'app-toast-notification',
  template: `
    <div *ngIf="showToast" class="toast-container">
      <div class="toast">
        <div class="toast-content">
          <div class="toast-icon">✅</div>
          <div class="toast-message">
            <div class="toast-title">Chat Resolved</div>
            <div class="toast-body">{{ toastBodyMessage }}</div>
          </div>
          <button class="toast-close" (click)="hideToast()">×</button>
        </div>
        <div class="toast-actions">
          <button class="view-thread-button" (click)="handleViewThread()">
            View Thread
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      animation: slideIn 0.3s ease-out;
    }
    
    .toast {
      background-color: #ffffff;
      border: 1px solid #e1dfdd;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      min-width: 300px;
      max-width: 400px;
    }
    
    .toast-content {
      display: flex;
      align-items: flex-start;
      padding: 16px;
      gap: 12px;
    }
    
    .toast-icon {
      font-size: 20px;
      margin-top: 2px;
    }
    
    .toast-message {
      flex: 1;
    }
    
    .toast-title {
      font-weight: 600;
      color: #323130;
      margin-bottom: 4px;
    }
    
    .toast-body {
      color: #605e5c;
      font-size: 14px;
      line-height: 1.4;
    }
    
    .toast-close {
      background: none;
      border: none;
      font-size: 20px;
      color: #605e5c;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background-color 0.2s;
    }
    
    .toast-close:hover {
      background-color: #f3f2f1;
    }
    
    .toast-actions {
      padding: 0 16px 16px;
      border-top: 1px solid #e1dfdd;
      padding-top: 12px;
    }
    
    .view-thread-button {
      background-color: #0078d4;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
      transition: background-color 0.2s;
      width: 100%;
    }
    
    .view-thread-button:hover {
      background-color: #106ebe;
    }
    
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `]
})
export class ToastNotificationComponent implements OnInit {
  @Input() toasterId: string = '';
  @Input() showToast: boolean = false;
  @Input() toastBodyMessage: string = '';
  
  @Output() onViewThread = new EventEmitter<string>();
  
  ngOnInit() {
    // Auto-hide toast after 5 seconds
    if (this.showToast) {
      setTimeout(() => {
        this.hideToast();
      }, 5000);
    }
  }
  
  hideToast(): void {
    this.showToast = false;
  }
  
  handleViewThread(): void {
    this.onViewThread.emit(this.toasterId);
    this.hideToast();
  }
}
