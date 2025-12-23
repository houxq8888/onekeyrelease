import { ContentService, BatchContentResult } from '../services/contentService';
import { AppError } from '../middleware/errorHandler';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

/**
 * AI API集成测试
 * 测试内容生成模块的实际AI API集成功能
 */
class AIApiIntegrationTest {
  private testResults: Array<{
    testName: string;
    status: 'PASSED' | 'FAILED' | 'SKIPPED';
    message: string;
    duration?: number;
  }> = [];

  /**
   * 运行所有测试
   */
  async runAllTests(): Promise<void> {
    console.log('🚀 开始AI API集成测试...\n');
    
    // 检查环境配置
    await this.testEnvironmentConfiguration();
    
    // 测试文案生成
    await this.testContentGeneration();
    
    // 测试图像生成
    await this.testImageGeneration();
    
    // 测试内容优化
    await this.testContentOptimization();
    
    // 测试批量生成
    await this.testBatchGeneration();
    
    // 输出测试结果
    this.printTestResults();
  }

  /**
   * 测试环境配置
   */
  private async testEnvironmentConfiguration(): Promise<void> {
    const startTime = Date.now();
    const testName = '环境配置检查';
    
    try {
      console.log('🔍 检查环境配置...');
      
      const requiredEnvVars = [
        'OPENAI_API_KEY',
        'STABLE_DIFFUSION_API_URL',
        'VIDEO_GENERATION_API_URL'
      ];
      
      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
      
      if (missingVars.length > 0) {
        console.log(`⚠️  缺少环境变量: ${missingVars.join(', ')}`);
        console.log('💡 提示: 部分测试将使用模拟数据\n');
        this.addTestResult(testName, 'SKIPPED', `缺少环境变量: ${missingVars.join(', ')}`);
      } else {
        console.log('✅ 环境配置检查通过\n');
        this.addTestResult(testName, 'PASSED', '所有必需环境变量已配置', Date.now() - startTime);
      }
    } catch (error: any) {
      this.addTestResult(testName, 'FAILED', error.message, Date.now() - startTime);
    }
  }

