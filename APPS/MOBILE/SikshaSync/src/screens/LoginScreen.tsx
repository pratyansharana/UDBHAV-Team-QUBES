import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, 
  Dimensions, FlatList, Animated, StatusBar, Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential, signInAnonymously } from 'firebase/auth';
import { auth } from '../firebase/firebaseconfig'; // Ensure this path points to your firebase config

const WEB_CLIENT_ID = '284247735551-vtmrlvd4lpl48d7p9bo1l3vh9dij96q4.apps.googleusercontent.com';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const LoginScreen: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: WEB_CLIENT_ID,
      offlineAccess: true,
    });
  }, []);

  const colors = {
    background: '#0A0A0A', 
    text: '#FFFFFF',
    textSecondary: '#888888',
    primary: '#00FFCC',    
    surface: '#1A1A1A',
  };

  const SLIDES = [
    { id: '1', heading: t('slide1Title'), description: t('slide1Desc'), icon: '🧠' },
    { id: '2', heading: t('slide2Title'), description: t('slide2Desc'), icon: '🚀' },
    { id: '3', heading: t('slide3Title'), description: t('slide3Desc'), icon: '🎓' },
  ];

  const handleGoogleLogin = async () => {
    console.log("DEBUG: handleGoogleLogin initiated");
    setLoading(true);
    try {
      console.log("DEBUG: Checking Play Services...");
      await GoogleSignin.hasPlayServices();
      
      console.log("DEBUG: Starting Google Sign-In...");
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;
      console.log("DEBUG: Google Sign-In success. ID Token received:", !!idToken);

      if (!idToken) throw new Error('No ID Token found.');

      const credential = GoogleAuthProvider.credential(idToken);
      console.log("DEBUG: Signing into Firebase with Credential...");
      await signInWithCredential(auth, credential);
      
      console.log("DEBUG: Firebase sign-in successful!");
    } catch (error: any) {
      console.error("DEBUG: Login failed at process:", error);
      Alert.alert("Login Error", error.message);
    } finally {
      setLoading(false);
      console.log("DEBUG: Loading state reset.");
    }
  };

  const handleGuestLogin = async () => {
    console.log("DEBUG: handleGuestLogin initiated");
    setGuestLoading(true);
    try {
      console.log("DEBUG: Attempting Anonymous Auth...");
      await signInAnonymously(auth);
      console.log("DEBUG: Anonymous login successful!");
    } catch (error: any) {
      console.error("DEBUG: Guest login failed:", error);
      Alert.alert("Guest Login Error", "Could not sign in as guest.");
    } finally {
      setGuestLoading(false);
    }
  };

  const renderSlide = ({ item }: { item: typeof SLIDES[0] }) => (
    <View style={styles.slide}>
      <View style={styles.heroSection}>
        <Text style={[styles.mainHeading, { color: colors.text }]}>{item.heading}</Text>
        <View style={styles.iconContainer}>
          <Text style={styles.emojiIcon}>{item.icon}</Text>
          <View style={[styles.dash, styles.dashTL, { borderColor: colors.primary }]} />
          <View style={[styles.dash, styles.dashBR, { borderColor: colors.primary }]} />
        </View>
      </View>
      <View style={styles.bodySection}>
        <Text style={[styles.description, { color: colors.textSecondary }]}>{item.description}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.mainContainer, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <Text style={[styles.logoText, { color: colors.text }]}>{t('app_name').toUpperCase()}</Text>
        <View style={styles.statusDot} />
      </View>

      <FlatList
        data={SLIDES}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
        keyExtractor={(item) => item.id}
        scrollEventThrottle={16}
        bounces={false}
      />

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {SLIDES.map((_, i) => {
            const inputRange = [(i - 1) * SCREEN_WIDTH, i * SCREEN_WIDTH, (i + 1) * SCREEN_WIDTH];
            const dotWidth = scrollX.interpolate({ inputRange, outputRange: [8, 22, 8], extrapolate: 'clamp' });
            const opacity = scrollX.interpolate({ inputRange, outputRange: [0.3, 1, 0.3], extrapolate: 'clamp' });
            return <Animated.View key={i} style={[styles.dot, { width: dotWidth, opacity, backgroundColor: colors.primary }]} />;
          })}
        </View>

        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={[styles.loginButton, { backgroundColor: colors.primary }]} 
            onPress={handleGoogleLogin}
            disabled={loading || guestLoading}
          >
            {loading ? <ActivityIndicator color="#000000" /> : <Text style={styles.buttonText}>{t('loginWithGoogle')}</Text>}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.guestButton} 
            onPress={handleGuestLogin}
            disabled={loading || guestLoading}
          >
            {guestLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.guestButtonText}>Continue as Guest</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  header: { width: '100%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  logoText: { fontSize: 20, fontWeight: '900', letterSpacing: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00FFCC', marginLeft: 8 },
  slide: { width: SCREEN_WIDTH, paddingHorizontal: 30 },
  heroSection: { alignItems: 'flex-start', marginTop: 20, minHeight: SCREEN_HEIGHT * 0.40 },
  mainHeading: { fontSize: 54, fontWeight: 'bold', lineHeight: 60, marginBottom: 40, letterSpacing: -1 },
  iconContainer: { width: '100%', alignItems: 'center', justifyContent: 'center', position: 'relative', marginTop: 10 },
  emojiIcon: { fontSize: 90 },
  dash: { position: 'absolute', width: 24, height: 24, borderStyle: 'dashed', borderWidth: 1.5, borderRadius: 6 },
  dashTL: { top: -15, left: '25%', transform: [{ rotate: '-15deg' }] },
  dashBR: { bottom: -10, right: '25%', transform: [{ rotate: '15deg' }] },
  bodySection: { width: '100%', marginTop: 20 },
  description: { fontSize: 18, lineHeight: 28, paddingRight: 30, fontWeight: '400' },
  footer: { paddingHorizontal: 30, paddingBottom: 50 },
  pagination: { flexDirection: 'row', marginBottom: 40, alignItems: 'center' },
  dot: { height: 8, borderRadius: 4, marginHorizontal: 4 },
  actionSection: { width: '100%', alignItems: 'flex-start' },
  loginButton: { paddingVertical: 18, borderRadius: 14, marginBottom: 15, width: '100%', alignItems: 'center' },
  buttonText: { fontWeight: 'bold', fontSize: 18, color: '#000000' },
  guestButton: { paddingVertical: 18, borderRadius: 14, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  guestButtonText: { fontWeight: 'bold', fontSize: 16, color: '#FFFFFF' }
});