/**
 * App — Root entry point with auth guard, tab navigation, and modal stack.
 */
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { COLORS } from './src/constants/theme';
import { Icon } from './src/components/Icon';

import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { TransactionsScreen } from './src/screens/TransactionsScreen';
import { AddEditTransactionModalScreen } from './src/screens/AddEditTransactionModalScreen';
import { CategoryManagementScreen } from './src/screens/CategoryManagementScreen';
import { BudgetScreen } from './src/screens/BudgetScreen';
import { NotificationsScreen } from './src/screens/NotificationsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

const AuthStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ─── Tab Navigator ───────────────────────────────────────
const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.muted,
      tabBarStyle: { backgroundColor: COLORS.card, borderTopColor: COLORS.border, height: 60, paddingBottom: 8, paddingTop: 8 },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
    }}
  >
    <Tab.Screen name="DashboardTab" component={DashboardScreen} options={{ tabBarLabel: 'Trang chủ', tabBarIcon: ({ color, size }) => <Icon name="home" size={size} color={color} /> }} />
    <Tab.Screen name="TransactionsTab" component={TransactionsScreen} options={{ tabBarLabel: 'Giao dịch', tabBarIcon: ({ color, size }) => <Icon name="arrowRightLeft" size={size} color={color} /> }} />
    <Tab.Screen name="BudgetTab" component={BudgetScreen} options={{ tabBarLabel: 'Ngân sách', tabBarIcon: ({ color, size }) => <Icon name="target" size={size} color={color} /> }} />
    <Tab.Screen name="NotificationsTab" component={NotificationsScreen} options={{ tabBarLabel: 'Thông báo', tabBarIcon: ({ color, size }) => <Icon name="bell" size={size} color={color} /> }} />
    <Tab.Screen name="SettingsTab" component={SettingsScreen} options={{ tabBarLabel: 'Cài đặt', tabBarIcon: ({ color, size }) => <Icon name="settings" size={size} color={color} /> }} />
  </Tab.Navigator>
);

// ─── Root Navigation ─────────────────────────────────────
const RootNavigation = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? (
        <MainStack.Navigator screenOptions={{ headerShown: false }}>
          <MainStack.Screen name="MainTabs" component={TabNavigator} />
          <MainStack.Screen name="AddEditTransaction" component={AddEditTransactionModalScreen} options={{ presentation: 'modal' }} />
          <MainStack.Screen name="CategoryManagement" component={CategoryManagementScreen} />
        </MainStack.Navigator>
      ) : (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Login" component={LoginScreen} />
          <AuthStack.Screen name="Register" component={RegisterScreen} />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigation />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
