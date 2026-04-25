import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, useTheme, RadioButton, ProgressBar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const QuizScreen: React.FC = () => {
  const theme = useTheme();
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const mockQuestion = {
    number: 1,
    total: 10,
    question: 'What is the capital of France?',
    options: ['London', 'Berlin', 'Paris', 'Madrid'],
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="quiz" size={48} color={theme.colors.primary} />
        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.primary }]}>
          Quiz Mode
        </Text>
      </View>

      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.progressContainer}>
              <Text variant="bodySmall">
                Question {mockQuestion.number} of {mockQuestion.total}
              </Text>
              <ProgressBar
                progress={mockQuestion.number / mockQuestion.total}
                style={styles.progressBar}
              />
            </View>

            <Text
              variant="titleLarge"
              style={[styles.question, { marginVertical: 20 }]}
            >
              {mockQuestion.question}
            </Text>

            <View style={styles.optionsContainer}>
              {mockQuestion.options.map((option, index) => (
                <View key={index} style={styles.optionRow}>
                  <RadioButton
                    value={option}
                    status={selectedAnswer === option ? 'checked' : 'unchecked'}
                    onPress={() => setSelectedAnswer(option)}
                  />
                  <Text
                    variant="bodyMedium"
                    style={[styles.optionText]}
                    onPress={() => setSelectedAnswer(option)}
                  >
                    {option}
                  </Text>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>

        <View style={styles.buttonContainer}>
          <Button mode="outlined" style={styles.button}>
            Previous
          </Button>
          <Button
            mode="contained"
            style={styles.button}
            disabled={!selectedAnswer}
          >
            Next
          </Button>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 12 }}>
              Available Quizzes
            </Text>
            <Button mode="text" icon="arrow-right">
              Mathematics Basics
            </Button>
            <Button mode="text" icon="arrow-right">
              Science Chapter 3
            </Button>
            <Button mode="text" icon="arrow-right">
              History MCQ
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
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    marginTop: 8,
    height: 6,
  },
  question: {
    fontWeight: '600',
  },
  optionsContainer: {
    marginVertical: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    paddingHorizontal: 8,
  },
  optionText: {
    marginLeft: 8,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
});
