import { config } from '../config/environment';

export const API = {
  endpoint: (path: string) => `${config.apiBaseUrl}${path}`,
};