import { Immutable, MessageEvent, PanelExtensionContext } from "@foxglove/extension";
import React from "react";
import { ReactElement, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

interface StringMessage {
  data: string;
}

function JsonMessageViewer({ context }: { context: PanelExtensionContext }): ReactElement {
  const [messages, setMessages] = useState<Immutable<MessageEvent[]> | undefined>();
  const [previousMessages, setPreviousMessages] = useState<Immutable<MessageEvent[]> | undefined>();

  useEffect(() => {
    context.subscribe([{ topic: "/autoaim_debug_info" }]);
    context.watch("currentFrame");

    context.onRender = (renderState, done) => {
      setPreviousMessages(messages);
      setMessages(renderState.currentFrame);
      done();
    };

    return () => {
      console.log("Cleaning up panel...");
    };
  }, [context, messages]);

  // 获取最新解析后的消息（优先使用当前帧）
  const latestParsedMessage = (() => {
    // 检查当前帧消息是否存在
    if (messages && messages.length > 0) {
      const current = messages
        .filter((msg) => msg.topic === "/autoaim_debug_info")
        .map((msg) => JSON.parse((msg.message as StringMessage).data));
      if (current.length > 0) {
        return current[current.length - 1]; // 返回最新的一条消息
      }
    }

    // 如果当前帧没有消息，检查上一帧消息
    if (previousMessages && previousMessages.length > 0) {
      const previous = previousMessages
        .filter((msg) => msg.topic === "/autoaim_debug_info")
        .map((msg) => JSON.parse((msg.message as StringMessage).data));
      if (previous.length > 0) {
        return previous[previous.length - 1]; // 返回上一帧的最新消息
      }
    }

    // 如果都没有消息，返回 undefined
    return undefined;
  })();

  // 分组数据逻辑
  const groupedData = latestParsedMessage 
    ? Object.entries(latestParsedMessage).reduce((acc, [fullKey, value]) => {
        const [category, ...rest] = fullKey.split('/');
        const subKey = rest.join('/');
        
        if (!category || !subKey) return acc;
        
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push({ key: subKey, value: String(value) });
        return acc;
      }, {} as Record<string, Array<{ key: string; value: string }>>)
    : null;

  return (
    // 设置高度为100%，并允许垂直滚动
    <div style={{ padding: "1rem", fontFamily: 'monospace', height: '100%', overflowY: 'auto' }}>
      {/* 原始数据展示 */}
      {/* <h3 style={{ color: '#4CAF50' }}>原始数据 (Raw JSON)</h3>
      <pre style={{ 
        backgroundColor: '#f5f5f5',
        padding: '1rem',
        borderRadius: '4px',
        marginBottom: '2rem'
      }}>
        {JSON.stringify(latestParsedMessage, null, 2)}
      </pre> */}
      {/* 格式化数据展示 */}
      <h3 style={{ color: '#2196F3', marginTop: '2rem' }}>Data Visualization</h3>
      {groupedData ? (
        Object.entries(groupedData).map(([category, items]) => (
          <div key={category} style={{ 
            marginBottom: '1.5rem',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#f8f9fa',
              borderBottom: '1px solid #e0e0e0'
            }}>
              <strong>{category}</strong>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(200px, 1fr) 2fr',
              gap: '1px',
              backgroundColor: '#e0e0e0'
            }}>
              {items.map((item, idx) => (
                <React.Fragment key={idx}>
                  <div style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: 'white',
                    fontWeight: 500
                  }}>{item.key}</div>
                  <div style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: 'white',
                    wordBreak: 'break-word'
                  }}>{item.value || <span style={{ color: '#999' }}>N/A</span>}</div>
                </React.Fragment>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div style={{ 
          padding: '1rem',
          backgroundColor: '#fff3cd',
          borderRadius: '4px',
          color: '#856404'
        }}>
          ⚠️ 等待autoaim_debug_info消息...
        </div>
      )}
    </div>
  );
}

export function initExamplePanel(context: PanelExtensionContext): () => void {
  const root = createRoot(context.panelElement);
  root.render(<JsonMessageViewer context={context} />);
  return () => root.unmount();
}
