import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { getTaskList } from '../store/slices/taskSlice';

const TaskScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const device = useSelector(state => state.device);
  const task = useSelector(state => state.task);
  
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, pending, completed, failed

  // 过滤任务列表
  const filteredTasks = task.taskList.filter(taskItem => {
    switch (filter) {
      case 'pending':
        return taskItem.status === 'pending' || taskItem.status === 'processing';
      case 'completed':
        return taskItem.status === 'completed';
      case 'failed':
        return taskItem.status === 'failed';
      default:
        return true;
    }
  });

  // 加载任务列表
  const loadTasks = async () => {
    if (!device.deviceId) return;
    
    try {
      await dispatch(getTaskList(device.deviceId));
    } catch (error) {
      console.error('加载任务列表失败:', error);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [device.deviceId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  };

  // 获取状态图标和颜色
  const getStatusInfo = (status) => {
    switch (status) {
      case 'completed':
        return { icon: 'checkmark-circle', color: '#34C759', label: '完成' };
      case 'failed':
        return { icon: 'close-circle', color: '#FF3B30', label: '失败' };
      case 'processing':
        return { icon: 'refresh-circle', color: '#007AFF', label: '处理中' };
      default:
        return { icon: 'time', color: '#8E8E93', label: '等待中' };
    }
  };

  // 获取进度条宽度
  const getProgressWidth = (progress) => {
    return Math.max(0, Math.min(100, progress || 0));
  };

  // 渲染任务项
  const renderTaskItem = ({ item }) => {
    const statusInfo = getStatusInfo(item.status);
    const progressWidth = getProgressWidth(item.progress);

    return (
      <TouchableOpacity
        style={styles.taskItem}
        onPress={() => navigation.navigate('TaskDetail', { taskId: item.taskId })}
      >
        <View style={styles.taskHeader}>
          <View style={styles.taskTitleContainer}>
            <Ionicons name={statusInfo.icon} size={20} color={statusInfo.color} />
            <Text style={styles.taskTitle} numberOfLines={1}>
              {item.title || '未命名任务'}
            </Text>
          </View>
          <Text style={styles.taskTime}>
            {new Date(item.createdAt).toLocaleTimeString()}
          </Text>
        </View>

        <Text style={styles.taskPrompt} numberOfLines={2}>
          {item.prompt}
        </Text>

        {/* 进度条 */}
        {(item.status === 'processing' || item.status === 'pending') && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${progressWidth}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>{progressWidth}%</Text>
          </View>
        )}

        {/* 任务信息 */}
        <View style={styles.taskInfo}>
          <View style={styles.taskMeta}>
            <Text style={styles.taskType}>{item.type}</Text>
            <Text style={[styles.taskStatus, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
          
          <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
        </View>
      </TouchableOpacity>
    );
  };

  // 空状态
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="list" size={64} color="#C7C7CC" />
      <Text style={styles.emptyTitle}>暂无任务</Text>
      <Text style={styles.emptyDescription}>
        发送指令后，任务将显示在这里
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => navigation.navigate('Command')}
      >
        <Ionicons name="create" size={16} color="white" />
        <Text style={styles.emptyButtonText}>发送第一个指令</Text>
      </TouchableOpacity>
    </View>
  );

  // 过滤器选项
  const filterOptions = [
    { id: 'all', label: '全部', count: task.taskList.length },
    { 
      id: 'pending', 
      label: '进行中', 
      count: task.taskList.filter(t => t.status === 'pending' || t.status === 'processing').length 
    },
    { 
      id: 'completed', 
      label: '已完成', 
      count: task.taskList.filter(t => t.status === 'completed').length 
    },
    { 
      id: 'failed', 
      label: '失败', 
      count: task.taskList.filter(t => t.status === 'failed').length 
    },
  ];

  return (
    <View style={styles.container}>
      {/* 过滤器 */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {filterOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.filterButton,
                filter === option.id && styles.filterButtonActive,
              ]}
              onPress={() => setFilter(option.id)}
            >
              <Text style={[
                styles.filterText,
                filter === option.id && styles.filterTextActive,
              ]}>
                {option.label}
              </Text>
              <View style={[
                styles.filterBadge,
                filter === option.id && styles.filterBadgeActive,
              ]}>
                <Text style={styles.filterBadgeText}>{option.count}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 任务列表 */}
      <FlatList
        data={filteredTasks}
        renderItem={renderTaskItem}
        keyExtractor={(item) => item.taskId}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  filterContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  filterTextActive: {
    color: 'white',
  },
  filterBadge: {
    backgroundColor: '#E5E5EA',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
    minWidth: 20,
    alignItems: 'center',
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
  },
  listContainer: {
    flexGrow: 1,
    padding: 16,
  },
  taskItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: '#1C1C1E',
    flex: 1,
  },
  taskTime: {
    fontSize: 12,
    color: '#8E8E93',
  },
  taskPrompt: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
    lineHeight: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 8,
    minWidth: 30,
  },
  taskInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  taskType: {
    fontSize: 12,
    color: '#8E8E93',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  taskStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default TaskScreen;