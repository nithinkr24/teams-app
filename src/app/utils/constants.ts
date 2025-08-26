export const threadStrings = {
  noThreads: 'No threads available',
  assignedToMe: 'Assigned to me',
  failToGetTeamsUserInfo: 'Failed to get Teams user info',
  failToLinkToACSUser: 'Failed to link to ACS user',
  failToGetEndpointUrl: 'Failed to get endpoint URL',
  failToGetToken: 'Failed to get token',
  failToCreateThreadStatusWorkItem: 'Failed to create thread status work item',
  failToUpdateThreadStatusWorkItem: 'Failed to update thread status work item',
  failToFetchThreads: 'Failed to fetch threads',
  failToAddChatClientListeners: 'Failed to add chat client listeners',
  failToInitializeChatThreadClient: 'Failed to initialize chat thread client',
  failToResolveChat: 'Failed to resolve chat',
  failToUpdateAgentWorkItem: 'Failed to update agent work item'
};

export const appConstants = {
  appName: 'Business App',
  version: '1.0.0',
  company: 'Microsoft',
  supportEmail: 'support@businessapp.com',
  maxThreadsPerPage: 50,
  autoRefreshInterval: 30000, // 30 seconds
  toastAutoHideDelay: 5000, // 5 seconds
  defaultTheme: 'light',
  supportedThemes: ['light', 'dark', 'contrast']
};

export const apiEndpoints = {
  agent: {
    acsUser: '/agentACSUser/?teamsUserId=',
    endpointUrl: '/getEndpointUrl',
    token: '/api/agent/token',
    workItems: '/api/agent/work-items'
  },
  chat: {
    threads: '/api/chat/threads',
    messages: '/api/chat/messages',
    participants: '/api/chat/participants'
  }
};

export const errorMessages = {
  networkError: 'Network error occurred. Please check your connection.',
  unauthorized: 'You are not authorized to access this resource.',
  forbidden: 'Access to this resource is forbidden.',
  notFound: 'The requested resource was not found.',
  serverError: 'An internal server error occurred. Please try again later.',
  timeout: 'Request timed out. Please try again.',
  unknown: 'An unknown error occurred. Please try again.'
};
