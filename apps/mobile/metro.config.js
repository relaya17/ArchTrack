/**
 * Metro configuration for Expo app in pnpm monorepo
 */
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Watch the monorepo root to resolve symlinks/node_modules hoisting
config.watchFolders = [workspaceRoot];

// Ensure resolving modules from the root node_modules too
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Handle common extensions
config.resolver.sourceExts = [...config.resolver.sourceExts, "cjs"];
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
