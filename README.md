# OneKeyRelease - 小红书自动化发布工具

一个全栈自动化工具，实现一键生成内容、一键发布到小红书的功能。

## 功能特性

### 内容生成模块
- **智能文案生成**：基于AI的文案创作
- **图像生成**：自动生成符合小红书风格的图片
- **视频生成**：结合文案和图片生成短视频
- **内容排版优化**：自动优化内容格式和布局

### 自动发布模块
- **模拟登录**：安全的小红书账号登录
- **内容发布**：自动填充并发布内容
- **错误处理**：完善的异常处理和重试机制
- **任务监控**：实时监控发布状态

### 用户界面
- **直观的控制面板**：任务创建、管理和监控
- **实时状态显示**：发布进度和结果反馈
- **配置管理**：账号配置和发布设置

## 技术架构

### 后端技术栈
- Node.js + Express + TypeScript
- Puppeteer/Playwright (浏览器自动化)
- OpenAI API (文案生成)
- Stable Diffusion API (图像生成)
- FFmpeg (视频处理)
- Redis (任务队列)
- MongoDB (数据存储)

### 前端技术栈
- React + TypeScript
- Tailwind CSS + Ant Design
- Vite (构建工具)

## 项目结构

```
onekeyrelease/
├── backend/          # 后端服务
│   ├── src/
│   │   ├── modules/  # 功能模块
│   │   ├── services/ # 业务服务
│   │   └── api/      # API接口
│   └── package.json
├── frontend/         # 前端应用
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── utils/
│   └── package.json
└── README.md
```

## 快速开始

### 环境要求
- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```

### 构建项目
```bash
npm run build
```

### 生产环境启动
```bash
npm start
```

## 配置说明

在开始使用前，需要配置以下环境变量：

- `OPENAI_API_KEY`: OpenAI API密钥
- `STABLE_DIFFUSION_API_URL`: 图像生成API地址
- `REDIS_URL`: Redis连接地址
- `MONGODB_URI`: MongoDB连接字符串
- `XIAOHONGSHU_ACCOUNTS`: 小红书账号配置

## 使用说明

1. **配置账号**：在控制面板添加小红书账号
2. **创建任务**：设置发布内容和时间
3. **生成内容**：AI自动生成文案和配图
4. **发布内容**：自动发布到小红书平台
5. **监控结果**：查看发布状态和统计数据

## 开发计划

- [x] 项目架构设计
- [ ] 后端API服务开发
- [ ] 前端界面开发
- [ ] 内容生成模块实现
- [ ] 自动发布模块实现
- [ ] 测试和部署

## 许可证

MIT License