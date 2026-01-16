---
title: 首页
date: 2026-01-16 12:00:00
tags:
- 首页
- 介绍
categories:
- 基础信息
---



欢迎来到 GeminiCards 知识库！本知识库详细记录了 GeminiCards 项目的文件功能、数据流和基本概念，旨在帮助开发者更好地理解和使用这个智能闪卡应用。

## 项目简介

GeminiCards 是一个基于 React + TypeScript 开发的智能闪卡应用，利用通义千问 API 分析用户输入的话题或上传的文件，自动生成结构化的闪卡，包含问题、选项、答案和详细解析。

<!-- more -->

## 核心功能

- **智能闪卡生成**：通过通义千问 API 分析用户输入，自动生成结构化的闪卡
- **多难度级别**：支持基础、进阶和专家三个难度级别的闪卡生成
- **文件上传**：支持上传图像、PDF 和 Word 文档作为闪卡生成的数据源
- **学习模式**：提供交互式学习模式，支持闪卡翻转、答案验证和学习进度追踪
- **学习统计**：记录学习过程中的数据，生成详细的学习统计报告
- **错题本**：自动收集用户标记为未掌握的闪卡，提供专项复习功能
- **数据持久化**：使用 IndexedDB 进行本地数据存储，确保数据安全可靠
- **响应式设计**：适配不同屏幕尺寸，提供良好的移动端体验

## 技术栈

- **前端框架**：React 19.2.3 + TypeScript 5.8.2
- **构建工具**：Vite 6.2.0
- **样式方案**：Tailwind CSS
- **状态管理**：React useState/useEffect 钩子
- **数据持久化**：IndexedDB
- **AI 服务**：通义千问 API（qwen-plus 模型）
- **图标库**：Lucide React

## 知识库内容

### 基础信息

- [项目概述](project-overview.html) - 了解 GeminiCards 项目的整体架构和功能

### 文件分析

- [App.tsx 功能分析](app-tsx-analysis.html) - 详细分析应用主组件的功能和实现
- [StudyView.tsx 功能分析](study-view-analysis.html) - 深入了解学习模式组件的设计和数据流
- [FlashcardComponent.tsx 功能分析](flashcard-component-analysis.html) - 探索闪卡展示组件的实现细节
- [types.ts 功能分析](types-analysis.html) - 理解项目的类型定义和数据结构

### 服务分析

- [qwenService.ts 功能分析](qwen-service-analysis.html) - 学习如何与通义千问 API 交互
- [memoryService.ts 功能分析](memory-service-analysis.html) - 了解本地数据存储的实现

### 架构分析

- [前后端完整数据流分析](data-flow-analysis.html) - 掌握应用的完整数据流和交互逻辑

## 如何使用本知识库

1. **按照顺序阅读**：建议从项目概述开始，逐步深入了解各个组件和服务
2. **参考代码示例**：每个文档都包含详细的代码示例，帮助你理解实现细节
3. **关注数据流**：数据流是理解应用架构的关键，建议重点阅读数据流分析文档
4. **实践应用**：将所学知识应用到实际开发中，尝试扩展或修改 GeminiCards 项目

## 贡献指南

如果你发现本知识库中有任何错误或遗漏，或者有任何改进建议，欢迎贡献你的想法和代码。

## 联系方式

如有任何问题或建议，请通过以下方式联系我们：

- 邮箱：support@geminicards.com
- GitHub：https://github.com/geminicards

---

感谢你访问 GeminiCards 知识库！希望本知识库能够帮助你更好地理解和使用 GeminiCards 项目。