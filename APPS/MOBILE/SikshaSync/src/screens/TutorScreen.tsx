import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, TextInput, Button, useTheme, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const TutorScreen: React.FC = () => {
  const theme = useTheme();
  const [message, setMessage] = useState('');

  const handleSendMessage = () => {
    if (message.trim()) {
      setMessage('');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="robot" size={48} color={theme.colors.primary} />
        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.primary }]}>
          AI Tutor
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Ask anything. Learn everything.
        </Text>
      </View>

      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 12 }}>
              What would you like to learn about?
            </Text>

            <View style={styles.chipGroup}>
              <Chip icon="flash" mode="outlined" style={styles.chip}>
                Math
              </Chip>
              <Chip icon="flask" mode="outlined" style={styles.chip}>
                Science
              </Chip>
            </View>

            <View style={styles.chipGroup}>
              <Chip icon="book" mode="outlined" style={styles.chip}>
                History
              </Chip>
              <Chip icon="palette" mode="outlined" style={styles.chip}>
                Arts
              </Chip>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 12 }}>
              Recent Topics
            </Text>
            <Button mode="text" icon="arrow-right">
              Quadratic Equations
            </Button>
            <Button mode="text" icon="arrow-right">
              Photosynthesis Explained
            </Button>
            <Button mode="text" icon="arrow-right">
              World War II Timeline
            </Button>
          </Card.Content>
        </Card>

        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Ask your question..."
            value={message}
            onChangeText={setMessage}
            mode="outlined"
            style={styles.input}
            multiline
            numberOfLines={3}
          />
          <Button
            mode="contained"
            onPress={handleSendMessage}
            icon="send"
            style={styles.sendButton}
          >
            Send
          </Button>
        </View>
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
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    marginVertical: 4,
  },
  inputContainer: {
    marginTop: 16,
  },
  input: {
    marginBottom: 12,
  },
  sendButton: {
    marginTop: 8,
  },
});
