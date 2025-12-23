import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import CommandScreen from '../screens/CommandScreen';
import TaskScreen from '../screens/TaskScreen';
import TaskDetailScreen from '../screens/TaskDetailScreen';
import ContentScreen from '../screens/ContentScreen';
import ContentDetailScreen from '../screens/ContentDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ContentDetailScreen from '../screens/ContentDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// 任务堆栈导航器
const TaskStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="TaskList" component={TaskScreen} />
    <Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
  </Stack.Navigator>
);

// 内容堆栈导航器
const ContentStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ContentList" component={ContentScreen} />
    <Stack.Screen name="ContentDetail" component={ContentDetailScreen} />
  </Stack.Navigator>
);

// 主标签页导航
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Command') {
            iconName = focused ? 'create' : 'create-outline';
          } else if (route.name === 'Tasks') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Content') {
            iconName = focused ? 'images' : 'images-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: '首页' }} />
      <Tab.Screen name="Command" component={CommandScreen} options={{ title: '发送指令' }} />
      <Tab.Screen name="Tasks" component={TaskStack} options={{ title: '任务列表' }} />
      <Tab.Screen name="Content" component={ContentStack} options={{ title: '内容库' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: '设置' }} />
    </Tab.Navigator>
  );
};

// 主应用导航
const AppNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Main" 
        component={TabNavigator} 
        options={{ headerShown: false }} 
      />

    </Stack.Navigator>
  );
};

export default AppNavigator;