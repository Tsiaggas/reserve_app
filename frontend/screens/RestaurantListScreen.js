import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native';
import { getRestaurants } from '../api/api';

const RestaurantListScreen = ({ navigation }) => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchName, setSearchName] = useState('');
  const [searchLocation, setSearchLocation] = useState('');

  const loadRestaurants = async (filters = {}) => {
    setLoading(true);
    try {
      const data = await getRestaurants(filters);
      setRestaurants(data);
      setError(null);
    } catch (error) {
      setError('Αποτυχία φόρτωσης εστιατορίων');
      Alert.alert('Σφάλμα', error.message || 'Κάτι πήγε στραβά');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRestaurants();
  }, []);

  const handleSearch = () => {
    const filters = {};
    if (searchName) filters.name = searchName;
    if (searchLocation) filters.location = searchLocation;
    loadRestaurants(filters);
  };

  const renderRestaurantItem = ({ item }) => (
    <TouchableOpacity
      style={styles.restaurantItem}
      onPress={() => navigation.navigate('RestaurantDetails', { restaurant: item })}
    >
      <Text style={styles.restaurantName}>{item.name}</Text>
      <Text style={styles.restaurantLocation}>{item.location}</Text>
      {item.description && (
        <Text style={styles.restaurantDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Αναζήτηση με όνομα"
          value={searchName}
          onChangeText={setSearchName}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Αναζήτηση με τοποθεσία"
          value={searchLocation}
          onChangeText={setSearchLocation}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.buttonText}>Αναζήτηση</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0066cc" style={styles.loader} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <FlatList
          data={restaurants}
          keyExtractor={(item) => item.restaurant_id.toString()}
          renderItem={renderRestaurantItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              Δεν βρέθηκαν εστιατόρια. Δοκιμάστε διαφορετικά κριτήρια αναζήτησης.
            </Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  searchContainer: {
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1'
  },
  searchInput: {
    height: 40,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10
  },
  searchButton: {
    backgroundColor: '#0066cc',
    height: 40,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center'
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  listContainer: {
    padding: 15
  },
  restaurantItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 5,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5
  },
  restaurantLocation: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5
  },
  restaurantDescription: {
    fontSize: 14,
    color: '#888'
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    margin: 20
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    margin: 20
  }
});

export default RestaurantListScreen; 