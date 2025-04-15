import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';

// Οθόνες
import AuthScreen from '../screens/AuthScreen';
import RestaurantListScreen from '../screens/RestaurantListScreen';
import RestaurantDetailsScreen from '../screens/RestaurantDetailsScreen';
import ReservationsScreen from '../screens/ReservationsScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);

  // Έλεγχος αν ο χρήστης είναι ήδη συνδεδεμένος
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        console.log('Αναζήτηση token στο AsyncStorage...');
        const token = await AsyncStorage.getItem('token');
        console.log('Token βρέθηκε:', token ? 'Ναι' : 'Όχι');
        
        if (token) {
          // Επαλήθευση ότι έχουμε και τα άλλα δεδομένα
          const userId = await AsyncStorage.getItem('userId');
          const userName = await AsyncStorage.getItem('userName');
          console.log('UserId:', userId, 'UserName:', userName);
        }
        
        setUserToken(token);
      } catch (e) {
        console.error('Σφάλμα κατά την ανάκτηση του token', e);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  // Χειρισμός αποσύνδεσης
  const handleLogout = async (navigation) => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('userId');
      await AsyncStorage.removeItem('userName');
      setUserToken(null);
      // Χρησιμοποιούμε επαναφόρτωση αντί για navigation
      window.location.reload();
    } catch (e) {
      console.log('Σφάλμα κατά την αποσύνδεση', e);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {userToken == null ? (
          // Ο χρήστης δεν είναι συνδεδεμένος
          <Stack.Screen 
            name="Auth" 
            component={AuthScreen} 
            options={{ headerShown: false }}
          />
        ) : (
          // Ο χρήστης είναι συνδεδεμένος
          <>
            <Stack.Screen
              name="Main"
              component={RestaurantListScreen}
              options={({ navigation }) => ({
                title: 'Εστιατόρια',
                headerRight: () => (
                  <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('Reservations')}
                      style={{ marginRight: 15 }}
                    >
                      <Text style={{ color: '#0066cc', fontSize: 16 }}>Κρατήσεις</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleLogout(navigation)}>
                      <Text style={{ color: '#e74c3c', fontSize: 16 }}>Αποσύνδεση</Text>
                    </TouchableOpacity>
                  </View>
                )
              })}
            />
            <Stack.Screen
              name="RestaurantDetails"
              component={RestaurantDetailsScreen}
              options={({ route }) => ({
                title: route.params.restaurant.name
              })}
            />
            <Stack.Screen
              name="Reservations"
              component={ReservationsScreen}
              options={{ title: 'Οι Κρατήσεις μου' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator; 