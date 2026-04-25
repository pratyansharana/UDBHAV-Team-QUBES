import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, useTheme, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const CareerScreen: React.FC = () => {
  const theme = useTheme();

  const careerPaths = [
    { title: 'Engineering', icon: 'hammer', color: '#FF6B6B' },
    { title: 'Medical', icon: 'hospital-box', color: '#4ECDC4' },
    { title: 'Business', icon: 'briefcase', color: '#45B7D1' },
    { title: 'Arts & Design', icon: 'palette', color: '#FFA07A' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="compass" size={48} color={theme.colors.primary} />
        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.primary }]}>
          Career Pathways
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Explore your future
        </Text>
      </View>

      <View style={styles.content}>
        <Text variant="titleMedium" style={{ marginBottom: 12 }}>
          Popular Career Paths
        </Text>

        {careerPaths.map((path, index) => (
          <Card key={index} style={styles.card}>
            <Card.Content>
              <View style={styles.pathHeader}>
                <MaterialCommunityIcons
                  name={path.icon as any}
                  size={32}
                  color={path.color}
                />
                <Text variant="titleMedium" style={{ marginLeft: 12, flex: 1 }}>
                  {path.title}
                </Text>
              </View>
              <Text variant="bodySmall" style={{ marginVertical: 8 }}>
                Explore skills, courses, and opportunities in {path.title.toLowerCase()}
              </Text>
              <Button mode="contained-tonal" style={styles.button}>
                Explore
              </Button>
            </Card.Content>
          </Card>
        ))}

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 12 }}>
              Career Assessment
            </Text>
            <Text variant="bodySmall" style={{ marginBottom: 12 }}>
              Take a quick assessment to discover careers aligned with your interests and strengths.
            </Text>
            <Button mode="contained" icon="clipboard-check">
              Start Assessment
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 12 }}>
              Your Interests
            </Text>
            <View style={styles.chipGroup}>
              <Chip icon="check" mode="outlined">
                Problem Solving
              </Chip>
              <Chip icon="check" mode="outlined">
                Creativity
              </Chip>
            </View>
            <View style={styles.chipGroup}>
              <Chip icon="check" mode="outlined">
                Technology
              </Chip>
              <Chip icon="check" mode="outlined">
                Communication
              </Chip>
            </View>
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
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  title: {
    marginTop: 12,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  pathHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  button: {
    marginTop: 8,
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
