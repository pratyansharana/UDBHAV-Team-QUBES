import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Keyboard,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Alert,
  Modal,
} from 'react-native';
import { Text, TextInput, Surface, Button } from 'react-native-paper';
import Markdown from 'react-native-markdown-display';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
  type?: 'text' | 'pdf_summary';
  fileName?: string;
}

// Animated 3-dot typing indicator component
const TypingIndicator: React.FC = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const bounce = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: -6, duration: 280, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 280, useNativeDriver: true }),
          Animated.delay(600),
        ])
      );

    const a1 = bounce(dot1, 0);
    const a2 = bounce(dot2, 160);
    const a3 = bounce(dot3, 320);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  return (
    <View style={typingStyles.row}>
      <View style={typingStyles.avatarBox}>
        <MaterialCommunityIcons name="robot" size={16} color="#0A0A0A" />
      </View>
      <View style={typingStyles.bubble}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View
            key={i}
            style={[typingStyles.dot, { transform: [{ translateY: dot }] }]}
          />
        ))}
      </View>
    </View>
  );
};

const typingStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 14,
    marginTop: 2,
  },
  avatarBox: {
    backgroundColor: '#00FFCC',
    padding: 7,
    borderRadius: 10,
    marginRight: 8,
    alignSelf: 'flex-end',
    marginBottom: 2,
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1C',
    borderRadius: 18,
    borderBottomLeftRadius: 5,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 5,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#00FFCC',
  },
});

