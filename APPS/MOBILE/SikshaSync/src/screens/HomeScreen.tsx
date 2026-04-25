import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../navigation/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebaseconfig';
import { getAllAvailableModules, getOfflineQuizAttempts, QuizAttempt } from '../services/Quiz';
import { useFocusEffect } from '@react-navigation/native';

interface HomeUserStats {
  totalQuestionsAsked?: number;
  avgPace?: number;
  totalPDFsUploaded?: number;
}

const toDateKey = (iso: string): string => new Date(iso).toISOString().split('T')[0];

const computeStudyStreak = (attempts: QuizAttempt[]): number => {
  if (attempts.length === 0) {
    return 0;
  }

  const dateSet = new Set(attempts.map((item) => toDateKey(item.createdAt)));
  let streak = 0;
  const cursor = new Date();

  while (true) {
    const key = cursor.toISOString().split('T')[0];
    if (!dateSet.has(key)) {
      break;
    }

    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
};

export const HomeScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [userStats, setUserStats] = useState<HomeUserStats | null>(null);
  const [offlineModulesCount, setOfflineModulesCount] = useState(0);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);

  useEffect(() => {
    if (!user) {
      setUserStats(null);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
      setUserStats((snapshot.data() || null) as HomeUserStats | null);
    });

    return unsubscribe;
  }, [user]);

  const loadOfflineStats = useCallback(async () => {
    const [modules, attempts] = await Promise.all([
      getAllAvailableModules(),
      getOfflineQuizAttempts(),
    ]);

    setOfflineModulesCount(modules.length);
    setQuizAttempts(attempts);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadOfflineStats();
    }, [loadOfflineStats])
  );

  const attemptsCount = quizAttempts.length;

  const averageQuizScore = useMemo(() => {
    if (attemptsCount === 0) {
      return 0;
    }

    const total = quizAttempts.reduce((sum, attempt) => sum + attempt.percentage, 0);
    return Math.round(total / attemptsCount);
  }, [quizAttempts, attemptsCount]);

  const bestQuizScore = useMemo(() => {
    if (attemptsCount === 0) {
      return 0;
    }

    return quizAttempts.reduce((best, attempt) => Math.max(best, attempt.percentage), 0);
  }, [quizAttempts, attemptsCount]);

  const studyStreak = useMemo(() => computeStudyStreak(quizAttempts), [quizAttempts]);

  const latestAttemptModule = useMemo(() => {
    if (attemptsCount === 0) {
      return 'No quiz attempts yet';
    }

    const latest = [...quizAttempts].sort(
      (first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
    )[0];
    return latest.moduleTitle;
  }, [quizAttempts, attemptsCount]);

  const totalQuestionsAsked = userStats?.totalQuestionsAsked ?? 0;
  const avgPace = userStats?.avgPace ? userStats.avgPace.toFixed(1) : '0.0';
  const totalPdfs = userStats?.totalPDFsUploaded ?? 0;

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
            <Text style={styles.cardTitle}>Questions Asked</Text>
            <Text style={styles.cardValue}>{totalQuestionsAsked}</Text>
            <Text style={styles.cardMeta}>Avg pace: {avgPace} q/hr</Text>
          </View>

          <View style={styles.statCard}>
            <MaterialCommunityIcons name="fire" size={26} color="#00FFCC" />
            <Text style={styles.cardTitle}>Study Streak</Text>
            <Text style={styles.cardValue}>{studyStreak} Days</Text>
            <Text style={styles.cardMeta}>Best score: {bestQuizScore}%</Text>
          </View>
        </View>

        <View style={styles.gridRow}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="book-open-page-variant" size={26} color="#00FFCC" />
            <Text style={styles.cardTitle}>Offline Modules</Text>
            <Text style={styles.cardValue}>{offlineModulesCount}</Text>
            <Text style={styles.cardMeta}>Ready to practice</Text>
          </View>

          <View style={styles.statCard}>
            <MaterialCommunityIcons name="check-decagram" size={26} color="#00FFCC" />
            <Text style={styles.cardTitle}>Quiz Accuracy</Text>
            <Text style={styles.cardValue}>{averageQuizScore}%</Text>
            <Text style={styles.cardMeta}>{attemptsCount} attempts saved</Text>
          </View>
        </View>

        <View style={styles.wideCard}>
          <Text style={styles.cardTitle}>Recent Learning Data</Text>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="history" size={18} color="#00FFCC" />
            <Text style={styles.infoText}>Last quiz module: {latestAttemptModule}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="file-document-outline" size={18} color="#00FFCC" />
            <Text style={styles.infoText}>PDF summaries generated: {totalPdfs}</Text>
          </View>

          <Text style={[styles.cardTitle, { marginTop: 14 }]}>Quick Actions</Text>
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  infoText: {
    color: '#CFCFCF',
    marginLeft: 8,
    flex: 1,
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
