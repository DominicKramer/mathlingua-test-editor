
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
  "membership:\nthrough:",
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

const SYNTAX_KEY = 'MATHLINGUA_SYNTAX';

/*
function parseSyntaxText(text: string): string[] {
  const lines = text.split('\n');
  const result: string[] = [];
  let i = 0;
  while (i < lines.length) {
    let content = '';
    while (i < lines.length && lines[i].replace(/ /g, '') !== '') {
      content += lines[i];
      i++;
    }
    result.push(content.trim());
    while (i < lines.length && lines[i].replace(/ /g, '') === '') {
      i++;
    }
  }
  return result;
}
*/

export function loadRawMathlinguaSyntax(): string[] {
  /*
  const fromStorage = localStorage.getItem(SYNTAX_KEY);
  if (fromStorage) {
    return fromStorage.split('\n');
  }
  */
  return DEFAULT_RAW_MATHLINGUA_SYNTAX;
}

export function saveRawMathlinguaSyntax(syntax: string) {
//  localStorage.setItem(SYNTAX_KEY, syntax);
}

export function createSyntaxMap(syntaxList: string[]): Map<string, string[]> {
  const result = new Map<string, string[]>();
  for (const item of syntaxList) {
    const itemList = item.replace("[]\n", "").split("\n");
    result.set(itemList[0].replace(":", "").replace("?", ""), itemList);
  }
  return result;
}

export function loadSyntaxGroups(): Array<string[]> {
  return loadRawMathlinguaSyntax().map(it => it.replace("[]\n", "").split("\n"));
}
