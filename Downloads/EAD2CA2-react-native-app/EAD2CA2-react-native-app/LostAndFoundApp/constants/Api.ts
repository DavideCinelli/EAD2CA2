export const API_BASE_URL = 'https://lostandfoundapp-g7a2apb2bqgjc7hj.uksouth-01.azurewebsites.net';  // Azure hosted API

export const API_DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

export const API_ENDPOINTS = {
  // Items
  ITEMS: `${API_BASE_URL}/api/Items`,
  ITEM_DETAIL: (id: number | string) => `${API_BASE_URL}/api/Items/${id}`,
  
  // Users
  USERS: `${API_BASE_URL}/api/Users`,
  USER_REGISTER: `${API_BASE_URL}/api/Users/register`,
  USER_LOGIN: `${API_BASE_URL}/api/Users/login`,
}; 