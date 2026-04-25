import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../navigation/AuthContext';

export const HomeScreen: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text variant="titleMedium" style={styles.kicker}>Namaste!</Text>
            <Text variant="headlineMedium" style={styles.greeting}>Welcome Back..</Text>
            <Text variant="bodyMedium" style={styles.subtext}>
              {user?.displayName || user?.email || 'Learner'}
            </Text>
          </View>

          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <MaterialCommunityIcons name="logout" size={18} color="#0A0A0A" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.gridRow}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="chart-line" size={26} color="#00FFCC" />
            <Text style={styles.cardTitle}>Progress</Text>
            <Text style={styles.cardValue}>12.5h</Text>
            <Text style={styles.cardMeta}>4.2h this week</Text>
          </View>

          <View style={styles.statCard}>
            <MaterialCommunityIcons name="fire" size={26} color="#00FFCC" />
            <Text style={styles.cardTitle}>Streak</Text>
            <Text style={styles.cardValue}>5 Days</Text>
            <Text style={styles.cardMeta}>Best 12 days</Text>
          </View>
        </View>

        <View style={styles.wideCard}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          <TouchableOpacity style={styles.primaryAction}>
            <Text style={styles.primaryActionText}>Start Learning</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryAction}>
            <Text style={styles.secondaryActionText}>View Achievements</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  header: {
    paddingTop: 14,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  kicker: {
    color: '#888888',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  greeting: {
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
  },
  subtext: {
    color: '#888888',
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: '#00FFCC',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoutText: {
    color: '#0A0A0A',
    fontWeight: '700',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#252525',
    padding: 14,
  },
  wideCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#252525',
    padding: 14,
    marginTop: 2,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 4,
  },
  cardValue: {
    color: '#00FFCC',
    fontSize: 24,
    fontWeight: '800',
  },
  cardMeta: {
    color: '#888888',
  },
  primaryAction: {
    backgroundColor: '#00FFCC',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  primaryActionText: {
    color: '#0A0A0A',
    fontWeight: '700',
  },
  secondaryAction: {
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2E2E2E',
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryActionText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
