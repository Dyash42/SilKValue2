module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Path aliases — must match tsconfig paths
      // IMPORTANT: more-specific prefixes must come before '@' to avoid '@' eating them first
      [
        'module-resolver',
        {
          root: ['.'],
          alias: {
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
            '@': './src',
          },
        },
      ],
      // WatermelonDB decorator support
      // NOTE: legacy decorators MUST come before class-properties,
      // and class-properties MUST use loose:true to avoid "definite assignment" clash
      ['@babel/plugin-proposal-decorators', { legacy: true }],
      ['@babel/plugin-proposal-class-properties', { loose: true }],
      'react-native-reanimated/plugin',
    ],
  };
};
