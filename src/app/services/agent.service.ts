import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { apiEndpoints } from '../utils/constants';


@Injectable({
  providedIn: 'root'
})
export class AgentService {
  constructor(private http: HttpClient) {}

  async getSalesRepInfo(teamsUserId: string): Promise<any | undefined> {
    try {
      const response = await firstValueFrom(
        this.http.post<any>(
          `http://localhost:5047/api/TeamsChat/getSalesRepInfo`,
          { aadObjectId: teamsUserId }
        )
      );
      return response;
    } catch (error) {
      console.error('Failed to get teams sales Rep Information:', error);
      return undefined;
    }
  }

  async getAgentACSUser(teamsUserId: string): Promise<any | undefined> {
    try {
      const response = await firstValueFrom(this.http.get<any>(`http://localhost:5047/api/TeamsChat/agentACSUser/?teamsUserId=${teamsUserId}`));
      return response.data;
    } catch (error) {
      console.error('Failed to get ACS user:', error);
      // Fallback for development - you can remove this in production
      return undefined;
    }
  }

  async getEndpointUrl(): Promise<string> {
    try {
      const response = await firstValueFrom(this.http.get<{ endpointUrl: string }>('http://localhost:5047/api/TeamsChat/getEndpointUrl'));
      return response?.data?.endpointUrl || '';
    } catch (error) {
      console.error('Failed to get endpoint URL:', error);
      // Fallback for development - you can remove this in production
      return 'https://mock-endpoint.communication.azure.com/';
    }
  }

  async getToken(acsUserId: string): Promise<any> {
    try {
      const response = await firstValueFrom(this.http.post<any>(`http://localhost:5047/api/TeamsChat/salesAgent-token`, { SalesRepAcsUserId: acsUserId}));
      return response.data || { token: '' };
    } catch (error) {
      console.error('Failed to get token:', error);
      // Fallback for development - you can remove this in production
      return { token: 'mock-token' };
    }
  }
  
}
