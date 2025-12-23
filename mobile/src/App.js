import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from './store/store';
import AppNavigator from './navigation/AppNavigator';
import { initializeApp } from './services/initialization';
import { NotificationService } from './services/notificationService';

const App = () => {
  useEffect(() => {
    // 初始化应用
    initializeApp();
    
    // 初始化推送通知
    NotificationService.init();
    
    // 请求通知权限
    NotificationService.requestPermissions();
  }, []);

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </Provider>
  );
};

export default App;