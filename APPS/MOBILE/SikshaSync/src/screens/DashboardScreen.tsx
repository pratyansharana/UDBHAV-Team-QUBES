import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Surface, Avatar, Chip, Divider } from 'react-native-paper';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebaseconfig';
import { useAuth } from '../navigation/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const DashboardScreen: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    // Listen to user document in real-time
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      setStats(doc.data());
    });
    
    return () => unsubscribe();
  }, [user]);

  if (!stats) return (
    <View style={styles.center}><Text style={{color: '#fff'}}>Loading Dashboard...</Text></View>
  );

  // Helper: Get Top Interest
  const getTopInterest = () => {
    if (!stats.interests) return 'None';
    return Object.entries(stats.interests).sort((a:any, b:any) => b[1] - a[1])[0][0];
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      
      {/* 1. Profile Header */}
      <View style={styles.profileHeader}>
        <Avatar.Image 
          size={70} 
          source={{ uri: user?.photoURL || 'https://ui-avatars.com/api/?name=User' }} 
          style={styles.avatar}
        />
        <View style={styles.headerText}>
          <Text style={styles.userName}>{user?.displayName || 'Student'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Performance Overview</Text>

      {/* 2. Key Metrics Grid */}
      <View style={styles.statsRow}>
        <Surface style={styles.halfCard}>
          <Text style={styles.cardTitle}>Questions</Text>
          <Text style={styles.statValue}>{stats.totalQuestionsAsked || 0}</Text>
        </Surface>
        <Surface style={styles.halfCard}>
          <Text style={styles.cardTitle}>Avg Pace</Text>
          <Text style={styles.statValue}>{stats.avgPace ? stats.avgPace.toFixed(1) : '0.0'}</Text>
          <Text style={styles.cardTitle}>Q/hr</Text>
        </Surface>
      </View>

      {/* 3. Deep Insights */}
      <Surface style={styles.fullCard}>
        <Text style={styles.cardTitle}>Peak Productivity Time</Text>
        <View style={styles.row}>
          <MaterialCommunityIcons name="clock-outline" size={20} color="#00FFCC" />
          <Text style={styles.statValue}>
            {Object.keys(stats.productivityMap || {}).length > 0 
              ? `${Object.entries(stats.productivityMap).sort((a:any, b:any) => b[1] - a[1])[0][0]}:00` 
              : "No data"}
          </Text>
        </View>
      </Surface>

      {/* 4. Interests Cloud */}
      <Surface style={styles.fullCard}>
        <Text style={styles.cardTitle}>Key Interests</Text>
        <View style={styles.chipContainer}>
          {stats.interests ? Object.entries(stats.interests).map(([topic, count]: any) => (
            <Chip key={topic} style={styles.chip} textStyle={styles.chipText}>
              {topic} ({count})
            </Chip>
          )) : <Text style={styles.statValue}>None yet</Text>}
        </View>
      </Surface>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  content: { padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A0A' },
  profileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  avatar: { backgroundColor: '#1A1A1A' },
  headerText: { marginLeft: 15 },
  userName: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  userEmail: { color: '#888', fontSize: 14 },
  sectionTitle: { color: '#00FFCC', fontSize: 18, fontWeight: '700', marginBottom: 15 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  halfCard: { width: '48%', backgroundColor: '#1A1A1A', padding: 20, borderRadius: 16 },
  fullCard: { backgroundColor: '#1A1A1A', padding: 20, borderRadius: 16, marginBottom: 15 },
  cardTitle: { color: '#888', fontSize: 12, textTransform: 'uppercase', marginBottom: 5 },
  statValue: { color: '#FFFFFF', fontSize: 24, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  chip: { backgroundColor: '#2E2E2E', margin: 4 },
  chipText: { color: '#FFFFFF' }
});