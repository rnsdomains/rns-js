module.exports = {
  presets: [
    [
      '@babel/env',
      {
        modules: false,
        targets: {
          node: '8',
          browsers: 'last 2 versions'
        }
      }
    ],
    '@babel/preset-typescript'
  ],
  plugins: [
    '@babel/plugin-transform-typescript'
  ]
};