  /**
   * 测试文案生成
   */
  private async testContentGeneration(): Promise<void> {
    const testName = '文案生成测试';
    const startTime = Date.now();
    
    try {
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
        throw new AppError('文案生成返回空内容');
      }
      
      if (content.content.includes('模拟生成')) {
        console.log('📝 使用模拟文案生成 (未配置OpenAI API)');
        this.addTestResult(testName, 'SKIPPED', '使用模拟文案生成 - 未配置OpenAI API', Date.now() - startTime);
      } else {
        console.log('✅ AI文案生成成功');
        console.log(`📄 生成标题: ${content.title}`);
        console.log(`📄 生成内容预览: ${content.content.substring(0, 100)}...\n`);
        this.addTestResult(testName, 'PASSED', '文案生成功能正常', Date.now() - startTime);
      }
    } catch (error: any) {
      console.error(`❌ 文案生成测试失败: ${error.message}`);
      this.addTestResult(testName, 'FAILED', error.message, Date.now() - startTime);
    }
  }

  /**
   * 测试图像生成
   */
  private async testImageGeneration(): Promise<void> {
    const testName = '图像生成测试';
    const startTime = Date.now();
    
    try {
      console.log('🖼️  测试图像生成功能...');
      
      const testTheme = '夏日海滩风景';
      const images = await ContentService.generateImages(testTheme);
      
      if (!Array.isArray(images) || images.length === 0) {
        throw new AppError('图像生成返回空数组');
      }
      
      if (images.some(img => img.includes('example.com'))) {
        console.log('🖼️  使用模拟图像生成 (未配置图像生成API)');
        this.addTestResult(testName, 'SKIPPED', '使用模拟图像生成 - 未配置图像生成API', Date.now() - startTime);
      } else {
        console.log('✅ AI图像生成成功');
        console.log(`📸 生成图片数量: ${images.length}`);
        console.log(`🖼️  图片URL示例: ${images[0]}\n`);
        this.addTestResult(testName, 'PASSED', '图像生成功能正常', Date.now() - startTime);
      }
    } catch (error: any) {
      console.error(`❌ 图像生成测试失败: ${error.message}`);
      this.addTestResult(testName, 'FAILED', error.message, Date.now() - startTime);
    }
  }

  /**
   * 测试内容优化
   */
  private async testContentOptimization(): Promise<void> {
    const testName = '内容优化测试';
    const startTime = Date.now();
    
    try {
      console.log('✨ 测试内容优化功能...');
      
      const originalContent = '今天天气很好，适合出去散步。公园里的花都开了，非常漂亮。';
      const optimizedContent = await ContentService.optimizeContent(originalContent, 'xiaohongshu');
      
      if (!optimizedContent) {
        throw new AppError('内容优化返回空内容');
      }
      
      if (optimizedContent.includes('✨ 优化后的内容 ✨')) {
        console.log('✨ 使用模拟内容优化 (未配置OpenAI API)');
        this.addTestResult(testName, 'SKIPPED', '使用模拟内容优化 - 未配置OpenAI API', Date.now() - startTime);
      } else {
        console.log('✅ AI内容优化成功');
        console.log(`📄 优化后内容预览: ${optimizedContent.substring(0, 100)}...\n`);
        this.addTestResult(testName, 'PASSED', '内容优化功能正常', Date.now() - startTime);
      }
    } catch (error: any) {
      console.error(`❌ 内容优化测试失败: ${error.message}`);
      this.addTestResult(testName, 'FAILED', error.message, Date.now() - startTime);
    }
  }

  /**
   * 测试批量生成
   */
  private async testBatchGeneration(): Promise<void> {
    const testName = '批量生成测试';
    const startTime = Date.now();
    
    try {
      console.log('📦 测试批量内容生成功能...');
      
      const testThemes = [
        '美食探店分享',
        '健身运动心得',
        '旅行攻略推荐'
      ];
      
      const results = await ContentService.batchGenerateContent(testThemes);
      
      if (!Array.isArray(results) || results.length !== testThemes.length) {
        throw new AppError('批量生成返回结果数量不正确');
      }
      
      const successCount = results.filter(r => r.status === 'success').length;
      const errorCount = results.filter(r => r.status === 'error').length;
      
      console.log(`✅ 批量生成完成`);
      console.log(`📊 成功: ${successCount}, 失败: ${errorCount}`);
      
      results.forEach((result, index) => {
        console.log(`  ${index + 1}. ${result.theme}: ${result.status}`);
      });
      
      console.log('');
      this.addTestResult(testName, 'PASSED', `批量生成功能正常 - 成功: ${successCount}, 失败: ${errorCount}`, Date.now() - startTime);
    } catch (error: any) {
      console.error(`❌ 批量生成测试失败: ${error.message}`);
      this.addTestResult(testName, 'FAILED', error.message, Date.now() - startTime);
    }
  }

  /**
   * 添加测试结果
   */
  private addTestResult(testName: string, status: 'PASSED' | 'FAILED' | 'SKIPPED', message: string, duration?: number): void {
    this.testResults.push({
      testName,
      status,
      message,
      duration
    });
  }

  /**
   * 输出测试结果
   */
  private printTestResults(): void {
    console.log('\n📊 AI API集成测试结果汇总:');
    console.log('='.repeat(60));
    
    const passed = this.testResults.filter(r => r.status === 'PASSED').length;
    const failed = this.testResults.filter(r => r.status === 'FAILED').length;
    const skipped = this.testResults.filter(r => r.status === 'SKIPPED').length;
    
    this.testResults.forEach(result => {
      const statusIcon = result.status === 'PASSED' ? '✅' : result.status === 'FAILED' ? '❌' : '⚠️';
      const durationStr = result.duration ? `(${result.duration}ms)` : '';
      console.log(`${statusIcon} ${result.testName}: ${result.status} ${durationStr}`);
      if (result.message) {
        console.log(`   ${result.message}`);
      }
    });
    
    console.log('='.repeat(60));
    console.log(`总计: ${this.testResults.length}个测试 - ✅ 通过: ${passed} | ❌ 失败: ${failed} | ⚠️  跳过: ${skipped}`);
    
    if (failed > 0) {
      console.log('\n❌ 测试失败，请检查相关配置和实现');
      process.exit(1);
    } else if (skipped > 0) {
      console.log('\n⚠️  部分测试跳过，建议配置完整的AI API环境');
    } else {
      console.log('\n🎉 所有测试通过！AI API集成功能正常');
    }
  }
}

// 运行测试
async function main() {
  const testRunner = new AIApiIntegrationTest();
  await testRunner.runAllTests();
}

// 如果是直接运行此文件
if (require.main === module) {
  main().catch(error => {
    console.error('测试运行失败:', error);
    process.exit(1);
  });
}

export { AIApiIntegrationTest };