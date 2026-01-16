---
title: React 基础学习指南
date: 2026-01-16 14:30:00
tags:
  - React
  - 前端开发
  - 基础学习
categories:
  - React 学习
---

> 快速入门 React 核心概念，掌握现代前端开发的基础知识

## 什么是 React？
React 是一个用于构建用户界面的 JavaScript 库，由 Facebook 开发并维护。它允许开发者使用组件化的方式构建复杂的用户界面，通过声明式的语法使代码更易于理解和维护。

## 核心概念
1. **组件**：React 应用的基本构建单元
2. **JSX**：JavaScript 的语法扩展，用于描述 UI
3. **Props**：组件间传递数据的方式
4. **State**：组件内部的可变数据
5. **Hooks**：让函数组件使用 React 特性的函数
6. **条件渲染**：根据条件显示不同的 UI
7. **列表渲染**：渲染数组数据为 UI 列表

<!-- more -->

## 创建和嵌套组件
React 应用由组件构成。组件是具有自己的逻辑和外观的 UI 部分，可以小到一个按钮，大到整个页面。

### 函数式组件
React 组件是返回标记的 JavaScript 函数：

```jsx
function MyButton() {
  return (
    <button>I'm a button</button>
  );
}
```

### 嵌套组件
定义了 `MyButton` 后，可以将其嵌套到另一个组件中：

```jsx
export default function MyApp() {
  return (
    <div>
      <h1>Welcome to my app</h1>
      <MyButton />
    </div>
  );
}
```

**注意**：React 组件名称必须始终以大写字母开头，而 HTML 标签必须是小写的。

## 使用 JSX 编写标记
上面看到的标记语法称为 JSX。它是可选的，但大多数 React 项目都使用 JSX 以方便开发。

### JSX 语法规则
- JSX 比 HTML 更严格。例如，必须关闭标签，如 `<br />`
- 组件不能返回多个 JSX 标签。必须将它们包装在一个共享的父级中，如 `<div>...</div>` 或空的 `<>`...</> 包装器

### JSX 示例
```jsx
function AboutPage() {
  return (
    <>
      <h1>About</h1>
      <p>Hello there.<br />How do you do?</p>
    </>
  );
}
```

## 添加样式
在 React 中，使用 `className` 指定 CSS 类，与 HTML 的 `class` 属性工作方式相同：

```jsx
<img className="avatar" />
```

然后在单独的 CSS 文件中为其编写 CSS 规则：

```css
/* In your CSS */
.avatar {
  border-radius: 50%;
}
```

React 不规定如何添加 CSS 文件。在最简单的情况下，可以向 HTML 添加 `<link>` 标签。

## 显示数据
JSX 允许在 JavaScript 中放入标记。花括号允许您“转义回”JavaScript，以便嵌入代码中的变量并将其显示给用户。

### 嵌入变量
例如，这将显示 `user.name`：

```jsx
return (
  <h1>{user.name}</h1>
);
```

### 嵌入表达式
还可以在 JSX 花括号内放入更复杂的表达式，例如字符串连接：

```jsx
const user = {
  name: 'Hedy Lamarr',
  imageUrl: 'https://i.imgur.com/yXOvdOSs.jpg',
  imageSize: 90,
};

export default function Profile() {
  return (
    <>
      <h1>{user.name}</h1>
      <img
        className="avatar"
        src={user.imageUrl}
        alt={'Photo of ' + user.name}
        style={{
          width: user.imageSize,
          height: user.imageSize
        }}
      />
    </>
  );
}
```

**注意**：`style={{}}` 不是特殊语法，而是 `style={ }` JSX 花括号内的常规 `{}` 对象。当样式依赖于 JavaScript 变量时，可以使用 `style` 属性。

## 条件渲染
在 React 中，没有用于编写条件的特殊语法。相反，您将使用与编写常规 JavaScript 代码时相同的技术。

### 使用 if 语句
可以使用 `if` 语句有条件地包含 JSX：

```jsx
let content;
if (isLoggedIn) {
  content = <AdminPanel />;
} else {
  content = <LoginForm />;
}

return (
  <div>{content}</div>
);
```

### 使用条件运算符
如果喜欢更紧凑的代码，可以使用条件 `?` 运算符。与 `if` 不同，它在 JSX 中工作：

```jsx
<div>
  {isLoggedIn ? (
    <AdminPanel />
  ) : (
    <LoginForm />
  )}
</div>
```

### 使用逻辑 && 语法
当不需要 `else` 分支时，还可以使用更短的逻辑 `&&` 语法：

```jsx
<div>
  {isLoggedIn && <AdminPanel />}
</div>
```

所有这些方法也适用于有条件地指定属性。

## 渲染列表
您将依靠 `for` 循环和数组 `map()` 函数等 JavaScript 功能来渲染组件列表。

### 使用 map() 渲染列表
例如，假设您有一个产品数组：

```jsx
const products = [
  { title: 'Cabbage', id: 1 },
  { title: 'Garlic', id: 2 },
  { title: 'Apple', id: 3 },
];
```

您可以使用 `map()` 方法将其渲染为列表：

```jsx
export default function ShoppingList() {
  const products = [
    { title: 'Cabbage', id: 1 },
    { title: 'Garlic', id: 2 },
    { title: 'Apple', id: 3 },
  ];

  return (
    <ul>
      {products.map(product => (
        <li key={product.id}>
          {product.title}
        </li>
      ))}
    </ul>
  );
}
```

**注意**：渲染列表时，每个项目都需要一个唯一的 `key` 属性，帮助 React 识别哪些项目已更改、添加或删除。

## 响应事件和更新屏幕
React 组件可以响应用户交互，如点击、输入等。

### 事件处理
可以通过在组件中定义事件处理函数来响应事件：

```jsx
function MyButton() {
  function handleClick() {
    alert('You clicked me!');
  }

  return (
    <button onClick={handleClick}>
      Click me
    </button>
  );
}
```

### 使用 State
要在组件中存储和更新数据，可以使用 `useState` Hook：

```jsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  function handleClick() {
    setCount(count + 1);
  }

  return (
    <button onClick={handleClick}>
      Clicked {count} times
    </button>
  );
}
```

`useState` 返回一对值：当前状态和更新状态的函数。初始状态作为参数传递给 `useState`。

## 组件间共享数据
当多个组件需要访问相同的数据时，可以将状态提升到它们的共同父组件，然后通过 props 传递给子组件。

### 状态提升示例
```jsx
import { useState } from 'react';

function Display({ message }) {
  return <h2>{message}</h2>;
}

function Button({ onClick, label }) {
  return <button onClick={onClick}>{label}</button>;
}

export default function App() {
  const [message, setMessage] = useState('Hello React!');

  function handleChangeMessage() {
    setMessage('Hello World!');
  }

  return (
    <div>
      <Display message={message} />
      <Button onClick={handleChangeMessage} label="Change Message" />
    </div>
  );
}
```

## 学习资源
- **官方文档**：[React 文档](https://react.dev/learn)
- **教程**：React 官方教程和互动学习平台
- **社区**：React 社区论坛和 Stack Overflow

## 总结
React 是一个强大而灵活的前端库，通过组件化、声明式语法和高效的渲染机制，使构建复杂的用户界面变得更加简单。掌握上述核心概念后，您将能够开始构建自己的 React 应用，并逐步深入学习更高级的特性。

React 的学习曲线相对平缓，特别是对于已经熟悉 JavaScript 的开发者来说。通过实践和不断学习，您将能够充分利用 React 的优势，构建出高性能、可维护的现代前端应用。