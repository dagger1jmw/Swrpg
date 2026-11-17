// ESLint flat config. Enforces the layer rules from docs-v2/architecture.md §1 (D-11).
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

const LAYERS = ['engine', 'data', 'features', 'state', 'memory', 'lore', 'ai', 'turn', 'persist', 'ui'];

/**
 * Regex for a relative import that reaches the given layers. `depth` is the minimum number of
 * `../` needed to reach src/ from the layer's top folder; deeper files need more, so it is a minimum.
 */
function layerRegex(depth, layers) {
  return `^(\\.\\./){${depth},}(${layers.join('|')})(/|$)`;
}

/** Feature internals: another feature's files other than selectors.ts. */
function featureInternalsRegex(depth) {
  return `^(\\.\\./){${depth},}features/[^/]+/(?!selectors$)[^/]+`;
}

function restrict(patterns) {
  return {
    '@typescript-eslint/no-restricted-imports': ['error', { patterns }],
  };
}

const others = (...allowed) => LAYERS.filter((l) => !allowed.includes(l));

// Pure layers: no randomness, wall-clock time, network or DOM (architecture §1).
const pureRules = {
  'no-restricted-globals': [
    'error',
    ...['fetch', 'document', 'window', 'localStorage', 'sessionStorage', 'indexedDB', 'navigator', 'setTimeout', 'setInterval', 'XMLHttpRequest'].map(
      (name) => ({ name, message: 'Pure layer: no DOM, network, storage or timers.' }),
    ),
  ],
  'no-restricted-properties': [
    'error',
    { object: 'Math', property: 'random', message: 'Use the seeded RNG in src/engine/rng.ts.' },
    { object: 'Date', property: 'now', message: 'Time comes from the clock slice.' },
  ],
  'no-restricted-syntax': [
    'error',
    { selector: "NewExpression[callee.name='Date']", message: 'Time comes from the clock slice.' },
  ],
};

export default tseslint.config(
  { ignores: ['dist/', '.claude/', 'node_modules/', 'legacy/', 'Docs/', 'docs-v2/', 'src/lore/generated/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.browser } },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    files: ['eslint.config.js', 'vite.config.ts', 'scripts/**'],
    languageOptions: { globals: { ...globals.node } },
  },
  // Layer rules. Paths are relative imports from files directly inside src/<layer>/.
  {
    files: ['src/engine/**/*.ts'],
    rules: { ...restrict([{ regex: layerRegex(1, others('engine', 'data')), message: 'engine imports only src/data.' }]), ...pureRules },
  },
  {
    files: ['src/data/**/*.ts'],
    rules: { ...restrict([{ regex: layerRegex(1, others('data')), message: 'data imports nothing else in src.' }]), ...pureRules },
  },
  {
    // src/features/<name>/<file>.ts sits two folders below src/.
    files: ['src/features/**/*.ts'],
    rules: {
      ...restrict([
        { regex: layerRegex(2, others('engine', 'data', 'features', 'state')), message: 'features import engine, data and other features via selectors.' },
        { regex: layerRegex(2, ['state']), allowTypeImports: true, message: 'features may import only types from src/state.' },
        { regex: '^\\.\\./(?!\\.\\.)[^/]+/(?!selectors$)[^/]+$', message: 'Other features only through features/<name>/selectors.ts.' },
      ]),
      ...pureRules,
    },
  },
  {
    files: ['src/state/**/*.ts'],
    rules: {
      ...restrict([
        { regex: layerRegex(1, others('state', 'features', 'engine', 'data')), message: 'state imports features, engine and data only.' },
      ]),
      ...pureRules,
    },
  },
  {
    files: ['src/memory/**/*.ts', 'src/lore/**/*.ts'],
    rules: {
      ...restrict([
        { regex: layerRegex(1, others('memory', 'lore', 'state', 'engine', 'data', 'features')), message: 'memory/lore read state types and selectors only.' },
        { regex: featureInternalsRegex(1), message: 'Feature selectors only.' },
      ]),
      ...pureRules,
    },
  },
  {
    files: ['src/ai/**/*.ts'],
    rules: {
      ...restrict([
        { regex: layerRegex(1, ['turn', 'persist', 'ui']), message: 'ai does not import turn, persist or ui.' },
        { regex: featureInternalsRegex(1), message: 'Feature selectors only; event schemas come through the registry.' },
      ]),
      'no-restricted-properties': pureRules['no-restricted-properties'],
    },
  },
  {
    files: ['src/persist/**/*.ts'],
    rules: {
      ...restrict([
        { regex: layerRegex(1, ['ai', 'turn', 'ui', 'memory', 'lore']), message: 'persist uses state types and feature migrations only.' },
        { regex: featureInternalsRegex(1), message: 'Feature migrations come through the registry.' },
      ]),
    },
  },
  {
    files: ['src/turn/**/*.ts'],
    rules: {
      ...restrict([
        { regex: layerRegex(1, ['ui']), message: 'turn does not import ui.' },
        { regex: featureInternalsRegex(1), message: 'Feature selectors only.' },
      ]),
      'no-restricted-properties': pureRules['no-restricted-properties'],
    },
  },
  {
    files: ['src/ui/**/*.ts'],
    rules: {
      ...restrict([{ regex: featureInternalsRegex(1), message: 'ui reads state via selectors only.' }]),
      'no-restricted-properties': pureRules['no-restricted-properties'],
    },
  },
);
