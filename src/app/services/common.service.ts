import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CommonService {

  constructor() { }

  /**
   * Sets a cookie with the specified name, value, and expiration days
   * @param name - Cookie name
   * @param value - Cookie value
   * @param days - Number of days until expiration (0 for session cookie)
   */
  setCookie(name: string, value: string, days: number): void {
    let expires = '';
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = '; expires=' + date.toUTCString();
    }
    // Add the SameSite=None; Secure attribute
    document.cookie = name + '=' + (value || '') + expires + '; path=/; SameSite=None; Secure';
  }

  /**
   * Gets a cookie value by name
   * @param name - Cookie name
   * @returns Cookie value or null if not found
   */
  getCookie(name: string): string | null {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  /**
   * Removes a cookie by setting its expiration date to the past
   * @param name - Cookie name
   */
  removeCookie(name: string): void {
    document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  }
}
