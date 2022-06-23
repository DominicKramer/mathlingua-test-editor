import { tokenize, TokenType } from "./Lexer";
import { createSyntaxMap, loadRawMathlinguaSyntax } from "./Syntax";

export interface Diagnostic {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
  message: string;
}

export function getDiagnostics(text: string): Diagnostic[] {
  const markers: Diagnostic[] = [];
  const lines = toLines(text);
  const groups = toGroups(lines);
  for (const actual of groups) {
    const headName = actual.lines[0].name;
    const expected = createSyntaxMap(loadRawMathlinguaSyntax()).get(headName) || [];

    let i = 0;
    let j = 0;

    while (i < actual.lines.length && j < expected.length) {
      const acName = actual.lines[i].name;
      const exName = expected[j].replace(":", "").replace("?", "");

      if (acName === exName) {
        i++;
        j++;
      } else if (expected[j].indexOf("?:") === expected[j].length - 2) {
        j++; // move past the expected name
      } else {
        markers.push({
          startLineNumber: actual.lines[i].lineNumber,
          startColumn: 0,
          endLineNumber: actual.lines[i].lineNumber,
          endColumn: actual.lines[i].name.length + 1,
          message: `Expected '${expected[j]}'`
        });
        i++;
      }
    }

    while (j < expected.length) {
      if (!expected[j]) {
        break;
      }

      if (expected[j].indexOf("?:") === -1) {
        const lastActual = actual.lines[i - 1] ?? {
          name: "",
          index: 0
        };
        markers.push({
          startLineNumber: lastActual.lineNumber,
          startColumn: 0,
          endLineNumber: lastActual.lineNumber,
          endColumn: lastActual.name.length + 1,
          message: `Expected '${expected[j]}'`
        });
      }
      j++;
    }

    while (i < actual.lines.length) {
      if (actual.lines[i].name.replace(/-/g, "").length > 0) {
        markers.push({
          startLineNumber: actual.lines[i].lineNumber,
          startColumn: 0,
          endLineNumber: actual.lines[i].lineNumber,
          endColumn: actual.lines[i].name.length + 1,
          message: `Unexpected section '${actual.lines[i].name}'`
        });
      }
      i++;
    }
  }

  return markers;
}

interface Group {
  lines: Line[];
}

interface Line {
  lineNumber: number;
  content: string;
  indent: number;
  name: string;
  hasDot: boolean;
}

export function getLineInfo(content: string): { hasDot: boolean; indent: number; name: string; } {
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

function toLines(text: string): Line[] {
  const result: Line[] = [];
  const tokens = tokenize(text).filter(token => token.type === TokenType.Other || token.type === TokenType.LineBreak);
  let i = 0;
  while (i < tokens.length) {
    if (tokens[i].type === TokenType.LineBreak) {
      const lineNumber = tokens[i++].lineNumber;
      result.push({
        lineNumber,
        content: '',
        indent: 0,
        name: '',
        hasDot: false
      });
      continue;
    }

    let content = '';
    let lineNumber = tokens[i]?.lineNumber ?? -1;
    while (i < tokens.length && tokens[i].type === TokenType.Other && tokens[i].lineNumber === lineNumber) {
      content += tokens[i++].text;
    }
    const { indent, name, hasDot } = getLineInfo(content);
    result.push({
      lineNumber,
      content,
      indent,
      name,
      hasDot,
    });
  }
  return result;
}

function toGroups(items: Line[]): Group[] {
  const result: Group[] = [];
  const stack: Array<Line[]> = [];
  // filter out [...] lines since the grouping mechanism doesn't know
  // how to handle them, and the consequence is that using [...] is
  // incorrectly marked as an error
  for (const item of items.filter(line => line.content.indexOf('[') === -1)) {
    if (item.content === '') {
      // the group is done
      while (stack.length > 0) {
        result.push({
          lines: stack.pop()!
        });
      }
      continue;
    }

    if (stack.length === 0) {
      stack.push([item]);
    } else {
      const peekArr = stack[stack.length - 1];
      const peek = peekArr[0];

      if (item.indent === peek.indent && !item.hasDot) {
        peekArr.push(item);
      } else if (item.indent === peek.indent && item.hasDot) {
        result.push({
          lines: stack.pop()!
        });
        stack.push([item]);
      } else if (item.indent > peek.indent) {
        stack.push([item]);
      } else {
        while (
          stack.length > 0 &&
          stack[stack.length - 1][0].indent > item.indent
        ) {
          result.push({
            lines: stack.pop()!
          });
        }
        stack[stack.length - 1].push(item);
      }
    }
  }
  while (stack.length > 0) {
    result.push({
      lines: stack.pop()!
    });
  }
  return result;
}
