import { Deck, GlobalStats, SessionStats } from "../types";

// 数据库名称和版本
const DB_NAME = "GeminiFlashcardDB";
const DB_VERSION = 1;

// 存储对象名称
const STORES = {
  DECKS: "decks",
  STATS: "stats",
  SESSIONS: "sessions",
  METADATA: "metadata"
};

// 数据库连接实例
let dbInstance: IDBDatabase | null = null;

// 初始化数据库
const initDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error("数据库连接失败"));
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 创建闪卡集存储
      if (!db.objectStoreNames.contains(STORES.DECKS)) {
        const deckStore = db.createObjectStore(STORES.DECKS, { keyPath: "id" });
        deckStore.createIndex("createdAt", "createdAt", { unique: false });
        deckStore.createIndex("difficulty", "difficulty", { unique: false });
      }

      // 创建统计存储
      if (!db.objectStoreNames.contains(STORES.STATS)) {
        db.createObjectStore(STORES.STATS, { keyPath: "id" });
      }

      // 创建会话存储
      if (!db.objectStoreNames.contains(STORES.SESSIONS)) {
        const sessionStore = db.createObjectStore(STORES.SESSIONS, { keyPath: "id", autoIncrement: true });
        sessionStore.createIndex("timestamp", "timestamp", { unique: false });
      }

      // 创建元数据存储
      if (!db.objectStoreNames.contains(STORES.METADATA)) {
        db.createObjectStore(STORES.METADATA, { keyPath: "key" });
      }
    };
  });
};

// 通用存储操作
const storeOperation = async <T>(
  storeName: string,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> => {
  const db = await initDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const request = operation(store);

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(new Error(`存储操作失败: ${request.error?.message}`));
    };

    transaction.oncomplete = () => {
      // 事务完成
    };

    transaction.onerror = () => {
      reject(new Error(`事务失败: ${transaction.error?.message}`));
    };
  });
};

// 自动记忆系统服务
export const memoryService = {
  // 保存闪卡集
  saveDeck: async (deck: Deck): Promise<void> => {
    await storeOperation(STORES.DECKS, "readwrite", (store) => 
      store.put(deck)
    );
  },

  // 保存多个闪卡集
  saveDecks: async (decks: Deck[]): Promise<void> => {
    const db = await initDatabase();
    const transaction = db.transaction(STORES.DECKS, "readwrite");
    const store = transaction.objectStore(STORES.DECKS);

    for (const deck of decks) {
      store.put(deck);
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error(`保存闪卡集失败: ${transaction.error?.message}`));
    });
  },

  // 获取所有闪卡集
  getDecks: async (): Promise<Deck[]> => {
    return storeOperation(STORES.DECKS, "readonly", (store) => 
      store.getAll()
    );
  },

  // 根据ID获取闪卡集
  getDeckById: async (id: string): Promise<Deck | undefined> => {
    try {
      return await storeOperation(STORES.DECKS, "readonly", (store) => 
        store.get(id)
      );
    } catch (error) {
      return undefined;
    }
  },

  // 删除闪卡集
  deleteDeck: async (id: string): Promise<void> => {
    await storeOperation(STORES.DECKS, "readwrite", (store) => 
      store.delete(id)
    );
  },

  // 保存全局统计
  saveGlobalStats: async (stats: GlobalStats): Promise<void> => {
    await storeOperation(STORES.STATS, "readwrite", (store) => 
      store.put({ id: "global", ...stats })
    );
  },

  // 获取全局统计
  getGlobalStats: async (): Promise<GlobalStats> => {
    try {
      const stats = await storeOperation(STORES.STATS, "readonly", (store) => 
        store.get("global")
      );
      
      if (stats) {
        // 移除id字段
        const { id, ...globalStats } = stats;
        return globalStats as GlobalStats;
      }
    } catch (error) {
      // 忽略错误，返回默认值
    }

    // 默认值
    return {
      totalReviewed: 0,
      totalKnown: 0,
      totalUnknown: 0,
      sessions: []
    };
  },

  // 保存学习会话
  saveSession: async (session: SessionStats): Promise<void> => {
    await storeOperation(STORES.SESSIONS, "readwrite", (store) => 
      store.put({ id: Date.now(), ...session })
    );
  },

  // 获取所有学习会话
  getSessions: async (): Promise<SessionStats[]> => {
    return storeOperation(STORES.SESSIONS, "readonly", (store) => 
      store.getAll()
    );
  },

  // 保存元数据
  saveMetadata: async (key: string, value: any): Promise<void> => {
    await storeOperation(STORES.METADATA, "readwrite", (store) => 
      store.put({ key, value, updatedAt: Date.now() })
    );
  },

  // 获取元数据
  getMetadata: async (key: string): Promise<any> => {
    try {
      const metadata = await storeOperation(STORES.METADATA, "readonly", (store) => 
        store.get(key)
      );
      return metadata?.value;
    } catch (error) {
      return undefined;
    }
  },

  // 清除所有数据
  clearAllData: async (): Promise<void> => {
    const db = await initDatabase();
    
    Object.values(STORES).forEach(storeName => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      store.clear();
    });
  },

  // 导出所有数据
  exportAllData: async (): Promise<{ decks: Deck[], stats: GlobalStats, sessions: SessionStats[] }> => {
    const [decks, stats, sessions] = await Promise.all([
      memoryService.getDecks(),
      memoryService.getGlobalStats(),
      memoryService.getSessions()
    ]);

    return { decks, stats, sessions };
  },

  // 导入数据
  importData: async (data: { decks: Deck[], stats: GlobalStats, sessions: SessionStats[] }): Promise<void> => {
    await Promise.all([
      memoryService.saveDecks(data.decks),
      memoryService.saveGlobalStats(data.stats)
    ]);

    // 保存会话
    for (const session of data.sessions) {
      await memoryService.saveSession(session);
    }
  }
};

// 自动保存工具函数
export const autoSave = {
  // 自动保存闪卡集
  decks: async (decks: Deck[]): Promise<void> => {
    try {
      await memoryService.saveDecks(decks);
      console.log("闪卡集自动保存成功");
    } catch (error) {
      console.error("闪卡集自动保存失败:", error);
    }
  },

  // 自动保存全局统计
  stats: async (stats: GlobalStats): Promise<void> => {
    try {
      await memoryService.saveGlobalStats(stats);
      console.log("统计数据自动保存成功");
    } catch (error) {
      console.error("统计数据自动保存失败:", error);
    }
  },

  // 自动保存学习会话
  session: async (session: SessionStats): Promise<void> => {
    try {
      await memoryService.saveSession(session);
      console.log("学习会话自动保存成功");
    } catch (error) {
      console.error("学习会话自动保存失败:", error);
    }
  }
};

// 数据加载工具函数
export const loadData = {
  // 加载所有数据
  all: async (): Promise<{ decks: Deck[], stats: GlobalStats }> => {
    try {
      const [decks, stats, sessions] = await Promise.all([
        memoryService.getDecks(),
        memoryService.getGlobalStats(),
        memoryService.getSessions()
      ]);
      
      // 确保 stats 包含 sessions
      const statsWithSessions = {
        ...stats,
        sessions: sessions.map(session => ({
          knownIds: session.knownIds,
          unknownIds: session.unknownIds,
          timestamp: session.timestamp
        }))
      };
      
      return { decks, stats: statsWithSessions };
    } catch (error) {
      console.error("数据加载失败:", error);
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

export default memoryService;