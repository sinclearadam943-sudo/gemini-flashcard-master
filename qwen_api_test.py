import os
from openai import OpenAI

# 初始化客户端
client = OpenAI(
    # 配置通义千问API密钥
    api_key="sk-301a05c964a74b4f95851a9afcd997bb",
    # 通义千问兼容模式API endpoint
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)

# 发送聊天请求
completion = client.chat.completions.create(
    # 模型选择：qwen-plus（效果、速度、成本均衡）
    # 其他可选模型：qwen-max（能力最强）、qwen-flash（速度快、成本低）
    model="qwen-plus",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "你是谁？"},
    ]
)

# 打印格式化的JSON响应
print(completion.model_dump_json(indent=2, ensure_ascii=False))