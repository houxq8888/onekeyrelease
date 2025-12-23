import { ContentService } from '../services/contentService';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

console.log('🚀 开始简化AI API集成测试...\n');

async function runSimpleTest() {
  try {
    // 测试1: 环境配置检查
    console.log('🔍 检查环境配置...');
    const requiredEnvVars = [
      'OPENAI_API_KEY',
      'STABLE_DIFFUSION_API_URL',
      'VIDEO_GENERATION_API_URL'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.log(`⚠️  缺少环境变量: ${missingVars.join(', ')}`);
      console.log('💡 提示: 将使用模拟数据\n');
    } else {
      console.log('✅ 环境配置检查通过\n');
    }
    
    // 测试2: 文案生成
    console.log('📝 测试文案生成功能...');
    const config = {
      theme: '夏日旅行攻略',
      keywords: ['旅行', '夏日', '攻略', '海滩'],
      targetAudience: '年轻旅行爱好者',
      style: 'casual' as const,
      wordCount: 500
    };
    
    const content = await ContentService.generateContent(config);
    
    if (!content) {
      throw new Error('文案生成返回空内容');
    }
    
    if (content.content.includes('模拟生成')) {
      console.log('📝 使用模拟文案生成 (未配置OpenAI API)');
    } else {
      console.log('✅ AI文案生成成功');
      console.log(`📄 生成标题: ${content.title}`);
      console.log(`📄 生成内容预览: ${content.content.substring(0, 100)}...\n`);
    }
    
    console.log('🎉 简化测试完成！');
    
  } catch (error: any) {
    console.error(`❌ 测试失败: ${error.message}`);
    console.error('详细错误:', error);
  }
}

runSimpleTest();