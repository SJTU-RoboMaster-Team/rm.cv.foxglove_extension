import { ExtensionContext } from "@foxglove/extension";

import { initExamplePanel } from "./JsonMessageViewer";

export function activate(extensionContext: ExtensionContext): void {
  extensionContext.registerPanel({ name: "JsonMessageViewer", initPanel: initExamplePanel });
}
