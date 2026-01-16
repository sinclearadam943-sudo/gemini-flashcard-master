<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Gemini Flashcard Master

一个基于 React 和 TypeScript 的智能闪卡应用，利用 Gemini API 自动生成闪卡，帮助用户更高效地学习和复习知识。

## 功能特点

- 🤖 **智能闪卡生成**：上传 PDF、Word 文档或图片，Gemini 会自动提取知识点并生成闪卡
- 📚 **多模式学习**：支持不同难度级别的学习模式
- 📊 **学习统计**：实时追踪学习进度和效果
- ❌ **错题本**：自动收集错题，方便专项复习
- 💾 **数据管理**：支持数据导入导出，确保学习数据安全
- 🎨 **现代化界面**：美观、响应式的用户界面

## 技术栈

- React 19
- TypeScript
- Tailwind CSS
- Lucide React (图标库)
- Vite (构建工具)

## 快速开始

### 前提条件

- Node.js 16+
- Gemini API Key

### 安装步骤

1. 克隆项目：
   ```bash
   git clone https://github.com/yourusername/gemini-flashcard-master.git
   cd gemini-flashcard-master
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 配置 API 密钥：
   - 在项目根目录创建 `.env.local` 文件
   - 添加以下内容：
     ```
     VITE_GEMINI_API_KEY=your_api_key_here
     ```

4. 启动开发服务器：
   ```bash
   npm run dev
   ```

5. 在浏览器中打开：
   ```
   http://localhost:5173
   ```

## 使用指南

### 创建闪卡集

1. 点击顶部导航栏中的 "创建" 按钮
2. 上传相关学习资料（PDF、Word、图片）
3. 选择难度级别
4. 可以添加特定的学习要求或话题
5. 点击 "AI 智能解析并生成" 按钮
6. 等待 Gemini 生成闪卡集

### 学习模式

1. 在资源库中选择一个闪卡集
2. 进入学习模式，浏览闪卡内容
3. 根据自己的掌握情况标记答案
4. 学习完成后查看学习统计

### 查看统计

1. 点击顶部导航栏中的 "总结" 按钮
2. 查看整体学习统计、错题本和最近学习记录
3. 可以针对错题本进行专项复习

### 数据管理

1. 点击顶部导航栏中的 "数据" 下拉菜单
2. 选择 "导出数据" 备份学习数据
3. 选择 "导入数据" 恢复学习数据
4. 选择 "清除数据" 重置所有学习数据

## 项目结构

```
gemini-flashcard-master/
├── components/          # React 组件
│   ├── FlashcardComponent.tsx  # 闪卡组件
│   └── StudyView.tsx           # 学习视图组件
├── services/            # 服务
│   ├── memoryService.ts        # 本地存储服务
│   └── qwenService.ts          # Gemini API 服务
├── hexo-geminicards-knowledge/ # 知识库
├── App.tsx              # 主应用组件
├── types.ts             # TypeScript 类型定义
├── package.json         # 项目配置
└── vite.config.ts       # Vite 配置
```

## 贡献

欢迎提交 Issue 和 Pull Request 来帮助改进这个项目！

## 许可证

MIT License
