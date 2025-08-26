import { Component } from '@angular/core';

@Component({
  selector: 'app-privacy',
  template: `
    <div class="privacy-container">
      <div class="privacy-content">
        <h1>Privacy Policy</h1>
        <p>This is the privacy policy for the Business App. Please review our privacy practices.</p>
        <p>Last updated: {{ getCurrentDate() }}</p>
        
        <h2>Information We Collect</h2>
        <p>We collect information you provide directly to us, such as when you create an account or contact us for support.</p>
        
        <h2>How We Use Your Information</h2>
        <p>We use the information we collect to provide, maintain, and improve our services.</p>
        
        <h2>Contact Us</h2>
        <p>If you have any questions about this Privacy Policy, please contact us.</p>
      </div>
    </div>
  `,
  styles: [`
    .privacy-container {
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
      background-color: #ffffff;
      min-height: 100vh;
    }
    
    .privacy-content h1 {
      color: #323130;
      margin-bottom: 24px;
      font-size: 32px;
    }
    
    .privacy-content h2 {
      color: #323130;
      margin-top: 32px;
      margin-bottom: 16px;
      font-size: 24px;
    }
    
    .privacy-content p {
      color: #605e5c;
      line-height: 1.6;
      margin-bottom: 16px;
    }
  `]
})
export class PrivacyComponent {
  getCurrentDate(): string {
    return new Date().toLocaleDateString();
  }
}
