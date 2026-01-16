---
title: React + TypeScript 官方文档及核心使用指南
date: 2026-01-16 14:39:00
tags:
  - React
  - TypeScript
  - 官方文档
  - 核心配置
  - 使用指南
categories:
  - React 学习
---

> 梳理权威文档来源、核心配置和关键使用要点，帮助你高效上手 React + TypeScript 开发

## 一、权威官方文档来源
React + TypeScript 的相关文档主要分为两个核心官方来源，二者搭配使用才能覆盖完整的开发需求：

1. **TypeScript 官方 React 指南（核心类型配置与规范）**
   这是 TypeScript 团队专门为 React 开发者准备的官方指南，聚焦于 TypeScript 与 React 结合的类型定义、配置最佳实践，地址：
   `https://www.typescriptlang.org/docs/handbook/react.html`

2. **React 官方文档（React 核心用法 + TypeScript 补充说明）**
   React 官方文档中，大部分核心概念（组件、Hook、状态管理等）都提供了 TypeScript 版本的示例和补充说明，是结合 React 核心功能学习 TypeScript 集成的最佳资源，地址：
   `https://react.dev/`
   （在文档中搜索「TypeScript」可筛选相关内容，或直接查看「API Reference」中的类型说明）

## 二、前置条件：创建 React + TypeScript 项目（官方推荐方式）
React 官方推荐使用 `Create React App`（CRA）或 `Vite` 快速创建开箱即用的 React + TypeScript 项目，无需手动配置基础 TS 环境：

<!-- more -->

### 1. 使用 Create React App（传统稳定方案）
```bash
# npx 直接执行（无需全局安装 CRA）
npx create-react-app my-react-ts-app --template typescript

# 进入项目并启动
cd my-react-ts-app
npm start
```
创建完成后，项目会自动生成 `tsconfig.json`（TS 核心配置文件）、`App.tsx` 等 TSX 格式文件，直接支持 React + TypeScript 开发。

### 2. 使用 Vite（现代快速构建方案，官方更推荐）
```bash
# npm
npm create vite@latest my-react-ts-app -- --template react-ts

# yarn
yarn create vite my-react-ts-app --template react-ts

# 进入项目、安装依赖、启动
cd my-react-ts-app
npm install
npm run dev
```
Vite 构建的项目启动更快、热更新更高效，同样自动配置好 TS 环境，生成对应的 `tsconfig.json` 和 TSX 源码文件。

## 三、核心文件：`tsconfig.json` 说明
`tsconfig.json` 是 TypeScript 项目的核心配置文件，React + TypeScript 项目中部分关键配置项说明（默认生成的配置已满足基础需求，可根据项目扩展）：

```json
{
  "compilerOptions": {
    "target": "ESNext", // 目标 JS 版本，推荐 ESNext 以支持最新语法
    "lib": ["DOM", "DOM.Iterable", "ESNext"], // 引入的内置库类型，React 依赖 DOM 库
    "jsx": "react-jsx", // 关键配置：指定 JSX 编译方式（React 17+ 推荐 react-jsx）
    "module": "ESNext", // 模块系统类型
    "moduleResolution": "Node", // 模块解析策略，对应 Node 模块规范
    "strict": true, // 开启严格类型检查（核心！推荐始终开启，充分发挥 TS 价值）
    "esModuleInterop": true, // 兼容 CommonJS 模块导入
    "skipLibCheck": true, // 跳过第三方库的类型检查，提升编译速度
    "forceConsistentCasingInFileNames": true // 强制文件名大小写一致，避免跨平台问题
  },
  "include": ["src"] // 指定需要 TS 编译的文件目录
}
```
其中 `jsx` 配置是 React 项目的关键，不同取值对应不同的 JSX 编译逻辑，React 17 及以上版本优先使用 `react-jsx`（无需手动引入 React 核心库）。

## 四、React + TypeScript 核心使用示例

