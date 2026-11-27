// m8-fixes E3: anything typed that starts with "/" is a command and never reaches Gemini. Outside dev mode it is refused on
// screen; in dev mode an unknown command answers "Unknown command" with the list, in code.
import { describe, expect, it } from 'vitest';
import { COMMANDS_NEED_DEV, DEV_HELP, runDevCommand, slashRoute } from '../../src/turn/devCommands';
import { REGISTRY } from '../../src/state/registry';
import { base } from '../support/schemaSituations';

describe('slash commands (m8-fixes E3)', () => {
  it('outside dev mode: any "/" input is refused on screen, never a story turn', () => {
    for (const t of ['/help', '/fight 2 thugs', '/', '/123', '  /ground x']) expect(slashRoute(t, false)).toBe('refuse');
    expect(COMMANDS_NEED_DEV).toMatch(/^Commands need dev mode/);
    expect(slashRoute('I draw my saber', false)).toBe('story');
    expect(slashRoute('a/b test', false)).toBe('story');
  });
  it('in dev mode: an unknown command gets "Unknown command" and the list, in code (no AI call: runDevCommand is pure)', () => {
    expect(slashRoute('/frobnicate', true)).toBe('dev');
    expect(slashRoute('/', true)).toBe('dev');
    const s = base();
    const test = { ...s, character: { ...s.character, testCharacter: true } };
    const r = runDevCommand(REGISTRY, test, '/frobnicate now');
    expect(r.ok).toBe(false);
    expect(r.line).toMatch(/Unknown command \/frobnicate/);
    expect(r.line).toContain(DEV_HELP[0]!);
  });
});
