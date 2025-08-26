import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Subject, timer } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-toast-notification',
  template: `
    <div *ngIf="showToast" class="toast-notification" [@slideInOut]>
      <div class="toast-content">
        <div class="toast-header">
          <span class="toast-title">Chat Resolved</span>
          <button class="toast-close" (click)="closeToast()">×</button>
        </div>
        <div class="toast-body">
          <p>{{ toastBodyMessage }}</p>
        </div>
        <div class="toast-actions">
          <button class="view-thread-btn" (click)="handleViewThread()">
            View Thread
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .toast-notification {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      max-width: 350px;
      background: #ffffff;
      border: 1px solid #e1dfdd;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: slideInRight 0.3s ease-out;
    }
    
    .toast-content {
      padding: 16px;
    }
    
    .toast-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    
    .toast-title {
      font-weight: 600;
      color: #323130;
      font-size: 14px;
    }
    
    .toast-close {
      background: none;
      border: none;
      font-size: 18px;
      color: #605e5c;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
    }
    
    .toast-close:hover {
      background-color: #f3f2f1;
    }
    
    .toast-body {
      margin-bottom: 16px;
    }
    
    .toast-body p {
      margin: 0;
      color: #323130;
      font-size: 14px;
      line-height: 1.4;
    }
    
    .toast-actions {
      display: flex;
      justify-content: flex-end;
    }
    
    .view-thread-btn {
      background-color: #0078d4;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 14px;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    .view-thread-btn:hover {
      background-color: #106ebe;
    }
    
    @keyframes slideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    /* Dark mode support */
    .dark-mode .toast-notification {
      background: #1b1a19;
      border-color: #3b3a39;
    }
    
    .dark-mode .toast-title,
    .dark-mode .toast-body p {
      color: #ffffff;
    }
    
    .dark-mode .toast-close {
      color: #c8c6c4;
    }
    
    .dark-mode .toast-close:hover {
      background-color: #3b3a39;
    }
    
    /* Responsive design */
    @media (max-width: 480px) {
      .toast-notification {
        top: 10px;
        right: 10px;
        left: 10px;
        max-width: none;
      }
    }
  `],
  animations: [
    // Add animations if needed
  ]
})
export class ToastNotificationComponent implements OnInit, OnDestroy {
  @Input() toasterId: string = '';
  @Input() showToast: boolean = false;
  @Input() toastBodyMessage: string = '';
  
  @Output() onViewThread = new EventEmitter<string>();
  
  private destroy$ = new Subject<void>();
  private autoHideTimer: any;

  ngOnInit() {
    // Auto-hide toast after 5 seconds
    if (this.showToast) {
      this.autoHideTimer = timer(5000).subscribe(() => {
        this.closeToast();
      });
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.autoHideTimer) {
      this.autoHideTimer.unsubscribe();
    }
  }

  closeToast() {
    this.showToast = false;
    this.onViewThread.emit(this.toasterId);
  }

  handleViewThread() {
    this.onViewThread.emit(this.toasterId);
    this.closeToast();
  }
}
