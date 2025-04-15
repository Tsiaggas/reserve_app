import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API URL - ΠΡΟΣΟΧΗ: Αλλάξτε την παρακάτω διεύθυνση με την πραγματική IP του υπολογιστή σας
// στο τοπικό δίκτυο (π.χ. 192.168.1.5) αντί για localhost
const API_URL = 'http://192.168.2.6:5000'; // <-- ΑΛΛΑΞΤΕ ΤΟ "192.168.1.x" ΜΕ ΤΗΝ ΠΡΑΓΜΑΤΙΚΗ ΣΑΣ IP!

// Εναλλακτικά, μπορείτε να χρησιμοποιήσετε την ngrok για να εκθέσετε τον server σας παγκοσμίως
// const API_URL = 'https://your-ngrok-url.ngrok.io';

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