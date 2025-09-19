import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import ProjectsScreen from './src/screens/ProjectsScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import TableScreen from './src/screens/TableScreen';
import DrawingScreen from './src/screens/DrawingScreen';
import ProfileScreen from './src/screens/ProfileScreen';

// Theme
import { theme } from './src/theme/theme';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName: keyof typeof Ionicons.glyphMap;

              if (route.name === 'Home') {
                iconName = focused ? 'home' : 'home-outline';
              } else if (route.name === 'Projects') {
                iconName = focused ? 'folder' : 'folder-outline';
              } else if (route.name === 'Calendar') {
                iconName = focused ? 'calendar' : 'calendar-outline';
              } else if (route.name === 'Table') {
                iconName = focused ? 'grid' : 'grid-outline';
              } else if (route.name === 'Drawing') {
                iconName = focused ? 'create' : 'create-outline';
              } else if (route.name === 'Profile') {
                iconName = focused ? 'person' : 'person-outline';
              } else {
                iconName = 'help-outline';
              }

              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#3B82F6',
            tabBarInactiveTintColor: 'gray',
            headerStyle: {
              backgroundColor: '#3B82F6',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          })}
        >
          <Tab.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ title: 'ProBuilder' }}
          />
          <Tab.Screen 
            name="Projects" 
            component={ProjectsScreen} 
            options={{ title: 'פרויקטים' }}
          />
          <Tab.Screen 
            name="Calendar" 
            component={CalendarScreen} 
            options={{ title: 'לוח שנה' }}
          />
          <Tab.Screen 
            name="Table" 
            component={TableScreen} 
            options={{ title: 'טבלה' }}
          />
          <Tab.Screen 
            name="Drawing" 
            component={DrawingScreen} 
            options={{ title: 'ציור' }}
          />
          <Tab.Screen 
            name="Profile" 
            component={ProfileScreen} 
            options={{ title: 'פרופיל' }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}
