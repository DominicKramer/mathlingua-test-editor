
export function removeStrings(text: string): string {
  let result = "";
  const stack: string[] = [];
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === `'` || c === `"` || c === "`") {
      if (stack.length === 0 || stack[stack.length - 1] !== c) {
        stack.push(c);
      } else {
        stack.pop();
      }
    } else if (stack.length === 0) {
      // if stack is non-empty we are within a string
      // and so don't add the characters to the result
      result += c;
    } else {
      if (c === "\n") {
        result += "\n";
      } else {
        result += "-";
      }
    }
  }
  return result;
}

export interface LineAndIndent {
  name: string;
  indent: number;
  hasDot: boolean;
  index: number;
}

export function getLinesAndIndents(text: string): Array<LineAndIndent | null> {
  const result: Array<LineAndIndent | null> = [];
  const lines = text.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.indexOf("::") === 0) {
      i++; // skip the first :: line
      while (i < lines.length && lines[i].indexOf("::") !== 0) {
        i++; // skip the middle lines
      }
      if (i < lines.length && lines[i].indexOf("::") === 0) {
        i++; // move past the last :: line
      }
    } else if (line.replace(/ /g, "").length === 0) {
      i++; // skip the blank line
      result.push(null);
    } else if (line.replace(/-/g, "").length === 0) {
      i++; // skip -... lines since those are lines that were
      // replacing multi string lines
    } else if (line.indexOf("[") === 0) {
      i++; // skip [...] lines
    } else {
      i++;
      let hasDot = false;
      let indent = 0;
      let name = "";

      let j = 0;
      while (j < line.length && (line[j] === " " || line[j] === ".")) {
        indent++;
        if (line[j] === ".") {
          hasDot = true;
        }
        j++;
      }

      while (j < line.length && line[j] !== ":") {
        name += line[j++];
      }

      if (
        name.indexOf('"') !== 0 &&
        name.indexOf(`'`) !== 0 &&
        name.indexOf(`"`) !== 0
      ) {
        result.push({ name, indent, hasDot, index: i });
      }
    }
  }
  return result;
}

export function getBreakdown(text: string): Array<LineAndIndent[]> {
  const items = getLinesAndIndents(removeStrings(text));
  const result: Array<LineAndIndent[]> = [];
  const stack: Array<LineAndIndent[]> = [];
  for (const item of items) {
    if (item === null) {
      while (stack.length > 0) {
        result.push(stack.pop()!);
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
        result.push(stack.pop()!);
        stack.push([item]);
      } else if (item.indent > peek.indent) {
        stack.push([item]);
      } else {
        while (
          stack.length > 0 &&
          stack[stack.length - 1][0].indent > item.indent
        ) {
          result.push(stack.pop()!);
        }
        stack[stack.length - 1].push(item);
      }
    }
  }
  while (stack.length > 0) {
    result.push(stack.pop()!);
  }
  return result;
}
