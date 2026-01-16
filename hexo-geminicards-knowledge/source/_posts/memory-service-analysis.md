---
title: memoryService.ts 功能分析
date: 2026-01-16 14:38:00
tags:
- memoryService
- 数据存储
- IndexedDB
categories:
- 服务分析
---



## 核心功能

memoryService.ts 是 GeminiCards 应用的本地数据存储服务，负责以下核心功能：

1. **数据持久化**：使用 IndexedDB 实现闪卡集、学习统计和会话数据的持久化存储
2. **数据加载**：从本地存储加载保存的数据，初始化应用状态
3. **自动保存**：提供自动保存机制，确保数据实时同步到本地存储
4. **数据管理**：提供导入/导出/清除数据的功能，方便用户管理数据
5. **性能优化**：通过批量操作和索引优化，提高数据存储和检索的性能

<!-- more -->

## 技术实现

memoryService.ts 使用 IndexedDB 作为存储方案，相比 localStorage 具有以下优势：

- **更大的存储容量**：IndexedDB 通常提供数 GB 的存储容量，而 localStorage 只有约 5MB
- **更复杂的数据结构**：IndexedDB 支持存储复杂的 JavaScript 对象，无需手动序列化/反序列化
- **更好的性能**：IndexedDB 是异步的，不会阻塞主线程，适合处理大量数据
- **事务支持**：IndexedDB 支持事务，确保数据操作的原子性和一致性

## 核心数据结构

### 数据库结构

```
数据库名称: gemini-flashcard-db
版本: 1

存储对象:
1. decks - 存储闪卡集
   - 键: id (UUID)
   - 索引: 无

2. stats - 存储全局统计数据
   - 键: id (固定为 'global')
   - 索引: 无

3. sessions - 存储学习会话数据
   - 键: timestamp (时间戳)
   - 索引: 无
```

### 数据类型

- **Deck**：闪卡集，包含标题、描述、难度级别和卡片列表
- **GlobalStats**：全局学习统计，包含总复习次数、已掌握和未掌握的卡片数量、学习会话历史
- **SessionStats**：单次学习会话的统计，包含已掌握和未掌握的卡片 ID 列表、时间戳

## 核心方法

### 数据库初始化

```typescript
const initDB = async (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      
      // 创建 decks 存储
      if (!db.objectStoreNames.contains('decks')) {
        db.createObjectStore('decks', { keyPath: 'id' });
      }
      
      // 创建 stats 存储
      if (!db.objectStoreNames.contains('stats')) {
        db.createObjectStore('stats', { keyPath: 'id' });
      }
      
      // 创建 sessions 存储
      if (!db.objectStoreNames.contains('sessions')) {
        db.createObjectStore('sessions', { keyPath: 'timestamp' });
      }
    };
  });
};
```

### 闪卡集操作

```typescript
// 保存闪卡集
const saveDecks = async (decks: Deck[]): Promise<void> => {
  const db = await initDB();
  const transaction = db.transaction('decks', 'readwrite');
  const store = transaction.objectStore('decks');
  
  // 清空现有数据
  const clearRequest = store.clear();
  clearRequest.onerror = () => throwError(clearRequest.error);
  
  // 保存新数据
  for (const deck of decks) {
    const request = store.put(deck);
    request.onerror = () => throwError(request.error);
  }
  
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

// 获取闪卡集
const getDecks = async (): Promise<Deck[]> => {
  const db = await initDB();
  const transaction = db.transaction('decks', 'readonly');
  const store = transaction.objectStore('decks');
  const request = store.getAll();
  
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};
```

### 统计数据操作

