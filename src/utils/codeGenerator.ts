import { Node, Edge } from 'reactflow';

// Helper function to find connected nodes based on target/source and handle IDs
const findConnectedNodes = (
    nodeId: string,
    edges: Edge[],
    nodes: Node[],
    handleId?: string, // The handle ID on the *current* node (nodeId)
    connectionType: 'source' | 'target' = 'source' // Is the current node the source or target of the connection we're looking for?
): Node[] => {
    const connectedEdges = edges.filter(edge =>
        (connectionType === 'source' && edge.source === nodeId && (!handleId || edge.sourceHandle === handleId)) ||
        (connectionType === 'target' && edge.target === nodeId && (!handleId || edge.targetHandle === handleId))
    );
    // Get the IDs of the nodes on the *other* side of the connection
    const connectedNodeIds = connectedEdges.map(edge => connectionType === 'source' ? edge.target : edge.source);
    // Find the actual node objects
    return nodes.filter(node => connectedNodeIds.includes(node.id));
};


// Helper to generate Python list string from variable names
const formatVarList = (items: string[]): string => `[${items.join(', ')}]`;

// Helper to generate Python string literal correctly
const formatStringLiteral = (str: string): string => {
    if (str === null || str === undefined) return '""'; // Handle null/undefined
    // Use triple quotes for multiline strings or strings containing quotes that would break simple quoting
    if (str.includes('\n') || (str.includes('"') && str.includes("'"))) {
        // Escape existing triple quotes within the string
        const escapedStr = str.replace(/"""/g, '\\"\\"\\"');
        return `"""${escapedStr}"""`;
    }
    // If it contains double quotes, use single quotes
    if (str.includes('"')) {
        return `'${str}'`;
    }
    // Otherwise, use double quotes (escaping internal double quotes just in case, though previous check handles most)
    return `"${str.replace(/"/g, '\\"')}"`;
};


export const generatePythonCode = (nodes: Node[], edges: Edge[]): string => {
    let imports = new Set<string>(['from agents import Agent, Runner']);
    let pydanticModels = ''; // TODO: Implement Pydantic model generation if output_type is used
    let functionDefs = '';
    let agentDefs = '';
    let runnerCodeSync = ''; // For sync runner calls
    let runnerCodeAsync = ''; // For async runner calls
    let requiresAsync = false;

    const functionToolNodes = nodes.filter(node => node.type === 'functionTool');
    const agentNodes = nodes.filter(node => node.type === 'agent');
    const runnerNodes = nodes.filter(node => node.type === 'runner');

    // --- Generate Function Tool definitions ---
    if (functionToolNodes.length > 0) {
        imports.add('from agents import function_tool');
        // TODO: Add pydantic import if complex types/models are used
    }
    functionToolNodes.forEach(node => {
        const funcName = node.data.name || 'unnamed_function';
        // Ensure parameters is an array and filter out any without a name
        const params = (Array.isArray(node.data.parameters) ? node.data.parameters : [])
            .filter((p: { name?: string }) => p.name)
            .map((p: { name: string, type: string }) => `${p.name}: ${p.type || 'str'}`) // Default to str if type missing
            .join(', ');
        const returnType = node.data.returnType || 'str'; // Default to str
        const implementation = node.data.implementation || '  pass';
        // Basic indentation for the implementation
        const indentedImplementation = implementation.split('\n').map((line: string) => `  ${line}`).join('\n');

        functionDefs += `@function_tool\n`;
        functionDefs += `def ${funcName}(${params}) -> ${returnType}:\n`;
        functionDefs += `${indentedImplementation}\n\n`;
    });

    // --- Generate Agent definitions ---
    // Need to define agents potentially used in handoffs first
    const agentVarNames: { [nodeId: string]: string } = {};
    agentNodes.forEach(node => {
        // Generate a unique, valid Python variable name
        agentVarNames[node.id] = (node.data.name || `agent_${node.id}`).toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/^[^a-z_]+/, 'agent_');
    });

    agentNodes.forEach(node => {
        const agentVarName = agentVarNames[node.id];
        const agentName = node.data.name || 'Unnamed Agent';
        const instructions = node.data.instructions || '';

        // Find connected tools (FunctionTool source handle 'a' -> Agent target handle 'c') - CHECK HANDLES
        const connectedToolNodes = findConnectedNodes(node.id, edges, functionToolNodes, 'c', 'target');
        const toolNames = connectedToolNodes.map(toolNode => toolNode.data.name || 'unnamed_function');

        // 找到連接的handoffs (Agent source handle 'b' -> Agent target handle 'a')
        // 注意：這裡我們需要找到當前Agent作為source，連接到其他Agent作為target的關係
        const handoffAgentNodes = findConnectedNodes(node.id, edges, agentNodes, 'b', 'source')
                                   .filter(n => n.type === 'agent'); // 確保它是一個agent
        
        // 獲取handoff Agent的變量名
        const handoffAgentVarNames = handoffAgentNodes.map(hn => agentVarNames[hn.id]);
        
        // 如果有handoff，添加handoff_description
        const hasHandoff = handoffAgentNodes.length > 0;
        const handoffDescription = node.data.handoff_description || `Specialist agent for ${agentName}`;


        agentDefs += `${agentVarName} = Agent(\n`;
        agentDefs += `    name=${formatStringLiteral(agentName)},\n`;
        agentDefs += `    instructions=${formatStringLiteral(instructions)},\n`;
        
        // 如果有handoff，添加handoff_description
        if (hasHandoff) {
            agentDefs += `    handoff_description=${formatStringLiteral(handoffDescription)},\n`;
        }
        
        if (toolNames.length > 0) {
            // 確保工具名稱是有效的變量名
            agentDefs += `    tools=${formatVarList(toolNames)},\n`;
        }
        
        if (handoffAgentVarNames.length > 0) {
            agentDefs += `    handoffs=${formatVarList(handoffAgentVarNames)},\n`;
        }
        // TODO: Add output_type, guardrails
        agentDefs += `)\n\n`;
    });


    // --- Generate Runner code ---
    runnerNodes.forEach(node => {
        const input = node.data.input || '';
        const mode = node.data.mode || 'async'; // Default to async
        // Find the agent connected to the runner (Agent source handle 'b' -> Runner target handle 'a') - CHECK HANDLES
        const connectedAgent = findConnectedNodes(node.id, edges, agentNodes, 'a', 'target')[0]; // Assume only one agent connects to a runner

        if (connectedAgent) {
            const agentVarName = agentVarNames[connectedAgent.id];
            const runInput = formatStringLiteral(input); // Format input string correctly
            const resultVar = `result_${agentVarName}_${node.id.substring(0, 4)}`; // Unique result variable

            if (mode === 'async') {
                requiresAsync = true;
                runnerCodeAsync += `    print(f"--- Running {${agentVarName}.name} (Async) ---")\n`;
                runnerCodeAsync += `    ${resultVar} = await Runner.run(${agentVarName}, input=${runInput})\n`;
                runnerCodeAsync += `    print(f"Result: {${resultVar}.final_output}")\n\n`;
            } else {
                runnerCodeSync += `print(f"--- Running {${agentVarName}.name} (Sync) ---")\n`;
                runnerCodeSync += `${resultVar} = Runner.run_sync(${agentVarName}, input=${runInput})\n`;
                runnerCodeSync += `print(f"Result: {${resultVar}.final_output}")\n\n`;
            }
        } else {
             // Add a comment if runner is not connected
             const runnerComment = `# Warning: Runner node (ID: ${node.id}) is not connected to an Agent.\n`;
             if (mode === 'async') runnerCodeAsync += `    ${runnerComment}`;
             else runnerCodeSync += runnerComment;
        }
    });

    // --- Assemble the final code ---
    let finalCode = '';
    if (requiresAsync) {
        imports.add('import asyncio');
    }
    // Add other necessary imports based on features used (e.g., pydantic)

    finalCode += Array.from(imports).sort().join('\n') + '\n\n'; // Sort imports
    if (pydanticModels) finalCode += pydanticModels + '\n\n';
    if (functionDefs) finalCode += functionDefs;
    if (agentDefs) finalCode += agentDefs;

    if (requiresAsync) {
        finalCode += `async def main():\n`;
        finalCode += runnerCodeAsync; // Add async runner calls
         if (runnerCodeSync) { // Add sync calls inside main if mixed modes
             finalCode += `    # --- Synchronous Calls --- \n`;
             // Indent sync code correctly
             finalCode += runnerCodeSync.split('\n').map(line => line ? `    ${line}`: '').join('\n');
         }
        finalCode += `\n\nif __name__ == "__main__":\n`;
        finalCode += `    asyncio.run(main())\n`;
    } else if (runnerCodeSync) {
        // Only sync calls, no async def main needed
        finalCode += runnerCodeSync;
    } else if (!agentDefs && !functionDefs) {
        finalCode += `# No Agents or Function Tools defined in the workflow.\n`;
    } else if (!runnerNodes.length) {
         finalCode += `# No Runner nodes found. Add a Runner node and connect it to an Agent to execute the workflow.\n`;
    }


    return finalCode;
};