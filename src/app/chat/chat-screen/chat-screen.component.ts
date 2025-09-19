import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { TeamsFxService } from '../../teams-fx.service';
import { AgentWorkItemService } from '../../services/agent-work-item.service';
import { ThreadItemStatus } from '../../services/threads.service';

@Component({
  selector: 'app-chat-screen',
  template: `
    <div class="chat-screen-container">
      <ng-container *ngIf="!isLoading; else loadingTemplate">
        <app-chat-header
          [personaName]="receiverName"
          [threadStatus]="threadStatus"
          (onResolveChat)="handleOnResolveChat()">
        </app-chat-header>
        
        <div class="chat-content">
          <app-chat-components 
            [isDarkMode]="isDarkMode"
            [threadId]="threadId"
            [userId]="userId"
            [token]="token"
            [endpointUrl]="endpointUrl"
            [displayName]="displayName">
          </app-chat-components>
        </div>
      </ng-container>
    </div>
    
    <ng-template #loadingTemplate>
      <app-loading-spinner></app-loading-spinner>
    </ng-template>
  `,
  styles: [`
    .chat-screen-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 400px;
      max-height: 100vh;
      background-color: #ffffff;
      overflow: hidden;
    }
    
    .chat-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-height: 0;
    }
    
    /* Responsive adjustments */
    @media (max-width: 768px) {
      .chat-screen-container {
        min-height: 300px;
      }
    }
    
    @media (max-width: 480px) {
      .chat-screen-container {
        min-height: 250px;
      }
    }
  `]
})
export class ChatScreenComponent implements OnInit, OnDestroy, OnChanges {
  @Input() token: string = '';
  @Input() userId: string = '';
  @Input() displayName: string = '';
  @Input() endpointUrl: string = '';
  @Input() threadId: string = '';
  @Input() receiverName: string = '';
  @Input() threadStatus: string = '';
  
  @Output() onResolveChat = new EventEmitter<string>();
  
  private destroy$ = new Subject<void>();
  
  isLoading: boolean = true;
  isDarkMode: boolean = false;
  
  constructor(
    private teamsFxService: TeamsFxService,
    private agentWorkItemService: AgentWorkItemService
  ) {}
  
  ngOnInit() {
    this.initializeChat();
    this.subscribeToTheme();
  }
  
  ngOnChanges(changes: SimpleChanges) {
    
    if (changes['threadId'] && !changes['threadId'].firstChange) {
    }
    
    if (changes['token'] || changes['userId'] || changes['endpointUrl'] || changes['threadId']) {
      this.initializeChat();
    }
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    
    // Cleanup
    // Restore body overflow
    document.body.style.overflow = 'auto';
  }
  
  private async initializeChat() {
    try {
      // Disable pull down to refresh
      document.body.style.overflow = 'hidden';
      
      // Set loading to false immediately since ChatComponents will handle its own initialization
      this.isLoading = false;
      
    } catch (error) {
      console.error('Failed to initialize chat screen:', error);
      this.isLoading = false;
    }
  }
  
  private subscribeToTheme() {
    this.teamsFxService.teamsContext$
      .pipe(takeUntil(this.destroy$))
      .subscribe(context => {
        this.isDarkMode = context.themeString === 'dark';
      });
  }

  async handleOnResolveChat() {
    try {
      await this.agentWorkItemService.updateAgentWorkItem(
        this.threadId, 
        ThreadItemStatus.RESOLVED
      );
      
      this.onResolveChat.emit(this.threadId);
    } catch (error) {
      console.error('Failed to resolve chat:', error);
    }
  }
}
