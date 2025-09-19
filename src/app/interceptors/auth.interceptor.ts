import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, from } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { TeamsAuthService } from '../services/teams-auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private token = '';

  constructor(
    private teamsAuthService: TeamsAuthService
  ) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let authReq = this.addAuthHeaders(request);

    return next.handle(authReq).pipe( 
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && !this.token) {
          return this.handleUnauthorized(request, next);
        }
        return throwError(() => error);
      })
    );
  }

  private handleUnauthorized(originalRequest: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.token) {
      return throwError(() => new Error('Authentication already in progress'));
    }

    return from(this.teamsAuthService.openLoginDialog()).pipe(
      switchMap((tokenValue) => {
        this.token = tokenValue;
        if (this.token) {
          const retryRequest = this.addAuthHeaders(originalRequest);
          return next.handle(retryRequest);
        } else {
          console.error('Login failed or was cancelled');
          return throwError(() => new Error('Authentication failed'));
        }
      }),
      catchError((error) => {
        this.token = ''; 
        return throwError(() => error);
      })
    );
  }

  private addAuthHeaders(request: HttpRequest<any>): HttpRequest<any> {
    const authHeaders: { [key: string]: string } = {};
    if (this.token) {
      authHeaders['token'] = `${this.token}`; // Note: a 'token' header is non-standard. The standard is 'Authorization' with 'Bearer'.
    }

    if (Object.keys(authHeaders).length > 0) {
      return request.clone({
        setHeaders: authHeaders
      });
    }

    return request;
  }
}