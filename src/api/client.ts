import axios from 'axios';
import Constants from 'expo-constants';

const fallbackApiUrl = 'http://localhost:4000';
const apiUrl = process.env.EXPO_PUBLIC_API_URL || Constants.expoConfig?.extra?.apiUrl || fallbackApiUrl;

export const api = axios.create({
  baseURL: apiUrl,
  timeout: 10000
});

export const attachToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};
