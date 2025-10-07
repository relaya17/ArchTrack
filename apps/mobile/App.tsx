import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import ProjectsScreen from './src/screens/ProjectsScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import TableScreen from './src/screens/TableScreen';
import DrawingScreen from './src/screens/DrawingScreen';
import ProfileScreen from './src/screens/ProfileScreen';

// Advanced Screens
import ProjectDetailScreen from './src/screens/ProjectDetailScreen';
import SheetDetailScreen from './src/screens/SheetDetailScreen';
import BIMViewerScreen from './src/screens/BIMViewerScreen';
import AIChatScreen from './src/screens/AIChatScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import OfflineScreen from './src/screens/OfflineScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';

// Theme
import { theme } from './src/theme/theme';

// Context
import { AuthProvider } from './src/context/AuthContext';
import { OfflineProvider } from './src/context/OfflineContext';
import { NotificationProvider } from './src/context/NotificationContext';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MainTabNavigator() {
  return (
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
          } else if (route.name === 'Analytics') {
            iconName = focused ? 'analytics' : 'analytics-outline';
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
        name="Analytics" 
        component={AnalyticsScreen} 
        options={{ title: 'אנליטיקס' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: 'פרופיל' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <OfflineProvider>
            <NotificationProvider>
              <NavigationContainer>
                <StatusBar style="auto" />
                <Stack.Navigator
                  screenOptions={{
                    headerStyle: {
                      backgroundColor: '#3B82F6',
                    },
                    headerTintColor: '#fff',
                    headerTitleStyle: {
                      fontWeight: 'bold',
                    },
                  }}
                >
                  <Stack.Screen 
                    name="Login" 
                    component={LoginScreen} 
                    options={{ 
                      title: 'התחברות',
                      headerShown: false 
                    }}
                  />
                  <Stack.Screen 
                    name="Register" 
                    component={RegisterScreen} 
                    options={{ 
                      title: 'הרשמה',
                      headerShown: false 
                    }}
                  />
                  <Stack.Screen 
                    name="Main" 
                    component={MainTabNavigator} 
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen 
                    name="ProjectDetail" 
                    component={ProjectDetailScreen} 
                    options={{ title: 'פרטי פרויקט' }}
                  />
                  <Stack.Screen 
                    name="SheetDetail" 
                    component={SheetDetailScreen} 
                    options={{ title: 'פרטי גיליון' }}
                  />
                  <Stack.Screen 
                    name="BIMViewer" 
                    component={BIMViewerScreen} 
                    options={{ title: 'צופה BIM' }}
                  />
                  <Stack.Screen 
                    name="AIChat" 
                    component={AIChatScreen} 
                    options={{ title: 'צ\'אט AI' }}
                  />
                  <Stack.Screen 
                    name="Settings" 
                    component={SettingsScreen} 
                    options={{ title: 'הגדרות' }}
                  />
                  <Stack.Screen 
                    name="Notifications" 
                    component={NotificationsScreen} 
                    options={{ title: 'התראות' }}
                  />
                  <Stack.Screen 
                    name="Offline" 
                    component={OfflineScreen} 
                    options={{ title: 'מצב לא מקוון' }}
                  />
                </Stack.Navigator>
              </NavigationContainer>
            </NotificationProvider>
          </OfflineProvider>
        </AuthProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
