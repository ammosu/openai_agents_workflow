import React from 'react';
import { Modal, Button, message } from 'antd';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { okaidia } from 'react-syntax-highlighter/dist/esm/styles/prism'; // Choose a style theme
import { CopyOutlined } from '@ant-design/icons';

interface CodeModalProps {
  visible: boolean;
  code: string;
  onClose: () => void;
}

const CodeModal: React.FC<CodeModalProps> = ({ visible, code, onClose }) => {

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      message.success('Code copied to clipboard!');
    } catch (err) {
      message.error('Failed to copy code.');
      console.error('Clipboard copy failed:', err);
    }
  };

  return (
    <Modal
      title="Generated Python Code"
      open={visible} // Use 'open' prop for Ant Design v5+
      onCancel={onClose}
      footer={[
        <Button key="copy" icon={<CopyOutlined />} onClick={handleCopy}>
          Copy Code
        </Button>,
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
      ]}
      width="80%" // Make modal wider
      style={{ top: 20 }} // Adjust vertical position if needed
      styles={{ body: { maxHeight: '75vh', overflowY: 'auto' } }} // Use styles.body for AntD v5+
    >
      <SyntaxHighlighter language="python" style={okaidia} showLineNumbers>
        {code}
      </SyntaxHighlighter>
    </Modal>
  );
};

export default CodeModal;