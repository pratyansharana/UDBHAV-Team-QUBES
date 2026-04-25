import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const HomeScreen: React.FC = () => {
  const theme = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={[styles.greeting, { color: theme.colors.primary }]}>
          Welcome Back! 👋
        </Text>
      </View>

      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="chart-line" size={32} color={theme.colors.primary} />
              <Text variant="titleMedium" style={{ marginLeft: 12 }}>
                Your Progress
              </Text>
            </View>
            <Text variant="bodyMedium" style={{ marginTop: 8 }}>
              📊 Total Learning Hours: 12.5h
            </Text>
            <Text variant="bodyMedium" style={{ marginTop: 4 }}>
              📈 This Week: 4.2h
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="lightning-bolt" size={32} color={theme.colors.secondary} />
              <Text variant="titleMedium" style={{ marginLeft: 12 }}>
                Streak
              </Text>
            </View>
            <Text variant="bodyMedium" style={{ marginTop: 8 }}>
              🔥 Current Streak: 5 days
            </Text>
            <Text variant="bodyMedium" style={{ marginTop: 4 }}>
              Best Streak: 12 days
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 12 }}>
              Quick Actions
            </Text>
            <Button mode="contained" style={styles.actionButton}>
              Start Learning
            </Button>
            <Button mode="outlined" style={styles.actionButton}>
              View Achievements
            </Button>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  greeting: {
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginTop: 8,
  },
});
