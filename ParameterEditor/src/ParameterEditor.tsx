import { PanelExtensionContext } from "@foxglove/extension";
import { ReactElement, useState } from "react";
import { createRoot } from "react-dom/client";

function ExamplePanel({  }: { context: PanelExtensionContext }): ReactElement {
  // 远程文件内容的状态
  const [fileContent, setFileContent] = useState<string>("");

  // 请根据实际情况修改远程设备上提供文件接口的 URL
  const remoteFileUrl = "http://10.42.0.174:8000/edit-param";

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
    try {
      const response = await fetch(remoteFileUrl, {
        method: "PUT", // 如果后端使用 POST，请修改这里为 "POST"
        headers: {
          "Content-Type": "text/plain",
        },
        body: fileContent,
      });
      if (!response.ok) {
        throw new Error(`保存远程文件错误：${response.statusText}`);
      }
      alert("保存远程文件成功！");
    } catch (error) {
      console.error("保存远程文件失败", error);
      alert("保存远程文件失败：" + error);
    }
  }

  return (
    <div style={{ padding: "1rem" }}>
      <h3>远程 TOML 文件编辑器</h3>
      <div style={{ marginBottom: "1rem" }}>
        <button onClick={fetchRemoteFile}>读取远程文件</button>
      </div>
      <textarea
        value={fileContent}
        onChange={(e) => setFileContent(e.target.value)}
        placeholder="远程文件内容将在此显示……"
        style={{ width: "100%", height: "200px", fontFamily: "monospace" }}
      />
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