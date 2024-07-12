import axios from 'axios';
import { getConfig } from '../services/apiConfigService';

const createApi = () => {
  const api = axios.create({
    baseURL: `${getConfig().routePrefix}/api`,
  });

  return api;
};

export const fetchEntry = (id: string) => createApi().get(`/entries/${id}`);
export const fetchEntries = (params: any) => createApi().get('/entries', { params });
