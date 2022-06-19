import { getBreakdown } from "./Util";

export const RAW_MATHLINGUA_SYNTAX = [
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
  "membership:\nthrough:",
  "view:\nas:\nvia:\nby?:",
  "symbols:\nwhere:",
  "memberSymbols:\nwhere:",
  "symbols:\nas:",
  "memberSymbols:\nas:",
  "[]\nDefines:\nwith?:\ngiven?:\nwhen?:\nsuchThat?:\nmeans?:\nsatisfying?:\nexpressing?:\nusing?:\nProviding?:\nCodified:\nDescribed?:\nMetadata?:",
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

function createSyntaxMap(syntaxList: string[]): Map<string, string[]> {
  const result = new Map<string, string[]>();
  for (const item of syntaxList) {
    const itemList = item.replace("[]\n", "").split("\n");
    result.set(itemList[0].replace(":", "").replace("?", ""), itemList);
  }
  return result;
}

export interface Diagnostic {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
  message: string;
}

export function getDiagnostics(text: string): Diagnostic[] {
  const markers: Diagnostic[] = [];
  const groups = getBreakdown(text);
  for (const actual of groups) {
    const headName = actual[0].name;
    const expected = createSyntaxMap(RAW_MATHLINGUA_SYNTAX).get(headName) || [];

    let i = 0;
    let j = 0;

    while (i < actual.length && j < expected.length) {
      const acName = actual[i].name;
      const exName = expected[j].replace(":", "").replace("?", "");

      if (acName === exName) {
        i++;
        j++;
      } else if (expected[j].indexOf("?:") === expected[j].length - 2) {
        j++; // move past the expected name
      } else {
        markers.push({
          startLineNumber: actual[i].index,
          startColumn: 0,
          endLineNumber: actual[i].index,
          endColumn: actual[i].name.length + 1,
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
        const lastActual = actual[i - 1] ?? {
          name: "",
          index: 0
        };
        markers.push({
          startLineNumber: lastActual.index,
          startColumn: 0,
          endLineNumber: lastActual.index,
          endColumn: lastActual.name.length + 1,
          message: `Expected '${expected[j]}'`
        });
      }
      j++;
    }

    while (i < actual.length) {
      if (actual[i].name.replace(/-/g, "").length > 0) {
        markers.push({
          startLineNumber: actual[i].index,
          startColumn: 0,
          endLineNumber: actual[i].index,
          endColumn: actual[i].name.length + 1,
          message: `Unexpected section '${actual[i].name}'`
        });
      }
      i++;
    }
  }

  return markers;
}
