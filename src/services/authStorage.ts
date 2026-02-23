import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'killzone_edge_token';

export const saveToken = async (token: string) => SecureStore.setItemAsync(TOKEN_KEY, token);
export const getToken = async () => SecureStore.getItemAsync(TOKEN_KEY);
export const clearToken = async () => SecureStore.deleteItemAsync(TOKEN_KEY);
