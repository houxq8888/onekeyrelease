# 手机连接PC端功能使用指南

## 功能概述

手机连接PC端功能允许移动设备通过二维码配对和WebSocket连接与PC端进行实时通信，实现内容生成、任务管理和状态同步等功能。

## 核心组件

### 1. 配对服务 (PairingService)
- **位置**: `src/services/pairingService.ts`
- **功能**: 管理配对会话、二维码生成、配对状态跟踪
- **主要方法**:
  - `createPairingSession()` - 创建配对会话
  - `handleQRCodeScan()` - 处理二维码扫描
  - `completePairing()` - 完成配对
  - `handleWebSocketConnection()` - 处理WebSocket连接

### 2. 移动端服务 (MobileService)
- **位置**: `src/services/mobileService.ts`
- **功能**: 设备管理、指令处理、内容生成
- **主要方法**:
  - `registerDevice()` - 注册设备
  - `handleCommand()` - 处理移动端指令
  - `getDeviceStatus()` - 获取设备状态

### 3. WebSocket服务 (WebSocketService)
- **位置**: `src/services/websocketService.ts`
- **功能**: 实时通信、连接管理、消息推送
- **主要方法**:
  - `initialize()` - 初始化WebSocket服务器
  - `sendToDevice()` - 发送消息到设备
  - `broadcast()` - 广播消息到所有设备

## API端点

### 配对相关API

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/v1/mobile/pairing/session` | 创建配对会话 |
| POST | `/api/v1/mobile/pairing/scan` | 处理二维码扫描 |
| POST | `/api/v1/mobile/pairing/complete` | 完成配对 |
| GET | `/api/v1/mobile/pairing/status/:sessionId` | 获取配对状态 |
| POST | `/api/v1/mobile/pairing/connection-qrcode` | 生成连接二维码 |
| GET | `/api/v1/mobile/pairing/stats` | 获取配对统计 |

### 设备管理API

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/v1/mobile/device/register` | 注册设备 |
| GET | `/api/v1/mobile/devices` | 获取设备列表 |
| GET | `/api/v1/mobile/device/status/:deviceId` | 获取设备状态 |

### 指令处理API

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/v1/mobile/command` | 处理移动端指令 |
| GET | `/api/v1/mobile/status/:taskId` | 获取任务状态 |
| GET | `/api/v1/mobile/content/:deviceId` | 获取设备内容 |

## 配对流程

### 1. 创建配对会话
```typescript
const pairingSession = await PairingService.createPairingSession(serverUrl);
// 返回: { sessionId, qrCode, deviceId }
```

### 2. 手机扫描二维码
- 手机端扫描生成的二维码
- 二维码包含配对信息和服务器地址

### 3. 处理扫描事件
```typescript
await PairingService.handleQRCodeScan(sessionId, {
  deviceId: 'device_123',
  deviceName: '我的手机',
  platform: 'android'
});
```

### 4. 建立WebSocket连接
```typescript
// 手机端建立WebSocket连接
const ws = new WebSocket(`ws://localhost:3000/ws/mobile?deviceId=${deviceId}`);

// 服务器端处理连接
await PairingService.handleWebSocketConnection(deviceId);
```

### 5. 完成配对
```typescript
await PairingService.completePairing(sessionId);
```

## WebSocket消息协议

### 消息类型
```typescript
type WebSocketMessageType =
  | 'device_connected'      // 设备连接
  | 'device_disconnected'   // 设备断开
  | 'task_completed'       // 任务完成
  | 'task_failed'          // 任务失败
  | 'progress_update'      // 进度更新
  | 'notification'         // 通知消息
  | 'ping'                 // 心跳检测
  | 'pong'                 // 心跳响应
  | 'pairing_status'       // 配对状态
  | 'pairing_complete'     // 配对完成
  | 'device_info_request'  // 设备信息请求
  | 'device_info_response' // 设备信息响应
```

### 消息格式
```typescript
interface WebSocketMessage {
  type: WebSocketMessageType;
  deviceId: string;
  data: any;
  timestamp: number;
}
```

## 使用示例

### 1. 创建配对会话 (Node.js)
```javascript
const response = await fetch('http://localhost:3000/api/v1/mobile/pairing/session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
});

const result = await response.json();
console.log('配对会话:', result.data);
```

### 2. 手机端连接 (JavaScript)
```javascript
// 建立WebSocket连接
const ws = new WebSocket('ws://localhost:3000/ws/mobile?deviceId=your_device_id');

ws.onopen = () => {
  console.log('连接成功');
  
  // 发送心跳包
  setInterval(() => {
    ws.send(JSON.stringify({
      type: 'ping',
      deviceId: 'your_device_id',
      data: {},
      timestamp: Date.now()
    }));
  }, 30000);
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('收到消息:', message);
};
```

### 3. 发送指令
```javascript
const response = await fetch('http://localhost:3000/api/v1/mobile/command', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    deviceId: 'your_device_id',
    command: 'generate_content',
    params: {
      platform: 'xiaohongshu',
      topic: '美食探店'
    }
  })
});
```

## 测试和演示

### 运行演示程序
```bash
cd backend
npm run demo:mobile
```

### 运行测试
```bash
cd backend
npm run test:mobile
```

## 配置说明

### 超时设置
- 配对会话超时: 10分钟
- WebSocket连接超时: 5分钟
- 心跳间隔: 30秒

### 端口配置
- HTTP服务器端口: 3000
- WebSocket路径: `/ws/mobile`

## 故障排除

### 常见问题

1. **配对会话过期**
   - 原因: 会话超过10分钟未完成配对
   - 解决: 重新创建配对会话

2. **WebSocket连接失败**
   - 原因: 设备ID不匹配或服务器未启动
   - 解决: 检查设备ID和服务器状态

3. **二维码扫描失败**
   - 原因: 二维码数据格式错误
   - 解决: 重新生成二维码

### 日志查看
```bash
# 查看服务器日志
tail -f logs/server.log

# 查看移动端连接日志
grep "mobile" logs/server.log
```

## 扩展功能

### 自定义配对流程
可以通过修改 `PairingService` 类来自定义配对流程，例如添加额外的验证步骤或自定义配对逻辑。

### 消息类型扩展
在 `WebSocketService` 中添加新的消息类型来处理自定义的业务逻辑。

### 设备管理增强
扩展 `MobileService` 类来支持更复杂的设备管理功能，如设备分组、权限控制等。

---

**注意**: 本功能需要确保服务器正常运行，并且移动设备能够访问服务器地址。在生产环境中，请配置正确的域名和SSL证书。