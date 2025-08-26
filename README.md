# Business App - Angular Version

This is a Microsoft Teams business application built with Angular. The application provides chat functionality using Azure Communication Services and integrates with Microsoft Teams.

## Features

- **Microsoft Teams Integration**: Authentication and theme support
- **Real-time Chat**: Using Azure Communication Services
- **Thread Management**: Active and resolved chat threads
- **Agent Interface**: For customer service agents to manage conversations
- **Real-time Updates**: Live notifications and message handling
- **Theme Support**: Light, dark, and contrast themes
- **Responsive Design**: Modern UI with Fluent Design principles

## Prerequisites

- Node.js 20.x or 22.x
- npm (comes with Node.js)
- Angular CLI 17.x

## Installation

1. **Install Angular CLI globally** (if not already installed):
   ```bash
   npm install -g @angular/cli@17
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

## Configuration

The application requires several configuration values for Teams and Azure Communication Services:

1. **Environment Variables**: Create a `.env` file in the root directory:
   ```env
   ANGULAR_APP_CLIENT_ID=your_teams_app_client_id
   ANGULAR_APP_START_LOGIN_PAGE_URL=https://your-domain/auth-start.html
   ```

2. **Azure Communication Services**: Update `src/environments/environment.ts`:
   ```typescript
   export const environment = {
     production: false,
     apiBaseUrl: 'https://localhost:8080',
     teamsAppId: 'your_teams_app_id',
     initiateLoginEndpoint: 'https://your-domain/auth-start.html',
     clientId: 'your_teams_app_client_id',
     azureCommunicationServices: {
       endpoint: 'https://your-resource.communication.azure.com/',
       connectionString: 'your_connection_string'
     }
   };
   ```

## Running the Application

### Development Mode

```bash
npm start
```

The application will be available at `https://localhost:53000`

### Teams Development Mode

```bash
npm run dev:teamsfx
```

This runs both the frontend and backend services for Teams development.

### Build for Production

```bash
npm run build
```

The built application will be in the `dist/business-app-angular` folder.

## Project Structure

```
src/
├── app/
│   ├── chat/                    # Chat-related components
│   │   ├── agent-screen/        # Main agent interface
│   │   ├── chat-screen/         # Chat display
│   │   ├── thread-list/         # Thread list component
│   │   ├── chat-header/         # Chat header
│   │   ├── chat-components/     # Chat interface components
│   │   ├── loading-spinner/     # Loading indicator
│   │   ├── error-screen/        # Error display
│   │   └── toast-notification/  # Toast notifications
│   ├── services/                # Angular services
│   │   ├── teams-fx.service.ts  # Teams integration
│   │   ├── threads.service.ts   # Thread management
│   │   ├── agent.service.ts     # Agent operations
│   │   └── agent-work-item.service.ts # Work item management
│   ├── utils/                   # Utility functions
│   ├── environments/            # Environment configuration
│   ├── app.component.ts         # Main app component
│   ├── app.module.ts            # Main app module
│   └── tab.component.ts         # Main tab component
├── styles.css                   # Global styles
├── main.ts                      # Application entry point
└── index.html                   # Main HTML file
```

## Key Components

### AgentScreenComponent
The main component that manages the agent interface, handles thread selection, and coordinates between different services.

### ThreadsService
Manages chat threads, handles real-time updates, and maintains thread state using RxJS observables.

### TeamsFxService
Handles Microsoft Teams integration, theme management, and user authentication.

### ChatScreenComponent
Manages individual chat sessions and integrates with Azure Communication Services.

## Development Notes

### Built with Angular
This application is built with Angular and follows Angular best practices:

1. **Components**: Angular components with decorators and lifecycle hooks
2. **State Management**: Angular services with RxJS observables
3. **Routing**: Angular Router with hash-based routing
4. **Styling**: Component-scoped CSS with global theme support
5. **Dependencies**: Angular ecosystem packages and Azure Communication Services

### Azure Communication Services
The application integrates with Azure Communication Services for:
- Real-time chat functionality
- Thread management
- User authentication
- Message handling

### Teams Integration
- Theme support (light, dark, contrast)
- User authentication
- Context awareness
- App lifecycle management

## Troubleshooting

### Common Issues

1. **Angular CLI not found**: Install Angular CLI globally
2. **Port conflicts**: Change the port in `angular.json` or use `ng serve --port 53001`
3. **Teams SDK errors**: Ensure Teams is running and the app is properly configured
4. **Azure Communication Services errors**: Check connection strings and endpoint URLs

### Build Issues

1. **TypeScript errors**: Run `npm run lint` to identify issues
2. **Dependency issues**: Delete `node_modules` and `package-lock.json`, then run `npm install`
3. **Angular version conflicts**: Ensure all Angular packages are the same version

## Testing

```bash
npm test
```

This runs the Karma test runner with Jasmine.

## Linting

```bash
npm run lint
npm run lint:fix
```

## Contributing

1. Follow Angular style guide
2. Use TypeScript strict mode
3. Write unit tests for new components
4. Follow the existing component structure

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues related to:
- **Angular**: Check Angular documentation and community forums
- **Teams Integration**: Refer to Microsoft Teams documentation
- **Azure Communication Services**: Check Azure documentation
- **Application-specific**: Create an issue in the project repository
