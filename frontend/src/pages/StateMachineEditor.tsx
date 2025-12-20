import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Typography, 
  Space, 
  message, 
  Upload, 
  Modal,
  Row,
  Col,
  Divider,
  Tag
} from 'antd';
import { 
  UploadOutlined, 
  PlayCircleOutlined,
  SaveOutlined,
  EditOutlined,
  EyeOutlined
} from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';

const { Title, Text } = Typography;

// Wizard文件类型定义
interface WizardState {
  id: string;
  name: string;
  type: 'start' | 'end' | 'normal' | 'decision';
  x: number;
  y: number;
  transitions: WizardTransition[];
}

interface WizardTransition {
  id: string;
  fromState: string;
  toState: string;
  condition?: string;
}

interface WizardFile {
  name: string;
  version: string;
  description: string;
  states: WizardState[];
  transitions: WizardTransition[];
}

const StateMachineEditor: React.FC = () => {
  const [wizardFile, setWizardFile] = useState<WizardFile | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // 处理文件上传
  const handleUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options;
    
    try {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsedWizard = JSON.parse(content) as WizardFile;
          
          // 验证文件格式
          if (!parsedWizard.name || !parsedWizard.states) {
            throw new Error('无效的wizard文件格式');
          }
          
          setWizardFile(parsedWizard);
          message.success(`成功加载wizard文件: ${parsedWizard.name}`);
          onSuccess?.('ok');
        } catch (error) {
          message.error('文件解析失败，请检查文件格式');
          onError?.(error as Error);
        }
      };
      
      reader.readAsText(file as Blob);
    } catch (error) {
      message.error('文件读取失败');
      onError?.(error as Error);
    }
  };

  // 渲染状态节点
  const renderStateNode = (state: WizardState) => {
    const getStateColor = (type: string) => {
      switch (type) {
        case 'start': return '#52c41a';
        case 'end': return '#f5222d';
        case 'decision': return '#fa8c16';
        default: return '#1890ff';
      }
    };

    const getStateIcon = (type: string) => {
      switch (type) {
        case 'start': return '▶️';
        case 'end': return '⏹️';
        case 'decision': return '❓';
        default: return '⚪';
      }
    };

    return (
      <Card
        key={state.id}
        size="small"
        style={{
          width: 120,
          borderColor: getStateColor(state.type),
          borderWidth: 2,
          position: 'absolute',
          left: state.x,
          top: state.y
        }}
        title={
          <div className="flex items-center justify-between">
            <span>{getStateIcon(state.type)}</span>
            <Tag color={getStateColor(state.type)}>
              {state.type === 'start' ? '开始' : 
               state.type === 'end' ? '结束' : 
               state.type === 'decision' ? '决策' : '状态'}
            </Tag>
          </div>
        }
      >
        <Text strong>{state.name}</Text>
        {state.transitions.length > 0 && (
          <div className="mt-2">
            <Text type="secondary" style={{ fontSize: '12px' }}>
              转出: {state.transitions.length}
            </Text>
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="p-6">
      {/* 页面标题和操作栏 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={2}>
            状态机编辑器
            {wizardFile && (
              <Text type="secondary" style={{ fontSize: '16px', marginLeft: '12px' }}>
                - {wizardFile.name}
              </Text>
            )}
          </Title>
          {wizardFile?.description && (
            <Text type="secondary">{wizardFile.description}</Text>
          )}
        </div>
        
        <Space>
          <Upload
            customRequest={handleUpload}
            fileList={fileList}
            onChange={({ fileList }) => setFileList(fileList)}
            accept=".json"
            showUploadList={false}
          >
            <Button icon={<UploadOutlined />}>
              加载Wizard文件
            </Button>
          </Upload>
          
          {wizardFile && (
            <>
              <Button icon={<EyeOutlined />} onClick={() => setIsModalVisible(true)}>
                查看详情
              </Button>
              <Button icon={<PlayCircleOutlined />} type="primary">
                执行状态机
              </Button>
            </>
          )}
        </Space>
      </div>

      {/* 状态机画布 */}
      <Card 
        title="状态机画布" 
        style={{ minHeight: '500px', position: 'relative' }}
        extra={
          wizardFile && (
            <Space>
              <Text type="secondary">
                状态: {wizardFile.states.length} | 转换: {wizardFile.transitions.length}
              </Text>
            </Space>
          )
        }
      >
        {wizardFile ? (
          <div style={{ position: 'relative', height: '400px' }}>
            {wizardFile.states.map(renderStateNode)}
            
            {/* 这里可以添加连线渲染逻辑 */}
            <div className="absolute inset-0 pointer-events-none">
              {/* 连线将在这里渲染 */}
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <UploadOutlined className="text-4xl text-gray-300 mb-4" />
            <div>
              <Text type="secondary">请上传wizard文件开始编辑状态机</Text>
            </div>
            <div className="mt-4">
              <Upload
                customRequest={handleUpload}
                fileList={fileList}
                onChange={({ fileList }) => setFileList(fileList)}
                accept=".json"
              >
                <Button type="primary" icon={<UploadOutlined />}>
                  选择Wizard文件
                </Button>
              </Upload>
            </div>
          </div>
        )}
      </Card>

      {/* Wizard文件详情模态框 */}
      <Modal
        title={`Wizard文件详情 - ${wizardFile?.name}`}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        {wizardFile && (
          <div className="space-y-4">
            <Row>
              <Col span={8}>
                <Text strong>文件名称:</Text>
              </Col>
              <Col span={16}>
                <Text>{wizardFile.name}</Text>
              </Col>
            </Row>
            <Row>
              <Col span={8}>
                <Text strong>版本:</Text>
              </Col>
              <Col span={16}>
                <Text>{wizardFile.version}</Text>
              </Col>
            </Row>
            <Row>
              <Col span={8}>
                <Text strong>描述:</Text>
              </Col>
              <Col span={16}>
                <Text>{wizardFile.description}</Text>
              </Col>
            </Row>
            
            <Divider />
            
            <Row>
              <Col span={12}>
                <Card size="small" title="状态列表">
                  {wizardFile.states.map(state => (
                    <div key={state.id} className="mb-2 p-2 border rounded">
                      <Text strong>{state.name}</Text>
                      <Tag size="small" style={{ marginLeft: '8px' }}>
                        {state.type}
                      </Tag>
                    </div>
                  ))}
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="转换列表">
                  {wizardFile.transitions.map(transition => (
                    <div key={transition.id} className="mb-2 p-2 border rounded">
                      <Text>
                        {transition.fromState} → {transition.toState}
                      </Text>
                      {transition.condition && (
                        <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                          条件: {transition.condition}
                        </Text>
                      )}
                    </div>
                  ))}
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StateMachineEditor;