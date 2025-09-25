import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ChatClient, ChatMessageReceivedEvent, ChatThreadCreatedEvent, ChatThreadItem } from '@azure/communication-chat';
import { AzureCommunicationTokenCredential, CommunicationUserKind } from '@azure/communication-common';
import { AgentWorkItemService } from './agent-work-item.service';
import { getNextActiveThreadId } from '../utils/threadsUtils';

export interface ThreadItem {
  id: string;
  topic: string;
  lastMessageReceivedOn: Date;
  status?: ThreadItemStatus;
}

export enum ThreadItemStatus {
  ACTIVE = 'active',
  RESOLVED = 'resolved'
}

@Injectable({
  providedIn: 'root'
})
export class ThreadsService {
  private threadsSubject = new BehaviorSubject<ThreadItem[]>([]);
  private selectedThreadIdSubject = new BehaviorSubject<string | undefined>(undefined);
  private resolvedThreadIdSubject = new BehaviorSubject<string | undefined>(undefined);
  private isLoadingSubject = new BehaviorSubject<boolean>(true);
  private chatClient: ChatClient | undefined;

  public threads$ = this.threadsSubject.asObservable();
  public selectedThreadId$ = this.selectedThreadIdSubject.asObservable();
  public resolvedThreadId$ = this.resolvedThreadIdSubject.asObservable();
  public isLoading$ = this.isLoadingSubject.asObservable();

  constructor(private agentWorkItemService: AgentWorkItemService) {}

  async initializeChatClient(userId: string, token: string, endpointUrl: string): Promise<void> {
    try {
      const tokenCredential = new AzureCommunicationTokenCredential(token);
      this.chatClient = new ChatClient(endpointUrl, tokenCredential);
      await this.chatClient.startRealtimeNotifications();
      
      this.addChatClientListeners(userId);
      
      await this.fetchThreads(true);
    } catch (error) {
      console.error('Failed to initialize chat client:', error);
    }
  }

  private addChatClientListeners(userId: string): void {
    if (!this.chatClient) return;

    this.chatClient.on('chatThreadCreated', (event: ChatThreadCreatedEvent) => {
        this.fetchThreads(false);
    });

    this.chatClient.on('chatMessageReceived', (event: ChatMessageReceivedEvent) => {
      const threadId = event.threadId;
      this.updateThreadLastMessage(threadId, new Date());
      
      if ((event.sender as CommunicationUserKind).communicationUserId !== userId) {
        this.reactivateThreadIfResolved(threadId);
      }
      
      this.emitMessageReceived(threadId, event);
    });
  }
  
  private emitMessageReceived(threadId: string, event: ChatMessageReceivedEvent): void {
    const messageUpdateEvent = new CustomEvent('messageReceived', {
      detail: { threadId, event }
    });
    window.dispatchEvent(messageUpdateEvent);
  }

  private async fetchThreads(init: boolean): Promise<void> {
    if (!this.chatClient) return;

    try {
      this.isLoadingSubject.next(true);
      
      const threadsResponse = await this.chatClient.listChatThreads().byPage().next();
      const threads = threadsResponse.value;
      
      const threadItems: ThreadItem[] = threads.map((thread: ChatThreadItem) => ({
        id: thread.id,
        topic: thread.topic,
        lastMessageReceivedOn: thread.lastMessageReceivedOn
      }));
      for (const thread of threadItems) {
        thread.status = ThreadItemStatus.ACTIVE
      }

      threadItems.sort((a, b) => 
        b.lastMessageReceivedOn.getTime() - a.lastMessageReceivedOn.getTime()
      );

      this.threadsSubject.next(threadItems);
      
      init && this.autoSelectFirstActiveThread(threadItems);
    } catch (error) {
      console.error('Failed to fetch threads:', error);
    } finally {
      this.isLoadingSubject.next(false);
    }
  }
  
  private autoSelectFirstActiveThread(threads: ThreadItem[]): void {
    if (!this.selectedThreadIdSubject.value && threads.length > 0) {
      const firstActiveThread = threads.find(thread => thread.status === ThreadItemStatus.ACTIVE);
      if (firstActiveThread) {
        this.setSelectedThreadId(firstActiveThread.id);
      } else {
        this.setSelectedThreadId(threads[0].id);
      }
    }
  }

  private addNewThread(threadItem: ThreadItem): void {
    const currentThreads = this.threadsSubject.value;
    const existingThreadIndex = currentThreads.findIndex(thread => thread.id === threadItem.id);
    
    if (existingThreadIndex === -1) {
      const newThreads = [threadItem, ...currentThreads];
      this.threadsSubject.next(newThreads);
      
      if (newThreads.length === 1) {
        this.setSelectedThreadId(threadItem.id);
      }
    }
  }

