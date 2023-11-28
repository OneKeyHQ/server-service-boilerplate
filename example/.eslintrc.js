const isDev = process.env.NODE_ENV !== 'production';
const jsRules = {
  // eslint-disable-next-line global-require
  'prettier/prettier': ['error', require('./.prettierrc.js')],
  'no-unused-vars': 'off',
  'no-use-before-define': 'off',
  'no-shadow': 'off',
  'import/no-extraneous-dependencies': 'off',
  'no-restricted-exports': 'off',
  'func-names': 'off',
  'class-methods-use-this': 'off',
  'import/extensions': 'off',
  'global-require': 'off',
  'import/no-unresolved': 'off', // tsc can check this
  'no-promise-executor-return': 'off',
  'default-param-last': 'off',
  'import/no-cycle': 'error',
  '@typescript-eslint/require-await': 'off',
  'max-classes-per-file': 'off',
  camelcase: 'off',
  'no-continue': 'off',
  'no-console': 'warn',
};
const tsRules = {
  '@typescript-eslint/default-param-last': 'off',
  '@typescript-eslint/consistent-type-imports': 'off',
  '@typescript-eslint/no-var-requires': 'off',
  '@typescript-eslint/no-unused-vars': [isDev ? 'warn' : 'error'],
  '@typescript-eslint/no-use-before-define': ['error'],
  '@typescript-eslint/no-shadow': ['error'],
  '@typescript-eslint/explicit-module-boundary-types': 'off',
  '@typescript-eslint/ban-ts-comment': 'off',
  '@typescript-eslint/no-unsafe-assignment': 'off',
  '@typescript-eslint/no-unsafe-argument': 'off',
  'sort-imports': [
    'error',
    {
      ignoreMemberSort: false,
      ignoreDeclarationSort: true,
    },
  ],
  'import/order': [
    'warn',
    {
      groups: [
        'builtin',
        'internal',
        'index',
        'external',
        'parent',
        'sibling',
        'object',
        'type',
      ],
      pathGroups: [
        {
          pattern: '@onekey/**',
          group: 'external',
          position: 'after',
        },
      ],
      alphabetize: {
        order: 'asc',
        caseInsensitive: true,
      },
      'newlines-between': 'always',
      pathGroupsExcludedImportTypes: ['builtin'],
      warnOnUnassignedImports: true,
    },
  ],
  'no-process-env': 'error',
};
module.exports = {
  extends: './node_modules/mwts/',
  ignorePatterns: ['node_modules', 'dist', 'test', 'jest.config.js', 'typings'],
  env: {
    jest: true,
  },
  plugins: ['eslint-plugin-import'],
  overrides: [
    {
      files: ['*.ts'],
      rules: {
        ...jsRules,
        ...tsRules,
      },
    },
  ],
};
