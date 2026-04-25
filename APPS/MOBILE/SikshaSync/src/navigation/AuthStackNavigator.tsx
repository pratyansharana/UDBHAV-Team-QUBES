import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from './AuthContext'; // Import your hook
import { AuthStackNavigator } from './AuthStackNavigator'; // Your Auth stack
import { MainStackNavigator } from './MainStackNavigator'; // You likely have an App/Main stack

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
  const { user, loading } = useAuth();

  // 1. Loading state prevents "flicker" where user sees Login before Auth check completes
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A0A' }}>
        <ActivityIndicator size="large" color="#00FFCC" />
      </View>
    );
  }

  // 2. Logic: If user exists, show Home/App stack. If null, show Auth stack.
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="MainApp" component={MainStackNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthStackNavigator} />
      )}
    </Stack.Navigator>
  );
};