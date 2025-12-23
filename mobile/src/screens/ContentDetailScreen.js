import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, Share } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { fetchContentDetail, downloadImage, deleteContent } from '../store/slices/contentSlice';

const ContentDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { contentId } = route.params;
  
  const currentContent = useSelector(state => state.content.currentContent);
  const [content, setContent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadContentDetail();
  }, [contentId]);

  const loadContentDetail = async () => {
    if (!contentId) return;
    
    setIsLoading(true);
    try {
      await dispatch(fetchContentDetail(contentId)).unwrap();
    } catch (error) {
      console.error('加载内容详情失败:', error);
      Alert.alert('错误', '加载内容详情失败');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentContent && currentContent.id === contentId) {
      setContent(currentContent);
    }
  }, [currentContent, contentId]);

  const handleDownload = async () => {
    if (!content?.imageUrl) return;
    
    try {
      await dispatch(downloadImage({ contentId, imageUrl: content.imageUrl })).unwrap();
      Alert.alert('成功', '图片已下载到相册');
    } catch (error) {
      console.error('下载图片失败:', error);
      Alert.alert('错误', '下载图片失败');
    }
  };

  const handleShare = async () => {
    if (!content) return;
    
    try {
      let shareContent = '';
      
      if (content.contentType === 'image' && content.imageUrl) {
        // 分享图片URL
        shareContent = content.imageUrl;
      } else if (content.contentType === 'text' && content.textContent) {
        // 分享文本内容
        shareContent = content.textContent;
      } else if (content.contentType === 'multimodal') {
        // 分享多模态内容
        shareContent = content.description || '查看生成的内容';
      }
      
      const result = await Share.share({
        message: shareContent,
        title: content.title || '生成内容',
      });
      
      if (result.action === Share.sharedAction) {
        console.log('分享成功');
      }
    } catch (error) {
      console.error('分享失败:', error);
      Alert.alert('错误', '分享失败');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      '确认删除',
      '确定要删除这个内容吗？此操作不可撤销。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteContent(contentId)).unwrap();
              navigation.goBack();
            } catch (error) {
              Alert.alert('错误', '删除内容失败');
            }
          }
        }
      ]
    );
  };

  const getContentTypeText = (contentType) => {
    switch (contentType) {
      case 'image': return '图片';
      case 'text': return '文本';
      case 'multimodal': return '多模态';
      default: return '未知';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>加载中...</Text>
      </View>
    );
  }

  if (!content) {
    return (
      <View style={styles.container}>
        <Text>内容不存在</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* 头部信息 */}
      <View style={styles.header}>
        <Text style={styles.title}>{content.title || '未命名内容'}</Text>
        <View style={styles.metaInfo}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{getContentTypeText(content.contentType)}</Text>
          </View>
          <Text style={styles.time}>{new Date(content.createdAt).toLocaleString()}</Text>
        </View>
      </View>

      {/* 内容展示 */}
      <View style={styles.contentSection}>
        {content.contentType === 'image' && content.imageUrl ? (
          <Image source={{ uri: content.imageUrl }} style={styles.contentImage} />
        ) : content.contentType === 'text' && content.textContent ? (
          <View style={styles.textContent}>
            <Text style={styles.textContentText}>{content.textContent}</Text>
          </View>
        ) : content.contentType === 'multimodal' ? (
          <View style={styles.multimodalContent}>
            {content.imageUrl && (
              <Image source={{ uri: content.imageUrl }} style={styles.multimodalImage} />
            )}
            {content.textContent && (
              <Text style={styles.multimodalText}>{content.textContent}</Text>
            )}
          </View>
        ) : (
          <View style={styles.unknownContent}>
            <Ionicons name="document" size={64} color="#D1D5DB" />
            <Text style={styles.unknownText}>未知内容类型</Text>
          </View>
        )}
      </View>

      {/* 详细信息 */}
      <View style={styles.detailsSection}>
        <Text style={styles.sectionTitle}>详细信息</Text>
        
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>内容类型:</Text>
          <Text style={styles.detailValue}>{getContentTypeText(content.contentType)}</Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>创建时间:</Text>
          <Text style={styles.detailValue}>{new Date(content.createdAt).toLocaleString()}</Text>
        </View>

        {content.updatedAt && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>更新时间:</Text>
            <Text style={styles.detailValue}>{new Date(content.updatedAt).toLocaleString()}</Text>
          </View>
        )}

        {content.description && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>描述:</Text>
            <Text style={styles.detailValue}>{content.description}</Text>
          </View>
        )}

        {content.tags && content.tags.length > 0 && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>标签:</Text>
            <View style={styles.tagsContainer}>
              {content.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {content.metadata && Object.keys(content.metadata).length > 0 && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>元数据:</Text>
            <Text style={styles.detailValue}>
              {JSON.stringify(content.metadata, null, 2)}
            </Text>
          </View>
        )}
      </View>

      {/* 操作按钮 */}
      <View style={styles.actionsSection}>
        {content.contentType === 'image' && content.imageUrl && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.downloadButton]}
            onPress={handleDownload}
          >
            <Ionicons name="download" size={20} color="#3B82F6" />
            <Text style={styles.downloadButtonText}>下载图片</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={[styles.actionButton, styles.shareButton]}
          onPress={handleShare}
        >
          <Ionicons name="share-social" size={20} color="#10B981" />
          <Text style={styles.shareButtonText}>分享</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDelete}
        >
          <Ionicons name="trash" size={20} color="#EF4444" />
          <Text style={styles.deleteButtonText}>删除</Text>
        </TouchableOpacity>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  typeText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  time: {
    fontSize: 14,
    color: '#6B7280',
  },
  contentSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
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
    height: 300,
    resizeMode: 'contain',
  },
  textContent: {
    padding: 20,
  },
  textContentText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1F2937',
  },
  multimodalContent: {
    padding: 0,
  },
  multimodalImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  multimodalText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1F2937',
    padding: 20,
  },
  unknownContent: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unknownText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
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
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  tag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#6B7280',
  },
  actionsSection: {
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  downloadButton: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  downloadButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
  shareButton: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  shareButtonText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ContentDetailScreen;