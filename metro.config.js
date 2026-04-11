const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// WatermelonDB requires cjs + mjs support
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs', 'mjs'];

// Block Node-only modules from being bundled on web/native
const STUB_MODULES = new Set([
  'better-sqlite3',
  'fs',
  'path',
]);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (STUB_MODULES.has(moduleName)) {
    // Return an empty module so the bundle doesn't fail
    return {
      filePath: path.resolve(__dirname, 'src/lib/stubs/empty.js'),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