  private updateThreadStatus(threadId: string, status: ThreadItemStatus): void {
    const currentThreads = this.threadsSubject.value;
    const threadIndex = currentThreads.findIndex(thread => thread.id === threadId);
    
    if (threadIndex !== -1) {
      const updatedThreads = [...currentThreads];
      updatedThreads[threadIndex] = { ...updatedThreads[threadIndex], status };
      
      if (status === ThreadItemStatus.RESOLVED) {
        const [resolvedThread] = updatedThreads.splice(threadIndex, 1);
        updatedThreads.push(resolvedThread);
      } else if (status === ThreadItemStatus.ACTIVE) {
        const [activeThread] = updatedThreads.splice(threadIndex, 1);
        updatedThreads.unshift(activeThread);
      }
      
      updatedThreads.sort((a, b) => b.lastMessageReceivedOn.getTime() - a.lastMessageReceivedOn.getTime());
      
      this.threadsSubject.next(updatedThreads);
      
      if (status === ThreadItemStatus.RESOLVED && this.selectedThreadIdSubject.value === threadId) {
        const nextActiveThreadId = getNextActiveThreadId(updatedThreads, threadId);
        if (nextActiveThreadId) {
          this.setSelectedThreadId(nextActiveThreadId);
        }
      }
    }
  }

  private updateThreadLastMessage(threadId: string, lastMessageReceivedOn: Date): void {
    const currentThreads = this.threadsSubject.value;
    const threadIndex = currentThreads.findIndex(thread => thread.id === threadId);
    
    if (threadIndex !== -1) {
      const updatedThreads = [...currentThreads];
      updatedThreads[threadIndex] = { ...updatedThreads[threadIndex], lastMessageReceivedOn };
      
      const [updatedThread] = updatedThreads.splice(threadIndex, 1);
      updatedThreads.unshift(updatedThread);
      
      const remainingThreads = updatedThreads.slice(1);
      remainingThreads.sort((a, b) => b.lastMessageReceivedOn.getTime() - a.lastMessageReceivedOn.getTime());
      
      const finalThreads = [updatedThread, ...remainingThreads];
      this.threadsSubject.next(finalThreads);
      
    }
  }

  private reactivateThreadIfResolved(threadId: string): void {
    const currentThreads = this.threadsSubject.value;
    const threadIndex = currentThreads.findIndex(thread => thread.id === threadId);
    
    if (threadIndex !== -1 && currentThreads[threadIndex].status === ThreadItemStatus.RESOLVED) {
      
      const updatedThreads = [...currentThreads];
      updatedThreads[threadIndex] = { ...updatedThreads[threadIndex], status: ThreadItemStatus.ACTIVE };
      
      const [reactivatedThread] = updatedThreads.splice(threadIndex, 1);
      updatedThreads.unshift(reactivatedThread);
      
      const remainingThreads = updatedThreads.slice(1);
      remainingThreads.sort((a, b) => b.lastMessageReceivedOn.getTime() - a.lastMessageReceivedOn.getTime());
      
      const finalThreads = [reactivatedThread, ...remainingThreads];
      this.threadsSubject.next(finalThreads);
      
      if (this.resolvedThreadIdSubject.value === threadId) {
        this.setResolvedThreadId(undefined);
      }
    }
  }

  setSelectedThreadId(threadId: string | undefined): void {
    if (threadId) {
      const threadExists = this.threadsSubject.value.some(thread => thread.id === threadId);
      if (!threadExists) {
        console.warn(`Thread ${threadId} not found in threads list`);
        return;
      }
    }
    
    this.selectedThreadIdSubject.next(threadId);
  }

  setResolvedThreadId(threadId: string | undefined): void {
    this.resolvedThreadIdSubject.next(threadId);
  }

  getNextActiveThreadIdFromService(currentThreadId: string): string | undefined {
    return getNextActiveThreadId(this.threadsSubject.value, currentThreadId);
  }

  async updateThreadStatusExternal(threadId: string, status: ThreadItemStatus): Promise<void> {
    try {
      if (status === ThreadItemStatus.RESOLVED) {
        await this.agentWorkItemService.updateAgentWorkItem(threadId, status);
      } else {
        await this.agentWorkItemService.createAgentWorkItem(threadId, status);
      }
      
      this.updateThreadStatus(threadId, status);
      
    } catch (error) {
      console.error(`Failed to update thread ${threadId} status:`, error);
      throw error;
    }
  }
}
