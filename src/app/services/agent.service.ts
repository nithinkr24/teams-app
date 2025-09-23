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
          `${environment.apiBaseUrl}TeamsChat/getSalesRepInfo`,
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
      const response = await firstValueFrom(this.http.get<any>(`${environment.apiBaseUrl}TeamsChat/agentACSUser/?teamsUserId=${teamsUserId}`));
      return response.data;
    } catch (error) {
      console.error('Failed to get ACS user:', error);
      return undefined;
    }
  }

  async getEndpointUrl(): Promise<string> {
    try {
      const response = await firstValueFrom(this.http.get<{ data: any }>(`${environment.apiBaseUrl}TeamsChat/getEndpointUrl`));
      return response?.data || '';
    } catch (error) {
      console.error('Failed to get endpoint URL:', error);
      return '';
    }
  }

  async getToken(acsUserId: string): Promise<any> {
    try {
      const response = await firstValueFrom(this.http.post<any>(`${environment.apiBaseUrl}TeamsChat/salesAgent-token`, { SalesRepAcsUserId: acsUserId}));
      return response.data || { token: '' };
    } catch (error) {
      console.error('Failed to get token:', error);
      return { token: 'mock-token' };
    }
  }
  
}
