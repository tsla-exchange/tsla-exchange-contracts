module.exports = {
  'env': {
    'node': true,
    'es6': true,
    'mocha': true,
  },
  'plugins': [
    'mocha',
  ],
  'extends': [
    'eslint:recommended',
    'plugin:mocha/recommended',
  ],
  'globals': {
    'hre': 'readonly',
    'task': 'readonly',
    'ethers': 'readonly',
  },
  'parserOptions': {
    'ecmaVersion': 2018,
    'sourceType': 'module',
  },
  'rules': {
    'indent': [
      'error',
      2,
    ],
    'linebreak-style': [
      'error',
      'unix',
    ],
    'no-trailing-spaces': [
      'error',
    ],
    'quotes': [
      'error',
      'single',
    ],
    'semi': [
      'error',
      'always',
    ],
    'no-var': [
      'error',
    ],
    'comma-dangle': [
      'error',
      {
        'objects': 'always-multiline',
        'arrays': 'always-multiline',
      },
    ],
    'object-curly-spacing': [
      'error',
      'always',
    ],
    'template-curly-spacing': [
      'error',
      'always',
    ],
    'no-template-curly-in-string': [
      'error',
    ],
    'key-spacing': [
      'error',
      {
        'afterColon': true,
        'mode': 'minimum',
      },
    ],
  },
};
