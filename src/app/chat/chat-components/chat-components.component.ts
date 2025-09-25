import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { ChatThreadClient, ChatMessage, ChatClient } from '@azure/communication-chat';
import { AzureCommunicationTokenCredential } from '@azure/communication-common';

export interface ChatMessageItem {
  id: string;
  content: string;
  sender: string;
  senderDisplayName: string;
  createdOn: Date;
  type: 'text' | 'html';
}

@Component({
  selector: 'app-chat-components',
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponentsComponent implements OnInit, OnDestroy, OnChanges {
  @Input() isDarkMode: boolean = false;
  @Input() threadId: string = '';
  @Input() userId: string = '';
  @Input() token: string = '';
  @Input() endpointUrl: string = '';
  @Input() displayName: string = '';
  
  private destroy$ = new Subject<void>();
  
  messages: ChatMessageItem[] = [];
  messageText: string = '';
  isLoading: boolean = false;
  canSendMessage: boolean = false;
  
  private chatThreadClient: ChatThreadClient | undefined;
  
  ngOnInit() {
    if (this.threadId && this.userId && this.token && this.endpointUrl && this.displayName) {
      this.initializeChatThreadClient();
      this.loadMessages();
    } else {
      console.log('Some required inputs are missing, waiting for changes');
    }
    
    window.addEventListener('resize', this.handleResize.bind(this));
    
    window.addEventListener('messageReceived', this.handleMessageReceived.bind(this) as EventListener);
    
  }
  
  private handleMessageReceived(event: Event): void {
    const customEvent = event as CustomEvent;
    const { threadId, event: messageEvent } = customEvent.detail;
    
    if (threadId === this.threadId) {
      this.refreshMessages();
    }
  }
  
  private handleResize() {
    this.ensureInputVisible();
  }
  
  ngOnChanges(changes: SimpleChanges) {
    if (changes['threadId'] && !changes['threadId'].firstChange) {
      const newThreadId = changes['threadId'].currentValue;
      const previousThreadId = changes['threadId'].previousValue;
      
      if (newThreadId && newThreadId !== previousThreadId) {
        this.handleThreadChange(newThreadId);
      }
    }
    
    if (changes['userId'] || changes['token'] || changes['endpointUrl'] || changes['displayName']) {
      const newUserId = changes['userId']?.currentValue || this.userId;
      const newToken = changes['token']?.currentValue || this.token;
      const newEndpointUrl = changes['endpointUrl']?.currentValue || this.endpointUrl;
      const newDisplayName = changes['displayName']?.currentValue || this.displayName;
      
      if (newUserId && newToken && newEndpointUrl && this.threadId && newDisplayName) {
        this.handleThreadChange(this.threadId);
      }
    }
  }
  
  private async handleThreadChange(newThreadId: string) {
    
    this.messages = [];
    this.messageText = '';
    this.isLoading = true;
    this.canSendMessage = false;
    
    this.disposeChatThreadClient();
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      await this.initializeChatThreadClient();
      if (this.chatThreadClient) {
        await this.loadMessages();
      }
    } catch (error) {
      console.error('Failed to initialize new thread:', error);
      this.isLoading = false;
    }
  }
  
  private disposeChatThreadClient() {
    if (this.chatThreadClient) {
      this.chatThreadClient = undefined;
    }
  }
  
  // Public method to manually trigger message loading
  public async refreshMessages() {
    if (this.chatThreadClient) {
      await this.loadMessages();
    } else {
      await this.initializeChatThreadClient();
      if (this.chatThreadClient) {
        await this.loadMessages();
      }
    }
  }
  
  public async forceRefreshMessages() {
    
    this.messages = [];
    this.isLoading = true;
    
    try {
      await this.initializeChatThreadClient();
      if (this.chatThreadClient) {
        await this.loadMessages();
      }
    } catch (error) {
      console.error('Failed to force refresh messages:', error);
      this.isLoading = false;
    }
  }
  
  // Method to ensure input box is visible
  public ensureInputVisible() {
    // Scroll to bottom to ensure input is visible
    setTimeout(() => {
      const chatContainer = document.querySelector('.chat-components-container');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100);
  }
  
  // Method to resolve chat thread
  public async resolveChatThread(): Promise<void> {
    if (!this.chatThreadClient) {
      console.error('No chat thread client available to resolve thread');
      return;
    }

    try {
      this.canSendMessage = false;
      
      await this.chatThreadClient.updateProperties({ 
        metadata: { isResolvedByAgent: 'true' } 
      });
      
      this.showSuccessMessage('Chat resolved successfully');
      
      this.canSendMessage = true;
    } catch (error) {
      console.error('Failed to update chat thread metadata:', error);
      this.canSendMessage = true;
      this.showErrorMessage('Failed to resolve chat. Please try again.');
    }
  }
  
  private showSuccessMessage(message: string): void {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    successDiv.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background-color: #107c10;
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      z-index: 1000;
      font-size: 14px;
    `;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
      if (successDiv.parentNode) {
        successDiv.parentNode.removeChild(successDiv);
      }
    }, 3000);
  }
  
  ngOnDestroy() {
    this.disposeChatThreadClient();
    
    this.messages = [];
    this.messageText = '';
    this.isLoading = false;
    this.canSendMessage = false;
    
    this.destroy$.next();
    this.destroy$.complete();
    
    window.removeEventListener('resize', this.handleResize.bind(this));
    
    window.removeEventListener('messageReceived', this.handleMessageReceived.bind(this) as EventListener);
  }
  
  private async initializeChatThreadClient() {
    try {
      if (!this.endpointUrl || !this.token || !this.threadId || !this.userId) {
        console.error('Missing required parameters for chat initialization');
        this.canSendMessage = false;
        return;
      }
      
      const currentThreadId = this.threadId;
      
      const tokenCredential = new AzureCommunicationTokenCredential(this.token);
      
      const chatClient = new ChatClient(this.endpointUrl, tokenCredential);
      
      await chatClient.startRealtimeNotifications();
      
      if (this.threadId !== currentThreadId) {
        console.log('Thread ID changed during initialization, aborting');
        return;
      }
      
      this.chatThreadClient = chatClient.getChatThreadClient(this.threadId);
      this.canSendMessage = true;
      
    } catch (error) {
      console.error('Failed to initialize chat thread client:', error);
      this.canSendMessage = false;
      this.chatThreadClient = undefined;
    }
  }
  
  private async loadMessages() {
    if (!this.chatThreadClient) {
      console.log('No chat thread client available, cannot load messages');
      return;
    }
    
    const currentThreadId = this.threadId;
    
    try {
      this.isLoading = true;
      
      const messages = await this.chatThreadClient.listMessages().byPage().next();
      
      if (this.threadId !== currentThreadId) {
        console.log('Thread ID changed during message loading, aborting');
        return;
      }
      
      if (!messages.value || messages.value.length === 0) {
        console.log('No messages found in thread');
        this.messages = [];
        this.ensureInputVisible();
        return;
      }
      
      const messageItems: ChatMessageItem[] = messages.value
        .filter((msg: ChatMessage) => {
          return msg.content?.message && msg.content.message.trim().length > 0;
        })
        .map((msg: ChatMessage) => {
          let senderId = '';
          let senderDisplayName = 'Unknown';
          
          if (msg.sender) {
            if ('communicationUserId' in msg.sender) {
              senderId = msg.sender.communicationUserId;
              if (senderId === this.userId) {
                senderDisplayName = this.displayName || 'You';
              } else {
                senderDisplayName = msg.senderDisplayName || 'Customer';
              }
            } else if ('kind' in msg.sender && (msg.sender as any).kind === 'communicationUser') {
              senderId = (msg.sender as any).communicationUserId;
              if (senderId === this.userId) {
                senderDisplayName = this.displayName || 'You';
              } else {
                senderDisplayName = msg.senderDisplayName || 'Customer';
              }
            } else {
              if (msg.senderDisplayName) {
                senderDisplayName = msg.senderDisplayName;
              }
            }
          }
          
          if (!senderId && msg.sender) {
            if (typeof msg.sender === 'string') {
              senderId = msg.sender;
            } else if (typeof msg.sender === 'object') {
              const senderObj = msg.sender as any;
              senderId = senderObj.id || senderObj.communicationUserId || senderObj.userId || '';
            }
          }
          
          const messageItem = {
            id: msg.id,
            content: msg.content?.message || '',
            sender: senderId,
            senderDisplayName: (senderId !== this.userId)?senderDisplayName: '',
            createdOn: msg.createdOn,
            type: 'text' 
          };
          
          return messageItem;
        });
      
      messageItems.sort((a, b) => a.createdOn.getTime() - b.createdOn.getTime());
      this.messages = messageItems;
      
      this.ensureInputVisible();
    } catch (error) {
      console.error('Failed to load messages:', error);
      this.messages = [];
      this.ensureInputVisible();
      
      this.showErrorMessage('Failed to load messages. Please refresh and try again.');
    } finally {
      this.isLoading = false;
    }
  }
  
  async sendMessage() {
    if (!this.messageText.trim() || !this.chatThreadClient || !this.canSendMessage) {
      return;
    }
    
    const messageContent = this.messageText.trim();
    
    try {
      this.messageText = '';
      
      this.canSendMessage = false;
      
      await this.chatThreadClient.sendMessage({
        content: messageContent
      });
      
      await this.loadMessages();
      
      this.canSendMessage = true;
    } catch (error) {
      console.error('Failed to send message:', error);
      this.messageText = messageContent;
      this.canSendMessage = true;
      
      this.showErrorMessage('Failed to send message. Please try again.');
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
  

  formatMessageTime(date: Date, locale = navigator.language):string {
        const now = new Date();
        const messageDate = new Date(date);

        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const msgDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());

        const diffTime = today.getTime() - msgDay.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        const timeString = messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        if (diffDays === 0) {
            return timeString;  
        } else if (diffDays === 1) {
            return `Yesterday ${timeString}`;
        } else if (diffDays > 1 && diffDays <= 7) {
            const weekdayFormatter = new Intl.DateTimeFormat(locale, { weekday: "long" });
            return `${weekdayFormatter.format(messageDate)} ${timeString}`;
        } else {
            const dateFormatter = new Intl.DateTimeFormat(locale, {
                day: "2-digit",
                month: "2-digit"
            });
            return `${dateFormatter.format(messageDate)} ${timeString}`;
        }
    }

  public shouldShowHeader(index: number): boolean {
    if (index === 0) {
      return true;
    }
    const currentMessage = this.messages[index];
    const previousMessage = this.messages[index - 1];

    const isDifferentSender = currentMessage.sender !== previousMessage.sender;
    const timeDifferenceMs = currentMessage.createdOn.getTime() - previousMessage.createdOn.getTime();
    const isTimeGap = timeDifferenceMs > 60000;

    return isDifferentSender || isTimeGap;
  }

}
