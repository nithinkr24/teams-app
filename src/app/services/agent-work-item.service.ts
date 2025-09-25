import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ThreadItemStatus } from './threads.service';

export interface AgentWorkItem {
  id: string;
  status: ThreadItemStatus;
}

@Injectable({
  providedIn: 'root'
})
export class AgentWorkItemService {
  constructor(private http: HttpClient) {}

  async getAgentWorkItems(): Promise<AgentWorkItem[]> {
    try {
      const response = await firstValueFrom(this.http.get<AgentWorkItem[]>('http://localhost:8080/agentWorkItem'));
      return response || [];
    } catch (error) {
      console.error('Failed to get agent work items:', error);
      return [];
    }
  }

  async createAgentWorkItem(threadId: string, status: ThreadItemStatus): Promise<void> {
    try {
      await firstValueFrom(this.http.post('http://localhost:8080/agentWorkItem', {
        id: threadId,
        status: status
      }));
    } catch (error) {
      console.error('Failed to create agent work item:', error);
    }
  }

  async updateAgentWorkItem(threadId: string, status: ThreadItemStatus): Promise<void> {
    try {
      await firstValueFrom(this.http.put(`http://localhost:8080/api/agent/work-items/${threadId}`, {
        status: status
      }));
    } catch (error) {
      console.error('Failed to update agent work item:', error);
    }
  }
}
