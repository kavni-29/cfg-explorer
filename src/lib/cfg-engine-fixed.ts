// CFG parsing and derivation engine used by the Generator and Visualizer.

export interface Rule {
  lhs: string;
  rhs: string[][];
}

export interface Grammar {
  nonTerminals: Set<string>;
  terminals: Set<string>;
  rules: Rule[];
  startSymbol: string;
}

export interface DerivationStep {
  sententialForm: string[];
  expandedIndex: number;
  expandedSymbol: string | null;
  replacement: string[];
  ruleUsed: string;
}

export interface TreeNode {
  id: number;
  label: string;
  isTerminal: boolean;
  isEpsilon: boolean;
  children: TreeNode[];
}

export interface LayoutNode {
  node: TreeNode;
  x: number;
  y: number;
  children: LayoutNode[];
}

const EPSILON = 'ε';
const EPSILON_PATTERN = /^(?:ε|ϵ|ɛ|epsilon)$/i;

function normalizeSymbol(symbol: string) {
  return symbol.trim();
}

function isEpsilonSymbol(symbol: string) {
  return EPSILON_PATTERN.test(symbol.trim());
}

function formatRule(lhs: string, rhs: string[]) {
  return `${lhs} → ${rhs.join(' ')}`;
}

function matchNonTerminalAt(text: string, index: number, orderedNonTerminals: string[]) {
  return orderedNonTerminals.find(symbol => text.startsWith(symbol, index)) ?? null;
}

