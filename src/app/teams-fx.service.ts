import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { app, Context } from "@microsoft/teams-js";

export interface TeamsContext {
  themeString: string;
  teamsUserCredential?: any;
}

@Injectable({
  providedIn: 'root'
})
export class TeamsFxService {
  private teamsContextSubject = new BehaviorSubject<TeamsContext>({
    themeString: 'default',
    teamsUserCredential: undefined
  });

  public teamsContext$: Observable<TeamsContext> = this.teamsContextSubject.asObservable();

  constructor() {
    this.initializeTeams();
  }

  private async initializeTeams() {
    try {
      await app.initialize();
    } catch (error) {
      console.error('Failed to initialize Teams:', error);
    }
  }

  public getTeamsContext(): TeamsContext {
    return this.teamsContextSubject.value;
  }

  public async getUserInfo(): Promise<any> {
    try {
      const context = await app.getContext();
      if (!context.user) {
        console.error('User context is undefined');
        return null;
      }
      return {
        objectId: context.user.id,
        displayName: context.user.displayName,
        // email: context.user.email
      };
    } catch (error) {
      console.error('Failed to get user info:', error);
      return null;
    }
  }
}
