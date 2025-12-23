import { ContentService } from '../services/contentService';
import * as dotenv from 'dotenv';
// 加载环境变量
dotenv.config();
async function debugTest() {
    console.log('🔍 开始调试测试...');
    try {
        // 测试简单的导入和函数调用
        console.log('✅ ContentService导入成功');
        // 检查是否存在generateContent方法
        if (typeof ContentService.generateContent === 'function') {
            console.log('✅ generateContent方法存在');
        }
        else {
            console.log('❌ generateContent方法不存在');
        }
        // 尝试调用一个简单的方法
        const config = {
            theme: '测试主题',
            keywords: ['测试'],
            targetAudience: '测试用户',
            style: 'casual',
            wordCount: 100
        };
        console.log('📝 尝试调用generateContent...');
        const result = await ContentService.generateContent(config);
        console.log('✅ generateContent调用成功');
        console.log('📄 生成标题:', result.title);
    }
    catch (error) {
        console.error('❌ 调试测试失败:', error.message);
        console.error('堆栈:', error.stack);
    }
}
debugTest().then(() => {
    console.log('🎉 调试测试完成');
}).catch(error => {
    console.error('💥 调试测试异常:', error);
});
