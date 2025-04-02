import React, { useCallback, useRef, useMemo, useState } from 'react'; // Removed useState for nodes/edges
import ReactFlow, {
  ReactFlowProvider,
  // Removed addEdge, useNodesState, useEdgesState
  Controls,
  Background,
  MiniMap,
  Node,
  // Removed Edge, Connection
  ReactFlowInstance,
  NodeTypes,
  ConnectionLineType,
  ConnectionMode,
} from 'reactflow';
import 'reactflow/dist/style.css';
import './CanvasArea.css';
// Import custom node components
import AgentNode from './nodes/AgentNode';
import RunnerNode from './nodes/RunnerNode';
import FunctionToolNode from './nodes/FunctionToolNode';
// Import the Zustand store
import useStore, { RFState } from '../store'; // Adjust path if needed



let id = 0;
const getId = () => `dndnode_${id++}`;

const CanvasArea: React.FC = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
  // 使用useMemo來記憶nodeTypes，避免在每次渲染時重新創建
  const nodeTypes = useMemo<NodeTypes>(() => ({
    agent: AgentNode,
    runner: RunnerNode,
    functionTool: FunctionToolNode,
  }), []);

  // Get state and actions from Zustand store individually
  const nodes = useStore((state) => state.nodes);
  const edges = useStore((state) => state.edges);
  const onNodesChange = useStore((state) => state.onNodesChange);
  const onEdgesChange = useStore((state) => state.onEdgesChange);
  const onConnect = useStore((state) => state.onConnect);
  const addNode = useStore((state) => state.addNode);
  // Keep local state for reactFlowInstance
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);


  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) {
        return;
      }

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      if (typeof type === 'undefined' || !type || !nodeTypes[type]) {
        return;
      }

      // 使用screenToFlowPosition代替project
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      let initialData = {};
      switch (type) {
        case 'agent':
          initialData = { label: 'New Agent', name: 'New Agent', instructions: 'You are a helpful assistant.' };
          break;
        case 'runner':
          initialData = { label: 'Runner', input: 'Initial input', mode: 'async' };
          break;
        case 'functionTool':
          initialData = { label: 'new_function', name: 'new_function', parameters: [{ id: Date.now(), name: 'param1', type: 'str' }], returnType: 'str', implementation: 'def new_function(param1: str) -> str:\n  return f"Processed: {param1}"' };
          break;
        default:
          initialData = { label: `${type} node` };
      }

      const newNode: Node = {
        id: getId(),
        type,
        position,
        data: initialData,
      };

      // Use addNode action from the store
      addNode(newNode);
    },
    [reactFlowInstance, addNode], // Use addNode from store
  );


  return (
    <div className="canvas-area" ref={reactFlowWrapper}>
      {/* ReactFlowProvider might not be strictly necessary when using external store,
          but keep it for now if using useReactFlow hook elsewhere */}
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect} // Use onConnect from store
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          fitView
          nodeTypes={nodeTypes} // Use the constant directly
          connectionMode={ConnectionMode.Loose} // 允許從節點的任何部分拖動連接線
          connectionLineType={ConnectionLineType.Bezier} // 使用貝塞爾曲線作為連接線
          snapToGrid={true} // 啟用網格對齊
          snapGrid={[15, 15]} // 設置網格大小
          defaultEdgeOptions={{
            type: 'default',
            animated: true, // 添加動畫效果
            style: { stroke: '#555', strokeWidth: 2 }, // 設置連接線樣式
            deletable: true // 允許刪除連接線
          }}
        >
          <Controls />
          <MiniMap />
          <Background gap={12} size={1} />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
};

export default CanvasArea;