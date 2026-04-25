import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Text, Button, Chip, Surface, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseconfig';
import { useAuth } from '../navigation/AuthContext';
import { GeminiService } from '../services/GeminiService';

export const CareerScreen: React.FC = () => {
  const [expandedPath, setExpandedPath] = useState<string | null>(null);
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
    setExpandedPath(title);
    setLoading(true);
    setRoadmap('');

    try {
      // Fetch user interests for personalization
      const userSnap = await getDoc(doc(db, 'users', user.uid));
      const interests = Object.keys(userSnap.data()?.interests || {}).join(', ');

      const prompt = `Create a 5-step, actionable career roadmap for a student interested in ${title}. 
      The student's current tracked interests are: ${interests || 'General academics'}. 
      Keep the advice specific to their profile, professional, and encouraging. Return a clean, formatted text response.`;

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

        {careerPaths.map((path) => (
          <Surface key={path.title} style={[styles.card, expandedPath === path.title && { borderColor: '#00FFCC' }]}>
            {expandedPath === path.title ? (
              <View>
                <View style={styles.pathHeader}>
                  <Text variant="titleMedium" style={styles.pathTitle}>{path.title} Roadmap</Text>
                  <IconButton icon="close" iconColor="#888" onPress={() => setExpandedPath(null)} />
                </View>
                {loading ? (
                  <ActivityIndicator color="#00FFCC" style={{ margin: 20 }} />
                ) : (
                  <Text style={styles.roadmapText}>{roadmap}</Text>
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
                <Button mode="contained" buttonColor="#00FFCC" textColor="#0A0A0A" onPress={() => handleExplore(path.title)}>
                  Explore
                </Button>
              </View>
            )}
          </Surface>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { alignItems: 'center', paddingTop: 8, paddingBottom: 18 },
  title: { marginTop: 12, color: '#FFFFFF', fontWeight: '800' },
  content: { paddingHorizontal: 20, paddingBottom: 28 },
  card: { marginBottom: 12, backgroundColor: '#1A1A1A', borderRadius: 16, borderWidth: 1, borderColor: '#252525', padding: 14 },
  pathHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, justifyContent: 'space-between' },
  pathTitle: { marginLeft: 12, color: '#FFFFFF', fontWeight: '700', flex: 1 },
  pathDesc: { marginVertical: 8, color: '#B2B2B2' },
  roadmapText: { color: '#FFFFFF', fontSize: 14, lineHeight: 22, marginTop: 10, padding: 5 }
});