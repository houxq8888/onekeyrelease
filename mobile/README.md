# OneKeyRelease 移动应用

OneKeyRelease 的 React Native 移动客户端，支持与电脑端进行实时通信，发送指令并接收生成的内容。

## 功能特性

- 📱 **跨平台支持**: 支持 Android 和 iOS
- 🔄 **实时通信**: 通过 WebSocket 与电脑端实时通信
- 📨 **指令发送**: 支持文本、图片、图文生成等多种指令类型
- 📊 **任务管理**: 查看任务状态、进度和结果
- 🖼️ **内容浏览**: 查看生成的内容，支持图片下载和分享
- 🔔 **推送通知**: 接收任务完成和系统通知
- ⚙️ **设置管理**: 丰富的应用设置选项

## 技术栈

- **React Native**: 跨平台移动应用框架
- **Expo**: 开发工具链和 SDK
- **Redux Toolkit**: 状态管理
- **React Navigation**: 导航管理
- **Axios**: HTTP 请求库
- **Expo Notifications**: 推送通知
- **Expo File System**: 文件系统操作

## 项目结构

```
mobile/
├── src/
│   ├── screens/           # 屏幕组件
│   │   ├── HomeScreen.js          # 首页
│   │   ├── CommandScreen.js       # 指令发送
│   │   ├── TaskScreen.js          # 任务列表
│   │   ├── TaskDetailScreen.js    # 任务详情
│   │   ├── ContentScreen.js       # 内容列表
│   │   ├── ContentDetailScreen.js # 内容详情
│   │   └── SettingsScreen.js      # 设置
│   ├── navigation/        # 导航配置
│   │   └── AppNavigator.js        # 主导航器
│   ├── store/            # 状态管理
│   │   ├── store.js               # Redux store
│   │   └── slices/                # Redux slices
│   │       ├── deviceSlice.js     # 设备状态
│   │       ├── taskSlice.js       # 任务状态
│   │       ├── contentSlice.js    # 内容状态
│   │       └── notificationSlice.js # 通知状态
│   └── services/         # 服务层
│       ├── deviceService.js       # 设备服务
│       ├── taskService.js         # 任务服务
│       ├── contentService.js      # 内容服务
│       ├── websocketService.js    # WebSocket 服务
│       ├── notificationService.js # 通知服务
│       └── initialization.js      # 初始化服务
├── app.json              # 应用配置
├── index.js              # 应用入口
└── package.json          # 依赖配置
```

## 快速开始

### 环境要求

- Node.js 16+
- npm 或 yarn
- Expo CLI
- Android Studio (Android开发)
- Xcode (iOS开发)

### 安装依赖

```bash
cd mobile
npm install
# 或
yarn install
```

### 运行应用

#### 开发模式
```bash
npm start
# 或
yarn start
```

#### Android
```bash
npm run android
# 或
yarn android
```

#### iOS
```bash
npm run ios
# 或
yarn ios
```

## 配置说明

### 环境变量

在项目根目录创建 `.env` 文件：

```env
API_BASE_URL=http://localhost:3000
WEBSOCKET_URL=ws://localhost:3000/ws
DEVICE_ID=your_device_id
```

### 应用配置

修改 `app.json` 文件配置应用信息：

```json
{
  "expo": {
    "name": "OneKeyRelease",
    "slug": "onekeyrelease",
    "version": "1.0.0",
    "orientation": "portrait"
  }
}
```

## 核心功能实现

### 初始化流程

应用启动时执行初始化：

1. 注册设备到后端
2. 建立 WebSocket 连接
3. 启动心跳检测
4. 监听网络状态

### 指令发送

支持多种指令类型：

- **文本生成**: 基于主题和关键词生成文本内容
- **图片生成**: 生成指定主题的图片
- **图文生成**: 同时生成文本和图片

### 状态管理

使用 Redux Toolkit 管理应用状态：

- **设备状态**: 设备信息、连接状态
- **任务状态**: 任务列表、进度、结果
- **内容状态**: 内容列表、详情
- **通知状态**: 推送通知、系统消息

## 开发指南

### 添加新页面

1. 在 `src/screens/` 创建新组件
2. 在 `src/navigation/AppNavigator.js` 配置路由
3. 在对应的 Redux slice 中添加状态管理

### 添加新服务

1. 在 `src/services/` 创建服务类
2. 实现对应的 API 调用方法
3. 在 Redux slice 中创建异步操作

### 调试技巧

- 使用 React Native Debugger
- 启用热重载
- 查看 Redux DevTools
- 使用 Expo DevTools

## 部署

### 构建应用

```bash
# 构建 Android APK
expo build:android

# 构建 iOS IPA
expo build:ios
```

### 发布到应用商店

1. 配置应用元数据
2. 生成发布版本
3. 提交到 Google Play / App Store

## 常见问题

### Q: 应用无法连接服务器
A: 检查网络连接和服务器地址配置

### Q: WebSocket 连接失败
A: 检查后端服务是否运行，端口是否正确

### Q: 推送通知不工作
A: 检查 Expo 通知配置和设备权限

## 许可证

MIT License