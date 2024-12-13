module.exports = {
  extends: ['marudor/noReact'],
  env: {
    node: true,
    es6: true,
    jest: true,
  },
  globals: {},
  rules: {
    'guard-for-in': 0,
    'jest/no-conditional-expect': 0,
  },
};
