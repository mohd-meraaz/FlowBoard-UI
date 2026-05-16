const backendBaseUrl = 'http://18.208.84.37:8080';
const frontendBaseUrl = 'http://18.208.84.37:4200';

export const environment = {
  production: false,
  backendBaseUrl,
  frontendBaseUrl,
  apiUrl: `${backendBaseUrl}/api/v1`,
  oauthUrl: backendBaseUrl
};
