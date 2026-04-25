import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // App & Navigation
      app_name: 'SikshaSync',
      dashboard: 'Dashboard',
      aiTutor: 'AI Tutor',
      quiz: 'Quiz',
      careers: 'Careers',
      
     // Login Screen (Updated for Underserved AI Education)
      slide1Title: 'Smart\nTutor',
      slide1Desc: 'Get personalized guidance from an intelligent AI tutor available 24/7. Learn at your own pace, anytime, anywhere.',
      slide2Title: 'Education\nFor All',
      slide2Desc: 'Breaking down barriers to quality education. Access premium learning resources and interactive quizzes entirely for free.',
      slide3Title: 'Achieve\nExcellence',
      slide3Desc: 'Discover your strengths, build critical skills, and prepare for a bright future with customized career pathways.',
      
      loginWithGoogle: 'Login With Google',
      madeInIndia: 'Made in INDIA.',
      connectionFailed: 'Connection Failed',
      connectionError: 'Could not connect to SikshaSync. Please check your internet and try again.',
      // Home Screen
      welcomeBack: 'Welcome Back!',
      yourProgress: 'Your Progress',
      totalLearningHours: 'Total Learning Hours',
      thisWeek: 'This Week',
      streak: 'Streak',
      currentStreak: 'Current Streak',
      bestStreak: 'Best Streak',
      quickActions: 'Quick Actions',
      startLearning: 'Start Learning',
      viewAchievements: 'View Achievements',
      
      // Tutor Screen
      aiTutorTitle: 'AI Tutor',
      askAnything: 'Ask anything. Learn everything.',
      whatWouldYouLike: 'What would you like to learn about?',
      math: 'Math',
      science: 'Science',
      history: 'History',
      arts: 'Arts',
      recentTopics: 'Recent Topics',
      askYourQuestion: 'Ask your question...',
      send: 'Send',
      
      // Quiz Screen
      quizMode: 'Quiz Mode',
      questionOf: 'Question {{number}} of {{total}}',
      previous: 'Previous',
      next: 'Next',
      availableQuizzes: 'Available Quizzes',
      mathematicsBasics: 'Mathematics Basics',
      scienceChapter: 'Science Chapter 3',
      historyMCQ: 'History MCQ',
      
      // Career Screen
      careerPathways: 'Career Pathways',
      exploreYourFuture: 'Explore your future',
      popularCareerPaths: 'Popular Career Paths',
      engineering: 'Engineering',
      medical: 'Medical',
      business: 'Business',
      artsDesign: 'Arts & Design',
      exploreSkills: 'Explore skills, courses, and opportunities',
      careerAssessment: 'Career Assessment',
      startAssessment: 'Start Assessment',
      yourInterests: 'Your Interests',
      problemSolving: 'Problem Solving',
      creativity: 'Creativity',
      technology: 'Technology',
      communication: 'Communication',
      explore: 'Explore',
      
      // Settings
      language: 'Language',
      theme: 'Theme',
      switchLanguage: 'Switch Language',
      english: 'English',
      hindi: 'Hindi',
      dark: 'Dark',
      light: 'Light',
      logout: 'Logout',
    },
  },
  hi: {
    translation: {
      // App & Navigation
      app_name: 'शिक्षा सिंक',
      dashboard: 'डैशबोर्ड',
      aiTutor: 'AI ट्यूटर',
      quiz: 'क्विज',
      careers: 'करियर',
      
      // Login Screen (Updated for Underserved AI Education)
      slide1Title: 'स्मार्ट\nट्यूटर',
      slide1Desc: '24/7 उपलब्ध एक बुद्धिमान AI ट्यूटर से व्यक्तिगत मार्गदर्शन प्राप्त करें। कभी भी, कहीं भी अपनी गति से सीखें।',
      slide2Title: 'सभी के लिए\nशिक्षा',
      slide2Desc: 'गुणवत्तापूर्ण शिक्षा की बाधाओं को दूर करें। प्रीमियम शिक्षण संसाधन और इंटरैक्टिव क्विज़ मुफ्त में प्राप्त करें।',
      slide3Title: 'उत्कृष्टता\nप्राप्त करें',
      slide3Desc: 'अपनी खूबियों को पहचानें, महत्वपूर्ण कौशल विकसित करें, और अनुकूलित करियर पथों के साथ एक उज्ज्वल भविष्य की तैयारी करें।',
      
      loginWithGoogle: 'Google से लॉगिन करें',
      madeInIndia: 'भारत में बनाया गया।',
      connectionFailed: 'कनेक्शन विफल',
      connectionError: 'शिक्षा सिंक से जुड़ नहीं सके। कृपया अपना इंटरनेट जांचें और पुनः प्रयास करें।',
     
      // Home Screen
      welcomeBack: 'स्वागत है!',
      yourProgress: 'आपकी प्रगति',
      totalLearningHours: 'कुल सीखने के घंटे',
      thisWeek: 'इस हफ्ते',
      streak: 'स्ट्रीक',
      currentStreak: 'वर्तमान स्ट्रीक',
      bestStreak: 'सर्वश्रेष्ठ स्ट्रीक',
      quickActions: 'त्वरित कार्य',
      startLearning: 'सीखना शुरू करें',
      viewAchievements: 'उपलब्धियां देखें',
      
      // Tutor Screen
      aiTutorTitle: 'AI ट्यूटर',
      askAnything: 'कुछ भी पूछो। सब कुछ सीखो।',
      whatWouldYouLike: 'आप क्या सीखना चाहते हैं?',
      math: 'गणित',
      science: 'विज्ञान',
      history: 'इतिहास',
      arts: 'कला',
      recentTopics: 'हाल के विषय',
      askYourQuestion: 'अपना सवाल पूछें...',
      send: 'भेजें',
      
      // Quiz Screen
      quizMode: 'क्विज मोड',
      questionOf: 'प्रश्न {{number}} का {{total}}',
      previous: 'पिछला',
      next: 'अगला',
      availableQuizzes: 'उपलब्ध क्विज़',
      mathematicsBasics: 'गणित मूल बातें',
      scienceChapter: 'विज्ञान अध्याय 3',
      historyMCQ: 'इतिहास MCQ',
      
      // Career Screen
      careerPathways: 'करियर पाथवेज',
      exploreYourFuture: 'अपना भविष्य खोजें',
      popularCareerPaths: 'लोकप्रिय करियर पाथ',
      engineering: 'इंजीनियरिंग',
      medical: 'चिकित्सा',
      business: 'व्यवसाय',
      artsDesign: 'कला और डिजाइन',
      exploreSkills: 'कौशल, पाठ्यक्रम और अवसर खोजें',
      careerAssessment: 'करियर मूल्यांकन',
      startAssessment: 'मूल्यांकन शुरू करें',
      yourInterests: 'आपकी रुचियां',
      problemSolving: 'समस्या समाधान',
      creativity: 'रचनात्मकता',
      technology: 'प्रौद्योगिकी',
      communication: 'संचार',
      explore: 'खोजें',
      
      // Settings
      language: 'भाषा',
      theme: 'थीम',
      switchLanguage: 'भाषा बदलें',
      english: 'अंग्रेजी',
      hindi: 'हिंदी',
      dark: 'डार्क',
      light: 'लाइट',
      logout: 'लॉगआउट',
    },
  },
};

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v3',
  resources,
  lng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
