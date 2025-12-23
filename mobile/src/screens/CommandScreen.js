import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { sendCommand } from '../store/slices/taskSlice';

const CommandScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const device = useSelector(state => state.device);
  const task = useSelector(state => state.task);
  
  const [commandType, setCommandType] = useState('text');
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // 指令类型选项
  const commandTypes = [
    { id: 'text', label: '文本生成', icon: 'document-text', description: '生成文章、文案等文本内容' },
    { id: 'image', label: '图片生成', icon: 'image', description: '根据描述生成图片' },
    { id: 'combined', label: '图文生成', icon: 'layers', description: '同时生成文本和图片' },
  ];

  // 预设提示词
  const presetPrompts = [
    {
      title: '产品介绍文案',
      prompt: '写一篇关于智能家居产品的介绍文案，突出产品特点和优势',
      type: 'text',
    },
    {
      title: '社交媒体图片',
      prompt: '生成一张适合社交媒体分享的科技感图片，包含现代设计元素',
      type: 'image',
    },
    {
      title: '营销图文',
      prompt: '创建一篇产品营销图文，包含吸引人的标题和配图',
      type: 'combined',
    },
  ];

  const handleSendCommand = async () => {
    if (!title.trim()) {
      Alert.alert('错误', '请输入指令标题');
      return;
    }

    if (!prompt.trim()) {
      Alert.alert('错误', '请输入生成提示词');
      return;
    }

    if (!device.deviceId) {
      Alert.alert('错误', '设备未注册，请检查连接状态');
      return;
    }

    setIsGenerating(true);

    try {
      const commandData = {
        deviceId: device.deviceId,
        type: commandType,
        title: title.trim(),
        prompt: prompt.trim(),
        timestamp: new Date().toISOString(),
      };

      const result = await dispatch(sendCommand(commandData));

      if (result.type.endsWith('/fulfilled')) {
        Alert.alert('成功', '指令发送成功，任务已开始处理', [
          {
            text: '查看任务',
            onPress: () => navigation.navigate('TaskDetail', { 
              taskId: result.payload.taskId 
            }),
          },
          { text: '继续发送', style: 'cancel' },
        ]);
        
        // 清空表单
        setTitle('');
        setPrompt('');
      } else {
        throw new Error(result.payload || '发送指令失败');
      }
    } catch (error) {
      Alert.alert('错误', error.message || '发送指令失败');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUsePreset = (preset) => {
    setTitle(preset.title);
    setPrompt(preset.prompt);
    setCommandType(preset.type);
  };

  return (
    <ScrollView style={styles.container}>
      {/* 指令类型选择 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>选择指令类型</Text>
        <View style={styles.typeGrid}>
          {commandTypes.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.typeButton,
                commandType === type.id && styles.typeButtonActive,
              ]}
              onPress={() => setCommandType(type.id)}
            >
              <Ionicons 
                name={type.icon} 
                size={24} 
                color={commandType === type.id ? '#007AFF' : '#8E8E93'} 
              />
              <Text style={[
                styles.typeLabel,
                commandType === type.id && styles.typeLabelActive,
              ]}>
                {type.label}
              </Text>
              <Text style={styles.typeDescription}>{type.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 指令表单 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>指令内容</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>指令标题</Text>
          <TextInput
            style={styles.textInput}
            placeholder="请输入指令标题（例如：产品介绍文案）"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>生成提示词</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="请输入详细的生成提示词..."
            value={prompt}
            onChangeText={setPrompt}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={1000}
          />
          <Text style={styles.charCount}>{prompt.length}/1000</Text>
        </View>
      </View>

      {/* 预设提示词 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>预设提示词</Text>
        <View style={styles.presetGrid}>
          {presetPrompts.map((preset, index) => (
            <TouchableOpacity
              key={index}
              style={styles.presetButton}
              onPress={() => handleUsePreset(preset)}
            >
              <Ionicons name="flash" size={16} color="#FF9500" />
              <Text style={styles.presetTitle}>{preset.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 发送按钮 */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!title.trim() || !prompt.trim() || isGenerating) && styles.sendButtonDisabled,
          ]}
          onPress={handleSendCommand}
          disabled={!title.trim() || !prompt.trim() || isGenerating}
        >
          {isGenerating ? (
            <View style={styles.loadingContainer}>
              <Ionicons name="refresh" size={20} color="white" style={styles.spinning} />
              <Text style={styles.sendButtonText}>发送中...</Text>
            </View>
          ) : (
            <View style={styles.sendButtonContent}>
              <Ionicons name="send" size={20} color="white" />
              <Text style={styles.sendButtonText}>发送指令</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* 状态提示 */}
      <View style={styles.statusSection}>
        <View style={styles.statusItem}>
          <Ionicons 
            name={device.isWebSocketConnected ? "checkmark-circle" : "close-circle"} 
            size={16} 
            color={device.isWebSocketConnected ? "#34C759" : "#FF3B30"} 
          />
          <Text style={styles.statusText}>
            WebSocket: {device.isWebSocketConnected ? '已连接' : '未连接'}
          </Text>
        </View>
        
        <View style={styles.statusItem}>
          <Ionicons 
            name={device.isRegistered ? "checkmark-circle" : "close-circle"} 
            size={16} 
            color={device.isRegistered ? "#34C759" : "#FF3B30"} 
          />
          <Text style={styles.statusText}>
            设备: {device.isRegistered ? '已注册' : '未注册'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  section: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#1C1C1E',
  },
  typeGrid: {
    gap: 12,
  },
  typeButton: {
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  typeButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  typeLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
    color: '#8E8E93',
  },
  typeLabelActive: {
    color: '#007AFF',
  },
  typeDescription: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#1C1C1E',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
  },
  textArea: {
    height: 100,
  },
  charCount: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'right',
    marginTop: 4,
  },
  presetGrid: {
    gap: 8,
  },
  presetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  presetTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    color: '#1C1C1E',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  sendButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  spinning: {
    transform: [{ rotate: '0deg' }],
    animation: 'spin 1s linear infinite',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  statusSection: {
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
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    marginLeft: 8,
    color: '#1C1C1E',
  },
});

export default CommandScreen;