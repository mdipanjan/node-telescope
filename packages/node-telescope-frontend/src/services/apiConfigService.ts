import axios from 'axios';

interface TelescopeConfig {
  routePrefix: string;
}

let config: TelescopeConfig | null = null;

export const initConfig = async (): Promise<void> => {
  try {
    const response = await axios.get<TelescopeConfig>('/telescope-config');
    config = response.data;
  } catch (error) {
    console.error('Failed to fetch Telescope config:', error);
    // Fallback to default if fetch fails
    config = { routePrefix: '/telescope' };
  }
};

export const getConfig = (): TelescopeConfig => {
  if (!config) {
    throw new Error('Config not initialized. Call initConfig first.');
  }
  return config;
};
