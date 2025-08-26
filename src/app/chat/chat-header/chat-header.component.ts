import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-chat-header',
  template: `
    <div class="chat-header">
      <div class="header-content">
        <div class="persona-info">
          <div class="avatar">{{ personaName.charAt(0).toUpperCase() }}</div>
          <div class="persona-details">
            <div class="persona-name">{{ personaName }}</div>
            <div class="thread-status" [ngClass]="getStatusClass()">
              {{ getStatusText() }}
            </div>
          </div>
        </div>
        
        <button 
          *ngIf="threadStatus === 'active'"
          class="resolve-button"
          (click)="handleResolveChat()">
          Resolve
        </button>
      </div>
    </div>
  `,
  styles: [`
    .chat-header {
      padding: 16px;
      border-bottom: 1px solid #e1dfdd;
      background-color: #ffffff;
    }
    
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .persona-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: #0078d4;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 16px;
    }
    
    .persona-details {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .persona-name {
      font-weight: 600;
      font-size: 16px;
      color: #323130;
    }
    
    .thread-status {
      font-size: 12px;
      font-weight: 500;
      padding: 2px 8px;
      border-radius: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .thread-status.active {
      background-color: #dff6dd;
      color: #107c10;
    }
    
    .thread-status.resolved {
      background-color: #fce4ec;
      color: #c2185b;
    }
    
    .resolve-button {
      background-color: #0078d4;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
      transition: background-color 0.2s;
    }
    
    .resolve-button:hover {
      background-color: #106ebe;
    }
    
    .resolve-button:active {
      background-color: #005a9e;
    }
  `]
})
export class ChatHeaderComponent {
  @Input() personaName: string = '';
  @Input() threadStatus: string = '';
  
  @Output() onResolveChat = new EventEmitter<void>();
  
  handleResolveChat(): void {
    this.onResolveChat.emit();
  }
  
  getStatusClass(): string {
    return this.threadStatus === 'active' ? 'active' : 'resolved';
  }
  
  getStatusText(): string {
    return this.threadStatus === 'active' ? 'Active' : 'Resolved';
  }
}
