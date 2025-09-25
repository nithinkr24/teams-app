import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { TeamsFxService } from '../../teams-fx.service';
import { ThreadsService, ThreadItemStatus } from '../../services/threads.service';
import { AgentService } from '../../services/agent.service';

@Component({
  selector: 'app-agent-screen',
  templateUrl: 'agent-screen.component.html',
  styleUrl: 'agent-screen.component.css'
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
      const userInfo = await this.teamsFxService.getUserInfo();
      if (!userInfo) {
        this.errorMessage = 'Failed to get Teams user info';
        this.showErrorMessage(this.errorMessage);
        return;
      }
      
      const getSalesRepInfo = await this.agentService.getSalesRepInfo(userInfo.objectId);
      if (!getSalesRepInfo) {
        this.errorMessage = 'Failed to get sales rep info';
        this.showErrorMessage(this.errorMessage);
        return;
      }
      const agentACSUser = await this.agentService.getAgentACSUser(userInfo.objectId);
      if (!agentACSUser) {
        this.errorMessage = 'Failed to link to ACS user';
        this.showErrorMessage(this.errorMessage);
        return;
      }
      this.endpointUrl = await this.agentService.getEndpointUrl();
      const tokenResponse = await this.agentService.getToken(agentACSUser.acsUserId);
      this.token = tokenResponse.token;
      this.userId = agentACSUser.acsUserId;
      this.displayName = agentACSUser.displayName;
      
      await this.threadsService.initializeChatClient(this.userId, this.token, this.endpointUrl);
    } catch (error) {
      this.errorMessage = 'Failed to initialize screen';
      this.showErrorMessage(this.errorMessage);
    }
  }
  
  private showErrorMessage(message: string): void {
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
      });

    this.threadsService.selectedThreadId$
      .pipe(takeUntil(this.destroy$))
      .subscribe(threadId => {
        this.selectedThreadId = threadId;
      });

    this.threadsService.resolvedThreadId$
      .pipe(takeUntil(this.destroy$))
      .subscribe(threadId => {
        this.resolvedThreadId = threadId;
      });

    this.threadsService.isLoading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.isLoading = loading;
      });
  }

  setSelectedThreadId(threadId: string) {
    this.threadsService.setSelectedThreadId(threadId);
  }

  handleOnResolveChat(threadId: string) {
    
    this.threadsService.updateThreadStatusExternal(threadId, ThreadItemStatus.RESOLVED);
    
    const nextActiveThreadId = this.threadsService.getNextActiveThreadIdFromService(threadId);
    if (nextActiveThreadId) {
      this.setSelectedThreadId(nextActiveThreadId);
    } else {
      console.log('No next active thread found');
    }
  }

  handleOnViewThread(threadId: string) {
    this.setSelectedThreadId(threadId);
    
    const thread = this.threads.find(t => t.id === threadId);
    if (thread && thread.status === ThreadItemStatus.RESOLVED) {
      this.selectedTab = this.tabs[1]; 
    }
    
    if (this.resolvedThreadId === threadId) {
      this.threadsService.setResolvedThreadId(undefined);
    }
  }

  handleOnStatusTabSelected(tabValue: string) {
    this.selectedTab = tabValue;
    
    const status = tabValue.toLowerCase() as ThreadItemStatus;
    const firstThreadOfSelectedTab = this.threads.find(thread => thread.status === status);
    
    if (firstThreadOfSelectedTab) {
      this.setSelectedThreadId(firstThreadOfSelectedTab.id);
    } else {
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
