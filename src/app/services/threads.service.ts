import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { ChatClient, ChatMessageReceivedEvent, ChatThreadCreatedEvent, ChatThreadItem } from '@azure/communication-chat';
import { AzureCommunicationTokenCredential, CommunicationUserKind } from '@azure/communication-common';
import { AgentWorkItemService, AgentWorkItem } from './agent-work-item.service';
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
      
      // Add real-time listeners
      this.addChatClientListeners(userId);
      
      // Fetch initial threads
      await this.fetchThreads(true);
    } catch (error) {
      console.error('Failed to initialize chat client:', error);
    }
  }

  private addChatClientListeners(userId: string): void {
    if (!this.chatClient) return;

    // this.chatClient.on('participantsAdded', async (event) => {
    //   const participantsAdded = event.participantsAdded;
    //   const isCurrentUserAdded = participantsAdded.some((participant) => {
    //     const participantId = participant.id as CommunicationUserKind;
    //     return participantId.communicationUserId === userId;
    //   });

    //   if (isCurrentUserAdded) {
    //     try {
    //       const topic = (await this.chatClient!.getChatThreadClient(event.threadId).getProperties()).topic;
    //       const threadItem: ThreadItem = {
    //         id: event.threadId,
    //         topic: topic,
    //         lastMessageReceivedOn: new Date(),
    //         status: ThreadItemStatus.ACTIVE
    //       };

    //       this.addNewThread(threadItem);
    //     } catch (error) {
    //       console.error('Failed to get thread properties:', error);
    //     }
    //   }
    // });

    // Listen for participants removed
    // this.chatClient.on('participantsRemoved', async (event) => {
    //   const threadId = event.threadId;
    //   this.updateThreadStatus(threadId, ThreadItemStatus.RESOLVED);
      
    //   // Auto-select next active thread if current thread is resolved
    //   if (this.selectedThreadIdSubject.value === threadId) {
    //     const nextActiveThreadId = getNextActiveThreadId(this.threadsSubject.value, threadId);
    //     this.setSelectedThreadId(nextActiveThreadId);
    //   }
      
    //   this.setResolvedThreadId(threadId);
    // });

    this.chatClient.on('chatThreadCreated', (event: ChatThreadCreatedEvent) => {
      this.fetchThreads(false);
    });

    // Listen for new messages
    this.chatClient.on('chatMessageReceived', (event: ChatMessageReceivedEvent) => {
      const threadId = event.threadId;
      this.updateThreadLastMessage(threadId, new Date());
      
      // Reactivate resolved thread if customer sends a message
      if ((event.sender as CommunicationUserKind).communicationUserId !== userId) {
        this.reactivateThreadIfResolved(threadId);
      }
      
      // Emit message received event for real-time updates
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

      // Get agent work items to determine thread status
      // const agentWorkItems = await this.agentWorkItemService.getAgentWorkItems();

      // for (const thread of threadItems) {
      //   const agentWorkItem = agentWorkItems.find((item: AgentWorkItem) => item.id === thread.id);
      //   if (!agentWorkItem) {
      //     try {
      //       await this.agentWorkItemService.createAgentWorkItem(thread.id, ThreadItemStatus.ACTIVE);
      //       thread.status = ThreadItemStatus.ACTIVE;
      //     } catch (error) {
      //       console.error(`Failed to create thread status work item for thread ${thread.id}:`, error);
      //       thread.status = ThreadItemStatus.ACTIVE; // Default to active
      //     }
      //   } else {
      //     thread.status = agentWorkItem.status;
      //   }
      // }

      // Sort threads by last message received time
      threadItems.sort((a, b) => 
        b.lastMessageReceivedOn.getTime() - a.lastMessageReceivedOn.getTime()
      );

      this.threadsSubject.next(threadItems);
      
      // Auto-select first active thread if no thread is selected
       this.autoSelectFirstActiveThread(threadItems);
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
      // Add new thread to the beginning of the list
      const newThreads = [threadItem, ...currentThreads];
      this.threadsSubject.next(newThreads);
      
      // Auto-select the new thread if it's the first one
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
      
      // Move resolved threads to the end and sort by last message time
      if (status === ThreadItemStatus.RESOLVED) {
        const [resolvedThread] = updatedThreads.splice(threadIndex, 1);
        updatedThreads.push(resolvedThread);
      } else if (status === ThreadItemStatus.ACTIVE) {
        // Move active threads to the top based on last message time
        const [activeThread] = updatedThreads.splice(threadIndex, 1);
        updatedThreads.unshift(activeThread);
      }
      
      // Sort threads by last message received time (most recent first)
      updatedThreads.sort((a, b) => b.lastMessageReceivedOn.getTime() - a.lastMessageReceivedOn.getTime());
      
      this.threadsSubject.next(updatedThreads);
      
      // If the resolved thread was the selected one, auto-select next active thread
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
      
      // Move thread to the top since it has the most recent message
      const [updatedThread] = updatedThreads.splice(threadIndex, 1);
      updatedThreads.unshift(updatedThread);
      
      // Sort remaining threads by last message time
      const remainingThreads = updatedThreads.slice(1);
      remainingThreads.sort((a, b) => b.lastMessageReceivedOn.getTime() - a.lastMessageReceivedOn.getTime());
      
      // Combine updated thread with sorted remaining threads
      const finalThreads = [updatedThread, ...remainingThreads];
      this.threadsSubject.next(finalThreads);
      
    }
  }

  private reactivateThreadIfResolved(threadId: string): void {
    const currentThreads = this.threadsSubject.value;
    const threadIndex = currentThreads.findIndex(thread => thread.id === threadId);
    
    if (threadIndex !== -1 && currentThreads[threadIndex].status === ThreadItemStatus.RESOLVED) {
      
      // Update status to active
      const updatedThreads = [...currentThreads];
      updatedThreads[threadIndex] = { ...updatedThreads[threadIndex], status: ThreadItemStatus.ACTIVE };
      
      // Move to top and sort
      const [reactivatedThread] = updatedThreads.splice(threadIndex, 1);
      updatedThreads.unshift(reactivatedThread);
      
      // Sort remaining threads
      const remainingThreads = updatedThreads.slice(1);
      remainingThreads.sort((a, b) => b.lastMessageReceivedOn.getTime() - a.lastMessageReceivedOn.getTime());
      
      const finalThreads = [reactivatedThread, ...remainingThreads];
      this.threadsSubject.next(finalThreads);
      
      // Clear resolved thread ID if it was this thread
      if (this.resolvedThreadIdSubject.value === threadId) {
        this.setResolvedThreadId(undefined);
      }
    }
  }

  setSelectedThreadId(threadId: string | undefined): void {
    if (threadId) {
      // Validate that the thread exists
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

  // Method to manually refresh threads
  // async refreshThreads(): Promise<void> {
  //   if (this.chatClient) {
  //     await this.fetchThreads();
  //   } else {
  //   }
  // }

  // Method to update thread status (used when resolving chat)
  async updateThreadStatusExternal(threadId: string, status: ThreadItemStatus): Promise<void> {
    try {
      // Update backend first
      if (status === ThreadItemStatus.RESOLVED) {
        await this.agentWorkItemService.updateAgentWorkItem(threadId, status);
      } else {
        await this.agentWorkItemService.createAgentWorkItem(threadId, status);
      }
      
      // Then update local state
      this.updateThreadStatus(threadId, status);
      
    } catch (error) {
      console.error(`Failed to update thread ${threadId} status:`, error);
      throw error;
    }
  }
}
