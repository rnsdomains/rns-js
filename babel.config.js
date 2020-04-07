module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        modules: 'cjs',
        targets: {
          esmodules: true,
          node: '8',
        },
      },
    ],
    '@babel/preset-typescript'
  ],
  plugins: [
    '@babel/plugin-transform-typescript',
    'add-module-exports'
  ]
};
