import { Flashcard, Difficulty } from "../types";

export interface FileInput {
  name: string; // File name to map sources
  data: string;
  mimeType: string;
}

// 通义千问 API 配置
const QWEN_API_KEY = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_QWEN_API_KEY) || "sk-301a05c964a74b4f95851a9afcd997bb";
const QWEN_API_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";

export const generateFlashcards = async (
  topicOrText: string, 
  difficulty: Difficulty = Difficulty.MEDIUM,
  files: FileInput[] = []
): Promise<{ cards: Partial<Flashcard>[], title: string, description: string }> => {
  
  const difficultyPrompt = {
    [Difficulty.SIMPLE]: "侧重于基础事实、核心定义。语言通俗易懂。",
    [Difficulty.MEDIUM]: "包含概念理解、因果关系。需要逻辑分析。",
    [Difficulty.EXPERT]: "专注于极深度的学术知识：复杂的理论、细微的机制或深层争议。极具挑战性。"
  };

  // 构建请求体（OpenAI 兼容模式格式）
  const requestBody = {
    model: "qwen-plus",
    messages: [
      {
        role: "system",
        content: "你是一个专业的学术闪卡助手。请根据以下输入生成一组 (10-15张) 闪卡。"
      },
      {
        role: "user",
        content: `【重要指令】：
1. 生成内容（标题、描述、问题、选项、答案、解析）必须使用 **简体中文**。
2. 难度：${difficulty} (${difficultyPrompt[difficulty]})。

【生成规则】：
- 如果输入包含题目（如选择题、问答题），请保留原题。
- 对于选择题：在 'question' 中放入题干，在 'options' 中提供选项列表（如 ["A. 选项内容", "B. 选项内容"]）。
- 重要：对于选择题，'answer' 必须完全匹配 'options' 数组中的其中一个字符串（包括 A. 前缀），或者仅为对应的大写字母。
- 对于知识点：'question' 为概念，'answer' 为详细解释。
- 'explanation' 给出详细解析或背景补充。
- 尽可能识别并记录每张卡片的 'sourceName'（对应的文件名或话题名称）。

【内容来源】：
- 话题/描述： "${topicOrText}"
- 文件列表：${files.map(f => f.name).join(', ')}

【输出格式】：
请以 JSON 格式输出，包含以下字段：
{
  "title": "闪卡集标题",
  "description": "闪卡集描述",
  "cards": [
    {
      "question": "问题/概念",
      "options": ["A. 选项1", "B. 选项2"], // 选择题才有
      "answer": "正确答案",
      "explanation": "详细解析",
      "sourceName": "来源文件名或话题"
    }
  ]
}`
      }
    ],
    response_format: {
      type: "json_object"
    }
  };

  try {
    // 发送请求
    const response = await fetch(QWEN_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${QWEN_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API 调用失败: ${errorData.error?.message || response.statusText}`);
    }

    // 解析响应
    const data = await response.json();
    
    // 提取生成的内容
    const generatedContent = data.choices[0].message.content;
    
    // 解析 JSON 响应
    try {
      const result = JSON.parse(generatedContent);
      return result;
    } catch (jsonError) {
      throw new Error("解析 AI 响应失败，返回格式不正确");
    }
  } catch (error) {
    console.error("生成闪卡失败", error);
    throw error instanceof Error ? error : new Error("生成闪卡时发生未知错误");
  }
};