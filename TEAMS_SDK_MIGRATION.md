# Teams SDK Migration Guide

This document outlines the migration from the CDN version of Microsoft Teams JavaScript SDK to the official `@microsoft/teams-js` npm package.

## What Changed

### 1. Package Installation
The `@microsoft/teams-js` package was already installed in your `package.json` (version 2.20.0).

### 2. Updated Files

#### Auth HTML Files
- `public/auth-start.html` - Updated to use ES6 modules and official SDK
- `public/auth-end.html` - Updated to use ES6 modules and official SDK

#### Angular Components
- `src/app/app.component.ts` - Updated to use official SDK imports
- `src/app/teams-fx.service.ts` - Updated to use official SDK imports and modern API
- `src/app/teams-example/teams-example.component.ts` - New example component

#### Type Definitions
- Removed `src/types/microsoft-teams.d.ts` - No longer needed with official SDK

### 3. New Features

#### Teams Example Component
A new component has been added to demonstrate the Teams SDK capabilities:
- **Route**: `/teams-example`
- **Features**: 
  - Get Teams context
  - Get user information
  - Show dialogs
  - Navigate to tabs
  - Get authentication tokens

## How to Use the New Teams SDK

### Basic Initialization

```typescript
import { app } from '@microsoft/teams-js';

ngOnInit() {
  app.initialize().then(() => {
    app.getContext().then(context => {
      console.log("Teams context:", context);
    });
  });
}
```

### Available APIs

The official SDK provides access to various Teams capabilities:

#### App Management
```typescript
import { app } from '@microsoft/teams-js';

// Initialize the SDK
await app.initialize();

// Get Teams context
const context = await app.getContext();

// Register theme change handler
app.registerOnThemeChangeHandler((theme: string) => {
  console.log('Theme changed to:', theme);
});
```

#### Authentication
```typescript
import { authentication } from '@microsoft/teams-js';

// Get authentication token
const token = await authentication.getAuthToken();
```

#### Dialogs
```typescript
import { dialog } from '@microsoft/teams-js';

// Show a dialog
const result = await dialog.open({
  title: 'Example Dialog',
  message: 'This is an example dialog!',
  confirmButton: 'OK',
  cancelButton: 'Cancel'
});
```

#### Navigation
```typescript
import { pages } from '@microsoft/teams-js';

// Navigate to a tab
await pages.navigateToTab({
  tabName: 'example-tab',
  entityId: 'example-entity'
});
```

### Migration Benefits

1. **Type Safety**: Full TypeScript support with proper type definitions
2. **Modern ES6 Modules**: Clean import/export syntax
3. **Better Error Handling**: Improved error messages and debugging
4. **Performance**: Optimized bundle size and runtime performance
5. **Maintenance**: Official Microsoft support and regular updates
6. **Documentation**: Comprehensive API documentation and examples

### Testing the Migration

1. **Run the application**: `npm start`
2. **Navigate to Teams Example**: Click on "Teams SDK Example" in the navigation
3. **Test functionality**: Use the buttons to test various Teams SDK features
4. **Check console**: Monitor console logs for successful SDK initialization

### Troubleshooting

#### Common Issues

1. **Module not found**: Ensure `@microsoft/teams-js` is installed
2. **Initialization errors**: Check if running in Teams environment
3. **Permission errors**: Verify app permissions in Teams manifest

#### Debug Tips

1. Check browser console for error messages
2. Verify Teams context is available
3. Test in Teams desktop/web client
4. Use the Teams Example component for testing

## Next Steps

1. **Explore the SDK**: Check out the [official documentation](https://docs.microsoft.com/en-us/javascript/api/teams-js/)
2. **Add more features**: Implement additional Teams capabilities as needed
3. **Customize the example**: Modify the Teams Example component for your use case
4. **Update other components**: Gradually migrate other components to use the new SDK

## Resources

- [Microsoft Teams JavaScript SDK Documentation](https://docs.microsoft.com/en-us/javascript/api/teams-js/)
- [Teams SDK Samples](https://github.com/OfficeDev/Microsoft-Teams-Samples)
- [Teams Developer Portal](https://dev.teams.microsoft.com/)
