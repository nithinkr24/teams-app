import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule, Routes } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { TabComponent } from './tab/tab.component';
import { AgentScreenComponent } from './chat/agent-screen/agent-screen.component';
import { ChatScreenComponent } from './chat/chat-screen/chat-screen.component';
import { ThreadListComponent } from './chat/thread-list/thread-list.component';
import { ThreadListHeaderComponent } from './chat/thread-list-header/thread-list-header.component';
import { ChatHeaderComponent } from './chat/chat-header/chat-header.component';
import { ChatComponentsComponent } from './chat/chat-components/chat-components.component';
import { LoadingSpinnerComponent } from './chat/loading-spinner/loading-spinner.component';
import { ErrorScreenComponent } from './chat/error-screen/error-screen.component';
import { ToastNotificationComponent } from './chat/toast-notification/toast-notification.component';
import { TeamsExampleComponent } from './teams-example/teams-example.component';

const routes: Routes = [
  { path: 'tab', component: TabComponent },
  { path: 'teams-example', component: TeamsExampleComponent },
  { path: '', redirectTo: '/tab', pathMatch: 'full' }
];

@NgModule({
  declarations: [
    AppComponent,
    TabComponent,
    AgentScreenComponent,
    ChatScreenComponent,
    ThreadListComponent,
    ThreadListHeaderComponent,
    ChatHeaderComponent,
    ChatComponentsComponent,
    LoadingSpinnerComponent,
    ErrorScreenComponent,
    ToastNotificationComponent,
    TeamsExampleComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(routes, { useHash: true }),
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
