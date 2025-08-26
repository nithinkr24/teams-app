import { Component } from '@angular/core';

@Component({
  selector: 'app-terms-of-use',
  template: `
    <div class="terms-container">
      <div class="terms-content">
        <h1>Terms of Use</h1>
        <p>Please read these terms of use carefully before using the Business App.</p>
        <p>Last updated: {{ getCurrentDate() }}</p>
        
        <h2>Acceptance of Terms</h2>
        <p>By accessing and using this application, you accept and agree to be bound by the terms and provision of this agreement.</p>
        
        <h2>Use License</h2>
        <p>Permission is granted to temporarily download one copy of the application for personal, non-commercial transitory viewing only.</p>
        
        <h2>Disclaimer</h2>
        <p>The materials on the application are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
        
        <h2>Contact Information</h2>
        <p>If you have any questions about these Terms of Use, please contact us.</p>
      </div>
    </div>
  `,
  styles: [`
    .terms-container {
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
      background-color: #ffffff;
      min-height: 100vh;
    }
    
    .terms-content h1 {
      color: #323130;
      margin-bottom: 24px;
      font-size: 32px;
    }
    
    .terms-content h2 {
      color: #323130;
      margin-top: 32px;
      margin-bottom: 16px;
      font-size: 24px;
    }
    
    .terms-content p {
      color: #605e5c;
      line-height: 1.6;
      margin-bottom: 16px;
    }
  `]
})
export class TermsOfUseComponent {
  getCurrentDate(): string {
    return new Date().toLocaleDateString();
  }
}
