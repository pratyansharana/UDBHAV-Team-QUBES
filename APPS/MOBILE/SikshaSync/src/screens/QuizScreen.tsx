import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, RadioButton, ProgressBar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export const QuizScreen: React.FC = () => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const mockQuestion = {
    number: 1,
    total: 10,
    question: 'What is the capital of France?',
    options: ['London', 'Berlin', 'Paris', 'Madrid'],
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="quiz" size={44} color="#00FFCC" />
          <Text variant="headlineMedium" style={styles.title}>Quiz Mode</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.progressContainer}>
            <Text variant="bodySmall" style={styles.progressLabel}>
              Question {mockQuestion.number} of {mockQuestion.total}
            </Text>
            <ProgressBar
              progress={mockQuestion.number / mockQuestion.total}
              style={styles.progressBar}
              color="#00FFCC"
            />
          </View>

          <Text variant="titleLarge" style={[styles.question, { marginVertical: 20 }]}>
            {mockQuestion.question}
          </Text>

          <View style={styles.optionsContainer}>
            {mockQuestion.options.map((option, index) => (
              <View key={index} style={styles.optionRow}>
                <RadioButton
                  value={option}
                  status={selectedAnswer === option ? 'checked' : 'unchecked'}
                  onPress={() => setSelectedAnswer(option)}
                  color="#00FFCC"
                  uncheckedColor="#6E6E6E"
                />
                <Text variant="bodyMedium" style={[styles.optionText]} onPress={() => setSelectedAnswer(option)}>
                  {option}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Button mode="outlined" style={styles.button} textColor="#CFCFCF">
            Previous
          </Button>
          <Button mode="contained" style={styles.button} buttonColor="#00FFCC" textColor="#0A0A0A" disabled={!selectedAnswer}>
            Next
          </Button>
        </View>

        <View style={styles.card}>
          <Text variant="titleMedium" style={styles.availableTitle}>Available Quizzes</Text>
          <Text style={styles.topicItem}>Mathematics Basics</Text>
          <Text style={styles.topicItem}>Science Chapter 3</Text>
          <Text style={styles.topicItem}>History MCQ</Text>
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
    paddingBottom: 20,
  },
  title: {
    marginTop: 12,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  card: {
    marginBottom: 12,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#252525',
    padding: 14,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressLabel: {
    color: '#8F8F8F',
  },
  progressBar: {
    marginTop: 8,
    height: 6,
    backgroundColor: '#2A2A2A',
  },
  question: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  optionsContainer: {
    marginVertical: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 12,
    backgroundColor: '#111111',
  },
  optionText: {
    marginLeft: 8,
    flex: 1,
    color: '#DADADA',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
    borderColor: '#2E2E2E',
  },
  availableTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 8,
  },
  topicItem: {
    color: '#C9C9C9',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#242424',
  },
});
