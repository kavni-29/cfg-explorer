// CFG Parsing Engine

export interface Rule {
  lhs: string;
  rhs: string[][]; // each alternative is an array of symbols
}

export interface Grammar {
  nonTerminals: Set<string>;
  terminals: Set<string>;
  rules: Rule[];
  startSymbol: string;
}

export interface DerivationStep {
  sententialForm: string[];
  expandedIndex: number; // which symbol was expanded (-1 for initial)
  ruleUsed: string; // e.g. "S → a S b"
}

export interface TreeNode {
  id: number;
  label: string;
  isTerminal: boolean;
  isEpsilon: boolean;
  children: TreeNode[];
}

export function parseGrammar(input: string): Grammar {
  const lines = input.trim().split('\n').filter(l => l.trim());
  const rules: Rule[] = [];
  const nonTerminals = new Set<string>();
  const allSymbols = new Set<string>();
  let startSymbol = '';

  for (const line of lines) {
    const match = line.match(/^\s*(\S+)\s*[→->]+\s*(.+)$/);
    if (!match) continue;

    const lhs = match[1].trim();
    nonTerminals.add(lhs);
    if (!startSymbol) startSymbol = lhs;

    const alternatives = match[2].split('|').map(a => a.trim());
    const rhs: string[][] = [];

    for (const alt of alternatives) {
      const symbols = alt === 'ε' || alt === 'epsilon' || alt === 'ɛ'
        ? ['ε']
        : alt.split(/\s+/).filter(s => s);
      rhs.push(symbols);
      symbols.forEach(s => allSymbols.add(s));
    }

    // Merge if same LHS already exists
    const existing = rules.find(r => r.lhs === lhs);
    if (existing) {
      existing.rhs.push(...rhs);
    } else {
      rules.push({ lhs, rhs });
    }
  }

  const terminals = new Set<string>();
  allSymbols.forEach(s => {
    if (!nonTerminals.has(s) && s !== 'ε') terminals.add(s);
  });

  return { nonTerminals, terminals, rules, startSymbol };
}

function findRule(grammar: Grammar, symbol: string): Rule | undefined {
  return grammar.rules.find(r => r.lhs === symbol);
}

// CYK-inspired top-down recursive descent with backtracking
export function derive(
  grammar: Grammar,
  input: string,
  mode: 'leftmost' | 'rightmost'
): DerivationStep[] | null {
  const target = input.split(/\s+/).filter(s => s);
  const steps: DerivationStep[] = [];

  steps.push({
    sententialForm: [grammar.startSymbol],
    expandedIndex: -1,
    ruleUsed: 'Start',
  });

  function helper(form: string[], depth: number): boolean {
    if (depth > 200) return false;

    // Check if fully derived
    const allTerminal = form.every(
      s => grammar.terminals.has(s) || s === 'ε'
    );
    if (allTerminal) {
      const result = form.filter(s => s !== 'ε');
      return (
        result.length === target.length &&
        result.every((s, i) => s === target[i])
      );
    }

    // Find next non-terminal to expand
    let idx = -1;
    if (mode === 'leftmost') {
      idx = form.findIndex(s => grammar.nonTerminals.has(s));
    } else {
      for (let i = form.length - 1; i >= 0; i--) {
        if (grammar.nonTerminals.has(form[i])) {
          idx = i;
          break;
        }
      }
    }

    if (idx === -1) return false;

    const symbol = form[idx];
    const rule = findRule(grammar, symbol);
    if (!rule) return false;

    for (const alt of rule.rhs) {
      const newForm = [...form.slice(0, idx), ...alt, ...form.slice(idx + 1)];

      // Pruning: if terminals so far don't match prefix of target
      const terminalPrefix = [];
      let valid = true;
      for (const s of newForm) {
        if (grammar.terminals.has(s) || s === 'ε') {
          if (s !== 'ε') terminalPrefix.push(s);
        } else break;
      }
      for (let i = 0; i < terminalPrefix.length; i++) {
        if (i >= target.length || terminalPrefix[i] !== target[i]) {
          valid = false;
          break;
        }
      }

      // Also check length doesn't exceed
      const minLen = newForm.filter(s => grammar.terminals.has(s)).length;
      if (minLen > target.length) valid = false;

      if (!valid) continue;

      const ruleStr = `${symbol} → ${alt.join(' ')}`;
      steps.push({
        sententialForm: newForm,
        expandedIndex: idx,
        ruleUsed: ruleStr,
      });

      if (helper(newForm, depth + 1)) return true;

      steps.pop();
    }

    return false;
  }

  if (helper([grammar.startSymbol], 0)) return steps;
  return null;
}

