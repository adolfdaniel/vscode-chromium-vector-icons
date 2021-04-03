// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';

let panel: vscode.WebviewPanel | null = null;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand('chromium-vector-icons-viewer.previewIcon', () => {
    // The code you place here will be executed every time your command is
    // executed

    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
      console.error('Cannot get the active editor');
      return;
    }

    showPanel(activeEditor, context.extensionUri);
  });

  vscode.window.onDidChangeActiveTextEditor((e) => onActiveEditorChanged(e, context.extensionUri));
  context.subscriptions.push(disposable);
}

function showPanel(editor: vscode.TextEditor, extensionUri: vscode.Uri) {
  if (!editor.document.fileName.endsWith('.icon')) {
    return;
  }

  if (panel) {
    panel.reveal(vscode.ViewColumn.Beside, true);
    panel.title = `Previewing ${path.basename(editor.document.fileName)}`;
  } else {
    panel = vscode.window.createWebviewPanel(
      'previewingVectorIcon',
      `Previewing ${path.basename(editor.document.fileName)}`,
      {
        viewColumn: vscode.ViewColumn.Beside,
        preserveFocus: true,
      },
      {
        // Enable javascript in the webview
        enableScripts: true,

        // And restrict the webview to only loading content from our extension's `media` directory.
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
      }
    );

    panel.onDidDispose(() => {
      panel = null;
    });
  }

  // And set its HTML content
  panel.webview.html = getWebviewContent(panel.webview, extensionUri, editor.document.getText());
}

function onActiveEditorChanged(editor: vscode.TextEditor | undefined, extensionUri: vscode.Uri) {
  if (!editor) { return; }

  if (!panel) { return; }

  showPanel(editor, extensionUri);
  console.log("Previewing file" + editor.document.fileName);
}

function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri, data: string) {
  // Local path to main script run in the webview
  const scriptPathOnDisk = vscode.Uri.joinPath(extensionUri, 'media', 'vector-icon.js');
  const scriptUri = webview.asWebviewUri(scriptPathOnDisk);

  // Local path to css styles
  const stylePath = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'vector-icon.css'));

  // Use a nonce to only allow specific scripts to be run
  const nonce = getNonce();
  return `<!DOCTYPE html>
  <html lang='en'>
  <head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Skia Vector Icon Preview</title>

    <link href='${stylePath}' rel='stylesheet'>
  </head>
  <body>
    <div id='preview-container'>
    </div>
    <script nonce='${nonce}' src='${scriptUri}'></script>
    <script>
      const data = \`${data}\`;
      setUpPreviewPanel(data);
    </script>
  </body>
  </html>`;
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// this method is called when your extension is deactivated
export function deactivate() { }
