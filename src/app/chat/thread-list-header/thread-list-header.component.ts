import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-thread-list-header',
  template: `
    <div class="thread-list-header">
      <div class="tabs">
        <div
          *ngFor="let tab of tabs"
          class="tab"
          [ngClass]="{ 'active': tab === selectedTab }"
          (click)="handleTabSelect(tab)">
          {{ tab }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .thread-list-header {
      padding: 16px;
      border-bottom: 1px solid #e1dfdd;
      background-color: #ffffff;
    }
    
    .tabs {
      display: flex;
      gap: 0;
      border: 1px solid #e1dfdd;
      border-radius: 4px;
      overflow: hidden;
    }
    
    .tab {
      flex: 1;
      padding: 8px 16px;
      text-align: center;
      cursor: pointer;
      background-color: #faf9f8;
      border-right: 1px solid #e1dfdd;
      transition: background-color 0.2s;
      font-size: 14px;
      font-weight: 500;
    }
    
    .tab:last-child {
      border-right: none;
    }
    
    .tab:hover {
      background-color: #f3f2f1;
    }
    
    .tab.active {
      background-color: #0078d4;
      color: white;
    }
    
    .tab.active:hover {
      background-color: #106ebe;
    }
  `]
})
export class ThreadListHeaderComponent {
  @Input() tabs: string[] = [];
  @Input() selectedTab: string = '';
  
  @Output() onTabSelect = new EventEmitter<string>();
  
  handleTabSelect(tab: string): void {
    this.onTabSelect.emit(tab);
  }
}
