
export enum TokenType {
  ColonColon,
  SingleQuote,
  DoubleQuote,
  Backtick,
  Newline,
  Other
}

export interface Token {
  type: TokenType;
  text: string;
  lineNumber: number;
}

export function tokenize(rawText: string): Token[] {
  const text = removeEscapedChars(rawText);
  const result: Token[] = [];
  let i = 0;
  let lineNumber = 0;
  while (i < text.length) {
    const startLine = lineNumber;
    const c = text[i++];
    if (c === '\n') {
      lineNumber++;
      result.push({
        type: TokenType.Newline,
        lineNumber: startLine,
        text: '\n',
      });
    } else if (i < text.length && c === ':' && text[i] === ':') {
      let content = c + text[i++];
      while (i < text.length && (text[i] + (text[i+1] || '')) !== '::') {
        const next = text[i++];
        if (next === '\n') {
          lineNumber++;
        }
        content += next;
      }
      if (((text[i] || '') + (text[i+1] || '')) === '::') {
        content += '::';
        i += 2;
      }
      result.push({
        type: TokenType.ColonColon,
        lineNumber: startLine,
        text: content,
      });
    } else if (c === "'") {
      let content = c;
      while (i < text.length && text[i] !== "'") {
        const next = text[i++];
        if (next === '\n') {
          lineNumber++;
        }
        content += next;
      }
      if (i < text.length && text[i] === "'") {
        content += text[i++];
      }
      result.push({
        type: TokenType.SingleQuote,
        lineNumber: startLine,
        text: content,
      });
    } else if (c === '"') {
      const startLine = lineNumber;
      let content = c;
      while (i < text.length && text[i] !== '"') {
        const next = text[i++];
        if (next === '\n') {
          lineNumber++;
        }
        content += next;
      }
      if (i < text.length && text[i] === '"') {
        content += text[i++];
      }
      result.push({
        type: TokenType.DoubleQuote,
        lineNumber: startLine,
        text: content,
      });
    } else if (c === '`') {
      const startLine = lineNumber;
      let content = c;
      while (i < text.length && text[i] !== '`') {
        const next = text[i++];
        if (next === '\n') {
          lineNumber++;
        }
        content += next;
      }
      if (i < text.length && text[i] === '`') {
        content += text[i++];
      }
      result.push({
        type: TokenType.Backtick,
        lineNumber: startLine,
        text: content,
      });
    } else {
      let content = c;
      while (i < text.length && !isSpecialChar(text[i])) {
        content += text[i++];
      }
      result.push({
        type: TokenType.Other,
        lineNumber: startLine,
        text: content,
      });
    }
  }
  return result;
}

function removeEscapedChars(text: string): string {
  return text.replace(/{::}/g, '    ').replace(/\\'/g, ' ').replace(/\\"/g, ' ').replace(/\\`/g, ' ');
}

function isSpecialChar(c: string): boolean {
  return c === "'" || c === '"' || c === '`' || c === '::'|| c === '\n';
}