export const TutorScreen: React.FC = () => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [uploadingPDF, setUploadingPDF] = useState(false);
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [pdfSummary, setPDFSummary] = useState('');
  const [chatHistory, setChatHistory] = useState<Message[]>([
    {
      id: '0',
      text: "Hello! I'm SikshaSync AI. How can I help you learn today?\n\n💡 Tip: You can paste your notes or document text here for a quick summary.",
      sender: 'ai',
      timestamp: Date.now(),
    },
  ]);

  const flatListRef = useRef<FlatList>(null);
  const sessionStart = useRef(Date.now());
  const sendScale = useRef(new Animated.Value(1)).current;
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const animateSend = () => {
    Animated.sequence([
      Animated.timing(sendScale, { toValue: 0.85, duration: 80, useNativeDriver: true }),
      Animated.timing(sendScale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
  };

  const handlePDFUpload = () => {
    Alert.alert(
      'PDF Upload Disabled',
      'Document picker is disabled. Paste text from your PDF into chat to get a summary.'
    );
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !user || loading) return;

    animateSend();
    const currentMsg = message.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      text: currentMsg,
      sender: 'user',
      timestamp: Date.now(),
    };

    setChatHistory(prev => [...prev, userMessage]);
    setMessage('');
    setLoading(true);
    Keyboard.dismiss();

    console.log('[TUTOR] Sending message to AI:', currentMsg);

    try {
      // Prepare history for memory
      const formattedHistory = chatHistory
        .filter(m => m.id !== '0')
        .map(m => ({
          role: m.sender === 'user' ? ('user' as const) : ('model' as const),
          text: m.text,
        }));

      // Get AI Response
      const aiResponse = await GeminiService.askTutor(currentMsg, formattedHistory);
      console.log('[TUTOR] AI Response received.');

      const aiMessage: Message = {
        id: Date.now().toString() + 'ai',
        text: aiResponse,
        sender: 'ai',
        timestamp: Date.now(),
      };
      setChatHistory(prev => [...prev, aiMessage]);

      // Analytics
      console.log('[ANALYTICS] Preparing data for user:', user.uid);
      const userRef = doc(db, 'users', user.uid);

      const payload = {
        message: currentMsg,
        timestamp: serverTimestamp(),
        hour: new Date().getHours(),
        type: 'tutor_chat',
      };

      await addDoc(collection(userRef, 'interactionLogs'), payload);
      console.log('[ANALYTICS] Log saved to interactionLogs.');

      await updateDoc(userRef, {
        totalQuestionsAsked: increment(1),
        [`productivityMap.${new Date().getHours()}`]: increment(1),
      });
      console.log('[ANALYTICS] User metrics updated.');

      // Pace Calculation
      const durationHours = (Date.now() - sessionStart.current) / 3600000;
      if (durationHours > 0.01) {
        await AnalyticsService.updateLearningPace(user.uid, durationHours * 60);
      }
    } catch (error) {
      console.error('[TUTOR] Error during operation:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => (
    <View
      style={[
        styles.messageRow,
        item.sender === 'user' ? styles.userRow : styles.aiRow,
        index === 0 && { marginTop: 8 },
      ]}
    >
      {item.sender === 'ai' && (
        <View style={styles.avatar}>
          <MaterialCommunityIcons name="robot" size={16} color="#0A0A0A" />
        </View>
      )}
      <View
        style={[
          styles.messageBubble,
          item.sender === 'user' ? styles.userBubble : styles.aiBubble,
        ]}
      >
        {item.sender === 'ai' ? (
          <Markdown style={markdownStyles}>{item.text}</Markdown>
        ) : (
          <Text style={[styles.messageText, { color: '#FFFFFF' }]}>{item.text}</Text>
        )}
        <Text
          style={[
            styles.timestamp,
            item.sender === 'ai' ? { color: 'rgba(10,10,10,0.45)' } : { color: 'rgba(255,255,255,0.35)' },
          ]}
        >
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      {item.sender === 'user' && (
        <View style={styles.avatarUser}>
          <MaterialCommunityIcons name="account" size={16} color="#0A0A0A" />
        </View>
      )}
    </View>
  );

  const renderTypingIndicator = () => {
    if (!loading && !uploadingPDF) return null;
    return <TypingIndicator />;
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

        {/* Header with PDF Upload Button */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.logoCircle}>
              <MaterialCommunityIcons name="robot" size={20} color="#0A0A0A" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>SikshaSync Tutor</Text>
              <View style={styles.onlineBadge}>
                <View style={styles.onlineDot} />
                <Text style={styles.headerSubtitle}>AI Powered · Online</Text>
              </View>
            </View>
          </View>
          
          {/* PDF Button (picker disabled) */}
          <TouchableOpacity
            onPress={handlePDFUpload}
            disabled={uploadingPDF}
            style={styles.pdfButton}
          >
            {uploadingPDF ? (
              <ActivityIndicator size="small" color="#00FFCC" />
            ) : (
              <>
                <MaterialCommunityIcons name="file-cancel" size={24} color="#00FFCC" />
                <Text style={styles.pdfButtonText}>PDF Disabled</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Chat List */}
        <FlatList
          ref={flatListRef}
          data={chatHistory}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.chatList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          onLayout={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
          ListFooterComponent={renderTypingIndicator}
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        />

        {/* Input Bar */}
        <Surface
          style={[
            styles.inputContainer,
            {
              borderColor: inputFocused ? '#00FFCC' : 'transparent',
              marginBottom: insets.bottom > 0 ? insets.bottom : 12,
            },
          ]}
          elevation={5}
        >
          <TextInput
            placeholder="Ask anything or paste document text..."
            value={message}
            onChangeText={setMessage}
            mode="flat"
            multiline
            maxLength={2000}
            style={styles.input}
            underlineColor="transparent"
            activeUnderlineColor="transparent"
            placeholderTextColor="#555"
            contentStyle={{ color: '#FFFFFF' }}
            textColor="#FFFFFF"
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            onSubmitEditing={handleSendMessage}
            blurOnSubmit={false}
            theme={{
              colors: {
                background: 'transparent',
                primary: '#00FFCC',
              },
            }}
          />
          <Animated.View style={{ transform: [{ scale: sendScale }] }}>
            <TouchableOpacity
              onPress={handleSendMessage}
              style={[
                styles.sendButton,
                (!message.trim() || loading) && styles.sendButtonDisabled,
              ]}
              disabled={loading || !message.trim()}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#0A0A0A" size="small" />
              ) : (
                <MaterialCommunityIcons name="send" size={20} color="#0A0A0A" />
              )}
            </TouchableOpacity>
          </Animated.View>
        </Surface>

        {/* PDF Summary Modal */}
        <Modal
          visible={showPDFModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowPDFModal(false)}
        >
          <SafeAreaView style={modalStyles.modalContainer}>
            <View style={modalStyles.modalHeader}>
              <Text style={modalStyles.modalTitle}>PDF Summary</Text>
              <TouchableOpacity
                onPress={() => setShowPDFModal(false)}
                style={modalStyles.modalClose}
              >
                <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={[{ id: 'summary', text: pdfSummary }]}
              renderItem={({ item }) => (
                <View style={modalStyles.modalContent}>
                  <Markdown style={modalMarkdownStyles}>{item.text}</Markdown>
                </View>
              )}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
            />
            <View style={modalStyles.modalFooter}>
              <Button
                mode="contained"
                onPress={() => setShowPDFModal(false)}
                buttonColor="#00FFCC"
                textColor="#0A0A0A"
                style={modalStyles.modalButton}
              >
                Close
              </Button>
            </View>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

// Add modal styles
const modalStyles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#00FFCC',
  },
  modalClose: {
    padding: 8,
  },
  modalContent: {
    padding: 20,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
  },
  modalButton: {
    borderRadius: 12,
  },
});

const modalMarkdownStyles = {
  body: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0.1,
  },
};

