import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, from } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { TeamsAuthService } from '../services/teams-auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    private teamsAuthService: TeamsAuthService
  ) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let authReq = this.addAuthHeaders(request);

    return next.handle(authReq).pipe( 
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          return this.handleUnauthorized(request, next);
        }
        return throwError(() => error);
      })
    );
  }

  private handleUnauthorized(originalRequest: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return from(this.teamsAuthService.openLoginDialog()).pipe(
      switchMap((tokenValue) => {
        localStorage.setItem('authToken', tokenValue)
        if (tokenValue) {
          const retryRequest = this.addAuthHeaders(originalRequest);
          return next.handle(retryRequest);
        } else {
          console.error('Login failed or was cancelled');
          return throwError(() => new Error('Authentication failed'));
        }
      }),
      catchError((error) => {
        localStorage.setItem('authToken', '')
        return throwError(() => error);
      })
    );
  }

  private addAuthHeaders(request: HttpRequest<any>): HttpRequest<any> {
    const authHeaders: { [key: string]: string } = {};
    const authToken = localStorage.getItem('authToken');
    if (authToken) {
      authHeaders['token'] = `${authToken}`; 
    }

    if (Object.keys(authHeaders).length > 0) {
      return request.clone({
        setHeaders: authHeaders
      });
    }

    return request;
  }
}