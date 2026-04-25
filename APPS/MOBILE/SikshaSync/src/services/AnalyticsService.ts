import { doc, updateDoc, increment, collection, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseconfig';

export const AnalyticsService = {
  
  // Helper to categorize the message topic
  detectTopic(message: string): string {
    const msg = message.toLowerCase();
    if (msg.includes('math') || msg.includes('equation') || msg.includes('calculus')) return 'Math';
    if (msg.includes('science') || msg.includes('biology') || msg.includes('physics')) return 'Science';
    if (msg.includes('history') || msg.includes('war') || msg.includes('ancient')) return 'History';
    if (msg.includes('art') || msg.includes('paint') || msg.includes('design')) return 'Arts';
    return 'General';
  },

  async logInteraction(userId: string, message: string) {
    try {
      const userRef = doc(db, 'users', userId);
      const hour = new Date().getHours();
      const topic = this.detectTopic(message);

      // 1. Log the message
      await addDoc(collection(userRef, 'interactionLogs'), {
        message,
        timestamp: serverTimestamp(),
        hour,
        topic,
        type: 'tutor_chat',
      });

      // 2. Update Productivity, Questions, AND Interests
      await updateDoc(userRef, {
        totalQuestionsAsked: increment(1),
        [`productivityMap.${hour}`]: increment(1),
        [`interests.${topic}`]: increment(1) // Tracks interest counts
      });
    } catch (error) {
      console.error("Analytics Error:", error);
    }
  },

  async updateLearningPace(userId: string, sessionDurationMinutes: number) {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const data = userSnap.data();
        const totalQuestions = data.totalQuestionsAsked || 1;
        
        // Calculate pace: Questions per Hour
        const hours = sessionDurationMinutes / 60;
        const pace = totalQuestions / (hours || 0.1); 
        
        await updateDoc(userRef, {
          avgPace: pace,
          lastSessionDuration: sessionDurationMinutes
        });
      }
    } catch (error) {
      console.error("Pace Update Error:", error);
    }
  }
};