const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Platform-specific resolver to handle react-native-maps on web
config.resolver.platforms = ["ios", "android", "native", "web"];

// Add platform-specific module resolution
config.resolver.resolverMainFields = ["react-native", "browser", "main"];

// Platform-specific handling for react-native-maps
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Exclude react-native-maps on web platform
  if (platform === "web" && moduleName.startsWith("react-native-maps")) {
    return {
      type: "empty",
    };
  }
  
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  
  return context.resolveRequest(context, moduleName, platform);
};

// Reduce the number of workers to decrease resource usage
config.maxWorkers = 2;

module.exports = config;
