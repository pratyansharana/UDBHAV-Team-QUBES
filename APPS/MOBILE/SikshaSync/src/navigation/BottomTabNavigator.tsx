import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { HomeScreen } from '../screens/HomeScreen';
import { TutorScreen } from '../screens/TutorScreen';
import { QuizScreen } from '../screens/QuizScreen';
import { CareerScreen } from '../screens/CareerScreen';
import { BottomTabParamList } from './types'; 

const Tab = createBottomTabNavigator<BottomTabParamList>();

export const BottomTabNavigator = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof MaterialCommunityIcons.glyphMap = 'home';
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Tutor') iconName = focused ? 'robot' : 'robot-outline';
          else if (route.name === 'Quiz') iconName = focused ? 'help-circle' : 'help-circle-outline';
          else if (route.name === 'Career') iconName = focused ? 'compass' : 'compass-outline';

          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        headerShown: true,
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.onSurface,
        headerTitleStyle: { fontWeight: '600' },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="Tutor" component={TutorScreen} options={{ title: 'AI Tutor' }} />
      <Tab.Screen name="Quiz" component={QuizScreen} options={{ title: 'Quiz' }} />
      <Tab.Screen name="Career" component={CareerScreen} options={{ title: 'Careers' }} />
    </Tab.Navigator>
  );
};