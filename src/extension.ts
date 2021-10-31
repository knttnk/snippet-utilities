import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  let disposablSnippetizeSelection = vscode.commands.registerTextEditorCommand(
    'snippet-utilities.AddSelectionToUserSnippets',
    (editor) => {
      let doc = editor.document;            // ドキュメント取得
      let text = doc.getText(editor.selection);  //取得されたテキスト

      let snippet = snippetizedString(text, editor);
      let languageId = editor.document.languageId;

      vscode.commands.executeCommand("workbench.action.openSnippets").then(
        (v) => {
          if (v) {  // スニペットファイルが開かれたら
            function fallback() {  // なにかに失敗したら自分でやってもらう．
              // スニペットをどうするか聞く
              const copyToClipBoardMessage = "Copy to clipboard";
              const disardMessage = "Discard";
              vscode.window.showInformationMessage(
                "Failed to update the snippet file. Do you need the snippet copied to the clipboard?",
                copyToClipBoardMessage, disardMessage,
              ).then((return_) => {  // 応答によって動作を決める
                switch (return_) {
                  case copyToClipBoardMessage:  // クリップボードにコピーするとき
                    vscode.env.clipboard.writeText(snippet);
                    vscode.window.showInformationMessage("Copied the snippet to clipboard.");
                    break;
                  default:
                    break;
                };
              });
            };

            try {
              let editor = vscode.window.activeTextEditor;
              let dirs = editor?.document.fileName.split("\\").join("/").split("/") ?? [""];
              let fileName = dirs[dirs.length - 1];  // \or/で分割したときの最後の文字列

              if (editor === undefined) {
                fallback();
              } else if (fileName !== languageId + ".json") {  // 違う言語が選択されたら
                fallback();
              } else {  // エディターが開いたらペーストする．
                editor.edit(
                  (edit) => {
                    if (editor !== undefined) {
                      function lastLinePosition(editor: vscode.TextEditor, charactor: number | undefined = undefined) {
                        return editor.document.validatePosition(new vscode.Position(Infinity, 0))
                          .with(undefined, charactor);
                      }

                      // 最後に `}` が1つだけあることを確認 なければjsonがおかしくなるので放置
                      let position = lastLinePosition(editor, 0);
                      let lastPosition = lastLinePosition(editor);
                      let lastText = editor.document.getText(new vscode.Range(position, lastPosition));
                      if (lastText.split("}").length === 2) {
                        // スニペットをペースト
                        edit.replace(position, snippet + "\n");
                        let newPosition = lastLinePosition(editor, 0);

                        // スニペットを選択して編集箇所をわかりやすく
                        editor.selection = new vscode.Selection(position, newPosition);

                        vscode.commands.executeCommand("editor.action.formatSelection");
                      } else {
                        fallback();
                      }
                    } else {
                      fallback();
                    }
                  }
                );
              }
            } catch (error) {
              fallback();
            }
          }
        },
      );
    }
  );

  context.subscriptions.push(
    disposablSnippetizeSelection,
  );
}

// this method is called when your extension is deactivated
export function deactivate() { }


function snippetizedCode(text: string, editor: vscode.TextEditor) {

  let lines = text.split(/\r\n|\r|\n/);
  let ret = "";
  lines.forEach((line) => {
    // インデントを\tに置き換え
    let indenter = "";
    let options = editor.options;
    switch (options.insertSpaces) {
      case true:
        let number = options.tabSize;
        if (typeof number !== "number") {
          number = 4;
        }
        indenter = " ".repeat(number);
        break;
      default:
        indenter = "\t";
        break;
    }
    let indent = "";

    let indentRegExp = new RegExp("^" + indenter);
    while (indentRegExp.exec(line)?.length ?? 0 > 0) {  // 行頭のインデントがあったら
      line = line.replace(indentRegExp, "");
      indent += "\\t";
    }
    // バックスラッシュを4つにする
    let newLine = indent +
      line.split("\\").join("\\".repeat(4));

    // " を \" に， $を\\$に入れ替え https://docs.microsoft.com/ja-jp/sql/relational-databases/json/how-for-json-escapes-special-characters-and-control-characters-sql-server?view=sql-server-ver15
    newLine = newLine.split('"').join('\\"').split('$').join('\\\\$');

    ret = ret + '"' + newLine + '",' + "\n";
  });
  return ret;
}

function snippetizedString(text: string, editor: vscode.TextEditor) {
  let code = snippetizedCode(text, editor);
  return `"very nice snippet": {
"prefix": "custom-prefix",
"body": [\n` + code + `],
"description": "your description"
},`;
}