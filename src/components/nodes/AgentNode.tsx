import React, { memo, useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow'; // Removed useReactFlow
import { Card, Input, Button } from 'antd'; // Added Button
import useStore from '../../store'; // Import the store
import './NodeStyles.css';
import { DeleteOutlined } from '@ant-design/icons'; // Added DeleteOutlined

const AgentNode: React.FC<NodeProps> = ({ id, data, isConnectable }) => {
  // Get the update function from the Zustand store
  const updateNodeData = useStore((state) => state.updateNodeData);
  const deleteNode = useStore((state) => state.deleteNode); // Get deleteNode action
  
  // 使用本地狀態來處理輸入
  const [localName, setLocalName] = React.useState(data.name || '');
  const [localInstructions, setLocalInstructions] = React.useState(data.instructions || '');
  const [localHandoffDesc, setLocalHandoffDesc] = React.useState(data.handoff_description || '');
  const [isComposing, setIsComposing] = React.useState(false);

  // 當外部數據更新時，同步本地狀態
  React.useEffect(() => {
    if (!isComposing) {
      setLocalName(data.name || '');
      setLocalInstructions(data.instructions || '');
      setLocalHandoffDesc(data.handoff_description || '');
    }
  }, [data.name, data.instructions, data.handoff_description, isComposing]);

  const onNameChange = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      const newName = evt.target.value;
      setLocalName(newName);
      
      // 只有在不是組合輸入狀態時才更新全局狀態
      if (!isComposing) {
        // Update the 'name' and 'label' fields in the node's data via the store
        updateNodeData(id, { label: newName, name: newName });
      }
    },
    [id, updateNodeData, isComposing] // Dependency is now the function from the store
  );

  // 處理組合開始
  const handleCompositionStart = useCallback(() => {
    setIsComposing(true);
  }, []);

  // 處理組合結束
  const handleCompositionEnd = useCallback((evt: React.CompositionEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setIsComposing(false);
    const target = evt.target as HTMLInputElement | HTMLTextAreaElement;
    const value = target.value;
    
    // 根據元素ID判斷是哪個輸入框
    if (target.id === `name-${id}`) {
      setLocalName(value);
      updateNodeData(id, { label: value, name: value });
    } else if (target.id === `instructions-${id}`) {
      setLocalInstructions(value);
      updateNodeData(id, { instructions: value });
    } else if (target.id === `handoff-desc-${id}`) {
      setLocalHandoffDesc(value);
      updateNodeData(id, { handoff_description: value });
    }
  }, [id, updateNodeData]);

  const onInstructionsChange = useCallback(
    (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newInstructions = evt.target.value;
      setLocalInstructions(newInstructions);
      
      // 只有在不是組合輸入狀態時才更新全局狀態
      if (!isComposing) {
        // Update the 'instructions' field in the node's data via the store
        updateNodeData(id, { instructions: newInstructions });
      }
    },
    [id, updateNodeData, isComposing]
  );

  return (
    <Card
      size="small"
      title="Agent"
      styles={{ header: { backgroundColor: '#3498db', color: 'white' } }}
      style={{ borderTop: '3px solid #3498db' }}
      className="custom-node agent-node"
      extra={ // Add delete button to the card header
        <Button
          icon={<DeleteOutlined />}
          onClick={() => deleteNode(id)}
          size="small"
          danger
          type="text" // Use text button for less emphasis
          style={{ color: 'white', border: 'none' }} // Adjust style for visibility on header
        />
      }
    >
      {/* 通用連接點 */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        id="a"
      />
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        id="d"
      />
      <div>
        <label htmlFor={`name-${id}`}>Name:</label>
        <Input
          id={`name-${id}`}
          value={localName}
          onChange={onNameChange}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          size="small"
        />
      </div>
      <div style={{ marginTop: 5 }}>
        <label htmlFor={`instructions-${id}`}>Instructions:</label>
        <Input.TextArea
          id={`instructions-${id}`}
          value={localInstructions}
          onChange={onInstructionsChange}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          rows={3}
          size="small"
        />
      </div>
      {/* 移除連接說明 */}
      
      {/* 右側連接點 */}
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        id="b"
      />
      
      {/* 底部連接點 */}
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        id="c"
      />
    </Card> // Closing tag remains the same
  );
};

export default memo(AgentNode);