import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native';
import { getUserReservations, updateReservation, deleteReservation } from '../api/api';

const ReservationsScreen = ({ navigation }) => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadReservations = async () => {
    setLoading(true);
    try {
      const data = await getUserReservations();
      setReservations(data);
      setError(null);
    } catch (error) {
      setError('Αποτυχία φόρτωσης κρατήσεων');
      Alert.alert('Σφάλμα', error.message || 'Κάτι πήγε στραβά');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReservations();

    // Ανανέωση των κρατήσεων όταν ο χρήστης επιστρέφει σε αυτή την οθόνη
    const unsubscribe = navigation.addListener('focus', () => {
      loadReservations();
    });

    return unsubscribe;
  }, [navigation]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadReservations();
  };

  const handleCancelReservation = (reservation) => {
    Alert.alert(
      'Ακύρωση Κράτησης',
      'Είστε σίγουροι ότι θέλετε να ακυρώσετε αυτή την κράτηση;',
      [
        { text: 'Άκυρο', style: 'cancel' },
        {
          text: 'Ακύρωση',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateReservation(reservation.reservation_id, { status: 'cancelled' });
              Alert.alert('Επιτυχία', 'Η κράτηση ακυρώθηκε επιτυχώς');
              loadReservations();
            } catch (error) {
              Alert.alert('Σφάλμα', error.message || 'Κάτι πήγε στραβά');
            }
          }
        }
      ]
    );
  };

  const handleDeleteReservation = (reservation) => {
    Alert.alert(
      'Διαγραφή Κράτησης',
      'Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την κράτηση;',
      [
        { text: 'Άκυρο', style: 'cancel' },
        {
          text: 'Διαγραφή',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteReservation(reservation.reservation_id);
              Alert.alert('Επιτυχία', 'Η κράτηση διαγράφηκε επιτυχώς');
              loadReservations();
            } catch (error) {
              Alert.alert('Σφάλμα', error.message || 'Κάτι πήγε στραβά');
            }
          }
        }
      ]
    );
  };

  const canModifyReservation = (reservation) => {
    // Έλεγχος αν η κράτηση είναι μελλοντική
    const reservationDate = new Date(`${reservation.date}T${reservation.time}`);
    const now = new Date();
    return reservationDate > now && reservation.status !== 'cancelled';
  };

  const renderReservationItem = ({ item }) => {
    const isPastReservation = new Date(`${item.date}T${item.time}`) < new Date();
    const isCancelled = item.status === 'cancelled';
    const canModify = canModifyReservation(item);

    return (
      <View
        style={[
          styles.reservationItem,
          isPastReservation && styles.pastReservation,
          isCancelled && styles.cancelledReservation
        ]}
      >
        <View style={styles.reservationHeader}>
          <Text style={styles.restaurantName}>{item.restaurant_name}</Text>
          <Text
            style={[
              styles.statusBadge,
              isCancelled ? styles.cancelledBadge : styles.activeBadge
            ]}
          >
            {isCancelled ? 'Ακυρωμένη' : 'Ενεργή'}
          </Text>
        </View>

        <Text style={styles.reservationDetail}>
          <Text style={styles.detailLabel}>Τοποθεσία: </Text>
          {item.restaurant_location}
        </Text>

        <Text style={styles.reservationDetail}>
          <Text style={styles.detailLabel}>Ημερομηνία: </Text>
          {new Date(item.date).toLocaleDateString('el-GR')}
        </Text>

        <Text style={styles.reservationDetail}>
          <Text style={styles.detailLabel}>Ώρα: </Text>
          {item.time.substring(0, 5)}
        </Text>

        <Text style={styles.reservationDetail}>
          <Text style={styles.detailLabel}>Άτομα: </Text>
          {item.people_count}
        </Text>

        {canModify && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => handleCancelReservation(item)}
            >
              <Text style={styles.buttonText}>Ακύρωση</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.deleteButton]}
              onPress={() => handleDeleteReservation(item)}
            >
              <Text style={styles.buttonText}>Διαγραφή</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={reservations}
        keyExtractor={(item) => item.reservation_id.toString()}
        renderItem={renderReservationItem}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Δεν έχετε κάνει ακόμα κάποια κράτηση.
          </Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  listContainer: {
    padding: 15
  },
  reservationItem: {
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
  pastReservation: {
    opacity: 0.7
  },
  cancelledReservation: {
    backgroundColor: '#ffeeee'
  },
  reservationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    fontSize: 12,
    fontWeight: 'bold'
  },
  activeBadge: {
    backgroundColor: '#e6f7eb',
    color: '#22954f'
  },
  cancelledBadge: {
    backgroundColor: '#ffeeee',
    color: '#cc5445'
  },
  reservationDetail: {
    fontSize: 16,
    marginBottom: 5
  },
  detailLabel: {
    fontWeight: 'bold'
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15
  },
  button: {
    flex: 1,
    height: 40,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5
  },
  cancelButton: {
    backgroundColor: '#f39c12'
  },
  deleteButton: {
    backgroundColor: '#e74c3c'
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold'
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    margin: 20
  }
});

export default ReservationsScreen; 