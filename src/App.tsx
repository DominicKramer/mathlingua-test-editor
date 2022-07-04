import React from 'react';
import Editor, { OnMount } from "@monaco-editor/react";

const MATHLINGUA_KEY = 'MATHLINGUA_EDITOR';

const ORANGE = '#ce9178';
const DARK_ORANGE = '#ce9178';

const FONTS = [
  'AcPlus_IBM_VGA_8x14',
  'IBM_DOS_ISO9',
  'Monospace',
];

export function App() {
  const [rawFontSize, setRawFontSize] = React.useState(18);
  const [theme, setTheme] = React.useState('light');
  const [fontFamily, setFontFamily] = React.useState(FONTS[0]);
  const [language, setLanguage] = React.useState('yaml');
  const [controlsShown, setControlsShown] = React.useState(false);

  React.useEffect(() => {
    document.body.style.backgroundColor = theme === 'retro' ? '#000000' : '#fbfbfb';
  }, [theme]);

  const onMount: OnMount = (editor, monaco: any) => {
    monaco.editor.defineTheme('retro', {
      base: 'vs-dark',
      inherit: true,
      rules: [{
        background: '#000000',
        foreground: DARK_ORANGE,
      }],
      colors: {
        'editor.foreground': ORANGE,
        'editor.background': '#000000',
        'editor.selectionBackground': '#222222',
        'editor.selectionHighlightBackground': '#000000',
        'editorCursor.foreground': '#663300',
      }
    });
    configureEditor(monaco);
    registerCompletionProvider(monaco);
    registerSaver(monaco);
    // this is needed to initially use dark mode since the
    // custom theme needs to be defined before dark mode can be used
    setTheme('retro');
  };

  const light = theme === 'light';
  const usingRetroFont = fontFamily !== 'Monospace';
  const foreground = light ? '#555555' : ORANGE;
  const fontSize = usingRetroFont ? rawFontSize + 7 : rawFontSize;
  const buttonStyle = {
    border: 'none',
    background: 'transparent',
    color: foreground,
    float: 'right',
    marginRight: '1em',
    fontSize,
    fontFamily,
  } as const;
  return <div style={{
    width: light ? '80%' : '99%',
    marginLeft: 'auto',
    marginRight: 'auto',
    border: light ? 'solid' : 'none',
    borderWidth: '1px',
    borderColor: light ? '#eee' : '#000000',
    borderRadius: '2px',
    boxShadow: light ? '0 1px 5px rgba(0,0,0,.1)' : 'none',
    marginTop: '2vh',
    paddingTop: '0.25em',
    paddingLeft: '1ex',
    backgroundColor: light ? 'white' : '#000000',
  }}>
    <div>
      <button
        style={buttonStyle}
        onClick={() => {
          setControlsShown(!controlsShown)
        }}>
          =
      </button>
      <div style={{
        color: ORANGE,
        display: controlsShown ? 'unset' : 'none',
        fontFamily,
        fontSize,
      }}>
        Font Family:&nbsp;
        <select style={{
          border: 'solid',
          borderWidth: '1px',
          borderColor: ORANGE,
          background: '#000000',
          color: ORANGE,
          fontFamily,
          fontSize,
        }}
        onChange={(event) => {
          setFontFamily(event.target.value);
        }}>
          {
            FONTS.map(fontName => (<option style={{
              background: '#333333',
              border: 'solid',
              borderColor: ORANGE,
              borderWidth: '1px',
            }}>
              {fontName ?? 'default'}
            </option>))
          }
        </select>
        &nbsp;Font size:&nbsp;
        <input style={{
          background: '#000000',
          borderWidth: '1px',
          borderColor: ORANGE,
          color: ORANGE,
          width: '2em',
          fontFamily,
          fontSize,
        }}
        value={rawFontSize}
        onChange={(event) => {
          setRawFontSize(+event.target.value)
        }} />
        &nbsp;Language:&nbsp;
        <input style={{
          background: '#000000',
          borderWidth: '1px',
          borderColor: ORANGE,
          color: ORANGE,
          width: '2em',
          fontFamily,
          fontSize,
        }}
        value={language}
        onChange={(event) => {
          setLanguage(event.target.value)
        }}/>
        &nbsp;Theme:&nbsp;
        <select style={{
          border: 'solid',
          borderWidth: '1px',
          borderColor: ORANGE,
          background: '#000000',
          color: ORANGE,
          fontFamily,
          fontSize,
        }}
        onChange={(event) => {
          setTheme(event.target.value);
        }}>
          {
            ['light', 'retro'].map(theme => (<option style={{
              background: '#333333',
              border: 'solid',
              borderColor: ORANGE,
              borderWidth: '1px',
            }}>
              {theme}
            </option>))
          }
        </select>
      </div>
      <Editor
        height='92vh'
        language={language}
        theme={light ? 'light' : 'retro'}
        options={{
          lineNumbers: 'off',
          autoClosingBrackets: 'never',
          autoClosingQuotes: 'never',
          tabSize: 2,
          autoIndent: true,
          quickSuggestions: false,
          minimap: {
            enabled: false
          },
          renderIndentGuides: false,
          renderLineHighlight: false,
          cursorStyle: 'block',
          cursorBlinking: 'solid',
          matchBrackets: 'never',
          fontSize,
          fontFamily,
        }}
        value={localStorage.getItem(MATHLINGUA_KEY) ?? ''}
        onMount={onMount}
      />
    </div>
  </div>;
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
      const syntaxGroups = SYNTAX_GROUPS;

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

function registerSaver(monaco: any) {
  const models = monaco.editor.getModels();
  for (const model of models) {
    const validate = () => {
      const val = model.getValue();
      localStorage.setItem(MATHLINGUA_KEY, val);
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

function getLineInfo(content: string): { hasDot: boolean; indent: number; name: string; } {
  let hasDot = false;
  let indent = 0;
  let name = '';

  let j = 0;
  while (j < content.length && (content[j] === ' ' || content[j] === '.')) {
    indent++;
    if (content[j] === '.') {
      hasDot = true;
    }
    j++;
  }

  while (j < content.length && content[j] !== ':') {
    name += content[j++];
  }

  return { hasDot, indent, name };
}

const DEFAULT_RAW_MATHLINGUA_SYNTAX = [
  "and:",
  "not:",
  "or:",
  "exists:\nwhere?:\nsuchThat?:",
  "existsUnique:\nwhere?:\nsuchThat?:",
  "forAll:\nwhere?:\nsuchThat?:\nthen:",
  "if:\nthen:",
  "iff:\nthen:",
  "generated:\nfrom:\nwhen?:",
  "piecewise:\nwhen?:\nthen?:\nelse?:",
  "matching:",
  "equality:\nbetween:\nprovided:",
  "member:\nmeans:",
  "membership:\naxiomatically:",
  "view:\nas:\nvia:\nby?:",
  "symbols:\nwhere:",
  "memberSymbols:\nwhere:",
  "symbols:\nas:",
  "memberSymbols:\nas:",
  "[]\nDefines:\nwith?:\ngiven?:\nwhen?:\nsuchThat?:\nextends?:\nsatisfying?:\nmeans?:\nexpressing?:\nusing?:\nProviding?:\nCodified:\nDescribed?:\nMetadata?:",
  "note:",
  "tag:",
  "reference:",
  "[]\nStates:\ngiven?:\nwhen?:\nsuchThat?:\nthat:\nusing?:\nCodified:\nDescribed?:\nMetadata?:",
  "writing:",
  "written:",
  "called:",
  "type:",
  "name:",
  "author:",
  "homepage:",
  "url:",
  "offset:",
  "[]\nResource:",
  "[]\nAxiom:\ngiven?:\nwhere?:\nsuchThat?:\nthen:\niff?:\nusing?:\nMetadata?:",
  "[]\nConjecture:\ngiven?:\nwhere?:\nsuchThat?:\nthen:\niff?:\nusing?:\nMetadata?:",
  "[]\nTheorem:\ngiven?:\nwhere?:\nsuchThat?:\nthen:\niff?:\nusing?:\nProof?:\nMetadata?:",
  "[]\nTopic:\ncontent:\nMetadata?:",
  "Note:\ncontent:\nMetadata?:",
  "Specify:",
  "zero:\nis:",
  "positiveInt:\nis:",
  "negativeInt:\nis:",
  "positiveFloat:\nis:",
  "negativeFloat:\nis:",
  "informally:\nas?:\nnote?:",
  "formally:\nas?:\nnote?:",
  "generally:\nas?:\nnote?:"
];

export const SYNTAX_GROUPS =
  DEFAULT_RAW_MATHLINGUA_SYNTAX.map(it => it.replace("[]\n", "").split("\n"));
