import { Injectable } from '@angular/core';
import { app, authentication } from '@microsoft/teams-js';
import { CommonService } from './common.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TeamsAuthService {
  private isInitialized = false;

  constructor(private commonService: CommonService) {
    this.initializeTeams();
  }

  private async initializeTeams() {
    if (this.isInitialized) return;
    
    try {
      await app.initialize();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Teams SDK:', error);
    }
  }

  /**
   * Opens the login page in a Teams popup dialog instead of redirecting the entire page
   * This ensures cookies are properly set within the Teams context
   * The external login page will handle cookie setting and redirect back to the app
   */
  async openLoginPopup(): Promise<boolean> {
    try {
      await this.initializeTeams();
      
      // Store the current URL for redirect after login
      this.commonService.setCookie('RedirectURL', location.href, 0);
      
      // Create a URL with callback parameters for Teams integration
      // The external login page will redirect back to this app after setting cookies
      const loginUrl = new URL(environment.loginPath);
      loginUrl.searchParams.set('teamsCallback', 'true');
      loginUrl.searchParams.set('teamsAppId', environment.teamsAppId);
      loginUrl.searchParams.set('returnUrl', encodeURIComponent(location.href));
      
      // Use the authentication.authenticate method for popup authentication
      return new Promise((resolve) => {
        authentication.authenticate({
          url: loginUrl.toString(),
          width: 500,
          height: 600,
          successCallback: (result: string) => {
            console.log('Login popup completed successfully');
            // The external login page has already set cookies and redirected back
            // Check if authentication was successful by looking for cookies
            this.waitForCookies().then(() => {
              const authenticated = this.isAuthenticated();
              if (authenticated) {
                console.log('Authentication successful - cookies found');
              } else {
                console.log('Authentication may have failed - no cookies found');
              }
              resolve(authenticated);
            });
          },
          failureCallback: (reason: string) => {
            console.error('Login popup was cancelled or failed:', reason);
            resolve(false);
          }
        });
      });
    } catch (error) {
      console.error('Failed to open login popup:', error);
      return false;
    }
  }

  /**
   * Alternative method for external login pages that redirect
   * This method creates a popup window that can handle external redirects
   * The external login page uses the RedirectURL cookie to redirect back to the app
   */
  async openLoginDialog(): Promise<boolean> {
    try {
      await this.initializeTeams();
      
      // Store the current URL for redirect after login - this is what the external login page uses
      this.commonService.setCookie('RedirectURL', location.href, 0);
      
      // Create a URL with callback parameters for Teams integration
      // The external login page will use the RedirectURL cookie to redirect back
      const loginUrl = new URL(environment.loginPath);
      // loginUrl.searchParams.set('teamsCallback', 'true');
      // loginUrl.searchParams.set('teamsAppId', environment.teamsAppId);
      
      // Use authentication.authenticate for external login pages
      return new Promise((resolve) => {
        authentication.authenticate({
          url: loginUrl.toString(),
          width: 500,
          height: 600,
          successCallback: (result: string) => {
            console.log('Login dialog completed successfully');
            // The external login page has set cookies and redirected back using RedirectURL cookie
            // Wait for cookies to be available
            this.waitForCookies().then(() => {
              const authenticated = this.isAuthenticated();

              if (authenticated) {
                const cookies = document.cookie.split(';');
                const cookieData: any = {};

                cookies.forEach(cookie => {
                  const [key, value] = cookie.trim().split('=');
                  if (key && value) {
                    cookieData[key] = decodeURIComponent(value);
                  }
                });
                 localStorage.setItem('allCookies', JSON.stringify(cookieData));
              }
             
              console.log('Authentication result:', authenticated);
              resolve(authenticated);
            });
          },
          failureCallback: (reason: string) => {
            console.error('Login dialog was cancelled or failed:', reason);
            resolve(false);
          }
        });
      });
    } catch (error) {
      console.error('Failed to open login dialog:', error);
      return false;
    }
  }

  /**
   * Wait for cookies to be set after login
   */
  private async waitForCookies(timeout: number = 3000): Promise<void> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      if (this.isAuthenticated()) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Check if user is authenticated by verifying if required cookies exist
   */
  isAuthenticated(): boolean {
    // Add logic to check for authentication cookies
    // This depends on what cookies your login system sets
    const authCookie = this.commonService.getCookie('jenn-auth');
    return !!authCookie;
  }

  /**
   * Get all cookies for debugging purposes
   */
  getAllCookies(): { [key: string]: string } {
    const cookies: { [key: string]: string } = {};
    document.cookie.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookies[name] = value;
      }
    });
    return cookies;
  }

  /**
   * Handle the redirect after successful login
   */
  handleLoginRedirect(): void {
    const redirectUrl = this.commonService.getCookie('RedirectURL');
    if (redirectUrl) {
      this.commonService.removeCookie('RedirectURL');
      // Navigate back to the original URL
      window.location.href = redirectUrl;
    }
  }
}
