import { Component, OnInit } from '@angular/core';
import { TeamsFxService } from '../teams-fx.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tab',
  template: `
    <div [ngClass]="themeClass">
      <router-outlet></router-outlet>
      <app-agent-screen></app-agent-screen>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
    
    .nav-header {
      background-color: #f8f9fa;
      padding: 15px 20px;
      border-bottom: 1px solid #dee2e6;
    }
    
    .nav-header h2 {
      margin: 0 0 10px 0;
      color: #333;
    }
    
    nav {
      display: flex;
      gap: 20px;
    }
    
    nav a {
      text-decoration: none;
      color: #0078d4;
      padding: 8px 16px;
      border-radius: 4px;
      transition: background-color 0.2s;
    }
    
    nav a:hover {
      background-color: #e3f2fd;
    }
    
    nav a.active {
      background-color: #0078d4;
      color: white;
    }
  `]
})
export class TabComponent implements OnInit {
  themeClass: string = 'light';

  constructor(
    private teamsFxService: TeamsFxService,
    private router: Router
  ) {}

  ngOnInit() {
    this.teamsFxService.teamsContext$.subscribe(context => {
      this.themeClass = context.themeString === 'default' ? 'light' : 
                        context.themeString === 'dark' ? 'contrast' : 'dark';
    });
  }
}
