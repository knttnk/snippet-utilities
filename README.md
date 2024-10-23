# snippet-utilities README

Utilities for snippets (still under development).

## Features

Click on "Add selection to user snippets" in the menu or `Shift` + `Alt` + `S` (`Shift` + `Option` + `S`, in Mac) to add a user snippet.
<!-- 
## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

* `myExtension.enable`: enable/disable this extension
* `myExtension.thing`: set to `blah` to do something -->

## Release Notes

### 0.0.1

The first release of this extension.

### 0.1.0

Now available in older versions of VSCode.

### 0.1.2

Fixed a bug that causes a snippet syntax error when a tab character is in the selected code.

### 0.2.0

- After adding a snippet, you can now move a focus to the name, `prefix`, and `description` using the tab key.
- Improved robustness for JSON comments.
- Fixed [issue #1](https://github.com/knttnk/snippet-utilities/issues/1).

### 0.2.1

- Fixed [issue #2](https://github.com/knttnk/snippet-utilities/issues/2).

### 0.2.2

- Fixed a problem that prevents from adding a snippet when there are no items in the user snippet file.
- Fixed some misspellings.

### 0.2.3

- Fixed a problem that indents are not replaced by `\t`.

### 0.2.4

- When "Add selection to user snippets" is executed, snippets are now not registered if no text is selected. So you can now open the snippet file easily.

### 0.2.5

- Updated some dependencies.