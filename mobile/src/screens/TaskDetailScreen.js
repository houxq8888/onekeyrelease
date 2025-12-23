import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { fetchTaskStatus, cancelTask, retryTask } from '../store/slices/taskSlice';

const TaskDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { taskId } = route.params;
  
  const currentTask = useSelector(state => state.task.currentTask);
  const taskList = useSelector(state => state.task.taskList);
  const [task, setTask] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // 从任务列表中找到对应的任务
    const foundTask = taskList.find(t => t.id === taskId);
    if (foundTask) {
      setTask(foundTask);
    }
  }, [taskId, taskList]);

  useEffect(() => {
    if (currentTask && currentTask.id === taskId) {
      setTask(currentTask);
    }
  }, [currentTask, taskId]);

  const refreshTaskStatus = async () => {
    if (!taskId) return;
    
    setIsRefreshing(true);
    try {
      await dispatch(fetchTaskStatus(taskId)).unwrap();
    } catch (error) {
      console.error('刷新任务状态失败:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCancelTask = () => {
    Alert.alert(
      '确认取消',
      '确定要取消这个任务吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: async () => {
            try {
              await dispatch(cancelTask(taskId)).unwrap();
              navigation.goBack();
            } catch (error) {
              Alert.alert('错误', '取消任务失败');
            }
          }
        }
      ]
    );
  };

  const handleRetryTask = () => {
    Alert.alert(
      '重新执行',
      '确定要重新执行这个任务吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: async () => {
            try {
              await dispatch(retryTask(taskId)).unwrap();
              navigation.goBack();
            } catch (error) {
              Alert.alert('错误', '重新执行任务失败');
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'failed': return '#EF4444';
      case 'running': return '#3B82F6';
      case 'pending': return '#F59E0B';
      case 'cancelled': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'failed': return '失败';
      case 'running': return '进行中';
      case 'pending': return '等待中';
      case 'cancelled': return '已取消';
      default: return '未知';
    }
  };

  if (!task) {
    return (
      <View style={styles.container}>
        <Text>加载中...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* 头部信息 */}
      <View style={styles.header}>
        <View style={styles.statusSection}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
            <Text style={styles.statusText}>{getStatusText(task.status)}</Text>
          </View>
          <Text style={styles.title}>{task.commandType || '未知指令'}</Text>
          <Text style={styles.time}>{new Date(task.createdAt).toLocaleString()}</Text>
        </View>

        {/* 进度条 */}
        {task.progress !== undefined && (
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${task.progress}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>{task.progress}%</Text>
          </View>
        )}
      </View>

      {/* 任务详情 */}
      <View style={styles.detailsSection}>
        <Text style={styles.sectionTitle}>任务详情</Text>
        
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>指令类型:</Text>
          <Text style={styles.detailValue}>{task.commandType}</Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>指令内容:</Text>
          <Text style={styles.detailValue}>{task.commandContent || '无'}</Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>创建时间:</Text>
          <Text style={styles.detailValue}>{new Date(task.createdAt).toLocaleString()}</Text>
        </View>

        {task.updatedAt && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>更新时间:</Text>
            <Text style={styles.detailValue}>{new Date(task.updatedAt).toLocaleString()}</Text>
          </View>
        )}

        {task.errorMessage && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>错误信息:</Text>
            <Text style={[styles.detailValue, styles.errorText]}>{task.errorMessage}</Text>
          </View>
        )}

        {task.result && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>执行结果:</Text>
            <Text style={styles.detailValue}>{JSON.stringify(task.result, null, 2)}</Text>
          </View>
        )}
      </View>

      {/* 操作按钮 */}
      <View style={styles.actionsSection}>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={refreshTaskStatus}
          disabled={isRefreshing}
        >
          <Ionicons name="refresh" size={20} color="#3B82F6" />
          <Text style={styles.refreshButtonText}>
            {isRefreshing ? '刷新中...' : '刷新状态'}
          </Text>
        </TouchableOpacity>

        {task.status === 'running' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.cancelButton]}
            onPress={handleCancelTask}
          >
            <Ionicons name="close-circle" size={20} color="#EF4444" />
            <Text style={styles.cancelButtonText}>取消任务</Text>
          </TouchableOpacity>
        )}

        {task.status === 'failed' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.retryButton]}
            onPress={handleRetryTask}
          >
            <Ionicons name="refresh-circle" size={20} color="#10B981" />
            <Text style={styles.retryButtonText}>重新执行</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statusSection: {
    alignItems: 'center',
    marginBottom: 15,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 10,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5,
  },
  time: {
    fontSize: 14,
    color: '#6B7280',
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginRight: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  detailsSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#1F2937',
    flex: 2,
    textAlign: 'right',
  },
  errorText: {
    color: '#EF4444',
  },
  actionsSection: {
    padding: 16,
    gap: 12,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    gap: 8,
  },
  refreshButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  cancelButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  retryButtonText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TaskDetailScreen;