function isStandalonePunctuation(char: string) {
  return /[^\p{L}\p{N}_']/u.test(char);
}

function tokenizeChunk(chunk: string, orderedNonTerminals: string[]) {
  const tokens: string[] = [];
  let index = 0;

  while (index < chunk.length) {
    const current = chunk[index];

    if (/\s/.test(current)) {
      index += 1;
      continue;
    }

    const nonTerminal = matchNonTerminalAt(chunk, index, orderedNonTerminals);
    if (nonTerminal) {
      tokens.push(nonTerminal);
      index += nonTerminal.length;
      continue;
    }

    if (isStandalonePunctuation(current)) {
      tokens.push(current);
      index += 1;
      continue;
    }

    let nextIndex = index + 1;
    while (nextIndex < chunk.length) {
      const nextChar = chunk[nextIndex];
      if (/\s/.test(nextChar) || isStandalonePunctuation(nextChar)) {
        break;
      }

      const upcomingNonTerminal = matchNonTerminalAt(chunk, nextIndex, orderedNonTerminals);
      if (upcomingNonTerminal) {
        break;
      }

      nextIndex += 1;
    }

    tokens.push(chunk.slice(index, nextIndex));
    index = nextIndex;
  }

  return tokens.map(normalizeSymbol).filter(Boolean);
}

function tokenizeProduction(rawAlternative: string, nonTerminals: Set<string>) {
  const trimmed = rawAlternative.trim();
  if (!trimmed || isEpsilonSymbol(trimmed)) {
    return [EPSILON];
  }

  const orderedNonTerminals = [...nonTerminals].sort((a, b) => b.length - a.length);
  return trimmed
    .split(/\s+/)
    .flatMap(chunk => tokenizeChunk(chunk, orderedNonTerminals))
    .filter(Boolean);
}

export function parseGrammar(input: string): Grammar {
  const rawLines = input
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

  const rawRules: Array<{ lhs: string; rhsText: string }> = [];
  const nonTerminals = new Set<string>();
  let startSymbol = '';

  for (const line of rawLines) {
    const match = line.match(/^(.+?)\s*(?:→|->|⇒|=>)\s*(.+)$/);
    if (!match) {
      continue;
    }

    const lhs = normalizeSymbol(match[1]);
    const rhsText = match[2].trim();
    if (!lhs || !rhsText) {
      continue;
    }

    if (!startSymbol) {
      startSymbol = lhs;
    }

    nonTerminals.add(lhs);
    rawRules.push({ lhs, rhsText });
  }

  if (!startSymbol) {
    return {
      nonTerminals,
      terminals: new Set<string>(),
      rules: [],
      startSymbol: '',
    };
  }

  const rulesByLhs = new Map<string, string[][]>();
  const terminals = new Set<string>();

  for (const { lhs, rhsText } of rawRules) {
    const alternatives = rhsText.split('|').map(part => part.trim()).filter(Boolean);
    const parsedAlternatives = alternatives.map(alternative => tokenizeProduction(alternative, nonTerminals));
    const existing = rulesByLhs.get(lhs) ?? [];
    existing.push(...parsedAlternatives);
    rulesByLhs.set(lhs, existing);

    parsedAlternatives.flat().forEach(symbol => {
      if (!nonTerminals.has(symbol) && symbol !== EPSILON) {
        terminals.add(symbol);
      }
    });
  }

  const rules = [...rulesByLhs.entries()].map(([lhs, rhs]) => ({ lhs, rhs }));
  return { nonTerminals, terminals, rules, startSymbol };
}

function tokenizeInput(input: string, terminals: Set<string>) {
  const trimmed = input.trim();
  if (!trimmed) {
    return [];
  }

  if (/\s/.test(trimmed)) {
    return trimmed.split(/\s+/).filter(Boolean);
  }

  const orderedTerminals = [...terminals]
    .filter(symbol => symbol !== EPSILON)
    .sort((a, b) => b.length - a.length);

  if (orderedTerminals.length === 0) {
    return [...trimmed];
  }

  const result: string[] = [];
  let index = 0;

  while (index < trimmed.length) {
    const match = orderedTerminals.find(symbol => trimmed.startsWith(symbol, index));
    if (match) {
      result.push(match);
      index += match.length;
      continue;
    }

    result.push(trimmed[index]);
    index += 1;
  }

  return result;
}

function findRule(grammar: Grammar, symbol: string) {
  return grammar.rules.find(rule => rule.lhs === symbol);
}

function isTerminalLike(grammar: Grammar, symbol: string) {
  return grammar.terminals.has(symbol) || symbol === EPSILON;
}

function computeMinLengths(grammar: Grammar) {
  const minLengths = new Map<string, number>();

  grammar.terminals.forEach(symbol => minLengths.set(symbol, 1));
  minLengths.set(EPSILON, 0);
  grammar.nonTerminals.forEach(symbol => minLengths.set(symbol, Number.POSITIVE_INFINITY));

  let changed = true;
  while (changed) {
    changed = false;

    for (const rule of grammar.rules) {
      const current = minLengths.get(rule.lhs) ?? Number.POSITIVE_INFINITY;
      let best = current;

      for (const alternative of rule.rhs) {
        let total = 0;
        let resolvable = true;

        for (const symbol of alternative) {
          const symbolLength = minLengths.get(symbol);
          if (symbolLength === undefined || !Number.isFinite(symbolLength)) {
            resolvable = false;
            break;
          }
          total += symbolLength;
        }

        if (resolvable) {
          best = Math.min(best, total);
        }
      }

      if (best < current) {
        minLengths.set(rule.lhs, best);
        changed = true;
      }
    }
  }

  return minLengths;
}

function getTerminalProjection(grammar: Grammar, form: string[]) {
  return form.filter(symbol => grammar.terminals.has(symbol));
}

function isSubsequence(needle: string[], haystack: string[]) {
  let needleIndex = 0;

  for (const token of haystack) {
    if (needleIndex < needle.length && needle[needleIndex] === token) {
      needleIndex += 1;
    }
  }

  return needleIndex === needle.length;
}

function isCompatibleWithTarget(
  grammar: Grammar,
  form: string[],
  target: string[],
  minLengths: Map<string, number>,
) {
  const projectedTerminals = getTerminalProjection(grammar, form);
  if (projectedTerminals.length > target.length) {
    return false;
  }

  const formMinLength = form.reduce((sum, symbol) => {
    const minLength = minLengths.get(symbol);
    return sum + (Number.isFinite(minLength) ? (minLength as number) : target.length + 1);
  }, 0);

  if (formMinLength > target.length) {
    return false;
  }

  if (!isSubsequence(projectedTerminals, target)) {
    return false;
  }

  const firstNonTerminal = form.findIndex(symbol => grammar.nonTerminals.has(symbol));
  let lastNonTerminal = -1;
  for (let index = form.length - 1; index >= 0; index -= 1) {
    if (grammar.nonTerminals.has(form[index])) {
      lastNonTerminal = index;
      break;
    }
  }

  const prefix = firstNonTerminal === -1 ? form : form.slice(0, firstNonTerminal);
  const suffix = lastNonTerminal === -1 ? [] : form.slice(lastNonTerminal + 1);
  const prefixTokens = prefix.filter(symbol => grammar.terminals.has(symbol));
  const suffixTokens = suffix.filter(symbol => grammar.terminals.has(symbol));

  if (prefixTokens.some((token, index) => target[index] !== token)) {
    return false;
  }

  if (suffixTokens.some((token, index) => target[target.length - suffixTokens.length + index] !== token)) {
    return false;
  }

  return true;
}

function allSymbolsTerminal(grammar: Grammar, form: string[]) {
  return form.every(symbol => isTerminalLike(grammar, symbol));
}

function exactYieldMatches(grammar: Grammar, form: string[], target: string[]) {
  const yieldTokens = form.filter(symbol => grammar.terminals.has(symbol));
  return yieldTokens.length === target.length && yieldTokens.every((token, index) => token === target[index]);
}

function candidateScore(grammar: Grammar, form: string[], target: string[], minLengths: Map<string, number>) {
  const nonTerminalCount = form.filter(symbol => grammar.nonTerminals.has(symbol)).length;
  const projectedLength = form.filter(symbol => grammar.terminals.has(symbol)).length;
  const minimumLength = form.reduce((sum, symbol) => {
    const minLength = minLengths.get(symbol);
    return sum + (Number.isFinite(minLength) ? (minLength as number) : target.length + 1);
  }, 0);

  return Math.abs(target.length - minimumLength) * 10 + nonTerminalCount * 2 + Math.abs(target.length - projectedLength);
}

export function derive(
  grammar: Grammar,
  input: string,
  mode: 'leftmost' | 'rightmost',
): DerivationStep[] | null {
  if (!grammar.startSymbol) {
    return null;
  }

  const target = tokenizeInput(input, grammar.terminals);
  const minLengths = computeMinLengths(grammar);
  const steps: DerivationStep[] = [
    {
      sententialForm: [grammar.startSymbol],
      expandedIndex: -1,
      expandedSymbol: null,
      replacement: [grammar.startSymbol],
      ruleUsed: 'Start',
    },
  ];

  const pathVisited = new Set<string>();
  const deadEnds = new Set<string>();

  function serialize(form: string[]) {
    return form.join('\u241f');
  }

  function helper(form: string[], depth: number): boolean {
    if (depth > Math.max(24, target.length * 4 + grammar.rules.length * 3)) {
      return false;
    }

    if (!isCompatibleWithTarget(grammar, form, target, minLengths)) {
      return false;
    }

    if (allSymbolsTerminal(grammar, form)) {
      return exactYieldMatches(grammar, form, target);
    }

    const key = serialize(form);
    if (pathVisited.has(key) || deadEnds.has(key)) {
      return false;
    }

    pathVisited.add(key);

    let expandedIndex = -1;
    if (mode === 'leftmost') {
      expandedIndex = form.findIndex(symbol => grammar.nonTerminals.has(symbol));
    } else {
      for (let index = form.length - 1; index >= 0; index -= 1) {
        if (grammar.nonTerminals.has(form[index])) {
          expandedIndex = index;
          break;
        }
      }
    }

    if (expandedIndex === -1) {
      pathVisited.delete(key);
      return false;
    }

    const expandedSymbol = form[expandedIndex];
    const rule = findRule(grammar, expandedSymbol);
    if (!rule) {
      pathVisited.delete(key);
      deadEnds.add(key);
      return false;
    }

    const candidates = rule.rhs
      .map(replacement => {
        const nextForm = [
          ...form.slice(0, expandedIndex),
          ...replacement,
          ...form.slice(expandedIndex + 1),
        ];

        return { replacement, nextForm };
      })
      .filter(candidate => isCompatibleWithTarget(grammar, candidate.nextForm, target, minLengths))
      .sort((a, b) => candidateScore(grammar, a.nextForm, target, minLengths) - candidateScore(grammar, b.nextForm, target, minLengths));

    for (const candidate of candidates) {
      steps.push({
        sententialForm: candidate.nextForm,
        expandedIndex,
        expandedSymbol,
        replacement: candidate.replacement,
        ruleUsed: formatRule(expandedSymbol, candidate.replacement),
      });

      if (helper(candidate.nextForm, depth + 1)) {
        pathVisited.delete(key);
        return true;
      }

      steps.pop();
    }

    pathVisited.delete(key);
    deadEnds.add(key);
    return false;
  }

  return helper([grammar.startSymbol], 0) ? steps : null;
}

export function buildParseTree(grammar: Grammar, steps: DerivationStep[]) {
  if (!steps.length) {
    return null;
  }

  let nextId = 0;
  const root: TreeNode = {
    id: nextId += 1,
    label: grammar.startSymbol,
    isTerminal: false,
    isEpsilon: false,
    children: [],
  };

  const frontier: TreeNode[] = [root];

  for (let index = 1; index < steps.length; index += 1) {
    const step = steps[index];
    if (step.expandedIndex < 0 || step.expandedIndex >= frontier.length) {
      continue;
    }

    const targetNode = frontier[step.expandedIndex];
    const childNodes = step.replacement.map(symbol => ({
      id: nextId += 1,
      label: symbol,
      isTerminal: symbol !== EPSILON && !grammar.nonTerminals.has(symbol),
      isEpsilon: symbol === EPSILON,
      children: [],
    }));

    targetNode.children = childNodes;
    frontier.splice(step.expandedIndex, 1, ...childNodes);
  }

  return root;
}

export function getYield(tree: TreeNode): string[] {
  if (tree.children.length === 0) {
    return tree.isEpsilon ? [] : [tree.label];
  }

  return tree.children.flatMap(child => getYield(child));
}

export function countNodes(node: TreeNode): number {
  return 1 + node.children.reduce((sum, child) => sum + countNodes(child), 0);
}

export function getConstructionSteps(steps: DerivationStep[]) {
  if (!steps.length) {
    return ['Start with the grammar start symbol.'];
  }

  return steps.map((step, index) => {
    if (index === 0) {
      return `Start with the root node ${step.sententialForm[0]} as the grammar start symbol.`;
    }

    return `Expand ${step.expandedSymbol} using ${step.ruleUsed}.`;
  });
}

export const EXAMPLES: Record<string, { grammar: string; input: string }> = {
  'Arithmetic expressions': {
    grammar: `E -> E + T | T
T -> T * F | F
F -> ( E ) | id`,
    input: 'id + id * id',
  },
  Palindromes: {
    grammar: `S -> a S a | b S b | a | b | ε`,
    input: 'abba',
  },
  'Balanced parentheses': {
    grammar: `S -> ( S ) S | ε`,
    input: '(())()',
  },
  'Simple sentences': {
    grammar: `S -> NP VP
NP -> Det N
VP -> V NP
Det -> the | a
N -> cat | dog
V -> chases | sees`,
    input: 'the cat chases a dog',
  },
  'aⁿbⁿ language': {
    grammar: `S -> a S b | ε`,
    input: 'aabb',
  },
};

export function layoutTree(root: TreeNode, width = 800, levelHeight = 80): LayoutNode {
  function countLeaves(node: TreeNode): number {
    if (node.children.length === 0) {
      return 1;
    }

    return node.children.reduce((sum, child) => sum + countLeaves(child), 0);
  }

  function layout(node: TreeNode, x: number, y: number, availableWidth: number): LayoutNode {
    const result: LayoutNode = { node, x, y, children: [] };
    if (node.children.length === 0) {
      return result;
    }

    const totalLeaves = countLeaves(node);
    let cursor = x - availableWidth / 2;

    for (const child of node.children) {
      const childLeaves = countLeaves(child);
      const childWidth = (childLeaves / totalLeaves) * availableWidth;
      const childX = cursor + childWidth / 2;
      result.children.push(layout(child, childX, y + levelHeight, childWidth));
      cursor += childWidth;
    }

    return result;
  }

  return layout(root, width / 2, 40, width - 80);
}
