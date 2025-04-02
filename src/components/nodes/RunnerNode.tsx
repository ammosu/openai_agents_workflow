import React, { memo, useCallback } from 'react'; // Added useCallback
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, Input, Switch, Button } from 'antd'; // Added Button
import useStore from '../../store'; // Import the store
import './NodeStyles.css';
import { DeleteOutlined } from '@ant-design/icons'; // Added DeleteOutlined

const RunnerNode: React.FC<NodeProps> = ({ id, data, isConnectable }) => { // Added id
  const updateNodeData = useStore((state) => state.updateNodeData);
  const deleteNode = useStore((state) => state.deleteNode); // Get deleteNode action
  const [localInput, setLocalInput] = React.useState(data.input || '');
  const [isComposing, setIsComposing] = React.useState(false);

  // 當data.input從外部更新時，同步更新localInput
  React.useEffect(() => {
    if (!isComposing) {
      setLocalInput(data.input || '');
    }
  }, [data.input, isComposing]);

  // 處理輸入變化
  const onInputChange = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = evt.target.value;
      setLocalInput(newValue);
      
      // 只有在不是組合輸入狀態時才更新全局狀態
      if (!isComposing) {
        updateNodeData(id, { input: newValue });
      }
    },
    [id, updateNodeData, isComposing]
  );

  // 處理組合開始
  const handleCompositionStart = useCallback(() => {
    setIsComposing(true);
  }, []);

  // 處理組合結束
  const handleCompositionEnd = useCallback((evt: React.CompositionEvent<HTMLInputElement>) => {
    setIsComposing(false);
    // 使用類型斷言來解決TypeScript錯誤
    const target = evt.target as HTMLInputElement;
    const newValue = target.value;
    setLocalInput(newValue);
    updateNodeData(id, { input: newValue });
  }, [id, updateNodeData]);

  const onModeChange = useCallback(
    (checked: boolean) => {
      updateNodeData(id, { mode: checked ? 'async' : 'sync' });
    },
    [id, updateNodeData]
  );

  return (
    <Card
      size="small"
      title="Runner"
      styles={{ header: { backgroundColor: '#e74c3c', color: 'white' } }}
      style={{ borderTop: '3px solid #e74c3c' }}
      className="custom-node runner-node"
      extra={ // Add delete button
        <Button
          icon={<DeleteOutlined />}
          onClick={() => deleteNode(id)}
          size="small"
          danger
          type="text"
          style={{ color: 'white', border: 'none' }}
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
      
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        id="b"
      />
      <div>
        <label htmlFor={`input-${id}`}>Input:</label> {/* Use id */}
        {/* 使用本地狀態控制輸入，並處理組合事件 */}
        <Input
          id={`input-${id}`}
          value={localInput}
          onChange={onInputChange}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          size="small"
        />
      </div>
      <div style={{ marginTop: 5, display: 'flex', alignItems: 'center' }}>
        <label style={{ marginRight: 8 }}>Mode:</label>
        {/* Controlled component */}
        <Switch
          checkedChildren="Async"
          unCheckedChildren="Sync"
          checked={data.mode === 'async'} // Use checked instead of defaultChecked
          onChange={onModeChange}
          size="small"
        />
      </div>
      {/* Add context configuration later */}
    </Card> // Closing tag remains the same
  );
};

export default memo(RunnerNode);