import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  
  const deviceState = useSelector(state => state.device);
  const notificationState = useSelector(state => state.notification);
  
  const [settings, setSettings] = useState({
    notificationsEnabled: true,
    autoConnect: true,
    darkMode: false,
    vibration: true,
    sound: true,
    language: 'zh-CN',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('app_settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('加载设置失败:', error);
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem('app_settings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('保存设置失败:', error);
    }
  };

  const handleToggleSetting = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    await saveSettings(newSettings);
  };

  const handleClearCache = () => {
    Alert.alert(
      '清除缓存',
      '确定要清除所有缓存数据吗？此操作不可撤销。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '清除',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('成功', '缓存已清除');
            } catch (error) {
              Alert.alert('错误', '清除缓存失败');
            }
          }
        }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      '退出登录',
      '确定要退出登录吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '退出',
          style: 'destructive',
          onPress: () => {
            // 这里实现退出登录逻辑
            Alert.alert('提示', '退出登录成功');
          }
        }
      ]
    );
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    type = 'toggle', 
    value, 
    onValueChange,
    onPress,
    danger = false 
  }) => (
    <TouchableOpacity 
      style={styles.settingItem}
      onPress={onPress}
      disabled={type === 'toggle'}
    >
      <View style={styles.settingLeft}>
        <Ionicons 
          name={icon} 
          size={24} 
          color={danger ? '#EF4444' : '#3B82F6'} 
        />
        <View style={styles.settingTexts}>
          <Text style={[styles.settingTitle, danger && styles.dangerText]}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      
      {type === 'toggle' ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
          thumbColor={value ? '#FFFFFF' : '#FFFFFF'}
        />
      ) : (
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* 设备状态 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>设备状态</Text>
        <View style={styles.deviceStatus}>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>设备ID:</Text>
            <Text style={styles.statusValue} numberOfLines={1}>
              {deviceState.deviceId || '未注册'}
            </Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>连接状态:</Text>
            <View style={[
              styles.statusIndicator, 
              deviceState.isConnected ? styles.connected : styles.disconnected
            ]}>
              <Text style={styles.statusIndicatorText}>
                {deviceState.isConnected ? '已连接' : '未连接'}
              </Text>
            </View>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>WebSocket:</Text>
            <View style={[
              styles.statusIndicator, 
              deviceState.isWebSocketConnected ? styles.connected : styles.disconnected
            ]}>
              <Text style={styles.statusIndicatorText}>
                {deviceState.isWebSocketConnected ? '已连接' : '未连接'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* 通知设置 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>通知设置</Text>
        <SettingItem
          icon="notifications"
          title="推送通知"
          subtitle="接收任务完成和系统通知"
          type="toggle"
          value={settings.notificationsEnabled}
          onValueChange={(value) => handleToggleSetting('notificationsEnabled', value)}
        />
        <SettingItem
          icon="volume-high"
          title="声音提醒"
          subtitle="通知时播放声音"
          type="toggle"
          value={settings.sound}
          onValueChange={(value) => handleToggleSetting('sound', value)}
        />
        <SettingItem
          icon="phone-portrait"
          title="震动提醒"
          subtitle="通知时震动设备"
          type="toggle"
          value={settings.vibration}
          onValueChange={(value) => handleToggleSetting('vibration', value)}
        />
        <View style={styles.notificationStats}>
          <Text style={styles.statsText}>
            未读通知: {notificationState.unreadCount}
          </Text>
          <Text style={styles.statsText}>
            权限状态: {notificationState.permissionGranted ? '已授权' : '未授权'}
          </Text>
        </View>
      </View>

      {/* 连接设置 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>连接设置</Text>
        <SettingItem
          icon="wifi"
          title="自动连接"
          subtitle="应用启动时自动连接服务器"
          type="toggle"
          value={settings.autoConnect}
          onValueChange={(value) => handleToggleSetting('autoConnect', value)}
        />
        <SettingItem
          icon="server"
          title="服务器配置"
          subtitle="修改服务器地址和端口"
          type="navigation"
          onPress={() => navigation.navigate('ServerConfig')}
        />
      </View>

      {/* 外观设置 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>外观设置</Text>
        <SettingItem
          icon="moon"
          title="深色模式"
          subtitle="启用深色主题"
          type="toggle"
          value={settings.darkMode}
          onValueChange={(value) => handleToggleSetting('darkMode', value)}
        />
        <SettingItem
          icon="language"
          title="语言设置"
          subtitle="选择应用语言"
          type="navigation"
          onPress={() => navigation.navigate('Language')}
        />
      </View>

      {/* 数据管理 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>数据管理</Text>
        <SettingItem
          icon="trash"
          title="清除缓存"
          subtitle="清除所有本地缓存数据"
          type="navigation"
          onPress={handleClearCache}
          danger
        />
        <SettingItem
          icon="download"
          title="数据导出"
          subtitle="导出任务和内容数据"
          type="navigation"
          onPress={() => navigation.navigate('ExportData')}
        />
      </View>

      {/* 关于应用 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>关于应用</Text>
        <SettingItem
          icon="information-circle"
          title="版本信息"
          subtitle="v1.0.0"
          type="navigation"
          onPress={() => navigation.navigate('About')}
        />
        <SettingItem
          icon="help-circle"
          title="使用帮助"
          subtitle="查看应用使用说明"
          type="navigation"
          onPress={() => navigation.navigate('Help')}
        />
        <SettingItem
          icon="bug"
          title="反馈问题"
          subtitle="报告Bug或建议"
          type="navigation"
          onPress={() => navigation.navigate('Feedback')}
        />
      </View>

      {/* 账户操作 */}
      <View style={styles.section}>
        <SettingItem
          icon="log-out"
          title="退出登录"
          type="navigation"
          onPress={handleLogout}
          danger
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>OneKeyRelease Mobile v1.0.0</Text>
        <Text style={styles.footerSubtext}>© 2024 All rights reserved</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  section: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    padding: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  deviceStatus: {
    padding: 16,
    gap: 12,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
    textAlign: 'right',
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  connected: {
    backgroundColor: '#DCFCE7',
  },
  disconnected: {
    backgroundColor: '#FECACA',
  },
  statusIndicatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTexts: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  dangerText: {
    color: '#EF4444',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  notificationStats: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsText: {
    fontSize: 12,
    color: '#6B7280',
  },
  footer: {
    padding: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

export default SettingsScreen;