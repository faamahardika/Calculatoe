import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, Alert } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { useAuth } from '../contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

export default function HomeScreen() {
  const [isProfilePopupVisible, setIsProfilePopupVisible] = useState(false);
  const [userStats, setUserStats] = useState({ easy: 0, medium: 0, hard: 0, total: 0 });
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchUserStats();
    }
  }, [user]);

  const fetchUserStats = async () => {
    if (!user) return;
    
    try {
      const statsRef = doc(db, 'playerStats', user.uid);
      const statsDoc = await getDoc(statsRef);
      if (statsDoc.exists()) {
        setUserStats(statsDoc.data() as { easy: number; medium: number; hard: number; total: number });
      }
    } catch (error) {
      console.error("Error fetching user stats:", error);
    }
  };
  

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('Logout Error', error.message);
    }
  };

  const showPlayerStats = () => {
    Alert.alert(
      'Your Game Stats',
      `Easy Wins: ${userStats.easy}
Medium Wins: ${userStats.medium}
Hard Wins: ${userStats.hard}
Total Wins: ${userStats.total}`,
      [{ text: 'OK', onPress: () => setIsProfilePopupVisible(false) }]
    );
  };

  useEffect(() => {
    if (!user) {
      navigation.navigate('Login');
    }
  }, [user]);  

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Calculatoe.</Text>
      <Text style={styles.description}>Learn Calculus by Playing Tic-Tac-Toe!</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Game', { mode: 'player' })}
        >
          <Text style={styles.buttonText}>Player vs Player</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Game', { mode: 'bot' })}
        >
          <Text style={styles.buttonText}>Player vs Bot</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.profileIcon}
        onPress={() => setIsProfilePopupVisible(true)}
      >
        <Image
          source={require('../assets/images/profile.png')}
          style={styles.profileImage}
        />
      </TouchableOpacity>
      <Modal
        animationType="slide"
        transparent={true}
        visible={isProfilePopupVisible}
        onRequestClose={() => setIsProfilePopupVisible(false)}
      >
        <View style={styles.profilePopup}>
          <Text style={styles.profilePopupText}>User Profile</Text>
          <TouchableOpacity
            style={styles.statsButton}
            onPress={showPlayerStats}
          >
            <Text style={styles.statsButtonText}>View Stats</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setIsProfilePopupVisible(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#12181B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    fontFamily: 'Itim-Regular',
  },
  description: {
    fontSize: 18,
    color: '#2e3a42',
    marginBottom: 30,
    fontFamily: 'Itim-Regular',
  },
  buttonContainer: {
    width: '80%',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#FF3860',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'Itim-Regular',
  },
  profileIcon: {
    position: 'absolute',
    top: 40,
    right: 20,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  profilePopup: {
    position: 'absolute',
    top: 80,
    right: 20,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  profilePopupText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    fontFamily: 'Itim-Regular',
  },
  statsButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  statsButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Itim-Regular',
  },
  logoutButton: {
    backgroundColor: '#FF3860',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Itim-Regular',
  },
  closeButton: {
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Itim-Regular',
  },
});

