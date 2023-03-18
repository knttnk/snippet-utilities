
import * as vscode from 'vscode';
import * as json from "jsonc-parser";

interface SnippetFileSpec {
    trailingCommaOnLastItem: boolean;
    indentor: string;
    lastItemEndPosition: vscode.Position | null;
    jsonEndPosition: vscode.Position;
}

export function snippetFileSpec(editor: vscode.TextEditor): SnippetFileSpec {
    const originalSnippetText = editor.document.getText();

    let endOffsets: Array<number> = [];
    let commaOffsets: Array<number> = [];
    json.visit(
        originalSnippetText,
        {
            onObjectEnd: (offset: number, length: number, startLine: number, startCharacter: String) => {
                endOffsets.push(offset);
            },
            onSeparator: (character: String, offset: number, length: number, startLine: number, startCharacter: String) => {
                if (character === ",") {
                    commaOffsets.push(offset);
                }
            },
        }
    );
    const reversedEndOffsets = endOffsets.reverse();
    const jsonEndPosition = editor.document.positionAt(
        reversedEndOffsets[0],
    );
    if (endOffsets.length < 2) {
        return {
            trailingCommaOnLastItem: false,
            indentor: indentorString(editor),
            lastItemEndPosition: null,
            jsonEndPosition: jsonEndPosition,
        };
    } else {
        const lastItemEndOffset = reversedEndOffsets[1];
        const lastItemEndPosition = editor.document.positionAt(
            lastItemEndOffset,
        );
        const lastCommaOffset = commaOffsets.reverse()[0];

        return {
            trailingCommaOnLastItem: lastItemEndOffset < lastCommaOffset,
            indentor: indentorString(editor),
            lastItemEndPosition: lastItemEndPosition,
            jsonEndPosition: jsonEndPosition,
        };
    }
}

function indentorString(editor: vscode.TextEditor) {
    if (editor.options.insertSpaces) {
        let number = editor.options.tabSize;
        if (typeof number !== "number") {
            number = 4;
        }
        return " ".repeat(number);
    } else {
        return "\t";
    }
}

export function snippetizedLines(
    text: string,
    editor: vscode.TextEditor,
    indentReplacer = "\\t",
    backslashReplacer = "\\".repeat(4),
    wQuotationReplacer = '\\"',
    tabReplacer = '\\t',
    dollarReplacer = '\\\\$',
) {
    const lines = text.split(/\r\n|\r|\n/);
    let ret: Array<string> = [];
    const indentor = indentorString(editor);
    lines.forEach((line) => {
        // インデントを\tに置き換え
        let indent = "";
        const indentRegExp = new RegExp("^" + indentor);
        while (indentRegExp.exec(line)?.length ?? 0 > 0) {  // 行頭のインデントがあったら
            line = line.replace(indentRegExp, "");
            indent += indentReplacer;
        }
        // バックスラッシュを4つにする
        let newLine = indent +
            line.split("\\").join(backslashReplacer);

        // " を \" に， $を\\$に入れ替え https://docs.microsoft.com/ja-jp/sql/relational-databases/json/how-for-json-escapes-special-characters-and-control-characters-sql-server?view=sql-server-ver15
        // タブがあるとスニペット文法のエラーになるので，\tに変える
        newLine = newLine
            .split('"').join(wQuotationReplacer)
            .split('\t').join(tabReplacer)
            .split('$').join(dollarReplacer);

        ret.push(newLine);
    });
    return ret;
}

/**
 * 
 * @param text snippet化するテキスト
 * @param editor テキストがあるファイルのエディター
 * @param snippetSpec 
 * @returns そのまま貼り付けるとスニペットになる string
 */
export function snippetizedString(
    text: string,
    editor: vscode.TextEditor,
    snippetSpec: SnippetFileSpec = {
        trailingCommaOnLastItem: false,
        indentor: "\t",
        lastItemEndPosition: new vscode.Position(Infinity, Infinity),
        jsonEndPosition: new vscode.Position(Infinity, 0),
    },
) {
    const {
        trailingCommaOnLastItem,
        indentor,
        lastItemEndPosition,
    } = snippetSpec;

    const code = snippetizedLines(text, editor).map(
        (v, i, arr) => (
            snippetSpec.indentor.repeat(3)
            + '"'
            + v
            + (trailingCommaOnLastItem || (i < (arr.length - 1)) ? '",' : `"`)
        )
    ).join("\n");
    return (
        indentor + `"very nice snippet": {\n`
        + indentor.repeat(2) + `"prefix": "custom-prefix",\n`
        + indentor.repeat(2) + `"body": [\n`
        + code + `\n`
        + indentor.repeat(2) + `],\n`
        + indentor.repeat(2) + `"description": "your description"` + (trailingCommaOnLastItem ? `,\n` : `\n`)
        + indentor + `}` + (trailingCommaOnLastItem ? `,` : ``)
    );
}

/**
 * 
 * @param text snippet化するテキスト
 * @param codeEditor テキストがあるファイルのエディター
 * @param snippetSpec 
 * @returns スニペットを貼り付けるための `SnippetString`
 */
export function snippetizedSnippetString(
    text: string,
    codeEditor: vscode.TextEditor,
    snippetSpec: SnippetFileSpec = {
        trailingCommaOnLastItem: false,
        indentor: "\t",
        lastItemEndPosition: new vscode.Position(Infinity, Infinity),
        jsonEndPosition: new vscode.Position(Infinity, 0),
    },
): vscode.SnippetString {
    const {
        trailingCommaOnLastItem,
        indentor,
        lastItemEndPosition,
    } = snippetSpec;
    const code = snippetizedLines(
        text,
        codeEditor,
        "\\\\t",  // indentReplacer
        "\\".repeat(8),  // backslashReplacer
        '\\\\"', // wQuotationReplacer
        '\\\\t',  // tabReplacer
        '\\\\\\\\' + '\\\$',  // dollarReplacer
    ).map(
        (v, i, arr) => (
            `\t\t\t"`
            + v
            + (trailingCommaOnLastItem || (i < (arr.length - 1)) ? '",' : `"`)
        )
    ).join("\n");

    return new vscode.SnippetString(
        `\t"\${1:very nice snippet}": {\n`
        + `\t\t"prefix": "\${2:custom-prefix}",\n`
        + `\t\t"body": [\n`
        + code + `\n`
        + `\t\t],\n`
        + `\t\t"description": "\${3:Your description.}"` + (trailingCommaOnLastItem ? `,\n` : `\n`)
        + `\t}` + (trailingCommaOnLastItem ? `,\n` : `\n`)
    );
}
