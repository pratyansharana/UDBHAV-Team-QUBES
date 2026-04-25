import React, { useState, useRef } from 'react';
import { 
  View, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, 
  Keyboard, StatusBar, KeyboardAvoidingView, Platform 
} from 'react-native';
import { Text, TextInput, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, addDoc, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';

import { db } from '../firebase/firebaseconfig'; 
import { useAuth } from '../navigation/AuthContext';
import { GeminiService } from '../services/GeminiService';
import { AnalyticsService } from '../services/AnalyticsService';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: number;
}

export const TutorScreen: React.FC = () => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Message[]>([
    { id: '0', text: "Hello! I'm SikshaSync AI. How can I help you learn today?", sender: 'ai', timestamp: Date.now() }
  ]);

  const flatListRef = useRef<FlatList>(null);
  const sessionStart = useRef(Date.now());
  const { user } = useAuth();

  const handleSendMessage = async () => {
    if (!message.trim() || !user || loading) return;

    const currentMsg = message;
    const userMessage: Message = { id: Date.now().toString(), text: currentMsg, sender: 'user', timestamp: Date.now() };
    
    setChatHistory(prev => [...prev, userMessage]);
    setMessage('');
    setLoading(true);
    Keyboard.dismiss();

    console.log("[TUTOR] Sending message to AI:", currentMsg);

    try {
      // 1. Prepare history for memory
      const formattedHistory = chatHistory
        .filter(m => m.id !== '0') 
        .map(m => ({
          role: m.sender === 'user' ? ('user' as const) : ('model' as const),
          text: m.text
        }));

      // 2. Get AI Response
      const aiResponse = await GeminiService.askTutor(currentMsg, formattedHistory);
      console.log("[TUTOR] AI Response received.");
      
      const aiMessage: Message = { id: Date.now().toString() + 'ai', text: aiResponse, sender: 'ai', timestamp: Date.now() };
      setChatHistory(prev => [...prev, aiMessage]);

      // 3. Analytics (WITH DEBUG LOGS)
      console.log("[ANALYTICS] Preparing data for user:", user.uid);
      const userRef = doc(db, 'users', user.uid);
      
      const payload = {
        message: currentMsg,
        timestamp: serverTimestamp(),
        hour: new Date().getHours(),
        type: 'tutor_chat',
      };
      
      await addDoc(collection(userRef, 'interactionLogs'), payload);
      console.log("[ANALYTICS] Log saved to interactionLogs.");

      await updateDoc(userRef, {
        totalQuestionsAsked: increment(1),
        [`productivityMap.${new Date().getHours()}`]: increment(1)
      });
      console.log("[ANALYTICS] User metrics updated.");

      // Pace Calculation
      const durationHours = (Date.now() - sessionStart.current) / 3600000;
      if (durationHours > 0.01) {
        await AnalyticsService.updateLearningPace(user.uid, durationHours * 60);
      }

    } catch (error) {
      console.error("[TUTOR] Error during operation:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.messageRow, item.sender === 'user' ? styles.userRow : styles.aiRow]}>
      {item.sender === 'ai' && (
        <View style={styles.avatar}><MaterialCommunityIcons name="robot" size={18} color="#0A0A0A" /></View>
      )}
      <View style={[styles.messageBubble, item.sender === 'user' ? styles.userBubble : styles.aiBubble]}>
        <Text style={[styles.messageText, item.sender === 'ai' && { color: '#0A0A0A' }]}>{item.text}</Text>
      </View>
      {item.sender === 'user' && (
        <View style={styles.avatarUser}><MaterialCommunityIcons name="account" size={18} color="#0A0A0A" /></View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoCircle}><MaterialCommunityIcons name="robot" size={22} color="#0A0A0A" /></View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>SikshaSync Tutor</Text>
            <Text style={styles.headerSubtitle}>AI Powered Learning</Text>
          </View>
        </View>
      </View>
      <FlatList
        ref={flatListRef}
        data={chatHistory}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.chatList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Surface style={styles.inputContainer} elevation={4}>
          <TextInput
            placeholder="Ask anything..."
            value={message}
            onChangeText={setMessage}
            mode="flat"
            multiline
            style={styles.input}
            underlineColor="transparent"
            activeUnderlineColor="transparent"
            placeholderTextColor="#888"
            theme={{ colors: { background: 'transparent', text: '#FFFFFF', primary: '#00FFCC' } }}
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            style={[styles.sendButton, (!message.trim() || loading) && { opacity: 0.4 }]}
            disabled={loading || !message.trim()}
          >
            {loading ? <ActivityIndicator color="#0A0A0A" /> : <MaterialCommunityIcons name="send" size={22} color="#0A0A0A" />}
          </TouchableOpacity>
        </Surface>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#1F1F1F' },
  headerContent: { flexDirection: 'row', alignItems: 'center' },
  logoCircle: { backgroundColor: '#00FFCC', padding: 10, borderRadius: 12 },
  headerText: { marginLeft: 12 },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  headerSubtitle: { color: '#AAAAAA', fontSize: 12 },
  chatList: { padding: 16 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 14 },
  userRow: { justifyContent: 'flex-end' },
  aiRow: { justifyContent: 'flex-start' },
  avatar: { backgroundColor: '#00FFCC', padding: 6, borderRadius: 8, marginRight: 8 },
  avatarUser: { backgroundColor: '#FFFFFF', padding: 6, borderRadius: 8, marginLeft: 8 },
  messageBubble: { padding: 14, borderRadius: 16, maxWidth: '75%' },
  userBubble: { backgroundColor: '#1F1F1F', borderBottomRightRadius: 4 },
  aiBubble: { backgroundColor: '#00FFCC', borderBottomLeftRadius: 4 },
  messageText: { color: '#FFFFFF', fontSize: 15, lineHeight: 22 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', margin: 16, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#151515' },
  input: { flex: 1, fontSize: 15, color: '#FFFFFF', maxHeight: 100, backgroundColor: 'transparent' },
  sendButton: { backgroundColor: '#00FFCC', padding: 12, borderRadius: 12, marginLeft: 8 }
});