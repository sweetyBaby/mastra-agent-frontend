import React, { useState, useEffect, useRef, use } from 'react';
import './App.css';
import MarkdownRenderer from './components/markdown'
import { processCodeReviewStreamData, sleep } from './utils';

function App() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  const CHAT_API_ENDPOINT = 'https://deepseek-worker-test.tongyao5186.workers.dev/graphql';
      const CODE_REVIEW_API_ENDPOINT = 'https://mastra-agents.tongyao5186.workers.dev/api/agents/codeReviewAgent/stream';
// ' https://deepseek-worker-test.tongyao5186.workers.dev/graphql'
  const sendChatMessage = (allMessages)=>{
    
   return fetch(CHAT_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            mutation CreateChatCompletion($input: ChatCompletionInput!) {
              createChatCompletion(input: $input) {
                choices {
                  message {
                    role
                    content
                  }
                }
              }
            }
          `,
          variables: {
            input: {
              model: "deepseek-chat",
              messages: allMessages,
              temperature: 0.7,
              max_tokens: 800
            }
          }
        }),
      });
  }
  const sendCodeReviewMessage = (message)=> {
  return fetch(CODE_REVIEW_API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
   body: JSON.stringify({
      messages: [
        {
          content: message,
          role: "user"
        }
      ]
    })
    
  });
};
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // 发送消息到 DeepSeek API
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // 添加用户消息到聊天记录
    const userMessage = { 
      id: Date.now().toString(),
      content: inputValue.trim(),
      role: 'user',
      timestamp: Date.now(),
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // 准备所有历史消息发送给 API
      const allMessages = [...messages, userMessage];
      
      const response = await sendCodeReviewMessage(userMessage.content);
      console.log(response);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiMessage = {
        id: (Date.now() + 1).toString(),
        content: '',
        role: 'assistant',
        timestamp: Date.now(),
      };
      
      // 从响应中提取 AI 消息
      setMessages(prevMessages => [...prevMessages, aiMessage]);
       while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);

        try {
          const processedText = processCodeReviewStreamData(chunk);
            
          if (processedText) {
            for (const char of processedText) {
              aiMessage.content += char;
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === aiMessage.id 
                    ? { ...msg, content: aiMessage.content }
                    : msg
                )
              );
              await sleep(30);
            }
          }
        } catch (err) {
          const error = err;
          console.error('Failed to parse chunk:', error);
        }
      }
    } catch (error) {
      console.error('发送消息时出错:', error);
      // 添加错误消息到聊天
      setMessages(prevMessages => [
        ...prevMessages, 
        { role: 'assistant', content: `发送消息时出错: ${error.message}` }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // 添加示例问题
  const addExampleQuestion = (question) => {
    setInputValue(question);
  };

   // 渲染消息内容，根据消息角色和内容决定是否使用 Markdown 渲染
   const renderMessageContent = (message) => {
    // 如果是用户消息，直接显示文本
    if (message.role === 'user') {
      return (
        <div className="message-content">
          {message.content.split('\n').map((line, i) => (
            <React.Fragment key={i}>
              {line}
              {i < message.content.split('\n').length - 1 && <br />}
            </React.Fragment>
          ))}
        </div>
      );
    }
    
    // 如果是 AI 消息，使用 Markdown 渲染
    return (
      <div className="message-content">
        <MarkdownRenderer markdown={message.content} />
      </div>
    );
  };

  return (
    <div className="chat-app">
      <header className="chat-header">
        <h1></h1>
      </header>
      
      <div className="chat-container">
        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="welcome-container">
              <h2>欢迎使用AI代码审核</h2>
            </div>
          ) : (
            messages.map((message, index) => (
              <div 
                key={index} 
                className={`message ${message.role === 'user' ? 'user-message' : 'ai-message'}`}
              >
                <div className="message-avatar">
                  {message.role === 'user' ? '👤' : '🤖'}
                </div>
                <div className="message-bubble">
                  {renderMessageContent(message)}
                </div>
               
              </div>
            ))
          )}
          {isLoading && (
            <div className="message ai-message">
              <div className="message-avatar">🤖</div>
              <div className="message-bubble">
                <div className="message-content typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <form className="input-container" onSubmit={sendMessage}>
          <textarea
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="请输入代码片段..."
            disabled={isLoading}
            className="message-textarea"
          />
          <button 
            type="submit" 
            disabled={isLoading || !inputValue.trim()} 
            className="send-button"
          >
            发送
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;