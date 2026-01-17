# 移动端设备设置指南

## 概述

本文档详细说明如何在移动设备（Android/iOS）上设置和连接一键发布系统的移动端功能。

## 前置条件

- 确保后端服务运行在 `http://localhost:3000`
- 确保前端服务运行在 `http://localhost:5174`
- 移动设备和电脑需要在同一局域网下

## 移动端设置步骤

### 1. 在网页端注册设备

1. 打开网页仪表板 (`http://localhost:5174`)
2. 在"移动端设备连接"区域点击"注册设备"按钮
3. 填写设备信息：
   - **设备ID**: 系统自动生成，请记录下来
   - **设备名称**: 自定义名称（如：我的iPhone）
   - **平台类型**: 选择 Android 或 iOS
   - **应用版本**: 填写版本号（可选）
4. 点击"注册设备"完成注册

### 2. 移动端应用设置

#### 方法一：使用现有应用（推荐）

1. 在移动设备上安装支持以下功能的任何应用：
   - 支持HTTP请求
   - 支持WebSocket连接
   - 支持文件下载和保存

2. 配置应用连接到服务器：
   ```
   服务器地址: http://你的电脑IP:3000
   设备ID: 在网页端注册时生成的设备ID
   ```

#### 方法二：使用浏览器（简单方式）

1. 在移动设备浏览器中打开：
   ```
   http://你的电脑IP:3000/mobile/connect?deviceId=你的设备ID
   ```

2. 页面将显示连接状态和可用功能

#### 方法三：使用专用移动端应用

我们提供了专门的移动端应用代码，位于 `mobile/` 目录：

1. 安装Node.js环境
2. 运行移动端应用：
   ```bash
   cd mobile
   npm install
   node app.js --deviceId=你的设备ID --server=http://你的电脑IP:3000
   ```

### 3. 获取电脑IP地址

#### Windows系统：
```cmd
ipconfig
```
查找"IPv4 地址"，通常是 `192.168.x.x` 格式

#### macOS/Linux系统：
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

### 4. 测试连接

1. 在移动设备上访问测试页面：
   ```
   http://你的电脑IP:3000/api/v1/mobile/health
   ```
   应该返回：`{"status":"OK"}`

2. 发送测试指令：
   ```
   POST http://你的电脑IP:3000/api/v1/mobile/command
   {
     "deviceId": "你的设备ID",
     "command": "test",
     "data": {"message": "测试连接"}
   }
   ```

## 移动端功能说明

### 核心功能

1. **设备注册与连接**
   - 自动注册到系统
   - 维持心跳连接
   - 实时状态同步

2. **指令接收与执行**
   - 接收内容生成指令
   - 执行发布任务
   - 返回执行结果

3. **内容管理**
   - 下载生成的内容
   - 本地存储管理
   - 发布状态跟踪

### API接口

移动端需要实现以下API调用：

#### 设备注册
```javascript
POST /api/v1/mobile/device/register
{
  "deviceId": "string",
  "deviceName": "string", 
  "platform": "android|ios",
  "version": "string"
}
```

#### 心跳保持
```javascript
POST /api/v1/mobile/device/heartbeat
{
  "deviceId": "string"
}
```

#### 指令接收
```javascript
WebSocket连接: ws://服务器地址/mobile/ws/设备ID
```

## 故障排除

### 常见问题

1. **连接失败**
   - 检查电脑防火墙设置
   - 确认IP地址正确
   - 确保端口3000可访问

2. **设备未显示在线**
   - 检查设备ID是否正确
   - 确认心跳发送正常
   - 查看后端日志

3. **指令无法接收**
   - 检查WebSocket连接
   - 确认设备在线状态
   - 验证指令格式

### 调试方法

1. 查看后端日志：
   ```bash
   cd backend
   npm run dev
   ```

2. 测试API连接：
   ```bash
   curl http://localhost:3000/api/v1/mobile/health
   ```

3. 检查设备状态：
   ```bash
   curl http://localhost:3000/api/v1/mobile/devices
   ```

## 安全注意事项

1. **网络环境**
   - 建议在安全的局域网内使用
   - 避免在公共网络暴露服务

2. **设备管理**
   - 定期清理未使用的设备
   - 监控设备活动状态

3. **数据保护**
   - 敏感信息本地存储加密
   - 传输数据使用HTTPS（生产环境）

## 进阶配置

### 自定义移动端应用

您可以根据 `mobile/` 目录中的代码开发自定义移动端应用：

1. 修改 `mobile/src/services/deviceService.js` 适配您的需求
2. 调整 `mobile/src/utils/helpers.js` 中的配置
3. 自定义UI界面和用户体验

### 多设备管理

支持同时管理多个移动设备：
- 每个设备独立注册
- 支持批量指令发送
- 设备状态集中监控

## 技术支持

如遇到问题，请检查：
1. 服务运行状态
2. 网络连接情况  
3. 设备配置信息
4. 系统日志输出

如需进一步帮助，请提供详细的错误信息和操作步骤。