```typescript
// 保存全局统计数据
const saveGlobalStats = async (stats: GlobalStats): Promise<void> => {
  const db = await initDB();
  const transaction = db.transaction('stats', 'readwrite');
  const store = transaction.objectStore('stats');
  const request = store.put({ ...stats, id: 'global' });
  
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// 获取全局统计数据
const getGlobalStats = async (): Promise<GlobalStats> => {
  const db = await initDB();
  const transaction = db.transaction('stats', 'readonly');
  const store = transaction.objectStore('stats');
  const request = store.get('global');
  
  return new Promise((resolve) => {
    request.onsuccess = () => {
      if (request.result) {
        // 移除 id 字段，返回纯净的统计数据
        const { id, ...stats } = request.result;
        resolve(stats);
      } else {
        // 如果没有统计数据，返回默认值
        resolve({
          totalReviewed: 0,
          totalKnown: 0,
          totalUnknown: 0,
          sessions: []
        });
      }
    };
    request.onerror = () => resolve({
      totalReviewed: 0,
      totalKnown: 0,
      totalUnknown: 0,
      sessions: []
    });
  });
};
```

### 会话数据操作

```typescript
// 保存学习会话数据
const saveSession = async (session: SessionStats): Promise<void> => {
  const db = await initDB();
  const transaction = db.transaction('sessions', 'readwrite');
  const store = transaction.objectStore('sessions');
  const request = store.put(session);
  
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// 获取所有学习会话数据
const getSessions = async (): Promise<SessionStats[]> => {
  const db = await initDB();
  const transaction = db.transaction('sessions', 'readonly');
  const store = transaction.objectStore('sessions');
  const request = store.getAll();
  
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};
```

### 数据导入/导出

```typescript
// 导出所有数据
const exportAllData = async (): Promise<{ decks: Deck[], stats: GlobalStats, sessions: SessionStats[] }> => {
  const [decks, stats, sessions] = await Promise.all([
    getDecks(),
    getGlobalStats(),
    getSessions()
  ]);
  
  return { decks, stats, sessions };
};

// 导入数据
const importData = async (data: { decks: Deck[], stats: GlobalStats, sessions: SessionStats[] }): Promise<void> => {
  await Promise.all([
    saveDecks(data.decks),
    saveGlobalStats(data.stats),
    ...data.sessions.map(session => saveSession(session))
  ]);
};

// 清除所有数据
const clearAllData = async (): Promise<void> => {
  const db = await initDB();
  
  // 清除所有存储
  const stores = ['decks', 'stats', 'sessions'];
  await Promise.all(stores.map(storeName => {
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }));
};
```

### 自动保存机制

```typescript
export const autoSave = {
  decks: async (decks: Deck[]) => {
    try {
      await saveDecks(decks);
    } catch (error) {
      console.error('自动保存闪卡集失败:', error);
    }
  },
  
  stats: async (stats: GlobalStats) => {
    try {
      await saveGlobalStats(stats);
    } catch (error) {
      console.error('自动保存统计数据失败:', error);
    }
  },
  
  session: async (session: SessionStats) => {
    try {
      await saveSession(session);
    } catch (error) {
      console.error('自动保存会话数据失败:', error);
    }
  }
};
```

### 数据加载机制

```typescript
export const loadData = {
  all: async (): Promise<{ decks: Deck[], stats: GlobalStats }> => {
    try {
      const [decks, stats] = await Promise.all([
        getDecks(),
        getGlobalStats()
      ]);
      return { decks, stats };
    } catch (error) {
      console.error('加载数据失败:', error);
      return {
        decks: [],
        stats: {
          totalReviewed: 0,
          totalKnown: 0,
          totalUnknown: 0,
          sessions: []
        }
      };
    }
  }
};
```

## 与其他文件的交互

### 与 App.tsx 的交互

- **初始化数据**：App 组件在初始化时调用 loadData.all() 加载数据
- **自动保存**：App 组件在数据变化时调用 autoSave 方法保存数据
- **数据管理**：App 组件通过 memoryService 提供的方法实现导入/导出/清除数据的功能

### 与 types.ts 的交互

- **使用类型**：memoryService 使用 types.ts 中定义的所有数据类型，如 Deck、GlobalStats、SessionStats 等
- **类型一致性**：确保存储和加载的数据类型与应用中使用的类型一致，避免类型错误

