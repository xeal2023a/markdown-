# Markdown 笔记应用 - 技术设计文档 (简化版)

## 1. 技术栈概览
- **前端框架**：React + TypeScript
- **构建工具**：Vite
- **状态管理**：React Context + useReducer
- **样式方案**：CSS Modules + CSS 变量（支持主题切换）
- **Markdown 解析**：`marked` + `marked-gfm`（支持 GFM）
- **代码高亮**：`highlight.js`
- **编辑器**：`@uiw/react-textarea-code-editor` 或 `CodeMirror 6`
- **本地存储**：LocalStorage（笔记元数据）、IndexedDB（图片资源）
- **PDF 导出**：利用浏览器打印功能 (`window.print()`)

## 2. 核心模块划分
- **笔记管理**：增删改查、搜索、本地存储同步。
- **编辑器**：标题输入 + Markdown 正文编辑，支持图片上传。
- **预览**：实时渲染 Markdown，支持代码高亮、多风格切换。
- **目录导航**：自动提取标题生成大纲，点击跳转。
- **主题切换**：通过 CSS 变量实现浅色/深色主题。
- **PDF 导出**：复制预览内容并调用打印。

## 3. 关键实现思路
### 3.1 数据存储
- 笔记列表使用 LocalStorage 保存（键名 `notes`）。
- 图片资源存入 IndexedDB，Markdown 中通过自定义 ID 引用；预览时解析并生成 Blob URL。

### 3.2 实时预览
- 编辑器内容变化后，防抖（500ms）更新预览和保存。
- 使用 `marked` 将 Markdown 转成 HTML，通过 `dangerouslySetInnerHTML` 渲染，同时提取标题生成目录。

### 3.3 目录生成
- 在 Markdown 解析过程中，通过 `marked` 的 `walkTokens` 或自定义扩展收集所有标题，生成带锚点的 HTML 和目录树。

### 3.4 图片上传
- 提供文件上传按钮，将图片转为 Base64（小图）或存入 IndexedDB（大图），生成 Markdown 图片语法插入编辑器。

### 3.5 PDF 导出
- 获取预览区域 HTML，嵌入打印样式，隐藏无关元素后调用 `window.print()`，用户可选择另存为 PDF。

### 3.6 主题切换
- 定义 CSS 变量（如 `--bg-color`），通过根元素类名切换变量值；编辑器主题若使用 CodeMirror 则动态加载对应主题。

## 4. 数据流简述
- 使用 `NotesProvider` 管理笔记列表和当前笔记，通过 Context 向下传递。
- 笔记操作触发 reducer，更新状态并同步到 LocalStorage。
- 搜索功能在前端对列表进行过滤。

## 5. 主要依赖
- `marked`, `marked-gfm`, `highlight.js`, `idb`（IndexedDB 封装），编辑器组件（可选）。