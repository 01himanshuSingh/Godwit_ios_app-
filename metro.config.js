const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Resolve `firebase/auth` to the React Native build (getReactNativePersistence, etc.).
config.resolver.unstable_conditionNames = ['react-native', 'browser', 'require'];

module.exports = config;
