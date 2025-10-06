module.exports = {
  extends: ['react-app', 'react-app/jest'],
  rules: {
    // Desactivar reglas que pueden causar problemas
    'no-unused-vars': 'warn',
    'no-console': 'off',
    'react-hooks/exhaustive-deps': 'warn'
  },
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  }
};