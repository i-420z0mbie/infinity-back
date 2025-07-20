module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'], // this replaces "expo-router/babel"
  };
};
