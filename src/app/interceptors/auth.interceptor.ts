import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, from } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { CommonService } from '../services/common.service';
import { TeamsAuthService } from '../services/teams-auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isAuthenticating = false;

  constructor(
    private commonService: CommonService,
    private teamsAuthService: TeamsAuthService
  ) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && !this.isAuthenticating) {
          return this.handleUnauthorized(request, next);
        }
        
        return throwError(() => error);
      })
    );
  }

  private handleUnauthorized(originalRequest: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.isAuthenticating) {
      return throwError(() => new Error('Authentication already in progress'));
    }

    this.isAuthenticating = true;

    return from(this.teamsAuthService.openLoginDialog()).pipe(
      switchMap((loginSuccess) => {
        this.isAuthenticating = false;
        
        if (loginSuccess) {
          console.log('Login successful, retrying original request');
          
          const retryRequest = this.addAuthHeaders(originalRequest);
          
          return next.handle(retryRequest);
        } else {
          console.error('Login failed or was cancelled');
          return throwError(() => new Error('Authentication failed'));
        }
      }),
      catchError((error) => {
        this.isAuthenticating = false;
        return throwError(() => error);
      })
    );
  }

  private addAuthHeaders(request: HttpRequest<any>): HttpRequest<any> {
    const authHeaders: { [key: string]: string } = {};

    const token = this.commonService.getCookie('jenn-auth');
    if (token) {
      authHeaders['Authorization'] = `Bearer ${token}`;
    }

    if (Object.keys(authHeaders).length > 0) {
      return request.clone({
        setHeaders: authHeaders
      });
    }

    return request;
  }

}
