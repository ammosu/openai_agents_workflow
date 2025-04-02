import React, { useState, useCallback } from 'react';
import { Button } from 'antd';
import useStore from '../store'; // Import Zustand store
import { generatePythonCode } from '../utils/codeGenerator'; // Import generator function
import CodeModal from './CodeModal'; // Import the modal component
import './TopNav.css';

const TopNav: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  // Get nodes and edges from the store
  const nodes = useStore((state) => state.nodes);
  const edges = useStore((state) => state.edges);

  const handleGenerateCode = useCallback(() => {
    try {
        const code = generatePythonCode(nodes, edges);
        setGeneratedCode(code);
        setIsModalVisible(true);
    } catch (error) {
        console.error("Error generating code:", error);
        // Optionally show an error message to the user
        setGeneratedCode("# An error occurred during code generation.\n# Check console for details.");
        setIsModalVisible(true);
    }
  }, [nodes, edges]); // Dependencies are nodes and edges from the store

  const handleCloseModal = useCallback(() => {
    setIsModalVisible(false);
    setGeneratedCode(''); // Clear code when closing
  }, []);

  return (
    <>
      <div className="top-nav">
        <div className="app-title">OpenAI Agents Workflow Designer</div>
        <div>
          <Button type="primary" style={{ marginRight: 8 }} onClick={handleGenerateCode}>
            Generate Code
          </Button>
          {/* Optional: Save/Load buttons */}
        </div>
      </div>
      <CodeModal
        visible={isModalVisible}
        code={generatedCode}
        onClose={handleCloseModal}
      />
    </>
  );
};

export default TopNav;