import React, { memo, useCallback } from 'react'; // Added useCallback
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, Input, Select, Button } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import useStore from '../../store'; // Import the store
import './NodeStyles.css';

const { Option } = Select;

// Define parameter type (can be kept or defined inline if only used here)
interface Parameter {
  id: number; // Use number for temporary ID during editing
  name: string;
  type: string;
}

const FunctionToolNode: React.FC<NodeProps> = ({ id, data, isConnectable }) => { // Added id
  const updateNodeData = useStore((state) => state.updateNodeData);
  const deleteNode = useStore((state) => state.deleteNode); // Get deleteNode action
  const parameters: Parameter[] = data.parameters || []; // Get parameters from data
  
  // 使用本地狀態來處理輸入
  const [localName, setLocalName] = React.useState(data.name || '');
  const [localImplementation, setLocalImplementation] = React.useState(data.implementation || '');
  const [isComposing, setIsComposing] = React.useState(false);
  
  // 當外部數據更新時，同步本地狀態
  React.useEffect(() => {
    if (!isComposing) {
      setLocalName(data.name || '');
      setLocalImplementation(data.implementation || '');
    }
  }, [data.name, data.implementation, isComposing]);

  const onNameChange = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      const newName = evt.target.value;
      setLocalName(newName);
      
      // 只有在不是組合輸入狀態時才更新全局狀態
      if (!isComposing) {
        updateNodeData(id, { label: newName, name: newName });
      }
    },
    [id, updateNodeData, isComposing]
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
    if (target.id === `func-name-${id}`) {
      setLocalName(value);
      updateNodeData(id, { label: value, name: value });
    } else if (target.id === `implementation-${id}`) {
      setLocalImplementation(value);
      updateNodeData(id, { implementation: value });
    } else if (target.id?.startsWith('param-name-')) {
      // 參數名稱輸入框的處理會在handleParamCompositionEnd中進行
      const paramIdStr = target.id.replace(`param-name-${id}-`, '');
      const paramId = parseInt(paramIdStr);
      handleParamChange(paramId, 'name', value);
    }
  }, [id, updateNodeData]);

  const onReturnTypeChange = useCallback(
    (value: string) => {
      updateNodeData(id, { returnType: value });
    },
    [id, updateNodeData]
  );

  const onImplementationChange = useCallback(
    (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = evt.target.value;
      setLocalImplementation(newValue);
      
      // 只有在不是組合輸入狀態時才更新全局狀態
      if (!isComposing) {
        updateNodeData(id, { implementation: newValue });
      }
    },
    [id, updateNodeData, isComposing]
  );

  const addParameter = useCallback(() => {
    // Ensure parameters is an array before spreading
    const currentParams = Array.isArray(parameters) ? parameters : [];
    const newParameters = [...currentParams, { id: Date.now(), name: '', type: 'str' }];
    updateNodeData(id, { parameters: newParameters });
  }, [id, parameters, updateNodeData]);

  const removeParameter = useCallback((paramId: number) => {
    // Ensure parameters is an array
    const currentParams = Array.isArray(parameters) ? parameters : [];
    const newParameters = currentParams.filter(p => p.id !== paramId);
    updateNodeData(id, { parameters: newParameters });
  }, [id, parameters, updateNodeData]);

  // 參數變更處理
  const handleParamChange = useCallback((paramId: number, field: 'name' | 'type', value: string) => {
    // 確保參數是一個數組
    const currentParams = Array.isArray(parameters) ? parameters : [];
    const newParameters = currentParams.map(p => p.id === paramId ? { ...p, [field]: value } : p);
    updateNodeData(id, { parameters: newParameters });
  }, [id, parameters, updateNodeData]);
  
  // 處理參數名稱的輸入變化
  const onParamNameChange = useCallback((paramId: number, evt: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = evt.target.value;
    
    // 只有在不是組合輸入狀態時才更新全局狀態
    if (!isComposing) {
      handleParamChange(paramId, 'name', newValue);
    }
  }, [handleParamChange, isComposing]);
  
  // 處理參數名稱的組合結束
  const handleParamCompositionEnd = useCallback((paramId: number, evt: React.CompositionEvent<HTMLInputElement>) => {
    const target = evt.target as HTMLInputElement;
    handleParamChange(paramId, 'name', target.value);
  }, [handleParamChange]);


  return (
    <Card
      size="small"
      title="Function Tool"
      styles={{ header: { backgroundColor: '#f39c12', color: 'white' } }}
      style={{ borderTop: '3px solid #f39c12' }}
      className="custom-node function-node"
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
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        id="a"
      /> {/* Output handle */}
      
      <Handle
        type="source"
        position={Position.Top}
        isConnectable={isConnectable}
        id="d"
      />
      
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        id="e"
      />
      <div>
        <label htmlFor={`func-name-${id}`}>Name:</label>
        {/* Controlled component with IME support */}
        <Input
          id={`func-name-${id}`}
          value={localName}
          onChange={onNameChange}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          size="small"
        />
      </div>

      <div style={{ marginTop: 5 }}>
        <label>Parameters:</label>
        {(Array.isArray(parameters) ? parameters : []).map((param) => ( // Iterate over parameters from data, ensure it's an array
          <div key={param.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 3 }}>
            <Input
              id={`param-name-${id}-${param.id}`}
              placeholder="name"
              value={param.name} // Controlled
              onChange={(e) => onParamNameChange(param.id, e)}
              onCompositionStart={handleCompositionStart}
              onCompositionEnd={(e) => handleParamCompositionEnd(param.id, e)}
              size="small"
              style={{ marginRight: 3, flexGrow: 1 }}
            />
            <Select
              value={param.type} // Controlled
              onChange={(value) => handleParamChange(param.id, 'type', value)}
              size="small"
              style={{ width: 80, marginRight: 3 }}
            >
              <Option value="str">str</Option>
              <Option value="int">int</Option>
              <Option value="float">float</Option>
              <Option value="bool">bool</Option>
              <Option value="list">list</Option>
              <Option value="dict">dict</Option>
            </Select>
            <Button icon={<DeleteOutlined />} onClick={() => removeParameter(param.id)} size="small" danger />
          </div>
        ))}
        <Button type="dashed" onClick={addParameter} block icon={<PlusOutlined />} size="small">
          Add Parameter
        </Button>
      </div>

      <div style={{ marginTop: 5 }}>
        <label htmlFor={`return-type-${id}`}>Return Type:</label>
        {/* Controlled component */}
        <Select id={`return-type-${id}`} value={data.returnType || 'str'} onChange={onReturnTypeChange} size="small" style={{ width: '100%' }}>
          <Option value="str">str</Option>
          <Option value="int">int</Option>
          <Option value="float">float</Option>
          <Option value="bool">bool</Option>
          <Option value="list">list</Option>
          <Option value="dict">dict</Option>
          <Option value="None">None</Option>
        </Select>
      </div>

       <div style={{ marginTop: 5 }}>
        <label htmlFor={`implementation-${id}`}>Implementation:</label>
        {/* Controlled component */}
        <Input.TextArea
          id={`implementation-${id}`}
          value={localImplementation}
          onChange={onImplementationChange}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          rows={4}
          size="small"
          placeholder="Enter Python function body"
        />
      </div>
    </Card> // Closing tag remains the same
  );
};

export default memo(FunctionToolNode);