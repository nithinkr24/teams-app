export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8080',
  teamsAppId: '',
  initiateLoginEndpoint: 'https://localhost:53000/auth-start.html',
  clientId: '',
  loginPath: 'https://10.0.0.6/jstore/Login.aspx',
  teamsAuthEndRedirect: 'https://10.0.0.6/teams-agent-app/#/teams-auth-end?teamsreturntoken=null',
  azureCommunicationServices: {
    endpoint: 'https://mock-endpoint.communication.azure.com/',
    connectionString: ''
  }
};
