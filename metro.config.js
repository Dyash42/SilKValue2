const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// WatermelonDB requires this resolver tweak
config.resolver.sourceExts.push('cjs');

// Ensure flow-typed files are handled
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs'];

module.exports = config;
