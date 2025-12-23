import { ContentService } from '../services/contentService';

console.log('ContentService test started...');

try {
  // 测试简单的配置
  const config = {
    theme: '测试主题',
    keywords: ['测试'],
    targetAudience: '测试用户',
    style: 'casual' as const,
    wordCount: 100
  };
  
  console.log('Testing ContentService.generateContent...');
  const result = await ContentService.generateContent(config);
  console.log('Content generation successful!');
  console.log('Title:', result.title);
  console.log('Content preview:', result.content.substring(0, 50) + '...');
} catch (error: any) {
  console.error('Error:', error.message);
}

console.log('ContentService test completed.');