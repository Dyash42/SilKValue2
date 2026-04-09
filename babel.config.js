module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Path aliases — must match tsconfig paths
      [
        'module-resolver',
        {
          root: ['.'],
          alias: {
            '@': './src',
            '@/components': './components',
            '@/app': './app',
            '@/constants': './src/constants',
            '@/hooks': './src/hooks',
            '@/lib': './src/lib',
            '@/models': './src/models',
            '@/services': './src/services',
            '@/stores': './src/stores',
            '@/types': './src/types',
            '@/utils': './src/utils',
          },
        },
      ],
      // WatermelonDB decorator support
      ['@babel/plugin-proposal-decorators', { legacy: true }],
      'react-native-reanimated/plugin',
    ],
  };
};
