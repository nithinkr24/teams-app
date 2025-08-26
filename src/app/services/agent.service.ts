import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { apiEndpoints } from '../utils/constants';

export interface AgentUser {
  acsUserId: string;
  displayName: string;
}

export interface TokenResponse {
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AgentService {
  constructor(private http: HttpClient) {}

  async getAgentACSUser(teamsUserId: string): Promise<AgentUser | undefined> {
    try {
      const response = await firstValueFrom(this.http.get<AgentUser>(`http://localhost:8080/agentACSUser/?teamsUserId=${teamsUserId}`));
      return response;
    } catch (error) {
      console.error('Failed to get ACS user:', error);
      // Fallback for development - you can remove this in production
      return undefined;
    }
  }

  async getEndpointUrl(): Promise<string> {
    try {
      const response = await firstValueFrom(this.http.get<{ endpointUrl: string }>('http://localhost:8080/getEndpointUrl'));
      return response?.endpointUrl || '';
    } catch (error) {
      console.error('Failed to get endpoint URL:', error);
      // Fallback for development - you can remove this in production
      return 'https://mock-endpoint.communication.azure.com/';
    }
  }

  async getToken(acsUserId: string): Promise<TokenResponse> {
    try {
      const response = await firstValueFrom(this.http.post<TokenResponse>(`http://localhost:8080/token/user/${acsUserId}?scope=chat`, {}));
      return response || { token: '' };
    } catch (error) {
      console.error('Failed to get token:', error);
      // Fallback for development - you can remove this in production
      return { token: 'mock-token' };
    }
  }
}
