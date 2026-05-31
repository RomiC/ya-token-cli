import js from '@eslint/js';
import markdown from '@eslint/markdown';
import globals from 'globals';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';

export default [
  {
    ...js.configs.recommended,
    files: ['**/*.js']
  },
  prettierConfig,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: globals.node
    },
    plugins: {
      prettier: prettierPlugin
    },
    rules: {
      'arrow-parens': ['warn', 'always'],
      'comma-spacing': ['warn'],
      'eol-last': ['warn', 'always'],
      'func-call-spacing': ['warn', 'never'],
      indent: ['warn', 2, { SwitchCase: 1 }],
      'key-spacing': [
        'warn',
        {
          beforeColon: false,
          afterColon: true
        }
      ],
      'keyword-spacing': ['warn', { after: true }],
      'no-extra-boolean-cast': 'off',
      'no-multiple-empty-lines': ['warn', { max: 1 }],
      'no-multi-spaces': 'warn',
      'no-unused-vars': 'warn',
      'object-curly-spacing': ['warn', 'always'],
      'prettier/prettier': 'warn',
      semi: ['warn', 'always'],
      'space-before-blocks': ['warn', 'always'],
      'space-before-function-paren': [
        'warn',
        {
          anonymous: 'always',
          named: 'never',
          asyncArrow: 'always'
        }
      ],
      'spaced-comment': ['warn', 'always'],
      'space-infix-ops': 'warn',
      'space-in-parens': ['warn', 'never'],
      'space-unary-ops': [
        'warn',
        {
          words: true,
          nonwords: false
        }
      ]
    }
  },
  ...markdown.configs.processor
];