## 数据流分析

### 数据加载流程

1. **应用初始化**：index.tsx 挂载 App 组件
2. **数据请求**：App 组件调用 loadData.all() 加载数据
3. **数据库查询**：memoryService 从 IndexedDB 查询 decks 和 stats 数据
4. **数据返回**：memoryService 返回加载的数据
5. **状态初始化**：App 组件使用返回的数据设置初始状态（decks 和 globalStats）

### 数据保存流程

1. **数据变化**：用户操作导致 App 组件的状态变化（如生成新闪卡、完成学习会话）
2. **自动保存触发**：useEffect 钩子监听状态变化，调用 autoSave 方法
3. **数据写入**：memoryService 将变化的数据写入 IndexedDB
4. **存储确认**：IndexedDB 确认数据写入成功

### 数据管理流程

1. **用户操作**：用户点击导入/导出/清除数据按钮
2. **方法调用**：App 组件调用 memoryService 对应的方法
3. **数据处理**：memoryService 执行相应的数据操作
4. **结果反馈**：操作完成后，App 组件显示相应的反馈信息

## 性能优化

1. **批量操作**：使用 Promise.all 并行执行多个数据操作，减少等待时间
2. **错误处理**：添加完善的错误处理机制，确保数据操作失败不会影响应用正常运行
3. **异步操作**：所有 IndexedDB 操作都是异步的，不会阻塞主线程
4. **缓存机制**：在内存中缓存数据库连接，避免频繁打开/关闭数据库
5. **事务优化**：使用事务确保数据操作的原子性，减少数据库锁定时间

## 代码优化建议

1. **错误处理增强**：
   - 添加更详细的错误日志和错误类型
   - 实现错误重试机制，处理临时的数据库错误
   - 提供错误恢复策略，确保应用在数据库错误时仍能正常运行

2. **性能优化**：
   - 添加数据库连接池，减少连接开销
   - 实现数据缓存机制，避免重复查询相同数据
   - 添加索引，提高数据检索性能（如按创建时间索引闪卡集）

3. **功能扩展**：
   - 添加数据版本控制，支持数据迁移
   - 实现数据备份和恢复功能
   - 添加数据同步到云端的功能，支持多设备同步

4. **代码组织**：
   - 将数据库操作封装成更细粒度的函数，提高代码可读性
   - 使用 TypeScript 泛型，减少重复代码
   - 添加单元测试，确保数据操作的正确性

## 实际使用示例

### 基本使用

```typescript
// 加载数据
const { decks, stats } = await loadData.all();

// 自动保存
autoSave.decks(updatedDecks);
autoSave.stats(updatedStats);

// 导出数据
const data = await memoryService.exportAllData();
const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `gemini-flashcard-data-${new Date().toISOString().split('T')[0]}.json`;
a.click();

// 导入数据
const input = document.createElement('input');
input.type = 'file';
input.accept = '.json';
input.onchange = async (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        await memoryService.importData(data);
        // 重新加载数据
        const { decks: loadedDecks, stats: loadedStats } = await loadData.all();
        setDecks(loadedDecks);
        setGlobalStats(loadedStats);
      } catch (error) {
        alert('数据导入失败，请检查文件格式');
      }
    };
    reader.readAsText(file);
  }
};
input.click();
```

## 总结

memoryService.ts 是 GeminiCards 应用的核心服务之一，负责本地数据的持久化存储和管理。它使用 IndexedDB 作为存储方案，提供了自动保存、数据加载、导入/导出/清除数据等功能，确保用户数据的安全和可靠。

通过合理的数据库设计和优化的操作方法，memoryService 为应用提供了高效、稳定的数据存储解决方案，支持大量闪卡数据的存储和管理。同时，它与 App 组件的紧密集成，确保了数据的实时同步和一致性，为用户提供了流畅的使用体验。

memoryService 的实现展示了如何在前端应用中使用 IndexedDB 实现复杂的数据存储需求，是前端数据持久化的最佳实践之一。