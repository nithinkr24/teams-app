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
  template: `
    <div class="chat-components-container" [ngClass]="{ 'dark-mode': isDarkMode }">
      <div class="chat-messages">
        <div class="message-list">
          <div *ngIf="isLoading" class="loading-messages">
            <div class="loading-spinner"></div>
            <div>Loading messages...</div>
          </div>
          <div *ngIf="!isLoading && messages.length === 0" class="no-messages">
            <div class="no-messages-icon">💬</div>
            <div>No messages yet. Start the conversation!</div>
          </div>
          <div *ngFor="let message of messages" class="message-item" [ngClass]="{ 'own-message': message.sender === userId }">
            <div class="message-content">
              <div class="message-sender">{{ message.senderDisplayName || 'Unknown' }}</div>
              <div class="message-text" [innerHTML]="message.content"></div>
              <div class="message-time">{{ formatMessageTime(message.createdOn) }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="chat-input">
        <div class="input-container">
          <input 
            type="text" 
            placeholder="Type a message..." 
            class="message-input"
            [(ngModel)]="messageText"
            (keyup.enter)="sendMessage()"
            [disabled]="!canSendMessage">
          <button 
            class="send-button"
            [disabled]="!canSendMessage || !messageText.trim()"
            (click)="sendMessage()">
            <span class="send-icon">📤</span>
            <span class="send-text">Send</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chat-components-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background-color: #ffffff;
      min-height: 400px;
      max-height: 100vh;
      position: relative;
      overflow: hidden;
    }
    
    .chat-components-container.dark-mode {
      background-color: #1b1a19;
      color: #ffffff;
    }
    
    .chat-messages {
      flex: 1 1 auto;
      overflow-y: auto;
      padding: 16px;
      min-height: 0;
      height: calc(100% - 80px); /* Subtract chat input height */
      display: flex;
      flex-direction: column;
      -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
    }
    
    .message-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      flex: 1;
    }
    
    .loading-messages, .no-messages {
      text-align: center;
      color: #666;
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      flex: 1;
      justify-content: center;
      min-height: 200px;
    }
    
    .dark-mode .loading-messages, .dark-mode .no-messages {
      color: #ccc;
    }
    
    .loading-spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #f3f2f1;
      border-top: 3px solid #0078d4;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    .no-messages-icon {
      font-size: 48px;
      opacity: 0.6;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .message-item {
      display: flex;
      justify-content: flex-start;
      margin-bottom: 8px;
    }
    
    .message-item.own-message {
      justify-content: flex-end;
    }
    
    .message-content {
      max-width: 70%;
      background-color: #f3f2f1;
      color: #323130;
      padding: 12px 16px;
      border-radius: 18px;
      border-bottom-left-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .own-message .message-content {
      background-color: #0078d4;
      color: white;
      border-bottom-left-radius: 18px;
      border-bottom-right-radius: 4px;
    }
    
    .dark-mode .message-content {
      background-color: #3b3a39;
      color: #ffffff;
    }
    
    .dark-mode .own-message .message-content {
      background-color: #106ebe;
    }
    
    .message-sender {
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 4px;
      opacity: 0.8;
    }
    
    .message-text {
      margin-bottom: 4px;
      line-height: 1.4;
      word-wrap: break-word;
      white-space: pre-wrap;
    }
    
    .message-time {
      font-size: 11px;
      opacity: 0.8;
      text-align: right;
    }
    
    .chat-input {
      padding: 16px;
      border-top: 1px solid #e1dfdd;
      background-color: #ffffff;
      position: sticky;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 10;
      height: 80px;
      min-height: 80px;
      display: flex;
      align-items: center;
      flex-shrink: 0;
      box-shadow: 0 -2px 8px rgba(0,0,0,0.05);
    }
    
    .dark-mode .chat-input {
      background-color: #1b1a19;
      border-top-color: #3b3a39;
      box-shadow: 0 -2px 8px rgba(0,0,0,0.2);
    }
    
    .input-container {
      display: flex;
      gap: 12px;
      align-items: center;
      width: 100%;
      max-width: 100%;
    }
    
    .message-input {
      flex: 1;
      padding: 12px 16px;
      border: 1px solid #e1dfdd;
      border-radius: 24px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
      min-width: 0;
      max-width: 100%;
    }
    
    .dark-mode .message-input {
      background-color: #3b3a39;
      border-color: #605e5c;
      color: #ffffff;
    }
    
    .message-input:focus {
      border-color: #0078d4;
    }
    
    .dark-mode .message-input:focus {
      border-color: #106ebe;
    }
    
    .message-input:disabled {
      background-color: #f3f2f1;
      color: #605e5c;
      cursor: not-allowed;
    }
    
    .dark-mode .message-input:disabled {
      background-color: #3b3a39;
      color: #605e5c;
    }
    
    .send-button {
      background-color: #0078d4;
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 24px;
      cursor: pointer;
      font-weight: 500;
      transition: background-color 0.2s;
      display: flex;
      align-items: center;
      gap: 8px;
      white-space: nowrap;
      min-width: fit-content;
      flex-shrink: 0;
    }
    
    .dark-mode .send-button {
      background-color: #106ebe;
    }
    
    .send-button:hover:not(:disabled) {
      background-color: #106ebe;
    }
    
    .dark-mode .send-button:hover:not(:disabled) {
      background-color: #005a9e;
    }
    
    .send-button:disabled {
      background-color: #c8c6c4;
      cursor: not-allowed;
    }
    
    .dark-mode .send-button:disabled {
      background-color: #605e5c;
    }
    
    .send-icon {
      font-size: 16px;
    }
    
    .send-text {
      font-size: 14px;
    }
    
    /* Responsive design */
    @media (max-width: 768px) {
      .chat-messages {
        padding: 12px;
        max-height: calc(100vh - 160px);
      }
      
      .message-content {
        max-width: 85%;
      }
      
      .chat-input {
        padding: 12px;
        min-height: 70px;
      }
      
      .input-container {
        gap: 8px;
      }
      
      .send-button {
        padding: 10px 16px;
      }
      
      .send-text {
        display: none;
      }
      
      .loading-messages, .no-messages {
        min-height: 150px;
        padding: 16px;
      }
    }
    
    @media (max-width: 480px) {
      .chat-components-container {
        min-height: 300px;
      }
      
      .chat-messages {
        padding: 8px;
        max-height: calc(100vh - 80px);
      }
      
      .message-content {
        max-width: 90%;
        padding: 10px 14px;
      }
      
      .message-input {
        padding: 10px 14px;
        font-size: 16px; /* Prevent zoom on iOS */
      }
      
      .chat-input {
        padding: 8px;
        min-height: 60px;
      }
      
      .loading-messages, .no-messages {
        min-height: 120px;
        padding: 12px;
      }
    }
    
    /* Ensure input is always visible on small screens */
    @media (max-height: 600px) {
      .chat-messages {
        max-height: calc(100vh - 100px);
      }
      
      .chat-input {
        position: sticky;
        bottom: 0;
        background-color: #ffffff;
        border-top: 1px solid #e1dfdd;
      }
      
      .dark-mode .chat-input {
        background-color: #1b1a19;
        border-top-color: #3b3a39;
      }
    }
  `]
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