// Add PDF button style
const pdfButtonStyles = {
  pdfButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  pdfButtonText: {
    color: '#00FFCC',
    fontSize: 12,
    fontWeight: '600' as const,
  },
};

// Merge styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
    backgroundColor: '#0A0A0A',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoCircle: {
    backgroundColor: '#00FFCC',
    padding: 10,
    borderRadius: 14,
  },
  headerText: {
    marginLeft: 12,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00FFCC',
    marginRight: 5,
  },
  headerSubtitle: {
    color: '#666',
    fontSize: 12,
    fontWeight: '500',
  },
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  pdfButtonText: {
    color: '#00FFCC',
    fontSize: 12,
    fontWeight: '600',
  },
  chatList: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    flexGrow: 1,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  aiRow: {
    justifyContent: 'flex-start',
  },
  avatar: {
    backgroundColor: '#00FFCC',
    padding: 7,
    borderRadius: 10,
    marginRight: 8,
    alignSelf: 'flex-end',
    marginBottom: 2,
  },
  avatarUser: {
    backgroundColor: '#FFFFFF',
    padding: 7,
    borderRadius: 10,
    marginLeft: 8,
    alignSelf: 'flex-end',
    marginBottom: 2,
  },
  messageBubble: {
    padding: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    maxWidth: '80%',
  },
  userBubble: {
    backgroundColor: '#1E1E1E',
    borderBottomRightRadius: 5,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  aiBubble: {
    backgroundColor: '#00FFCC',
    borderBottomLeftRadius: 5,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 20,
    paddingHorizontal: 6,
    paddingVertical: 6,
    backgroundColor: '#151515',
    borderWidth: 1.5,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
    maxHeight: 120,
    minHeight: 40,
    backgroundColor: 'transparent',
    paddingTop: Platform.OS === 'ios' ? 8 : 0,
  },
  sendButton: {
    backgroundColor: '#00FFCC',
    padding: 11,
    borderRadius: 14,
    marginLeft: 6,
    alignSelf: 'flex-end',
    marginBottom: 2,
  },
  sendButtonDisabled: {
    opacity: 0.35,
  },
});

// Merge markdown styles
const markdownStyles = {
  body: {
    color: '#0A0A0A',
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 6,
  },
  heading1: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#0A0A0A',
    marginBottom: 6,
    marginTop: 4,
  },
  heading2: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#0A0A0A',
    marginBottom: 4,
    marginTop: 4,
  },
  heading3: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#0A0A0A',
    marginBottom: 4,
    marginTop: 4,
  },
  strong: {
    fontWeight: '700' as const,
    color: '#0A0A0A',
  },
  em: {
    fontStyle: 'italic' as const,
    color: '#1A1A1A',
  },
  code_inline: {
    backgroundColor: 'rgba(0,0,0,0.12)',
    color: '#0A0A0A',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  fence: {
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 8,
    padding: 10,
    marginVertical: 6,
  },
  code_block: {
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 8,
    padding: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    color: '#0A0A0A',
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
    color: '#0A0A0A',
    fontWeight: '700' as const,
    marginRight: 6,
  },
  ordered_list_icon: {
    color: '#0A0A0A',
    fontWeight: '700' as const,
    marginRight: 6,
  },
  blockquote: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#0A0A0A',
    paddingLeft: 10,
    paddingVertical: 4,
    marginVertical: 4,
    borderRadius: 2,
  },
  hr: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    height: 1,
    marginVertical: 8,
  },
};