/**
  相应示例：
f:{"messageId":"msg-Lk3DBfFEpZvMFmI0j9pQU1Do"}
0:"你好"
0:"！很高兴为你服务。请提供你想让我评审的 GitHub Pull Request 的"
0:"链接，或者告诉我你想讨论的关于代码评审的任何问题。\n\n我"
0:"将按照我设定的流程，仔细检查你的 Pull Request，并提供详细的反馈，包括：\n\n*   **Pull Request 概览**\n*"
0:"   **关键问题 (Critical Issues)**\n*   **需要改进的地方 (Important Changes Needed)**\n*   **建议 (Suggestions)**\n*   **值得"
0:"称赞的地方 (Positive Aspects)**\n*   **检查清单 (Checklist)**\n\n期待看到你的 Pull Request！"
e:{"finishReason":"stop","usage":{"promptTokens":666,"completionTokens":124},"isContinued":false}
d:{"finishReason":"stop","usage":{"promptTokens":666,"completionTokens":124}}
 */
export const processCodeReviewStreamData = (chunk) => {
  try {
    const lines = chunk.split('\n');
    let result = '';
    for (const line of lines) {
      if (line.startsWith('0:"')) {
        const content = line.slice(3, -1)
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\');
        result += content;
      }
    }
    return result;
  } catch (err) {
    console.error('Error processing stream data:', err);
    return '';
  }
};

export const sleep = (ms) => 
  new Promise(resolve => setTimeout(resolve, ms)); 