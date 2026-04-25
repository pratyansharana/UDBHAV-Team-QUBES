import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { I18nextProvider } from 'react-i18next';
import i18n from './src/i18nConfig.ts';
import { ThemeProvider } from './src/theme/ThemeProvider.tsx';
import { AuthProvider } from './src/navigation/AuthContext.tsx';
import { RootNavigator } from './src/navigation/RootNavigator.tsx';

export default function App() {
  useEffect(() => {
    // Initialize i18n if needed
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <AuthProvider>
          <NavigationContainer>
            <RootNavigator />
            <StatusBar style="auto" />
          </NavigationContainer>
        </AuthProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}
