export interface ViewerAssets { readonly scriptUri: string; readonly styleUri?: string; readonly cspSource: string; readonly nonce: string }

export function webviewHtml(assets: ViewerAssets): string {
  const style = assets.styleUri ? `<link rel="stylesheet" href="${assets.styleUri}">` : '';
  return `<!doctype html>
<html><head><meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${assets.cspSource} data:; style-src ${assets.cspSource}; script-src 'nonce-${assets.nonce}';">
<meta name="viewport" content="width=device-width,initial-scale=1.0">${style}</head>
<body><div id="root"></div>
<script nonce="${assets.nonce}">
const vscode = acquireVsCodeApi();
window.__plyHost = Object.freeze({protocolVersion:1,postMessage:(message)=>vscode.postMessage(message),getState:()=>vscode.getState(),setState:(state)=>vscode.setState(state)});
</script>
<script nonce="${assets.nonce}" type="module" src="${assets.scriptUri}"></script></body></html>`;
}

export function createNonce(randomBytes: Uint8Array): string {
  return Array.from(randomBytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
