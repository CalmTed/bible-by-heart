module.exports = {
  root: true,
  extends: ['@react-native-community', 'airbnb-typescript', 'prettier'],
  plugins: ['jest', 'import'],
  parserOptions: {
    project: ['tsconfig.json']
  },
  rules: {
    "@typescript-eslint/no-use-before-define": "off",
    "react-hooks/exhaustive-deps": "off"
  }
};