import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { ThreadItem } from '../../services/threads.service';
import { formatTimestampForThread } from '../../utils/datetime.utils';

@Component({
  selector: 'app-thread-list',
  templateUrl: './thread-list.html',
  styles: [`
    .thread-list-container {
      width: 300px;
      min-width: 250px;
      max-width: 350px;
      border-right: 1px solid #e1dfdd;
      display: flex;
      flex-direction: column;
      background-color: #faf9f8;
      height: 100vh;
      overflow: hidden;
    }
    
    .thread-list-content {
      flex: 1;
      overflow-y: auto;
      scrollbar-width: thin;
      -ms-overflow-style: -ms-autohiding-scrollbar;
    }
    
    .thread-list-content::-webkit-scrollbar {
      width: 6px;
    }
    
    .thread-list-content::-webkit-scrollbar-thumb {
      background-color: #c8c6c4;
      border-radius: 3px;
    }
    
    .thread-list-content::-webkit-scrollbar-track {
      background-color: transparent;
    }
    
    .assigned-to-me-label {
      padding: 16px;
      font-weight: 600;
      color: #605e5c;
      border-bottom: 1px solid #e1dfdd;
      position: sticky;
      top: 0;
      background-color: #faf9f8;
      z-index: 1;
    }
    
    .thread-list {
      padding: 0;
    }
    
    .thread-item {
      padding: 12px 16px;
      cursor: pointer;
      border-bottom: 1px solid #e1dfdd;
      transition: background-color 0.2s;
    }
    
    .thread-item:hover {
      background-color: #f3f2f1;
    }
    
    .thread-item.selected {
      background-color: #deecf9;
      border-left: 3px solid #0078d4;
    }
    
    .thread-item.unselected {
      background-color: transparent;
    }
    
    .thread-item-content {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .persona {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background-color: #0078d4;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
    }
    
    .persona-name {
      font-weight: 500;
      color: #323130;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 200px;
    }
    
    .timestamp {
      font-size: 12px;
      color: #605e5c;
      margin-left: 44px;
    }
    
    .no-threads-label {
      padding: 16px;
      text-align: center;
      color: #605e5c;
      font-style: italic;
    }
  `]
})
export class ThreadListComponent implements OnInit, OnDestroy {
  @Input() threads: ThreadItem[] = [];
  @Input() isLoading: boolean = false;
  @Input() selectedThreadId?: string;
  @Input() tabs: string[] = [];
  @Input() selectedTab: string = '';
  
  @Output() onThreadSelected = new EventEmitter<string>();
  @Output() onStatusTabSelected = new EventEmitter<string>();
  
  private destroy$ = new Subject<void>();
  currentDate = new Date();
  
  constructor() {}
  
  ngOnInit() {
    // Select the first thread when the component is mounted
    if (!this.selectedThreadId && this.threads && this.threads.length > 0) {
      const firstThread = this.threads.find(thread => thread.status === this.selectedTab.toLowerCase());
      if (firstThread) {
        this.handleOnThreadSelected(firstThread.id);
      }
    }
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  handleOnThreadSelected(threadId: string): void {
    console.log('Thread selected in ThreadListComponent:', threadId);
    this.onThreadSelected.emit(threadId);
  }
  
  handleOnStatusTabSelected(tabValue: string): void {
    this.onStatusTabSelected.emit(tabValue);
  }
  
  getCurrentStatusThreads(): ThreadItem[] {
    return this.threads.filter(thread => thread.status === this.selectedTab.toLowerCase());
  }
  
  getThreadItemContainerStyle(threadId: string): string {
    return threadId === this.selectedThreadId ? 'selected' : 'unselected';
  }
  
  formatTimestampForThread(timestamp: Date, now: Date): string {
    return formatTimestampForThread(timestamp, now);
  }
}
