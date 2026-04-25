import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, TextInput, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export const TutorScreen: React.FC = () => {
  const [message, setMessage] = useState('');

  const handleSendMessage = () => {
    if (message.trim()) {
      setMessage('');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="robot" size={44} color="#00FFCC" />
          <Text variant="headlineMedium" style={styles.title}>AI Tutor</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>Ask anything. Learn everything.</Text>
        </View>

        <View style={styles.card}>
          <Text variant="titleMedium" style={styles.cardTitle}>What do you want to learn?</Text>
          <View style={styles.chipGroup}>
            <Chip icon="flash" mode="outlined" style={styles.chip}>Math</Chip>
            <Chip icon="flask" mode="outlined" style={styles.chip}>Science</Chip>
            <Chip icon="book" mode="outlined" style={styles.chip}>History</Chip>
            <Chip icon="palette" mode="outlined" style={styles.chip}>Arts</Chip>
          </View>
        </View>

        <View style={styles.card}>
          <Text variant="titleMedium" style={styles.cardTitle}>Recent Topics</Text>
          <Text style={styles.topicItem}>Quadratic Equations</Text>
          <Text style={styles.topicItem}>Photosynthesis Explained</Text>
          <Text style={styles.topicItem}>World War II Timeline</Text>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Ask your question..."
            value={message}
            onChangeText={setMessage}
            mode="outlined"
            style={styles.input}
            multiline
            numberOfLines={3}
            theme={{
              colors: {
                background: '#1A1A1A',
                onSurfaceVariant: '#888888',
                outline: '#2E2E2E',
                primary: '#00FFCC',
                text: '#FFFFFF',
              },
            }}
            textColor="#FFFFFF"
          />
          <TouchableOpacity onPress={handleSendMessage} style={styles.sendButton}>
            <MaterialCommunityIcons name="send" size={16} color="#0A0A0A" />
            <Text style={styles.sendButtonText}>Send</Text>
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
  subtitle: {
    color: '#888888',
    marginTop: 4,
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
  cardTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 10,
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginVertical: 4,
    backgroundColor: '#101010',
    borderColor: '#2E2E2E',
  },
  topicItem: {
    color: '#C9C9C9',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#242424',
  },
  inputContainer: {
    marginTop: 8,
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#1A1A1A',
  },
  sendButton: {
    marginTop: 4,
    backgroundColor: '#00FFCC',
    borderRadius: 14,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  sendButtonText: {
    color: '#0A0A0A',
    fontWeight: '700',
  },
});
