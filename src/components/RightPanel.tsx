import React from 'react';
import { Node } from 'reactflow';
import { Card, Input, Select, Switch, Form, Typography } from 'antd';
import './RightPanel.css';
import useStore from '../store';

const { Option } = Select;
const { Title } = Typography;

const RightPanel: React.FC = () => {
  // 直接從Zustand store獲取節點，而不是使用useReactFlow
  const nodes = useStore((state) => state.nodes);
  const updateNodeData = useStore((state) => state.updateNodeData);
  // 獲取當前選中的節點
  const selectedNodes = nodes.filter(node => node.selected);
  const selectedNode = selectedNodes.length === 1 ? selectedNodes[0] : null;
  
  
  // 處理屬性變更
  const handlePropertyChange = (nodeId: string, property: string, value: any) => {
    updateNodeData(nodeId, { [property]: value });
  };
  
  // 根據節點類型渲染不同的屬性編輯器
  const renderProperties = (node: Node) => {
    switch (node.type) {
      case 'agent':
        return renderAgentProperties(node);
      case 'functionTool':
        return renderFunctionToolProperties(node);
      case 'runner':
        return renderRunnerProperties(node);
      default:
        return <p>未知節點類型</p>;
    }
  };
  
  // 獲取edges，放在組件頂層，避免在條件渲染中使用Hook
  const edges = useStore((state) => state.edges);
  
  // 渲染Agent節點的屬性
  const renderAgentProperties = (node: Node) => {
    // 檢查該Agent是否有作為handoff源的連接
    const isHandoffSource = node.id && edges.some(
      edge => edge.source === node.id &&
             edge.target &&
             nodes.find(n => n.id === edge.target)?.type === 'agent'
    );
    
    return (
      <Form layout="vertical">
        <Form.Item label="Name">
          <Input
            value={node.data.name || ''}
            onChange={(e) => handlePropertyChange(node.id, 'name', e.target.value)}
          />
        </Form.Item>
        
        <Form.Item label="Instructions">
          <Input.TextArea
            rows={4}
            value={node.data.instructions || ''}
            onChange={(e) => handlePropertyChange(node.id, 'instructions', e.target.value)}
          />
        </Form.Item>
        
        {/* 只有當Agent作為handoff源時才顯示handoff_description */}
        {isHandoffSource && (
          <Form.Item label="Handoff Description">
            <Input
              value={node.data.handoff_description || ''}
              onChange={(e) => handlePropertyChange(node.id, 'handoff_description', e.target.value)}
              placeholder="Specialist agent for..."
            />
          </Form.Item>
        )}
      </Form>
    );
  };
  
  // 渲染Function Tool節點的屬性
  const renderFunctionToolProperties = (node: Node) => {
    return (
      <Form layout="vertical">
        <Form.Item label="Function Name">
          <Input
            value={node.data.name || ''}
            onChange={(e) => handlePropertyChange(node.id, 'name', e.target.value)}
          />
        </Form.Item>
        
        <Form.Item label="Return Type">
          <Select
            value={node.data.returnType || 'str'}
            onChange={(value) => handlePropertyChange(node.id, 'returnType', value)}
            style={{ width: '100%' }}
          >
            <Option value="str">str</Option>
            <Option value="int">int</Option>
            <Option value="float">float</Option>
            <Option value="bool">bool</Option>
            <Option value="list">list</Option>
            <Option value="dict">dict</Option>
            <Option value="None">None</Option>
          </Select>
        </Form.Item>
        
        <Form.Item label="Implementation">
          <Input.TextArea
            rows={6}
            value={node.data.implementation || ''}
            onChange={(e) => handlePropertyChange(node.id, 'implementation', e.target.value)}
          />
        </Form.Item>
      </Form>
    );
  };
  
  // 渲染Runner節點的屬性
  const renderRunnerProperties = (node: Node) => {
    return (
      <Form layout="vertical">
        <Form.Item label="Input">
          <Input
            value={node.data.input || ''}
            onChange={(e) => handlePropertyChange(node.id, 'input', e.target.value)}
          />
        </Form.Item>
        
        <Form.Item label="Mode">
          <Switch
            checkedChildren="Async"
            unCheckedChildren="Sync"
            checked={node.data.mode === 'async'}
            onChange={(checked) => handlePropertyChange(node.id, 'mode', checked ? 'async' : 'sync')}
          />
        </Form.Item>
      </Form>
    );
  };

  return (
    <aside className="right-panel">
      {selectedNode ? (
        <Card title={`${selectedNode.type?.charAt(0).toUpperCase()}${selectedNode.type?.slice(1)} Properties`}>
          {renderProperties(selectedNode)}
        </Card>
      ) : (
        <div className="no-selection">
          <Title level={5}>Node Properties</Title>
          <p>Select a node to view and edit its properties</p>
        </div>
      )}
    </aside>
  );
};

export default RightPanel;