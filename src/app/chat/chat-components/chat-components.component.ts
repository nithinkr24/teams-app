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
  templateUrl: './chat.components.html',
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
    console.log('ChatComponentsComponent ngOnInit with inputs:', {
      threadId: this.threadId,
      userId: this.userId,
      hasToken: !!this.token,
      hasEndpointUrl: !!this.endpointUrl,
      displayName: this.displayName
    });
    
    // Check if we have all required inputs
    if (this.threadId && this.userId && this.token && this.endpointUrl && this.displayName) {
      console.log('All required inputs available, initializing chat');
      this.initializeChatThreadClient();
      this.loadMessages();
    } else {
      console.log('Some required inputs are missing, waiting for changes');
    }
    
    // Add window resize listener for better responsiveness
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Add real-time message listener
    window.addEventListener('messageReceived', this.handleMessageReceived.bind(this) as EventListener);
    
    // Log component state
    console.log('ChatComponentsComponent initialized with threadId:', this.threadId);
  }
  
  private handleMessageReceived(event: Event): void {
    const customEvent = event as CustomEvent;
    const { threadId, event: messageEvent } = customEvent.detail;
    
    // Only update if the message is for the current thread
    if (threadId === this.threadId) {
      console.log('Real-time message received for current thread:', threadId);
      this.refreshMessages();
    }
  }
  
  private handleResize() {
    // Ensure input is visible after resize
    this.ensureInputVisible();
  }
  
  ngOnChanges(changes: SimpleChanges) {
    console.log('ChatComponentsComponent ngOnChanges:', changes);
    
    // Check if threadId has changed
    if (changes['threadId'] && !changes['threadId'].firstChange) {
      const newThreadId = changes['threadId'].currentValue;
      const previousThreadId = changes['threadId'].previousValue;
      
      if (newThreadId && newThreadId !== previousThreadId) {
        console.log('Thread changed from', previousThreadId, 'to', newThreadId);
        this.handleThreadChange(newThreadId);
      }
    }
    
    // Check if other critical inputs have changed
    if (changes['userId'] || changes['token'] || changes['endpointUrl'] || changes['displayName']) {
      const newUserId = changes['userId']?.currentValue || this.userId;
      const newToken = changes['token']?.currentValue || this.token;
      const newEndpointUrl = changes['endpointUrl']?.currentValue || this.endpointUrl;
      const newDisplayName = changes['displayName']?.currentValue || this.displayName;
      
      if (newUserId && newToken && newEndpointUrl && this.threadId && newDisplayName) {
        console.log('Critical inputs changed, reinitializing chat');
        this.handleThreadChange(this.threadId);
      }
    }
  }
  
  private async handleThreadChange(newThreadId: string) {
    console.log('Handling thread change to:', newThreadId);
    
    // Clear previous state immediately
    this.messages = [];
    this.messageText = '';
    this.isLoading = true;
    this.canSendMessage = false;
    
    // Dispose of old chat thread client
    this.disposeChatThreadClient();
    
    // Wait a bit to ensure UI updates
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Initialize new thread
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
      console.log('Disposing of old chat thread client');
      // Note: ChatThreadClient doesn't have a dispose method, but we can clear the reference
      this.chatThreadClient = undefined;
    }
  }
  
  // Public method to manually trigger message loading
  public async refreshMessages() {
    console.log('Manually refreshing messages');
    if (this.chatThreadClient) {
      await this.loadMessages();
    } else {
      console.log('No chat thread client available, reinitializing first');
      await this.initializeChatThreadClient();
      if (this.chatThreadClient) {
        await this.loadMessages();
      }
    }
  }
  
  // Public method to force refresh for current thread
  public async forceRefreshMessages() {
    console.log('Force refreshing messages for thread:', this.threadId);
    
    // Clear current messages and reload
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
      console.log('Resolving chat thread:', this.threadId);
      
      // Disable send button during resolve
      this.canSendMessage = false;
      
      // Update the chat thread metadata to notify the CustomerApp that the chat has been resolved
      await this.chatThreadClient.updateProperties({ 
        metadata: { isResolvedByAgent: 'true' } 
      });
      
      console.log('Chat thread metadata updated successfully');
      
      // Show success message
      this.showSuccessMessage('Chat resolved successfully');
      
      // Re-enable send button
      this.canSendMessage = true;
    } catch (error) {
      console.error('Failed to update chat thread metadata:', error);
      this.canSendMessage = true;
      this.showErrorMessage('Failed to resolve chat. Please try again.');
    }
  }
  
  private showSuccessMessage(message: string): void {
    // Create a temporary success message display
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
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (successDiv.parentNode) {
        successDiv.parentNode.removeChild(successDiv);
      }
    }, 3000);
  }
  
  ngOnDestroy() {
    console.log('ChatComponentsComponent destroying, cleaning up resources');
    
    // Dispose of chat thread client
    this.disposeChatThreadClient();
    
    // Clear messages and state
    this.messages = [];
    this.messageText = '';
    this.isLoading = false;
    this.canSendMessage = false;
    
    // Complete destroy subject
    this.destroy$.next();
    this.destroy$.complete();
    
    // Remove window resize listener
    window.removeEventListener('resize', this.handleResize.bind(this));
    
    // Remove real-time message listener
    window.removeEventListener('messageReceived', this.handleMessageReceived.bind(this) as EventListener);
  }
  
  private async initializeChatThreadClient() {
    try {
      console.log('Initializing chat thread client with:', {
        endpointUrl: this.endpointUrl,
        threadId: this.threadId,
        userId: this.userId,
        displayName: this.displayName
      });
      
      if (!this.endpointUrl || !this.token || !this.threadId || !this.userId) {
        console.error('Missing required parameters for chat initialization');
        this.canSendMessage = false;
        return;
      }
      
      // Validate that we're still working with the same thread (in case of rapid changes)
      const currentThreadId = this.threadId;
      
      const tokenCredential = new AzureCommunicationTokenCredential(this.token);
      
      // Create a proper chat client first to ensure user context is set
      const chatClient = new ChatClient(this.endpointUrl, tokenCredential);
      
      // Start real-time notifications
      await chatClient.startRealtimeNotifications();
      
      // Verify thread ID hasn't changed during initialization
      if (this.threadId !== currentThreadId) {
        console.log('Thread ID changed during initialization, aborting');
        return;
      }
      
      // Now create the thread client
      this.chatThreadClient = chatClient.getChatThreadClient(this.threadId);
      this.canSendMessage = true;
      
      console.log('Chat thread client initialized successfully for thread:', this.threadId);
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
    
    // Validate that we're still working with the same thread
    const currentThreadId = this.threadId;
    
    try {
      this.isLoading = true;
      console.log('Loading messages for thread:', this.threadId);
      
      const messages = await this.chatThreadClient.listMessages().byPage().next();
      
      // Check if thread ID changed during message loading
      if (this.threadId !== currentThreadId) {
        console.log('Thread ID changed during message loading, aborting');
        return;
      }
      
      console.log('Raw messages from ACS:', messages.value);
      console.log('Current user ID:', this.userId);
      console.log('Current user display name:', this.displayName);
      
      if (!messages.value || messages.value.length === 0) {
        console.log('No messages found in thread');
        this.messages = [];
        // Ensure input is visible even when no messages
        this.ensureInputVisible();
        return;
      }
      
      const messageItems: ChatMessageItem[] = messages.value
        .filter((msg: ChatMessage) => {
          // Filter out system messages and empty content
          return msg.content?.message && msg.content.message.trim().length > 0;
        })
        .map((msg: ChatMessage) => {
          // Extract sender information
          let senderId = '';
          let senderDisplayName = 'Unknown';
          
          console.log('Processing message:', msg);
          console.log('Message sender:', msg.sender);
          console.log('Message senderDisplayName:', msg.senderDisplayName);
          
          if (msg.sender) {
            // Check if it's a CommunicationUserKind
            if ('communicationUserId' in msg.sender) {
              senderId = msg.sender.communicationUserId;
              console.log('Found communicationUserId:', senderId);
              // If it's the current user, use their display name
              if (senderId === this.userId) {
                senderDisplayName = this.displayName || 'You';
                console.log('Current user message, using displayName:', senderDisplayName);
              } else {
                // For other users, try to get their display name from the message
                // In ACS, customer messages might not have senderDisplayName set
                senderDisplayName = msg.senderDisplayName || 'Customer';
                console.log('Other user message, using senderDisplayName:', senderDisplayName);
              }
            } else if ('kind' in msg.sender && (msg.sender as any).kind === 'communicationUser') {
              senderId = (msg.sender as any).communicationUserId;
              console.log('Found communicationUser kind with ID:', senderId);
              if (senderId === this.userId) {
                senderDisplayName = this.displayName || 'You';
              } else {
                senderDisplayName = msg.senderDisplayName || 'Customer';
              }
            } else {
              console.log('Unknown sender type:', msg.sender);
              // Try to extract any available information
              if (msg.senderDisplayName) {
                senderDisplayName = msg.senderDisplayName;
              }
            }
          }
          
          // If we still don't have a proper sender ID, try to extract it from the message
          if (!senderId && msg.sender) {
            // Try different ways to extract the sender ID
            if (typeof msg.sender === 'string') {
              senderId = msg.sender;
            } else if (typeof msg.sender === 'object') {
              // Try to get any ID-like property
              const senderObj = msg.sender as any;
              senderId = senderObj.id || senderObj.communicationUserId || senderObj.userId || '';
            }
          }
          
          const messageItem = {
            id: msg.id,
            content: msg.content?.message || '',
            sender: senderId,
            senderDisplayName: senderDisplayName,
            createdOn: msg.createdOn,
            type: 'text' // Default to text type
          };
          
          console.log('Created message item:', messageItem);
          return messageItem;
        });
      
      // Sort messages by creation time
      messageItems.sort((a, b) => a.createdOn.getTime() - b.createdOn.getTime());
      this.messages = messageItems;
      
      console.log('Final processed messages:', messageItems);
      console.log('Messages loaded successfully, count:', messageItems.length);
      
      // Ensure input is visible after messages are loaded
      this.ensureInputVisible();
    } catch (error) {
      console.error('Failed to load messages:', error);
      this.messages = [];
      // Ensure input is visible even on error
      this.ensureInputVisible();
      
      // Show user-friendly error message
      this.showErrorMessage('Failed to load messages. Please refresh and try again.');
    } finally {
      this.isLoading = false;
    }
  }
  
  async sendMessage() {
    if (!this.messageText.trim() || !this.chatThreadClient || !this.canSendMessage) {
      console.log('Cannot send message:', {
        hasText: !!this.messageText.trim(),
        hasClient: !!this.chatThreadClient,
        canSend: this.canSendMessage
      });
      return;
    }
    
    const messageContent = this.messageText.trim();
    
    try {
      console.log('Sending message:', messageContent);
      this.messageText = '';
      
      // Disable send button temporarily
      this.canSendMessage = false;
      
      // Send the message
      await this.chatThreadClient.sendMessage({
        content: messageContent
      });
      
      console.log('Message sent successfully');
      
      // Reload messages to show the new message
      await this.loadMessages();
      
      // Re-enable send button
      this.canSendMessage = true;
    } catch (error) {
      console.error('Failed to send message:', error);
      // Restore the message text if sending failed
      this.messageText = messageContent;
      // Re-enable send button
      this.canSendMessage = true;
      
      // Show user-friendly error message
      this.showErrorMessage('Failed to send message. Please try again.');
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
  
  formatMessageTime(date: Date): string {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
