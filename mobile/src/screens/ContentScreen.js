import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { fetchContentList, downloadImage } from '../store/slices/contentSlice';

const ContentScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  
  const contentList = useSelector(state => state.content.contentList);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadContentList();
  }, []);

  const loadContentList = async () => {
    setIsLoading(true);
    try {
      await dispatch(fetchContentList()).unwrap();
    } catch (error) {
      console.error('加载内容列表失败:', error);
      Alert.alert('错误', '加载内容列表失败');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredContent = contentList.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'images' && item.contentType === 'image') return true;
    if (filter === 'text' && item.contentType === 'text') return true;
    if (filter === 'multimodal' && item.contentType === 'multimodal') return true;
    return false;
  });

  const handleDownload = async (contentId, imageUrl) => {
    try {
      await dispatch(downloadImage({ contentId, imageUrl })).unwrap();
      Alert.alert('成功', '图片已下载到相册');
    } catch (error) {
      console.error('下载图片失败:', error);
      Alert.alert('错误', '下载图片失败');
    }
  };

  const renderContentItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.contentItem}
      onPress={() => navigation.navigate('ContentDetail', { contentId: item.id })}
    >
      {/* 内容预览 */}
      {item.contentType === 'image' && item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.contentImage} />
      ) : (
        <View style={styles.contentPreview}>
          <Ionicons 
            name={getContentIcon(item.contentType)} 
            size={40} 
            color="#9CA3AF" 
          />
          <Text style={styles.previewText}>
            {item.contentType === 'text' ? '文本内容' : '多模态内容'}
          </Text>
        </View>
      )}

      {/* 内容信息 */}
      <View style={styles.contentInfo}>
        <Text style={styles.contentTitle} numberOfLines={1}>
          {item.title || '未命名内容'}
        </Text>
        <Text style={styles.contentDescription} numberOfLines={2}>
          {item.description || '无描述'}
        </Text>
        
        <View style={styles.contentMeta}>
          <Text style={styles.contentType}>
            {getContentTypeText(item.contentType)}
          </Text>
          <Text style={styles.contentTime}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>

        {/* 操作按钮 */}
        <View style={styles.actionButtons}>
          {item.contentType === 'image' && item.imageUrl && (
            <TouchableOpacity 
              style={styles.downloadButton}
              onPress={() => handleDownload(item.id, item.imageUrl)}
            >
              <Ionicons name="download" size={16} color="#3B82F6" />
              <Text style={styles.downloadText}>下载</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.detailButton}
            onPress={() => navigation.navigate('ContentDetail', { contentId: item.id })}
          >
            <Ionicons name="eye" size={16} color="#6B7280" />
            <Text style={styles.detailText}>查看详情</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const getContentIcon = (contentType) => {
    switch (contentType) {
      case 'image': return 'image';
      case 'text': return 'document-text';
      case 'multimodal': return 'layers';
      default: return 'document';
    }
  };

  const getContentTypeText = (contentType) => {
    switch (contentType) {
      case 'image': return '图片';
      case 'text': return '文本';
      case 'multimodal': return '多模态';
      default: return '未知';
    }
  };

  const FilterButton = ({ title, value, isActive }) => (
    <TouchableOpacity
      style={[styles.filterButton, isActive && styles.filterButtonActive]}
      onPress={() => setFilter(value)}
    >
      <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* 过滤选项 */}
      <View style={styles.filterSection}>
        <FilterButton title="全部" value="all" isActive={filter === 'all'} />
        <FilterButton title="图片" value="images" isActive={filter === 'images'} />
        <FilterButton title="文本" value="text" isActive={filter === 'text'} />
        <FilterButton title="多模态" value="multimodal" isActive={filter === 'multimodal'} />
      </View>

      {/* 内容列表 */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text>加载中...</Text>
        </View>
      ) : filteredContent.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>暂无内容</Text>
          <Text style={styles.emptySubtext}>生成的内容将显示在这里</Text>
        </View>
      ) : (
        <FlatList
          data={filteredContent}
          renderItem={renderContentItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={isLoading}
          onRefresh={loadContentList}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  filterSection: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  filterButtonActive: {
    backgroundColor: '#3B82F6',
  },
  filterText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#6B7280',
    marginTop: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  listContainer: {
    padding: 16,
    gap: 16,
  },
  contentItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  contentImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  contentPreview: {
    width: '100%',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  previewText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  contentInfo: {
    padding: 16,
  },
  contentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  contentDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  contentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  contentType: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  contentTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    gap: 4,
  },
  downloadText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
});

export default ContentScreen;