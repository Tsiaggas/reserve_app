import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login, register } from '../api/api';

const AuthScreen = ({ navigation }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    // Έλεγχος εγκυρότητας πεδίων
    if (isLogin && (!email || !password)) {
      Alert.alert('Σφάλμα', 'Παρακαλώ συμπληρώστε όλα τα πεδία');
      return;
    }

    if (!isLogin && (!name || !email || !password)) {
      Alert.alert('Σφάλμα', 'Παρακαλώ συμπληρώστε όλα τα πεδία');
      return;
    }

    setLoading(true);

    try {
      let userData;
      console.log('Προσπάθεια αυθεντικοποίησης:', isLogin ? 'login' : 'register');

      if (isLogin) {
        userData = await login(email, password);
      } else {
        userData = await register(name, email, password);
      }

      console.log('Επιτυχής αυθεντικοποίηση, δεδομένα:', userData);

      // Αποθήκευση του token
      await AsyncStorage.setItem('token', userData.token);
      await AsyncStorage.setItem('userId', userData.userId.toString());
      await AsyncStorage.setItem('userName', userData.name);
      
      console.log('Δεδομένα αποθηκεύτηκαν στο AsyncStorage');
      
      // Διαφορετικός χειρισμός ανάλογα την πλατφόρμα
      setTimeout(() => {
        // Σωστή πλοήγηση για όλες τις πλατφόρμες
        try {
          console.log('Ανακατεύθυνση στην αρχική οθόνη...');
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          });
        } catch (navError) {
          console.error('Σφάλμα κατά την πλοήγηση:', navError);
          Alert.alert('Προειδοποίηση', 'Η σύνδεση ήταν επιτυχής. Παρακαλώ επανεκκινήστε την εφαρμογή.');
        }
      }, 1000);
    } catch (error) {
      console.error('Σφάλμα κατά την αυθεντικοποίηση:', error);
      Alert.alert('Σφάλμα', (error.message || 'Κάτι πήγε στραβά') + 
        '\n\nΠεριγραφή: ' + JSON.stringify(error).substring(0, 100));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isLogin ? 'Σύνδεση' : 'Εγγραφή'}</Text>

      {!isLogin && (
        <TextInput
          style={styles.input}
          placeholder="Όνομα"
          value={name}
          onChangeText={setName}
        />
      )}

      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Κωδικός"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#0066cc" />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleAuth}>
          <Text style={styles.buttonText}>{isLogin ? 'Σύνδεση' : 'Εγγραφή'}</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
        <Text style={styles.toggleText}>
          {isLogin
            ? 'Δεν έχετε λογαριασμό; Εγγραφείτε'
            : 'Έχετε ήδη λογαριασμό; Συνδεθείτε'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center'
  },
  input: {
    height: 50,
    backgroundColor: 'white',
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
  toggleText: {
    marginTop: 20,
    textAlign: 'center',
    color: '#0066cc'
  }
});

export default AuthScreen; 