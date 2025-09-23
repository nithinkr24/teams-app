import { environment } from '../../environments/environment';

const config = {
  initiateLoginEndpoint: environment.initiateLoginEndpoint || 'https://localhost:53000/auth-start.html',
};

export default config;
