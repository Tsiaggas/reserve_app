import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { createReservation } from '../api/api';

const RestaurantDetailsScreen = ({ route, navigation }) => {
  const { restaurant } = route.params;
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [peopleCount, setPeopleCount] = useState('');
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!date || !time || !peopleCount) {
      Alert.alert('Σφάλμα', 'Παρακαλώ συμπληρώστε όλα τα πεδία');
      return false;
    }

    // Απλός έλεγχος μορφής ημερομηνίας (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      Alert.alert('Σφάλμα', 'Μη έγκυρη μορφή ημερομηνίας. Χρησιμοποιήστε YYYY-MM-DD');
      return false;
    }

    // Απλός έλεγχος μορφής ώρας (HH:MM)
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(time)) {
      Alert.alert('Σφάλμα', 'Μη έγκυρη μορφή ώρας. Χρησιμοποιήστε HH:MM');
      return false;
    }

    // Έλεγχος αριθμού ατόμων
    const people = parseInt(peopleCount);
    if (isNaN(people) || people <= 0) {
      Alert.alert('Σφάλμα', 'Ο αριθμός ατόμων πρέπει να είναι θετικός αριθμός');
      return false;
    }

    return true;
  };

  const handleReservation = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const reservationData = {
        restaurant_id: restaurant.restaurant_id,
        date,
        time,
        people_count: parseInt(peopleCount)
      };

      await createReservation(reservationData);
      
      Alert.alert('Επιτυχία', 'Η κράτησή σας καταχωρήθηκε με επιτυχία!', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Reservations')
        }
      ]);
    } catch (error) {
      Alert.alert('Σφάλμα', error.message || 'Κάτι πήγε στραβά με την κράτηση');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.restaurantHeader}>
        <Text style={styles.restaurantName}>{restaurant.name}</Text>
        <Text style={styles.restaurantLocation}>{restaurant.location}</Text>
        {restaurant.description && (
          <Text style={styles.restaurantDescription}>{restaurant.description}</Text>
        )}
      </View>

      <View style={styles.reservationForm}>
        <Text style={styles.formTitle}>Κάντε Κράτηση</Text>

        <Text style={styles.label}>Ημερομηνία (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          placeholder="πχ. 2023-04-25"
          value={date}
          onChangeText={setDate}
        />

        <Text style={styles.label}>Ώρα (HH:MM)</Text>
        <TextInput
          style={styles.input}
          placeholder="πχ. 19:30"
          value={time}
          onChangeText={setTime}
        />

        <Text style={styles.label}>Αριθμός Ατόμων</Text>
        <TextInput
          style={styles.input}
          placeholder="πχ. 4"
          keyboardType="numeric"
          value={peopleCount}
          onChangeText={setPeopleCount}
        />

        {loading ? (
          <ActivityIndicator size="large" color="#0066cc" style={styles.loader} />
        ) : (
          <TouchableOpacity style={styles.button} onPress={handleReservation}>
            <Text style={styles.buttonText}>Κράτηση</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  restaurantHeader: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1'
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5
  },
  restaurantLocation: {
    fontSize: 18,
    color: '#666',
    marginBottom: 10
  },
  restaurantDescription: {
    fontSize: 16,
    color: '#444'
  },
  reservationForm: {
    padding: 20,
    backgroundColor: 'white',
    margin: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center'
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: '500'
  },
  input: {
    height: 50,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15
  },
  button: {
    backgroundColor: '#0066cc',
    height: 50,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  loader: {
    marginTop: 20
  }
});

export default RestaurantDetailsScreen; 