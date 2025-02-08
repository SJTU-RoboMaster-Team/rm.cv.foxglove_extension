import { PanelExtensionContext } from "@foxglove/extension";
import { ReactElement, useState } from "react";
import { createRoot } from "react-dom/client";

function ExamplePanel({  }: { context: PanelExtensionContext }): ReactElement {
  // 远程文件内容的状态
  const [fileContent, setFileContent] = useState<string>("");

  // 请根据实际情况修改远程设备上提供文件接口的 URL
  const remoteFileUrl = "http://10.42.0.174:8000/edit-param-raw";

  // 通过 HTTP GET 请求读取远程文件内容
  async function fetchRemoteFile() {
    try {
      const response = await fetch(remoteFileUrl);
      if (!response.ok) {
        throw new Error(`读取远程文件错误：${response.statusText}`);
      }
      const text = await response.text();
      setFileContent(text);
    } catch (error) {
      console.error("读取远程文件失败", error);
      alert("读取远程文件失败：" + error);
    }
  }

  // 通过 HTTP PUT 请求保存修改后的远程文件内容
  async function saveRemoteFile() {
    const newData = fileContent; // 获取用户编辑的内容

    // 创建 XMLHttpRequest 对象
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "http://10.42.0.174:8000/edit-param/post", true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

    // 设置请求完成后的处理程序
    xhr.onreadystatechange = function () {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        const feedback = document.getElementById("feedback-log") as HTMLTextAreaElement;
        if (xhr.status === 200) {
          // 成功处理请求
          if (feedback) {
            feedback.value += `[INFO] 成功发送了文件更新请求。\n`;
            feedback.scrollTop = feedback.scrollHeight;
          }
          alert("保存远程文件成功！");
        } else {
          // 失败处理
          if (feedback) {
            feedback.value += `[ERROR] 保存远程文件失败：${xhr.statusText}\n`;
            feedback.scrollTop = feedback.scrollHeight;
          }
          alert("保存远程文件失败：" + xhr.statusText);
        }
      }
    };

    // 发送更新数据
    xhr.send("new-data=" + encodeURIComponent(newData));
  }

  return (
    <div style={{ padding: "1rem" }}>
      <h3>远程 TOML 文件编辑器</h3>
      <div style={{ marginBottom: "1rem" }}>
        <button onClick={fetchRemoteFile}>读取远程文件</button>
      </div>
      <pre
        style={{ width: "100%", height: "200px", fontFamily: "monospace", overflow: "auto", whiteSpace: "pre-wrap", border: "1px solid #ccc", padding: "0.5rem" }}
      >
        <code contentEditable="true">{fileContent}</code>
      </pre>
      <div style={{ marginTop: "0.5rem" }}>
        <button onClick={saveRemoteFile}>保存修改到远程</button>
      </div>
    </div>
  );
}

export function initExamplePanel(context: PanelExtensionContext): () => void {
  const root = createRoot(context.panelElement);
  root.render(<ExamplePanel context={context} />);
  // 当面板移除时卸载 React 根节点
  return () => {
    root.unmount();
  };
}