import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const device = useSelector(state => state.device);
  const task = useSelector(state => state.task);
  const content = useSelector(state => state.content);
  const notification = useSelector(state => state.notification);
  
  const [refreshing, setRefreshing] = useState(false);

  // 统计数据
  const stats = {
    totalTasks: task.taskList.length,
    completedTasks: task.taskList.filter(t => t.status === 'completed').length,
    pendingTasks: task.taskList.filter(t => t.status === 'pending' || t.status === 'processing').length,
    totalContent: content.contentList.length,
    unreadNotifications: notification.unreadCount,
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // 这里可以添加刷新数据的逻辑
    setTimeout(() => setRefreshing(false), 1000);
  };

  const quickActions = [
    {
      title: '发送指令',
      icon: 'create',
      color: '#007AFF',
      screen: 'Command',
    },
    {
      title: '任务列表',
      icon: 'list',
      color: '#34C759',
      screen: 'Tasks',
    },
    {
      title: '内容库',
      icon: 'images',
      color: '#FF9500',
      screen: 'Content',
    },
    {
      title: '设置',
      icon: 'settings',
      color: '#8E8E93',
      screen: 'Settings',
    },
  ];

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* 状态卡片 */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Ionicons name="phone-portrait" size={24} color="#007AFF" />
          <Text style={styles.statusTitle}>设备状态</Text>
        </View>
        
        <View style={styles.statusInfo}>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>设备ID</Text>
            <Text style={styles.statusValue} numberOfLines={1}>
              {device.deviceId || '未注册'}
            </Text>
          </View>
          
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>WebSocket</Text>
            <View style={styles.statusIndicator}>
              <View 
                style={[
                  styles.statusDot, 
                  { backgroundColor: device.isWebSocketConnected ? '#34C759' : '#FF3B30' }
                ]} 
              />
              <Text style={styles.statusValue}>
                {device.isWebSocketConnected ? '已连接' : '未连接'}
              </Text>
            </View>
          </View>
          
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>通知权限</Text>
            <View style={styles.statusIndicator}>
              <View 
                style={[
                  styles.statusDot, 
                  { backgroundColor: notification.permissionGranted ? '#34C759' : '#FF3B30' }
                ]} 
              />
              <Text style={styles.statusValue}>
                {notification.permissionGranted ? '已授权' : '未授权'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* 统计卡片 */}
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>数据统计</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalTasks}</Text>
            <Text style={styles.statLabel}>总任务数</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.completedTasks}</Text>
            <Text style={styles.statLabel}>已完成</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.pendingTasks}</Text>
            <Text style={styles.statLabel}>进行中</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalContent}</Text>
            <Text style={styles.statLabel}>内容数</Text>
          </View>
        </View>
      </View>

      {/* 快速操作 */}
      <View style={styles.actionsCard}>
        <Text style={styles.actionsTitle}>快速操作</Text>
        
        <View style={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.actionButton}
              onPress={() => navigation.navigate(action.screen)}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                <Ionicons name={action.icon} size={24} color="white" />
              </View>
              <Text style={styles.actionText}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 最近任务 */}
      {task.taskList.length > 0 && (
        <View style={styles.recentCard}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>最近任务</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Tasks')}>
              <Text style={styles.seeAllText}>查看全部</Text>
            </TouchableOpacity>
          </View>
          
          {task.taskList.slice(0, 3).map((taskItem, index) => (
            <TouchableOpacity
              key={index}
              style={styles.taskItem}
              onPress={() => navigation.navigate('TaskDetail', { taskId: taskItem.taskId })}
            >
              <View style={styles.taskInfo}>
                <Text style={styles.taskTitle} numberOfLines={1}>
                  {taskItem.title || '未命名任务'}
                </Text>
                <Text style={styles.taskTime}>
                  {new Date(taskItem.createdAt).toLocaleString()}
                </Text>
              </View>
              
              <View style={[
                styles.taskStatus, 
                { 
                  backgroundColor: taskItem.status === 'completed' ? '#34C759' : 
                                 taskItem.status === 'failed' ? '#FF3B30' : '#FF9500'
                }
              ]}>
                <Text style={styles.taskStatusText}>
                  {taskItem.status === 'completed' ? '完成' : 
                   taskItem.status === 'failed' ? '失败' : '进行中'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  statusCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
    color: '#1C1C1E',
  },
  statusInfo: {
    gap: 12,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statsCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#1C1C1E',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  actionsCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#1C1C1E',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    alignItems: 'center',
    width: '48%',
    marginBottom: 16,
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
    textAlign: 'center',
  },
  recentCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  seeAllText: {
    fontSize: 14,
    color: '#007AFF',
  },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  taskTime: {
    fontSize: 12,
    color: '#8E8E93',
  },
  taskStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  taskStatusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
});

export default HomeScreen;