# AI 工作流程視覺化工具

這個工具可以視覺化 AI 代理之間的工作流程，讓使用者能夠以直觀的方式設計、配置和生成 AI 代理系統的 Python 代碼。

## 功能特點

- 直觀的拖放界面，輕鬆創建 AI 工作流程
- 支持多種節點類型：Agent、Runner、Function Tool
- 可視化代理之間的連接和數據流
- 自動生成可執行的 Python 代碼
- 實時編輯節點屬性
- 支持同步和異步執行模式

## 技術棧

本專案使用以下技術：

- **React**: 用於構建用戶界面
- **TypeScript**: 提供類型安全
- **Vite**: 快速的前端構建工具
- **React Flow**: 用於創建交互式節點圖
- **Zustand**: 狀態管理
- **Ant Design**: UI 組件庫

## 安裝與運行

### 前提條件

- Node.js (建議 v16 或更高版本)
- npm 或 yarn

### 安裝步驟

1. 克隆此專案
   ```bash
   git clone <repository-url>
   cd openai-agents-workflow
   ```

2. 安裝依賴
   ```bash
   npm install
   # 或
   yarn
   ```

3. 啟動開發服務器
   ```bash
   npm run dev
   # 或
   yarn dev
   ```

4. 在瀏覽器中打開 `http://localhost:5173`

## 使用指南

### 基本操作

1. **創建節點**：從左側面板拖動節點類型到畫布上
2. **連接節點**：點擊一個節點的輸出端點，然後拖動到另一個節點的輸入端點
3. **編輯節點屬性**：點擊節點後，在右側面板中編輯其屬性
4. **生成代碼**：點擊頂部導航欄中的「Generate Code」按鈕

### 節點類型

#### Agent 節點
代表 AI 代理，可以處理用戶輸入並執行任務。

屬性：
- **Name**: 代理名稱
- **Instructions**: 代理的指令/提示
- **Handoff Description**: 當作為轉交源時的描述

#### Function Tool 節點
代表可以被 Agent 調用的函數工具。

屬性：
- **Function Name**: 函數名稱
- **Return Type**: 返回值類型
- **Implementation**: Python 代碼實現

#### Runner 節點
負責執行 Agent 並處理結果。

屬性：
- **Input**: 初始輸入文本
- **Mode**: 執行模式（同步/異步）

### 連接規則

- **Agent → Agent**: 代理之間的轉交
- **Function Tool → Agent**: 為代理提供工具
- **Agent → Runner**: 執行代理

## 代碼生成

生成的 Python 代碼基於 OpenAI 的 Assistants API，包括：

- Agent 定義
- Function Tool 實現
- Runner 配置
- 同步/異步執行邏輯

生成的代碼可以直接在支持 OpenAI Assistants API 的環境中運行。

## 開發指南

### 專案結構

```
src/
├── components/       # React 組件
│   ├── nodes/        # 自定義節點組件
│   └── ...
├── utils/            # 工具函數
├── App.tsx           # 主應用組件
├── store.ts          # Zustand 狀態管理
└── ...
```

### 擴展節點類型

要添加新的節點類型：

1. 在 `src/components/nodes/` 中創建新的節點組件
2. 在 `src/components/CanvasArea.tsx` 中註冊節點類型
3. 在 `src/components/LeftPanel.tsx` 中添加新的拖動選項
4. 在 `src/components/RightPanel.tsx` 中添加屬性編輯器
5. 在 `src/utils/codeGenerator.ts` 中更新代碼生成邏輯

## 貢獻

歡迎提交 Pull Request 或創建 Issue 來改進此專案。

## 授權

[MIT 授權](LICENSE)