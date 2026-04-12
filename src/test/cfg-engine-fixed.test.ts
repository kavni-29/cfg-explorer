import { describe, expect, it } from 'vitest';
import {
  buildParseTree,
  derive,
  getYield,
  parseGrammar,
} from '@/lib/cfg-engine-fixed';

describe('cfg-engine-fixed', () => {
  it('parses productions without requiring spaces between symbols', () => {
    const grammar = parseGrammar(`S -> aSb | ε`);

    expect(grammar.startSymbol).toBe('S');
    expect(grammar.rules[0].rhs).toEqual([['a', 'S', 'b'], ['ε']]);
  });

  it('derives compact inputs like aabb', () => {
    const grammar = parseGrammar(`S -> aSb | ε`);
    const steps = derive(grammar, 'aabb', 'leftmost');

    expect(steps).not.toBeNull();
    expect(steps?.at(-1)?.sententialForm.filter(symbol => symbol !== 'ε')).toEqual(['a', 'a', 'b', 'b']);
  });

  it('handles mixed token lengths like id+id*id', () => {
    const grammar = parseGrammar(`E -> E + T | T
T -> T * F | F
F -> ( E ) | id`);
    const steps = derive(grammar, 'id+id*id', 'leftmost');
    const tree = steps ? buildParseTree(grammar, steps) : null;

    expect(steps).not.toBeNull();
    expect(tree ? getYield(tree) : null).toEqual(['id', '+', 'id', '*', 'id']);
  });
});
