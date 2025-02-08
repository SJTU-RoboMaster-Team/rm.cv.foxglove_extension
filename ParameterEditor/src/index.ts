import { ExtensionContext } from "@foxglove/extension";

import { initParameterEditor } from "./ParameterEditor";

export function activate(extensionContext: ExtensionContext): void {
  extensionContext.registerPanel({ name: "ParameterEditor", initPanel: initParameterEditor });
}