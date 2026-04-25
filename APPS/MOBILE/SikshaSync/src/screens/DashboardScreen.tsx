import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, Avatar, Chip } from 'react-native-paper';
import { collection, doc, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase/firebaseconfig';
import { useAuth } from '../navigation/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface DashboardStats {
  totalQuestionsAsked?: number;
  avgPace?: number;
  productivityMap?: Record<string, number>;
  interests?: Record<string, number>;
  totalPDFsUploaded?: number;
}

interface InteractionLogEntry {
  type?: string;
  topic?: string;
  hour?: number;
  timestamp?: { toDate?: () => Date };
}

const normalizeSeries = (values: number[], minHeight = 8, maxHeight = 90): number[] => {
  const max = Math.max(...values, 0);
  if (max === 0) {
    return values.map(() => minHeight);
  }

  return values.map((value) => minHeight + (value / max) * (maxHeight - minHeight));
};

export const DashboardScreen: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [logs, setLogs] = useState<InteractionLogEntry[]>([]);

  useEffect(() => {
    if (!user) return;
    
    // Listen to user document in real-time
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (docSnapshot) => {
      setStats((docSnapshot.data() || null) as DashboardStats | null);
    });
    
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setLogs([]);
      return;
    }

    const logsQuery = query(
      collection(db, 'users', user.uid, 'interactionLogs'),
      orderBy('timestamp', 'desc'),
      limit(200)
    );

    const unsubscribe = onSnapshot(logsQuery, (snapshot) => {
      setLogs(snapshot.docs.map((entry) => entry.data() as InteractionLogEntry));
    });

    return unsubscribe;
  }, [user]);

  const logsDerivedMetrics = useMemo(() => {
    const productivityMap: Record<string, number> = {};
    const interests: Record<string, number> = {};
    let totalQuestions = 0;
    let totalPdfs = 0;

    for (const log of logs) {
      const type = log.type || '';
      const hourValue = typeof log.hour === 'number' ? log.hour : undefined;
      const fallbackHour = log.timestamp?.toDate ? log.timestamp.toDate().getHours() : undefined;
      const normalizedHour = hourValue ?? fallbackHour;

      if (type === 'tutor_chat') {
        totalQuestions += 1;
        if (typeof normalizedHour === 'number') {
          productivityMap[normalizedHour] = (productivityMap[normalizedHour] || 0) + 1;
        }

        const topic = log.topic || 'General';
        interests[topic] = (interests[topic] || 0) + 1;
      }

      if (type === 'pdf_upload') {
        totalPdfs += 1;
        if (typeof normalizedHour === 'number') {
          productivityMap[normalizedHour] = (productivityMap[normalizedHour] || 0) + 1;
        }
      }
    }

    return {
      productivityMap,
      interests,
      totalQuestions,
      totalPdfs,
    };
  }, [logs]);

  const effectiveProductivityMap =
    Object.keys(logsDerivedMetrics.productivityMap).length > 0
      ? logsDerivedMetrics.productivityMap
      : (stats?.productivityMap || {});

  const effectiveInterests =
    Object.keys(logsDerivedMetrics.interests).length > 0
      ? logsDerivedMetrics.interests
      : (stats?.interests || {});

  const effectiveQuestionsCount =
    logsDerivedMetrics.totalQuestions > 0
      ? logsDerivedMetrics.totalQuestions
      : (stats?.totalQuestionsAsked || 0);

  const effectivePdfCount =
    logsDerivedMetrics.totalPdfs > 0
      ? logsDerivedMetrics.totalPdfs
      : (stats?.totalPDFsUploaded || 0);

  const productivityEntries = useMemo(() => {
    const map = effectiveProductivityMap;
    return Object.entries(map)
      .map(([hour, value]) => ({ hour, value: Number(value) || 0 }))
      .sort((first, second) => Number(first.hour) - Number(second.hour));
  }, [effectiveProductivityMap]);

  const hourlyTrendData = useMemo(() => {
    const items = productivityEntries.slice(0, 8);
    const labels = items.map((item) => `${item.hour}h`);
    const values = items.map((item) => item.value);
    if (values.length === 0) {
      return {
        labels: ['0h'],
        values: [0],
        heights: [12],
      };
    }

    return {
      labels,
      values,
      heights: normalizeSeries(values, 12, 92),
    };
  }, [productivityEntries]);

  const weeklyBars = useMemo(() => {
    const sourceValues = productivityEntries.slice(-7).map((item) => item.value);
    const values = sourceValues.length > 0 ? sourceValues : Array(7).fill(0);
    const paddedValues = values.length >= 7 ? values : [...values, ...Array(7 - values.length).fill(0)];
    const labels = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7'];
    const heights = normalizeSeries(paddedValues, 12, 104);

    return labels.map((label, index) => ({
      label,
      value: paddedValues[index],
      height: heights[index],
    }));
  }, [productivityEntries]);

  const interestDistribution = useMemo(() => {
    const entries = Object.entries(effectiveInterests).slice(0, 5);
    const colors = ['#00FFCC', '#4CF0B3', '#7EE6A9', '#A6D8A2', '#D0C99E'];

    if (entries.length === 0) {
      return [{ topic: 'No Data', value: 0, color: '#3A3A3A', percentage: 0 }];
    }

    const total = entries.reduce((sum, [, value]) => sum + (Number(value) || 0), 0);

    return entries.map(([topic, count], index) => {
      const value = Number(count) || 0;
      return {
        topic,
        value,
        color: colors[index % colors.length],
        percentage: total > 0 ? (value / total) * 100 : 0,
      };
    });
  }, [effectiveInterests]);

  const topInterest = useMemo(() => {
    const entries = Object.entries(effectiveInterests);
    if (entries.length === 0) return 'None';
    return entries.sort((first, second) => Number(second[1]) - Number(first[1]))[0][0];
  }, [effectiveInterests]);

  const peakHour = useMemo(() => {
    if (productivityEntries.length === 0) return 'No data';
    return `${[...productivityEntries].sort((first, second) => second.value - first.value)[0].hour}:00`;
  }, [productivityEntries]);

  if (!stats) {
    return (
      <View style={styles.center}>
        <Text style={{ color: '#fff' }}>Loading Dashboard...</Text>
      </View>
    );
  }

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
          <Text style={styles.cardTitle}>Questions Asked (Chat)</Text>
          <Text style={styles.statValue}>{effectiveQuestionsCount}</Text>
        </Surface>
        <Surface style={styles.halfCard}>
          <Text style={styles.cardTitle}>Average Pace</Text>
          <Text style={styles.statValue}>{stats.avgPace ? stats.avgPace.toFixed(1) : '0.0'}</Text>
          <Text style={styles.cardTitle}>Questions per hour</Text>
        </Surface>
      </View>

      <View style={styles.statsRow}>
        <Surface style={styles.halfCard}>
          <Text style={styles.cardTitle}>Top Interest Topic</Text>
          <Text style={styles.inlineValue}>{topInterest}</Text>
        </Surface>
        <Surface style={styles.halfCard}>
          <Text style={styles.cardTitle}>PDF Upload Events</Text>
          <Text style={styles.statValue}>{effectivePdfCount}</Text>
        </Surface>
      </View>

      {/* 3. Deep Insights */}
      <Surface style={styles.fullCard}>
        <Text style={styles.cardTitle}>Peak Active Hour</Text>
        <View style={styles.row}>
          <MaterialCommunityIcons name="clock-outline" size={20} color="#00FFCC" />
          <Text style={styles.statValue}>{peakHour}</Text>
        </View>
      </Surface>

      <Surface style={styles.fullCard}>
        <Text style={styles.cardTitle}>Hourly Activity Trend (Latest Slots)</Text>
        <View style={styles.trendChartWrap}>
          {hourlyTrendData.heights.map((height, index) => (
            <View key={`trend-${hourlyTrendData.labels[index]}-${index}`} style={styles.trendColumn}>
              <View style={[styles.trendBar, { height }]} />
              <Text style={styles.trendValue}>{hourlyTrendData.values[index]}</Text>
              <Text style={styles.trendLabel}>{hourlyTrendData.labels[index]}</Text>
            </View>
          ))}
        </View>
      </Surface>

      <Surface style={styles.fullCard}>
        <Text style={styles.cardTitle}>7-Slot Learning Intensity (Recent)</Text>
        <View style={styles.weeklyChartWrap}>
          {weeklyBars.map((entry) => (
            <View key={`week-${entry.label}`} style={styles.weeklyColumn}>
              <Text style={styles.weeklyValue}>{entry.value}</Text>
              <View style={[styles.weeklyBar, { height: entry.height }]} />
              <Text style={styles.weeklyLabel}>{entry.label}</Text>
            </View>
          ))}
        </View>
      </Surface>

      <Surface style={styles.fullCard}>
        <Text style={styles.cardTitle}>Interest Distribution (Top 5)</Text>
        <View style={styles.interestBarsWrap}>
          {interestDistribution.map((entry) => (
            <View key={`interest-${entry.topic}`} style={styles.interestRow}>
              <View style={styles.interestRowHead}>
                <View style={[styles.interestDot, { backgroundColor: entry.color }]} />
                <Text style={styles.interestTopic}>{entry.topic}</Text>
                <Text style={styles.interestPercent}>{entry.percentage.toFixed(0)}%</Text>
              </View>
              <View style={styles.interestTrack}>
                <View
                  style={[
                    styles.interestFill,
                    {
                      backgroundColor: entry.color,
                      width: `${Math.max(4, entry.percentage)}%`,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      </Surface>

      {/* 4. Interests Cloud */}
      <Surface style={styles.fullCard}>
        <Text style={styles.cardTitle}>Key Interests (From Chat Topics)</Text>
        <View style={styles.chipContainer}>
          {Object.keys(effectiveInterests).length > 0 ? Object.entries(effectiveInterests).map(([topic, count]) => (
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
  inlineValue: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  chartBlock: { marginTop: 10, borderRadius: 12 },
  trendChartWrap: {
    marginTop: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: 138,
  },
  trendColumn: {
    width: '11%',
    alignItems: 'center',
  },
  trendBar: {
    width: 12,
    borderRadius: 8,
    backgroundColor: '#00FFCC',
    marginBottom: 6,
  },
  trendValue: {
    color: '#D0D0D0',
    fontSize: 10,
  },
  trendLabel: {
    color: '#8A8A8A',
    fontSize: 10,
    marginTop: 2,
  },
  weeklyChartWrap: {
    marginTop: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: 155,
  },
  weeklyColumn: {
    width: '13%',
    alignItems: 'center',
  },
  weeklyValue: {
    color: '#B9B9B9',
    fontSize: 10,
    marginBottom: 4,
  },
  weeklyBar: {
    width: 16,
    borderRadius: 8,
    backgroundColor: '#2FD7B4',
  },
  weeklyLabel: {
    color: '#8A8A8A',
    fontSize: 10,
    marginTop: 4,
  },
  interestBarsWrap: {
    marginTop: 8,
    gap: 10,
  },
  interestRow: {
    gap: 6,
  },
  interestRowHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  interestDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  interestTopic: {
    color: '#DCDCDC',
    flex: 1,
    fontSize: 12,
  },
  interestPercent: {
    color: '#BDBDBD',
    fontSize: 11,
  },
  interestTrack: {
    width: '100%',
    height: 10,
    borderRadius: 999,
    backgroundColor: '#2A2A2A',
    overflow: 'hidden',
  },
  interestFill: {
    height: '100%',
    borderRadius: 999,
  },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  chip: { backgroundColor: '#2E2E2E', margin: 4 },
  chipText: { color: '#FFFFFF' }
});