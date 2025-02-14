import { PanelExtensionContext } from "@foxglove/extension";
import { ReactElement, useEffect, useMemo, useState } from "react";
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
    const [serverAddress, setServerAddress] = useState("localhost:8000");
    const [tomlLines, setTomlLines] = useState<TomlLine[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [matches, setMatches] = useState<number[]>([]);
    const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
    const [isSearchEnterEdit, setIsSearchEnterEdit] = useState(false);
    const [saveStatus, setSaveStatus] = useState<string | null>(null);
    const [readStatus, setReadStatus] = useState<string | null>(null);

    const remoteFileUrl = `http://${serverAddress}/edit-param-raw`;

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

    const generateTomlContent = (lines: TomlLine[]): string => {
        return lines.map((line) => line.raw).join("\n");
    };

    const fetchRemoteFile = async () => {
        try {
            const response = await fetch(remoteFileUrl);
            const text = await response.text();
            setTomlLines(parseTomlContent(text));
            setReadStatus("读取成功");
            setSaveStatus(null);
        } catch (error) {
            console.error("读取文件失败", error);
            alert("读取远程文件失败：" + error);
            setReadStatus("读取失败");
            setSaveStatus(null);
        }
    };

    const handleParamChange = (index: number, newValue: string) => {
        const updated = [...tomlLines];
        if (updated[index] && updated[index].type === "param") {
            updated[index].value = newValue;
            updated[index].raw = `${updated[index].indent}${updated[index].key} = ${newValue}${updated[index].comment ? ` ${updated[index].comment}` : ""}`;
            setTomlLines(updated);
        }
    };

    const saveRemoteFile = async () => {
        const newContent = generateTomlContent(tomlLines);
        try {
            const response = await fetch(`http://${serverAddress}/edit-param/post`, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: "new-data=" + encodeURIComponent(newContent),
            });
            if (!response.ok) throw new Error("保存失败");
            setSaveStatus("保存成功");
            setReadStatus(null);
        } catch (error) {
            console.error("保存失败", error);
            setSaveStatus("保存失败");
            setReadStatus(null);
        }
    };

    const paramIndices = useMemo(() => {
        return tomlLines.reduce((acc, line, index) => {
            if (line.type === "param" && line.key?.toLowerCase().includes(searchQuery.toLowerCase())) {
                acc.push(index);
            }
            return acc;
        }, [] as number[]);
    }, [tomlLines, searchQuery]);

    useEffect(() => {
        if (!isSearchEnterEdit) {
            setMatches(paramIndices);
            setCurrentMatchIndex(0);
        } else {
            setMatches(paramIndices);
        }
    }, [paramIndices, isSearchEnterEdit]);

    useEffect(() => {
        let timer: string | number | NodeJS.Timeout | undefined;
        const status = saveStatus || readStatus;
        if (status) {
            timer = setTimeout(() => {
                setSaveStatus(null);
                setReadStatus(null);
            }, 1500);
        }
        return () => clearTimeout(timer);
    }, [saveStatus, readStatus]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            const direction = e.key === "ArrowUp" ? -1 : 1;
            setCurrentMatchIndex((prev) => {
                if (matches.length === 0) return prev;
                const newIndex = (prev + direction + matches.length) % matches.length;
                return newIndex;
            });
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (matches.length > 0 && currentMatchIndex < matches.length) {
                const selectedIndex = matches[currentMatchIndex];
                if (typeof selectedIndex === 'number') {
                    const line = tomlLines[selectedIndex];
                    if (line && line.type === "param") {
                        const element = document.getElementById(`input-${selectedIndex}`) as HTMLInputElement;
                        if (element) {
                            if (element.type === "checkbox") {
                                element.checked = !element.checked;
                                handleParamChange(selectedIndex, element.checked ? "true" : "false");
                                const searchInput = document.querySelector('input[placeholder="搜索参数..."]') as HTMLInputElement;
                                searchInput.focus();
                                setIsSearchEnterEdit(true);
                            } else {
                                element.focus();
                                setIsSearchEnterEdit(true);
                            }
                        }
                    }
                }
            }
        }
    };

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
        if (e.ctrlKey) {
            if (e.key === 'f') {
                e.preventDefault();
                const searchInput = document.querySelector('input[placeholder="搜索参数..."]') as HTMLInputElement;
                searchInput.focus();
            } else if (e.key === 'r') {
                e.preventDefault();
                fetchRemoteFile();
            } else if (e.key === 's') {
                e.preventDefault();
                const saveButton = document.getElementById('save-button');
                if (saveButton) {
                    saveButton.click();
                }
            } else if (e.key === 'd') {
                e.preventDefault();
                const serverAddressInput = document.querySelector('input[placeholder="服务器地址"]') || document.querySelector('input[value="' + serverAddress + '"]');
                if (serverAddressInput) {
                    (serverAddressInput as HTMLInputElement).focus();
                }
            }
        }
    };

    useEffect(() => {
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => {
            window.removeEventListener('keydown', handleGlobalKeyDown);
        };
    }, []);

    const handleInputBlur = () => {
        setIsSearchEnterEdit(false);
    };

    useEffect(() => {
        if (matches.length === 0 || currentMatchIndex < 0) return;
        const selectedIndex = matches[currentMatchIndex];
        const element = document.getElementById(`param-${selectedIndex}`);
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, [currentMatchIndex, matches]);

    const highlightText = (text: string, query: string) => {
        if (!query) return text;
        const parts = text.split(new RegExp(`(${query})`, "gi"));
        return parts.map((part, i) =>
            part.toLowerCase() === query.toLowerCase() ? (
                <span key={i} style={{ backgroundColor: "#ffeb3b" }}>
                    {part}
                </span>
            ) : (
                part
            )
        );
    };

    const renderInput = (line: TomlLine, index: number) => {
        if (line.type !== "param") return null;
        const isMatched = matches.includes(index);
        const isCurrent = matches[currentMatchIndex] === index;
        const value = line.value ?? "";
        const isBoolean = value === "true" || value === "false";

        const handleInputKeyDown = (e: React.KeyboardEvent) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const searchInput = document.querySelector('input[placeholder="搜索参数..."]') as HTMLInputElement;
                searchInput.focus();
            }
        };

        return (
            <div
                key={index}
                id={`param-${index}`}
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "8px",
                    width: "100%",
                    backgroundColor: isCurrent ? "#e3f2fd" : "transparent",
                    borderRadius: "4px",
                    padding: "4px",
                }}
            >
                <span style={{ flex: 1, wordBreak: "break-word", whiteSpace: "normal" }}>
                    {highlightText(line.key || "", searchQuery)}
                </span>
                {isBoolean ? (
                    <input
                        type="checkbox"
                        id={`input-${index}`}
                        checked={value === "true"}
                        onChange={(e) => handleParamChange(index, e.target.checked ? "true" : "false")}
                        onBlur={handleInputBlur}
                        style={{ marginLeft: "auto", transform: "scale(1.2)" }}
                    />
                ) : (
                    <input
                        type="text"
                        id={`input-${index}`}
                        value={value}
                        onChange={(e) => handleParamChange(index, e.target.value)}
                        onBlur={handleInputBlur}
                        onKeyDown={handleInputKeyDown}
                        style={{
                            width: "150px",
                            marginLeft: "auto",
                            paddingLeft: "8px",
                            border: isMatched ? "2px solid #2196f3" : "1px solid #ddd",
                        }}
                    />
                )}
            </div>
        );
    };

    return (
        <div style={{ padding: "16px", height: "100%", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <span>服务器地址:</span>
                <input
                    type="text"
                    value={serverAddress}
                    onChange={(e) => setServerAddress(e.target.value)}
                    style={{ width: "200px", paddingLeft: "8px" }}
                />
            </div>
            <div style={{ marginBottom: "16px", display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                    type="text"
                    placeholder="搜索参数..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    style={{ flex: 1, maxWidth: "300px" }}
                />
                {searchQuery && (
                    <span style={{ color: "#666", fontSize: "0.9em" }}>
                        {matches.length > 0 ? `${currentMatchIndex + 1}/${matches.length}` : "无结果"}
                    </span>
                )}
            </div>
            <div style={{ marginBottom: "16px", display: "flex", gap: "8px", alignItems: "center" }}>
                <button onClick={fetchRemoteFile}>读取文件</button>
                <button id="save-button" onClick={saveRemoteFile}>保存修改</button>
                {saveStatus && (
                    <span
                        style={{
                            marginLeft: "10px",
                            color: saveStatus === "保存成功" ? "green" : "red",
                        }}
                    >
                        {saveStatus}
                    </span>
                )}
                {readStatus && (
                    <span
                        style={{
                            marginLeft: "10px",
                            color: readStatus === "读取成功" ? "green" : "red",
                        }}
                    >
                        {readStatus}
                    </span>
                )}
            </div>
            <div style={{ flex: 1, overflowY: "auto", paddingRight: "8px" }}>
                {tomlLines.map((line, index) => {
                    if (line.type === "section") {
                        return (
                            <div key={index} style={{ marginTop: "16px" }}>
                                <h4 style={{ backgroundColor: "#f0f0f0", padding: "8px", borderRadius: "4px" }}>
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