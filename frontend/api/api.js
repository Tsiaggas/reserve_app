import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API_URL για παραγωγικό περιβάλλον (Railway)
const API_URL = 'https://reserveapp-production.up.railway.app';

// Για τοπική ανάπτυξη, μπορείτε να χρησιμοποιήσετε την IP σας:
// const API_URL = 'http://192.168.2.6:5000';

// Δημιουργία axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor για να προσθέτει το token στις κλήσεις
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Συναρτήσεις για την επικοινωνία με το API
export const login = async (email, password) => {
  try {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Σφάλμα σύνδεσης με το διακομιστή' };
  }
};

export const register = async (name, email, password) => {
  try {
    const response = await api.post('/api/auth/register', { name, email, password });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Σφάλμα σύνδεσης με το διακομιστή' };
  }
};

export const getRestaurants = async (filters = {}) => {
  try {
    const response = await api.get('/api/restaurants', { params: filters });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Σφάλμα φόρτωσης εστιατορίων' };
  }
};

export const getRestaurantById = async (id) => {
  try {
    const response = await api.get(`/api/restaurants/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Σφάλμα φόρτωσης εστιατορίου' };
  }
};

export const createReservation = async (reservationData) => {
  try {
    const response = await api.post('/api/reservations', reservationData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Σφάλμα δημιουργίας κράτησης' };
  }
};

export const getUserReservations = async () => {
  try {
    const response = await api.get('/api/reservations/user');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Σφάλμα φόρτωσης κρατήσεων' };
  }
};

export const updateReservation = async (id, reservationData) => {
  try {
    const response = await api.put(`/api/reservations/${id}`, reservationData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Σφάλμα ενημέρωσης κράτησης' };
  }
};

export const deleteReservation = async (id) => {
  try {
    const response = await api.delete(`/api/reservations/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Σφάλμα διαγραφής κράτησης' };
  }
};

export default api; 