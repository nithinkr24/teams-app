import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { TeamsFxService } from '../../teams-fx.service';
import { ThreadsService, ThreadItemStatus } from '../../services/threads.service';
import { AgentService } from '../../services/agent.service';

@Component({
  selector: 'app-agent-screen',
  template: `
    <div>
      <div *ngIf="errorMessage" class="error-container">
        <app-error-screen [errorMessage]="errorMessage"></app-error-screen>
      </div>
      
      <div *ngIf="!errorMessage" class="agent-screen-container">
        <app-toast-notification
          *ngIf="resolvedThreadId"
          [toasterId]="resolvedThreadId"
          [showToast]="!!resolvedThreadId"
          [toastBodyMessage]="resolvedThreadCustomerDisplayName || ''"
          (onViewThread)="handleOnViewThread($event)">
        </app-toast-notification>
        
        <app-thread-list
          [selectedThreadId]="selectedThreadId"
          [threads]="threads"
          [isLoading]="!endpointUrl || isLoading"
          [tabs]="tabs"
          [selectedTab]="selectedTab"
          (onThreadSelected)="setSelectedThreadId($event)"
          (onStatusTabSelected)="handleOnStatusTabSelected($event)">
        </app-thread-list>
        
        <div class="chat-container">
          <app-chat-screen
            *ngIf="selectedThreadId && token && endpointUrl && userId && displayName"
            [token]="token"
            [userId]="userId"
            [displayName]="displayName"
            [endpointUrl]="endpointUrl"
            [threadId]="selectedThreadId"
            [receiverName]="getReceiverName()"
            [threadStatus]="getThreadStatus()"
            (onResolveChat)="handleOnResolveChat($event)">
          </app-chat-screen>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .agent-screen-container {
      display: flex;
      height: 100vh;
      min-height: 500px;
      max-height: 100vh;
      overflow: hidden;
    }
    
    .chat-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
    }
    
    .error-container {
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    /* Responsive adjustments */
    @media (max-width: 768px) {
      .agent-screen-container {
        min-height: 400px;
      }
    }
    
    @media (max-width: 480px) {
      .agent-screen-container {
        min-height: 300px;
      }
    }
  `]
})
export class AgentScreenComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  token: string = '';
  userId: string = '';
  displayName: string = '';
  endpointUrl: string = '';
  errorMessage: string | undefined;
  
  tabs = ['Active', 'Resolved'];
  selectedTab: string = 'Active';
  
  threads: any[] = [];
  selectedThreadId: string | undefined;
  resolvedThreadId: string | undefined;
  isLoading: boolean = false;

  constructor(
    private teamsFxService: TeamsFxService,
    private threadsService: ThreadsService,
    private agentService: AgentService
  ) {}

  ngOnInit() {
    this.initializeScreen();
    this.subscribeToThreads();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async initializeScreen() {
    try {
      console.log('Initializing agent screen...');
      
      const userInfo = await this.teamsFxService.getUserInfo();
      if (!userInfo) {
        this.errorMessage = 'Failed to get Teams user info';
        return;
      }
      
      console.log('Got Teams user info:', userInfo);

      const agentACSUser = await this.agentService.getAgentACSUser(userInfo.objectId);
      if (!agentACSUser) {
        this.errorMessage = 'Failed to link to ACS user';
        return;
      }
      
      console.log('Got agent ACS user:', agentACSUser);

      this.endpointUrl = await this.agentService.getEndpointUrl();
      const tokenResponse = await this.agentService.getToken(agentACSUser.acsUserId);
      this.token = tokenResponse.token;
      this.userId = agentACSUser.acsUserId;
      this.displayName = agentACSUser.displayName;
      
      console.log('Initialized with:', {
        endpointUrl: this.endpointUrl,
        token: this.token ? '***' : 'missing',
        userId: this.userId,
        displayName: this.displayName
      });

      // Initialize the chat client with the obtained credentials
      await this.threadsService.initializeChatClient(this.userId, this.token, this.endpointUrl);
    } catch (error) {
      console.error('Failed to set screen state due to error: ', error);
      this.errorMessage = 'Failed to initialize screen';
    }
  }
  
  // Method to refresh threads manually
  async refreshThreads() {
    try {
      console.log('Manually refreshing threads');
      await this.threadsService.refreshThreads();
    } catch (error) {
      console.error('Failed to refresh threads:', error);
      this.showErrorMessage('Failed to refresh threads. Please try again.');
    }
  }
  
  private showErrorMessage(message: string): void {
    // Create a temporary error message display
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background-color: #d13438;
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      z-index: 1000;
      font-size: 14px;
    `;
    
    document.body.appendChild(errorDiv);
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 3000);
  }

  private subscribeToThreads() {
    this.threadsService.threads$
      .pipe(takeUntil(this.destroy$))
      .subscribe(threads => {
        this.threads = threads;
        console.log('Threads loaded:', threads);
      });

    this.threadsService.selectedThreadId$
      .pipe(takeUntil(this.destroy$))
      .subscribe(threadId => {
        console.log('Selected thread ID changed to:', threadId);
        this.selectedThreadId = threadId;
      });

    this.threadsService.resolvedThreadId$
      .pipe(takeUntil(this.destroy$))
      .subscribe(threadId => {
        console.log('Resolved thread ID changed to:', threadId);
        this.resolvedThreadId = threadId;
      });

    this.threadsService.isLoading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.isLoading = loading;
      });
  }

  setSelectedThreadId(threadId: string) {
    console.log('Setting selected thread ID:', threadId);
    this.threadsService.setSelectedThreadId(threadId);
  }

  handleOnResolveChat(threadId: string) {
    console.log('Resolving chat for thread:', threadId);
    
    // Update thread status to resolved
    this.threadsService.updateThreadStatusExternal(threadId, ThreadItemStatus.RESOLVED);
    
    // Get next active thread
    const nextActiveThreadId = this.threadsService.getNextActiveThreadIdFromService(threadId);
    if (nextActiveThreadId) {
      console.log('Auto-selecting next active thread:', nextActiveThreadId);
      this.setSelectedThreadId(nextActiveThreadId);
    } else {
      console.log('No next active thread found');
    }
  }

  handleOnViewThread(threadId: string) {
    console.log('Viewing resolved thread:', threadId);
    this.setSelectedThreadId(threadId);
    
    // Change tab to resolved if needed
    const thread = this.threads.find(t => t.id === threadId);
    if (thread && thread.status === ThreadItemStatus.RESOLVED) {
      this.selectedTab = this.tabs[1]; // Resolved tab
    }
    
    // Clear resolved thread ID if it was this thread
    if (this.resolvedThreadId === threadId) {
      this.threadsService.setResolvedThreadId(undefined);
    }
  }

  handleOnStatusTabSelected(tabValue: string) {
    console.log('Status tab selected:', tabValue);
    this.selectedTab = tabValue;
    
    // Find first thread of selected status
    const status = tabValue.toLowerCase() as ThreadItemStatus;
    const firstThreadOfSelectedTab = this.threads.find(thread => thread.status === status);
    
    if (firstThreadOfSelectedTab) {
      console.log('Selecting first thread of status:', status, firstThreadOfSelectedTab.id);
      this.setSelectedThreadId(firstThreadOfSelectedTab.id);
    } else {
      console.log('No threads found for status:', status);
      this.selectedThreadId = undefined;
    }
  }

  getReceiverName(): string {
    if (!this.selectedThreadId) return '';
    const thread = this.threads.find(t => t.id === this.selectedThreadId);
    return thread?.topic || '';
  }

  getThreadStatus(): string {
    if (!this.selectedThreadId) return 'active';
    const thread = this.threads.find(t => t.id === this.selectedThreadId);
    return thread?.status || 'active';
  }

  get resolvedThreadCustomerDisplayName(): string | undefined {
    if (!this.resolvedThreadId) return undefined;
    const resolvedThread = this.threads.find(t => t.id === this.resolvedThreadId);
    return resolvedThread?.topic;
  }
}