// Build parse tree from derivation steps
export function buildParseTree(
  grammar: Grammar,
  steps: DerivationStep[]
): TreeNode | null {
  if (steps.length === 0) return null;

  let nodeId = 0;
  const root: TreeNode = {
    id: nodeId++,
    label: grammar.startSymbol,
    isTerminal: false,
    isEpsilon: false,
    children: [],
  };

  // Replay derivation on the tree
  function getLeaves(node: TreeNode): TreeNode[] {
    if (node.children.length === 0) return [node];
    const leaves: TreeNode[] = [];
    for (const child of node.children) {
      leaves.push(...getLeaves(child));
    }
    return leaves;
  }

  for (let i = 1; i < steps.length; i++) {
    const step = steps[i];
    const leaves = getLeaves(root).filter(
      l => !l.isTerminal && !l.isEpsilon && grammar.nonTerminals.has(l.label)
    );

    if (step.expandedIndex < 0) continue;

    // Find which leaf corresponds to expandedIndex
    const allLeaves = getLeaves(root);
    let ntCount = -1;
    let targetLeaf: TreeNode | null = null;

    // Map expandedIndex back to position in sentential form of prev step
    const prevForm = steps[i - 1].sententialForm;
    const expandedSymbol = prevForm[step.expandedIndex];

    // Find the correct leaf
    let leafIdx = 0;
    for (const leaf of allLeaves) {
      if (!leaf.isTerminal && !leaf.isEpsilon && leaf.children.length === 0) {
        // Count position of this non-terminal leaf in sentential form
        let pos = 0;
        let found = false;
        for (const l of allLeaves) {
          if (l === leaf) {
            found = true;
            break;
          }
          pos++;
        }
        if (found && pos === step.expandedIndex) {
          targetLeaf = leaf;
          break;
        }
      }
      leafIdx++;
    }

    if (!targetLeaf) {
      // Fallback: find by index
      let idx = 0;
      for (const leaf of allLeaves) {
        if (idx === step.expandedIndex && leaf.children.length === 0) {
          targetLeaf = leaf;
          break;
        }
        idx++;
      }
    }

    if (!targetLeaf) continue;

    // Parse the rule to get children
    const ruleMatch = step.ruleUsed.match(/^\S+\s*→\s*(.+)$/);
    if (!ruleMatch) continue;
    const rhsSymbols = ruleMatch[1].split(/\s+/).filter(s => s);

    for (const sym of rhsSymbols) {
      const child: TreeNode = {
        id: nodeId++,
        label: sym,
        isTerminal: sym === 'ε' ? false : !grammar.nonTerminals.has(sym),
        isEpsilon: sym === 'ε',
        children: [],
      };
      targetLeaf.children.push(child);
    }
  }

  return root;
}

// Get yield (leaf terminals left to right)
export function getYield(tree: TreeNode): string[] {
  if (tree.children.length === 0) {
    return tree.isEpsilon ? [] : [tree.label];
  }
  const result: string[] = [];
  for (const child of tree.children) {
    result.push(...getYield(child));
  }
  return result;
}

// Example grammars
export const EXAMPLES: Record<string, { grammar: string; input: string }> = {
  'Arithmetic expressions': {
    grammar: `E → E + T | T
T → T * F | F
F → ( E ) | id`,
    input: 'id + id * id',
  },
  'Palindromes': {
    grammar: `S → a S a | b S b | a | b | ε`,
    input: 'a b b a',
  },
  'Balanced parentheses': {
    grammar: `S → ( S ) S | ε`,
    input: '( ( ) ) ( )',
  },
  'Simple sentences': {
    grammar: `S → NP VP
NP → Det N
VP → V NP
Det → the | a
N → cat | dog
V → chases | sees`,
    input: 'the cat chases a dog',
  },
  'aⁿbⁿ language': {
    grammar: `S → a S b | ε`,
    input: 'a a b b',
  },
};

// Layout a tree for SVG rendering
export interface LayoutNode {
  node: TreeNode;
  x: number;
  y: number;
  children: LayoutNode[];
}

export function layoutTree(root: TreeNode, width: number = 800, levelHeight: number = 80): LayoutNode {
  // First pass: count leaves for each subtree
  function countLeaves(node: TreeNode): number {
    if (node.children.length === 0) return 1;
    return node.children.reduce((sum, c) => sum + countLeaves(c), 0);
  }

  function layout(node: TreeNode, x: number, y: number, availWidth: number): LayoutNode {
    const result: LayoutNode = { node, x, y, children: [] };

    if (node.children.length === 0) return result;

    const totalLeaves = countLeaves(node);
    let currentX = x - availWidth / 2;

    for (const child of node.children) {
      const childLeaves = countLeaves(child);
      const childWidth = (childLeaves / totalLeaves) * availWidth;
      const childX = currentX + childWidth / 2;

      result.children.push(layout(child, childX, y + levelHeight, childWidth));
      currentX += childWidth;
    }

    return result;
  }

  return layout(root, width / 2, 40, width - 80);
}
