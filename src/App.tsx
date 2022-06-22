import React from 'react';
import Editor, { OnMount } from "@monaco-editor/react";
import { loadRawMathlinguaSyntax, loadSyntaxGroups, saveRawMathlinguaSyntax } from './Syntax';
import { getDiagnostics, getLineInfo } from './Analyzer';

import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

const MATHLINGUA_KEY = 'MATHLINGUA_EDITOR';

export function App() {
  const [message, setMessage] = React.useState('');

  const onMount: OnMount = (editor, monaco: any) => {
    configureEditor(monaco);
    registerCompletionProvider(monaco);
    registerValidator(monaco);
  };

  const onMountSyntaxEditor: OnMount = (editor, monaco: any) => {
    const models = monaco.editor.getModels();
    for (const model of models) {
      const save = () => {
        const val = model.getValue();
        saveRawMathlinguaSyntax(val);
      };

      let handle: NodeJS.Timeout | null = null;
      model.onDidChangeContent(() => {
        if (handle) {
          clearTimeout(handle);
        }
        handle = setTimeout(save, 500);
      });
      save();
    }
  };

  const codeEditor = <Editor
    height='100vh'
    defaultLanguage='yaml'
    options={{
      lineNumbers: 'on',
      autoClosingBrackets: 'never',
      autoClosingQuotes: 'never',
      tabSize: 2,
      autoIndent: true,
      quickSuggestions: false,
      minimap: {
        enabled: false
      },
      renderIndentGuides: false
    }}
    value={localStorage.getItem(MATHLINGUA_KEY) ?? ''}
    onMount={onMount}
  />;

  const syntaxEditor = <Editor
    height='100vh'
    defaultLanguage='txt'
    value={loadRawMathlinguaSyntax().map(it => it.replace(/\n/g, '\\n')).join('\n')}
    onMount={onMountSyntaxEditor}
  />;

  return (
    <>
    <Tabs onSelect={(index) => setMessage('' + index)}>
      <TabList>
        <Tab>Content</Tab>
        <Tab>Syntax:</Tab>
      </TabList>

      <TabPanel>
        {codeEditor}
      </TabPanel>
      <TabPanel>
        {syntaxEditor}
      </TabPanel>
    </Tabs>
    <span style={{ color: 'white' }}>{message}</span>
    </>
  );
}

function configureEditor(monaco: any) {
  monaco.languages.setLanguageConfiguration('yaml', {
    indentationRules: {
      increaseIndentPattern: /^[ ]*\. /,
    }
  });
}

function registerCompletionProvider(monaco: any) {
  monaco.languages.registerCompletionItemProvider('yaml', {
    provideCompletionItems: (model: any, position: any, token: any) => {
      const syntaxGroups = loadSyntaxGroups();

      // get information about the current line where the
      // autocomplete was activated
      let lineNum = position.lineNumber;
      const curLineInfo = getLineInfo(model.getLineContent(lineNum));

      // identify the starting name of the group where the autocomplete
      // was activated.  That is, consider the text:
      //
      // a:
      // b:
      // c: <- autocomplete activated here
      //
      // Then `startName` will be `a`
      let startName = curLineInfo.name;
      // The used sections are the sections in the current group that have
      // already been used.  In the example above, they are `a:`, `b:`, and `c:`.
      const usedSections: string[] = [];
      lineNum--;
      while (lineNum >= 1) {
        const info = getLineInfo(model.getLineContent(lineNum));
        if (info.indent < curLineInfo.indent || !info.name) {
          break;
        }
        startName = info.name;
        usedSections.unshift(startName);
        if (info.hasDot && info.indent === curLineInfo.indent) {
          break;
        }
        lineNum--;
      }

      // find the group with the given start name
      let targetGroup: string[] | undefined = undefined;
      for (const group of syntaxGroups) {
        if (group[0].replace(/:/, '').replace(/\?/g, '') === startName) {
          targetGroup = group;
          break;
        }
      }

      // if there is no group with the given start name, it could be because
      // the user activated autocomplete on the line where they were writing
      // the start name, and haven't yet completed typing it.  In this case,
      // return all starting names and let monaco filter out the ones that
      // match what the user has already typed.
      if (!targetGroup) {
        return {
          suggestions: syntaxGroups.map(sections => {
            const name = sections[0];
            return {
              label: name + '...',
              kind: monaco.languages.CompletionItemKind.Text,
              insertText: name,
            };
          }),
        };
      }

      // all available sections
      const availableSections = targetGroup.map(item => item.replace(/:/, '').replace(/\?/g, ''));
      let i = 0;
      let j = 0;

      // determine which sections have already been used
      while (i < availableSections.length && j < usedSections.length) {
        const used = usedSections[j++];
        while (i < availableSections.length && availableSections[i] !== used) {
          i++;
        }
      }

      // at this point availableSections[i+1:...] contains the sections not already
      // used, so suggest those section names

      const startCode = 'a'.charCodeAt(0);
      const suggestions = availableSections.slice(i+1).map((item, index) => {
        return {
          label: item + "...",
          kind: monaco.languages.CompletionItemKind.Text,
          insertText: item + ':',
          // sort converting index 0, 1, 2, ... to 'a', 'b', 'c', ...
          // to allow the correct sorting by index
          sortText: String.fromCharCode(startCode + index),
        };
      });

      if (suggestions.length === 0) {
        // this hack is needed to prevent monaco from showing suggestions
        // that just list any text already entered on the page
        suggestions.push({
          label: 'No suggestions',
          kind: monaco.languages.CompletionItemKind.Text,
          insertText: '',
          sortText: '',
        });
      }

      return {
        suggestions
      };
    }
  });
}

function registerValidator(monaco: any) {
  const models = monaco.editor.getModels();
  for (const model of models) {
    const validate = () => {
      const val = model.getValue();
      localStorage.setItem(MATHLINGUA_KEY, val);
      const markers = getDiagnostics(val);
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
