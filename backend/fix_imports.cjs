const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');

// 递归处理目录
function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (file.endsWith('.js')) {
      processFile(filePath);
    }
  });
}

// 处理单个文件
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 正则匹配相对导入语句
  // 匹配模式：import ... from './xxx' 或 import ... from '../xxx'
  // 排除已经有 .js 扩展名的
  const importRegex = /from\s+['"](\.\.\/?|\.\/?)([^.'"\/]+)['"]/g;
  
  let modified = false;
  content = content.replace(importRegex, (match, prefix, moduleName) => {
    // 跳过已经有 .js 扩展名的
    if (match.includes('.js')) {
      return match;
    }
    // 跳过包含 @ 的模块（第三方包）
    if (moduleName.includes('@')) {
      return match;
    }
    // 跳过 node_modules 中的模块
    if (match.includes('node_modules')) {
      return match;
    }
    modified = true;
    return `from '${prefix}${moduleName}.js'`;
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed imports in: ${filePath}`);
  }
}

// 开始处理
console.log('Fixing imports in dist directory...');
processDirectory(distDir);
console.log('Import fixing completed!');
