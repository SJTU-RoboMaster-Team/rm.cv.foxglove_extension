import { ExtensionContext } from "@foxglove/extension";

import { initExamplePanel } from "./ParameterEditor";

export function activate(extensionContext: ExtensionContext): void {
  extensionContext.registerPanel({ name: "example-panel", initPanel: initExamplePanel });
}