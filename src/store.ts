import { create } from 'zustand';
import {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  addEdge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';

// 定義自定義連接類型
interface CustomConnection {
  source: string | null;
  target: string | null;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  type?: string;
  animated?: boolean;
  style?: React.CSSProperties;
  label?: string;
}

// Define the state structure
export type RFState = {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (node: Node) => void;
  updateNodeData: <T>(nodeId: string, data: Partial<T>) => void; // Generic function to update node data
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  deleteNode: (nodeId: string) => void; // Add deleteNode type
};

const useStore = create<RFState>((set, get) => ({
  nodes: [], // Initial nodes
  edges: [], // Initial edges
  onNodesChange: (changes: NodeChange[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },
  onEdgesChange: (changes: EdgeChange[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
  onConnect: (connection: Connection) => {
    // 驗證連接類型
    const sourceNode = get().nodes.find(node => node.id === connection.source);
    const targetNode = get().nodes.find(node => node.id === connection.target);
    
    // 確保節點存在
    if (!sourceNode || !targetNode) return;
    
    // 創建一個新的連接對象
    let newConnection: CustomConnection = {
      source: connection.source,
      target: connection.target,
    };
    
    // 根據節點類型自動判斷連接類型和設置適當的handle ID
    let isValidConnection = false;
    
    // 1. Agent -> Agent (handoff)
    if (sourceNode.type === 'agent' && targetNode.type === 'agent') {
      isValidConnection = true;
      newConnection = {
        ...newConnection,
        sourceHandle: 'b', // Agent的右側輸出
        targetHandle: 'a', // Agent的左側輸入
        type: 'default', // 使用默認線型
        animated: true, // 添加動畫
      };
    }
    
    // 2. Function -> Agent (tool)
    else if (sourceNode.type === 'functionTool' && targetNode.type === 'agent') {
      isValidConnection = true;
      newConnection = {
        ...newConnection,
        sourceHandle: 'a', // Function的右側輸出
        targetHandle: 'c', // Agent的底部輸入
        type: 'default', // 使用默認線型
        animated: true, // 添加動畫
      };
    }
    
    // 3. Agent -> Runner (execution)
    else if (sourceNode.type === 'agent' && targetNode.type === 'runner') {
      isValidConnection = true;
      newConnection = {
        ...newConnection,
        sourceHandle: 'b', // Agent的右側輸出
        targetHandle: 'a', // Runner的左側輸入
        type: 'default', // 使用默認線型
        animated: true, // 添加動畫
      };
    }
    
    // 只有有效的連接才會被添加，並使用新的連接設置
    if (isValidConnection) {
      set({
        edges: addEdge(newConnection as Connection, get().edges),
      });
    }
  },
  addNode: (node: Node) => {
    set({
        nodes: [...get().nodes, node]
    })
  },
  updateNodeData: <T>(nodeId: string, data: Partial<T>) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          // Merge new data with existing data
          return { ...node, data: { ...node.data, ...data } };
        }
        return node;
      }),
    });
  },
  setNodes: (nodes: Node[]) => {
    set({ nodes });
  },
  setEdges: (edges: Edge[]) => {
    set({ edges });
  },
  deleteNode: (nodeId: string) => {
    set({
      edges: get().edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId), // Remove edges connected to the node
      nodes: get().nodes.filter((node) => node.id !== nodeId), // Remove the node itself
    });
  },
}));

export default useStore;