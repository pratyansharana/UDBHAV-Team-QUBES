import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export const CareerScreen: React.FC = () => {
  const careerPaths = [
    { title: 'Engineering', icon: 'hammer', color: '#FF6B6B' },
    { title: 'Medical', icon: 'hospital-box', color: '#4ECDC4' },
    { title: 'Business', icon: 'briefcase', color: '#45B7D1' },
    { title: 'Arts & Design', icon: 'palette', color: '#FFA07A' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="compass" size={44} color="#00FFCC" />
          <Text variant="headlineMedium" style={styles.title}>Career Pathways</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>Explore your future</Text>
        </View>

        <Text variant="titleMedium" style={styles.sectionTitle}>Popular Career Paths</Text>

        {careerPaths.map((path, index) => (
          <View key={index} style={styles.card}>
            <View style={styles.pathHeader}>
              <MaterialCommunityIcons
                name={path.icon as any}
                size={32}
                color={path.color}
              />
              <Text variant="titleMedium" style={styles.pathTitle}>
                {path.title}
              </Text>
            </View>
            <Text variant="bodySmall" style={styles.pathDesc}>
              Explore skills, courses, and opportunities in {path.title.toLowerCase()}.
            </Text>
            <Button mode="contained" style={styles.button} buttonColor="#00FFCC" textColor="#0A0A0A">
              Explore
            </Button>
          </View>
        ))}

        <View style={styles.card}>
          <Text variant="titleMedium" style={styles.cardHeading}>Career Assessment</Text>
          <Text variant="bodySmall" style={styles.pathDesc}>
            Take a quick assessment to discover careers aligned with your interests and strengths.
          </Text>
          <Button mode="contained" icon="clipboard-check" buttonColor="#00FFCC" textColor="#0A0A0A">
            Start Assessment
          </Button>
        </View>

        <View style={styles.card}>
          <Text variant="titleMedium" style={styles.cardHeading}>Your Interests</Text>
          <View style={styles.chipGroup}>
            <Chip icon="check" mode="outlined" style={styles.chip}>Problem Solving</Chip>
            <Chip icon="check" mode="outlined" style={styles.chip}>Creativity</Chip>
            <Chip icon="check" mode="outlined" style={styles.chip}>Technology</Chip>
            <Chip icon="check" mode="outlined" style={styles.chip}>Communication</Chip>
          </View>
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
  header: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 18,
  },
  title: {
    marginTop: 12,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  subtitle: {
    color: '#888888',
    marginTop: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  sectionTitle: {
    marginBottom: 10,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  card: {
    marginBottom: 12,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#252525',
    padding: 14,
  },
  pathHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pathTitle: {
    marginLeft: 12,
    flex: 1,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  pathDesc: {
    marginVertical: 8,
    color: '#B2B2B2',
  },
  cardHeading: {
    marginBottom: 8,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  button: {
    marginTop: 8,
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#101010',
    borderColor: '#2E2E2E',
  },
});