### 1. 函数组件（两种定义方式，推荐箭头函数）
```tsx
// 方式1：箭头函数（推荐，语法简洁）
import { FC } from 'react';

// 定义组件 Props 类型
interface GreetingProps {
  name: string; // 必传属性
  age?: number; // 可选属性（? 标记）
  onGreet?: () => void; // 可选回调函数属性
}

// FC（FunctionComponent）内置了 children 类型支持
const Greeting: FC<GreetingProps> = ({ name, age = 18, onGreet, children }) => {
  return (
    <div>
      <h1>Hello, {name}!</h1>
      <p>Your age is {age}</p>
      {onGreet && <button onClick={onGreet}>Greet</button>}
      <div>{children}</div>
    </div>
  );
};

// 方式2：普通函数（无需导入 FC，更灵活）
const AnotherGreeting = (props: GreetingProps) => {
  const { name, age } = props;
  return <h1>Hi, {name} ({age})</h1>;
};

// 组件使用
const App = () => {
  return (
    <Greeting name="Alice" onGreet={() => console.log('Greeted!')}>
      <p>This is children content</p>
    </Greeting>
  );
};

export default App;
```

### 2. React Hooks 结合 TypeScript（常用 Hook 示例）

#### （1）`useState`（自动类型推导 / 手动指定类型）
```tsx
import { useState } from 'react';

const Counter = () => {
  // 方式1：自动类型推导（推荐，TS 从初始值推断类型）
  const [count, setCount] = useState(0); // count: number，setCount: (value: number | ((prevState: number) => number)) => void
  const [name, setName] = useState(''); // name: string

  // 方式2：手动指定类型（适用于初始值为 null/undefined，或联合类型）
  const [user, setUser] = useState<{ id: number; name: string } | null>(null);

  const increment = () => {
    setCount(prev => prev + 1);
  };

  const setUserInfo = () => {
    setUser({ id: 1, name: 'Bob' });
  };

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>Increment</button>
      <button onClick={setUserInfo}>Set User</button>
      {user && <p>User: {user.name}</p>}
    </div>
  );
};
```

#### （2）`useEffect`（无特殊类型配置，遵循依赖项规范即可）
```tsx
import { useState, useEffect } from 'react';

const DataFetcher = () => {
  const [data, setData] = useState<{ title: string }[]>([]);

  useEffect(() => {
    // 模拟接口请求
    const fetchData = async () => {
      const response = await fetch('https://jsonplaceholder.typicode.com/posts');
      const result = await response.json();
      setData(result.slice(0, 5));
    };

    fetchData();

    // 清理副作用
    return () => {
      console.log('Component unmounted');
    };
  }, []); // 空依赖：仅组件挂载时执行一次

  return (
    <div>
      <h2>Data List</h2>
      {data.map(item => (
        <p key={item.id}>{item.title}</p>
      ))}
    </div>
  );
};
```

## 五、关键补充说明

1. **文件后缀**：React + TypeScript 项目中，组件文件使用 `.tsx` 后缀（支持 JSX 语法），普通工具函数文件使用 `.ts` 后缀（不包含 JSX）。
2. **`strict` 模式**：`tsconfig.json` 中的 `strict: true` 开启了严格类型检查（包含 `noImplicitAny`、`strictNullChecks` 等），虽然初期有一定学习成本，但能有效避免大部分类型相关 Bug，推荐始终开启。
3. **第三方库类型**：使用第三方 React 库时，需安装对应的类型定义包（通常为 `@types/xxx`），例如 `npm install @types/react-router-dom --save-dev`。

## 总结

1. **权威文档**：TypeScript 官方 React 指南 + React 官方文档（TS 补充）是核心学习资源；
2. **快速起步**：使用 CRA 或 Vite 的 `react-ts` 模板创建项目，无需手动配置基础环境；
3. **核心配置**：`tsconfig.json` 中的 `jsx: react-jsx` 和 `strict: true` 是 React + TS 项目的关键配置；
4. **开发重点**：组件 Props 用 `interface` 定义，Hooks 优先利用 TS 自动类型推导，复杂场景手动指定类型。