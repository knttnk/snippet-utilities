// リリースは
// package.jsonのバージョンを修正 package-lock.json は勝手に更新される
// README.mdのバージョン情報を追加
// https://knttnk.visualstudio.com/snippet-utilities の👨‍💼でパーソナルアクセストークンを取得
// https://code.visualstudio.com/api/working-with-extensions/publishing-extension を参考に，
// vsce login knttnk
// vsce publish -p $token

import * as vscode from 'vscode';
import { basename } from "path";
import * as myUtil from "./utils";

function myPrint(message: any) {
  vscode.window.showInformationMessage(String(message));
}


function fallback(
  snippet: string,
  message = "Failed to update the snippet file. Do you need the snippet copied to the clipboard?",
) {  // なにかに失敗したら自分でやってもらう．
  // スニペットをどうするか聞く
  const copyToClipBoardMessage = "Copy to clipboard";
  const discardMessage = "Discard";
  vscode.window.showInformationMessage(
    message,
    copyToClipBoardMessage, discardMessage,
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


export function activate(context: vscode.ExtensionContext) {
  const disposableSnippetizeSelection = vscode.commands.registerTextEditorCommand(
    'snippet-utilities.AddSelectionToUserSnippets',
    (codeEditor) => {// ドキュメント取得
      const codeText = codeEditor.document.getText(codeEditor.selection);  //取得されたテキスト

      const languageId = codeEditor.document.languageId;

      vscode.commands.executeCommand("workbench.action.openSnippets").then(
        async (v) => {
          if (v) {  // スニペットファイルが開かれたら
            try {
              const snippetJsonEditor = vscode.window.activeTextEditor!;
              const fileName = basename(snippetJsonEditor.document.fileName);

              const snippetSpec = myUtil.snippetFileSpec(snippetJsonEditor);
              const fallbackSnippet = myUtil.snippetizedString(codeText, codeEditor, snippetSpec);
              if (fileName !== languageId + ".json") {  // 違う言語が選択されたら
                fallback(fallbackSnippet, "This file is not a user snippet file of" + languageId + ". Do you need the snippet copied to the clipboard?");
                return;
              }

              if (snippetJsonEditor === undefined) {
                fallback(fallbackSnippet);
              } else {
                if (!snippetSpec.trailingCommaOnLastItem) {
                  // 最後のアイテムにあれがなかったコンマがなかった場合
                  // コンマを付け足さなければならない
                  const _pos = snippetSpec.lastItemEndPosition;
                  await snippetJsonEditor.insertSnippet(
                    new vscode.SnippetString(","),
                    new vscode.Position(
                      _pos.line, _pos.character + 1
                    ),
                  );
                }

                // スニペットをペースト
                await snippetJsonEditor.insertSnippet(
                  myUtil.snippetizedSnippetString(
                    codeText, snippetJsonEditor,
                    snippetSpec,
                  ),
                  snippetSpec.jsonEndPosition,
                );
              }
            } catch (error) {
              fallback(myUtil.snippetizedString(codeText, codeEditor));
              myPrint(error);
            }
          }
        },
      );

    }
  );

  context.subscriptions.push(
    disposableSnippetizeSelection,
  );
}

// this method is called when your extension is deactivated
export function deactivate() { }
