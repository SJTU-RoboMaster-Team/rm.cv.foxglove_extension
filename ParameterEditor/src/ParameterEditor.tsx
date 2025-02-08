import { PanelExtensionContext } from "@foxglove/extension";
import { ReactElement, useState } from "react";
import { createRoot } from "react-dom/client";

interface TomlLine {
  type: "section" | "param" | "comment" | "other";
  raw: string;
  indent?: string;
  key?: string;
  value?: string;
  comment?: string;
  section?: string;
}

function ParameterEditor({}: { context: PanelExtensionContext }): ReactElement {
  const [serverAddress, setServerAddress] = useState("10.42.0.174:8000");
  const [tomlLines, setTomlLines] = useState<TomlLine[]>([]);

  const remoteFileUrl = `http://${serverAddress}/edit-param-raw`;

  // 解析TOML内容，保留注释
  const parseTomlContent = (content: string): TomlLine[] => {
    return content.split("\n").map((line) => {
      const trimmed = line.trim();

      if (trimmed.startsWith("#")) {
        return { type: "comment", raw: line };
      }

      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        return { type: "section", raw: line, section: trimmed.slice(1, -1).trim() };
      }

      const paramMatch = line.match(/^(\s*)([^=#]+)=\s*([^#]*?)(\s*(#.*)?)$/);
      if (paramMatch) {
        const [, indent, key, value, , comment] = paramMatch;
        return {
          type: "param",
          raw: line,
          indent: indent || "",
          key: key?.trim() || "",
          value: value?.trim() || "",
          comment: comment?.trim(),
        };
      }

      return { type: "other", raw: line };
    });
  };

  // 生成TOML内容时保留注释
  const generateTomlContent = (lines: TomlLine[]): string => {
    return lines.map((line) => line.raw).join("\n"); // 直接返回解析时的原始行，保证注释不丢失
  };

  // 获取远程文件
  const fetchRemoteFile = async () => {
    try {
      const response = await fetch(remoteFileUrl);
      const text = await response.text();
      setTomlLines(parseTomlContent(text));
    } catch (error) {
      console.error("读取文件失败", error);
      alert("读取远程文件失败：" + error);
    }
  };

  // 参数修改处理
  const handleParamChange = (index: number, newValue: string) => {
    const updated = [...tomlLines];
    if (updated[index] && updated[index].type === "param") {
      updated[index].value = newValue;
      updated[index].raw = `${updated[index].indent}${updated[index].key} = ${newValue}${updated[index].comment ? ` ${updated[index].comment}` : ""}`;
      setTomlLines(updated);
    }
  };

  // 保存文件
  const saveRemoteFile = async () => {
    const newContent = generateTomlContent(tomlLines);
    try {
      const response = await fetch(`http://${serverAddress}/edit-param/post`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "new-data=" + encodeURIComponent(newContent),
      });
      if (!response.ok) throw new Error("保存失败");
      alert("保存成功");
    } catch (error) {
      console.error("保存失败", error);
      alert("保存失败：" + error);
    }
  };

  // 渲染参数输入框
  const renderInput = (line: TomlLine, index: number) => {
    if (line.type !== "param") return null;

    const value = line.value ?? "";
    const isBoolean = value === "true" || value === "false";

    return (
      <div
        key={index}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "8px",
          marginBottom: "8px",
          width: "100%",
        }}
      >
        {/* 左侧参数名 */}
        <span style={{ flex: 1, wordBreak: "break-word", whiteSpace: "normal" }}>
          {line.key}
        </span>

        {/* 右侧输入框或复选框 */}
        {isBoolean ? (
          <input
            type="checkbox"
            checked={value === "true"}
            onChange={(e) => handleParamChange(index, e.target.checked ? "true" : "false")}
            style={{
              marginLeft: "auto",
              transform: "scale(1.2)",
            }}
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => handleParamChange(index, e.target.value)}
            style={{
              width: "150px",
              marginLeft: "auto",
              textAlign: "left",
              paddingLeft: "8px",
            }}
          />
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: "16px", height: "100%", display: "flex", flexDirection: "column" }}>
      {/* 服务器地址输入框 */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
        <span>服务器地址:</span>
        <input
          type="text"
          value={serverAddress}
          onChange={(e) => setServerAddress(e.target.value)}
          style={{ width: "200px", textAlign: "left", paddingLeft: "8px" }}
        />
      </div>

      {/* 操作按钮 */}
      <div style={{ marginBottom: "16px", display: "flex", gap: "8px" }}>
        <button onClick={fetchRemoteFile}>读取文件</button>
        <button onClick={saveRemoteFile}>保存修改</button>
      </div>

      {/* 参数列表 */}
      <div style={{ flex: 1, overflowY: "auto", paddingRight: "8px" }}>
        {tomlLines.map((line, index) => {
          if (line.type === "section") {
            return (
              <div key={index} style={{ marginTop: "16px" }}>
                <h4
                  style={{
                    backgroundColor: "#f0f0f0",
                    padding: "8px",
                    borderRadius: "4px",
                    margin: "8px 0",
                  }}
                >
                  [{line.section}]
                </h4>
              </div>
            );
          }
          if (line.type === "comment") {
            return (
              <div key={index} style={{ color: "gray", fontStyle: "italic", marginBottom: "4px" }}>
                {line.raw}
              </div>
            );
          }
          return renderInput(line, index);
        })}
      </div>
    </div>
  );
}

export function initParameterEditor(context: PanelExtensionContext): () => void {
  const root = createRoot(context.panelElement);
  root.render(<ParameterEditor context={context} />);
  return () => root.unmount();
}
