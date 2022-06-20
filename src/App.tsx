import React from 'react';
import Editor, { OnMount, Monaco } from "@monaco-editor/react";
import { RAW_MATHLINGUA_SYNTAX } from './Syntax';
import { getDiagnostics } from './Analyzer';

export function App() {

  const onMount: OnMount = (editor, monaco: any) => {
    registerCompletionProvider(monaco);
    registerValidator(monaco);
  };

  return (
    <Editor
       height='100vh'
       defaultLanguage='yaml'
       options={{
          lineNumbers: 'on',
          minimap: {
            enabled: false
          },
          renderIndentGuides: false
       }}
       value={''}
       onMount={onMount}
     />
  );
}

function registerCompletionProvider(monaco: any) {
  monaco.languages.registerCompletionItemProvider('yaml', {
    provideCompletionItems: (model: any, position: any, token: any) => {
      const line = model.getLineContent(position.lineNumber);
      const indent =
        line.length > 0 && (line[0] === " " || line[0] === ".") ? "  " : "";
      const result = [];
      for (const item of RAW_MATHLINGUA_SYNTAX.map(it => it.replace("[]\n", "").split("\n"))) {
        for (let i = 0; i < item.length; i++) {
          const parts = item.slice(i);
          result.push({
            label: parts[0] + "...",
            kind: monaco.languages.CompletionItemKind.Text,
            insertText: parts.join("\n" + indent).trim()
          });
        }
      }

      return {
        suggestions: result
      };
    }
  });
}

function registerValidator(monaco: any) {
  const models = monaco.editor.getModels();
  for (const model of models) {
    const validate = () => {
      const markers = getDiagnostics(model.getValue());
      monaco.editor.setModelMarkers(model, "yaml", markers);
    };

    let handle: NodeJS.Timeout | null = null;
    model.onDidChangeContent(() => {
      if (handle) {
        clearTimeout(handle);
      }
      handle = setTimeout(validate, 500);
    });
    validate();
  }
}
