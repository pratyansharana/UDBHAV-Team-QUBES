import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Text, Button, Chip, Surface, IconButton, TextInput } from 'react-native-paper';
import Markdown from 'react-native-markdown-display';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseconfig';
import { useAuth } from '../navigation/AuthContext';
import { GeminiService } from '../services/GeminiService';

export const CareerScreen: React.FC = () => {
  const [selectedCareer, setSelectedCareer] = useState<string | null>(null);
  const [careerInput, setCareerInput] = useState('');
  const [roadmap, setRoadmap] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const careerPaths = [
    { title: 'Engineering', icon: 'hammer', color: '#FF6B6B' },
    { title: 'Medical', icon: 'hospital-box', color: '#4ECDC4' },
    { title: 'Business', icon: 'briefcase', color: '#45B7D1' },
    { title: 'Arts & Design', icon: 'palette', color: '#FFA07A' },
  ];

  const handleExplore = async (title: string) => {
    if (!user) return;
    const normalizedCareer = title.trim();
    if (!normalizedCareer) {
      return;
    }

    setSelectedCareer(normalizedCareer);
    setLoading(true);
    setRoadmap('');

    try {
      // Fetch user interests for personalization
      const userSnap = await getDoc(doc(db, 'users', user.uid));
      const interests = Object.keys(userSnap.data()?.interests || {}).join(', ');
      const questionsAsked = userSnap.data()?.totalQuestionsAsked || 0;
      const avgPace = userSnap.data()?.avgPace || 0;

      const prompt = `Create an exact, practical roadmap for a student targeting the career "${normalizedCareer}".

Student profile context:
- Interests: ${interests || 'General academics'}
- Questions asked in app: ${questionsAsked}
- Average pace: ${avgPace}

Output requirements:
1) Return only clean text (no JSON).
2) Keep output concise, but specific and realistic.
3) Return output in clean markdown.
4) Include these sections in order:
   - Career Goal
   - 30-Day Plan (daily/weekly actions)
   - 3-Month Plan (skills + projects)
   - 6-Month Plan (portfolio + internships)
   - Required Skills and Tools
   - Certifications/Courses (top picks)
   - Milestones and How to Track Progress
   - Common Mistakes to Avoid
5) Use numbered bullets and actionable steps.`;

      const response = await GeminiService.askTutor(prompt, []);
      setRoadmap(response);
    } catch (error) {
      setRoadmap("Could not generate roadmap. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="compass" size={44} color="#00FFCC" />
          <Text variant="headlineMedium" style={styles.title}>Career Pathways</Text>
        </View>

        <Surface style={styles.inputCard}>
          <Text style={styles.inputTitle}>Enter Your Target Career</Text>
          <TextInput
            mode="outlined"
            value={careerInput}
            onChangeText={setCareerInput}
            placeholder="e.g. Data Scientist, IAS Officer, UX Designer"
            placeholderTextColor="#6E6E6E"
            outlineColor="#2E2E2E"
            activeOutlineColor="#00FFCC"
            textColor="#FFFFFF"
            style={styles.careerInput}
            right={
              <TextInput.Icon
                icon="send"
                onPress={() => void handleExplore(careerInput)}
                color="#00FFCC"
              />
            }
          />
          <Button
            mode="contained"
            buttonColor="#00FFCC"
            textColor="#0A0A0A"
            disabled={loading || !careerInput.trim()}
            onPress={() => void handleExplore(careerInput)}
            style={styles.generateButton}
          >
            Generate Exact Roadmap
          </Button>
        </Surface>

        <Text style={styles.sectionLabel}>Quick Career Picks</Text>

        <View style={styles.quickPicks}>
          {careerPaths.map((path) => (
            <Chip
              key={`chip-${path.title}`}
              onPress={() => {
                setCareerInput(path.title);
                void handleExplore(path.title);
              }}
              selected={selectedCareer === path.title}
              style={styles.pickChip}
              textStyle={styles.pickChipText}
            >
              {path.title}
            </Chip>
          ))}
        </View>

        {careerPaths.map((path) => (
          <Surface key={path.title} style={[styles.card, selectedCareer === path.title && { borderColor: '#00FFCC' }]}>
            {selectedCareer === path.title ? (
              <View>
                <View style={styles.pathHeader}>
                  <Text variant="titleMedium" style={styles.pathTitle}>{path.title} Roadmap</Text>
                  <IconButton icon="close" iconColor="#888" onPress={() => setSelectedCareer(null)} />
                </View>
                {loading ? (
                  <ActivityIndicator color="#00FFCC" style={{ margin: 20 }} />
                ) : (
                  <Markdown style={markdownStyles}>{roadmap}</Markdown>
                )}
              </View>
            ) : (
              <View>
                <View style={styles.pathHeader}>
                  <MaterialCommunityIcons name={path.icon as any} size={32} color={path.color} />
                  <Text variant="titleMedium" style={styles.pathTitle}>{path.title}</Text>
                </View>
                <Text variant="bodySmall" style={styles.pathDesc}>
                  Explore skills, courses, and opportunities in {path.title.toLowerCase()}.
                </Text>
                <Button mode="contained" buttonColor="#00FFCC" textColor="#0A0A0A" onPress={() => void handleExplore(path.title)}>
                  Explore
                </Button>
              </View>
            )}
          </Surface>
        ))}

        {selectedCareer && !careerPaths.some((path) => path.title === selectedCareer) ? (
          <Surface style={[styles.card, { borderColor: '#00FFCC' }]}>
            <View style={styles.pathHeader}>
              <Text variant="titleMedium" style={styles.pathTitle}>{selectedCareer} Roadmap</Text>
              <IconButton icon="close" iconColor="#888" onPress={() => setSelectedCareer(null)} />
            </View>
            {loading ? (
              <ActivityIndicator color="#00FFCC" style={{ margin: 20 }} />
            ) : (
              <Markdown style={markdownStyles}>{roadmap}</Markdown>
            )}
          </Surface>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { alignItems: 'center', paddingTop: 8, paddingBottom: 18 },
  title: { marginTop: 12, color: '#FFFFFF', fontWeight: '800' },
  content: { paddingHorizontal: 20, paddingBottom: 28 },
  inputCard: { marginBottom: 12, backgroundColor: '#1A1A1A', borderRadius: 16, borderWidth: 1, borderColor: '#252525', padding: 14 },
  inputTitle: { color: '#FFFFFF', fontWeight: '700', marginBottom: 10 },
  careerInput: { backgroundColor: '#101010' },
  generateButton: { marginTop: 10 },
  sectionLabel: { color: '#A9A9A9', marginBottom: 8, fontWeight: '600' },
  quickPicks: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  pickChip: { backgroundColor: '#101010', borderColor: '#2E2E2E' },
  pickChipText: { color: '#E2E2E2' },
  card: { marginBottom: 12, backgroundColor: '#1A1A1A', borderRadius: 16, borderWidth: 1, borderColor: '#252525', padding: 14 },
  pathHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, justifyContent: 'space-between' },
  pathTitle: { marginLeft: 12, color: '#FFFFFF', fontWeight: '700', flex: 1 },
  pathDesc: { marginVertical: 8, color: '#B2B2B2' },
  roadmapText: { color: '#FFFFFF', fontSize: 14, lineHeight: 22, marginTop: 10, padding: 5 }
});

const markdownStyles = {
  body: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
  },
  heading1: {
    color: '#00FFCC',
    fontSize: 18,
    fontWeight: '700' as const,
    marginTop: 6,
    marginBottom: 4,
  },
  heading2: {
    color: '#00FFCC',
    fontSize: 16,
    fontWeight: '700' as const,
    marginTop: 6,
    marginBottom: 4,
  },
  heading3: {
    color: '#BFFFEF',
    fontSize: 15,
    fontWeight: '700' as const,
    marginTop: 6,
    marginBottom: 4,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 6,
  },
  bullet_list: {
    marginVertical: 4,
  },
  ordered_list: {
    marginVertical: 4,
  },
  list_item: {
    marginBottom: 3,
    flexDirection: 'row' as const,
  },
  bullet_list_icon: {
    color: '#00FFCC',
    marginRight: 6,
  },
  ordered_list_icon: {
    color: '#00FFCC',
    marginRight: 6,
  },
  strong: {
    color: '#FFFFFF',
    fontWeight: '700' as const,
  },
};