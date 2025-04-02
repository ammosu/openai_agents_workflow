import React from 'react';
import './LeftPanel.css'; // Will create this CSS file later

const LeftPanel: React.FC = () => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="left-panel">
      <div className="description">You can drag these nodes to the pane on the right.</div>
      <div className="dndnode agent" onDragStart={(event) => onDragStart(event, 'agent')} draggable>
        Agent Node
      </div>
      <div className="dndnode runner" onDragStart={(event) => onDragStart(event, 'runner')} draggable>
        Runner Node
      </div>
      <div className="dndnode function" onDragStart={(event) => onDragStart(event, 'functionTool')} draggable>
        Function Tool Node
      </div>
      {/* Add more node types if needed */}
    </aside>
  );
};

export default LeftPanel;