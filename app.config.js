// Dynamic wrapper around app.json so web builds can target either root ("")
// or a subpath (e.g. "/Spark-Love" on GitHub Pages) via EXPO_PUBLIC_BASE_URL.
module.exports = ({ config }) => {
  const rawBaseUrl = process.env.EXPO_PUBLIC_BASE_URL?.trim() ?? '';
  const baseUrl = rawBaseUrl === '/' ? '' : rawBaseUrl.replace(/\/+$/, '');

  return {
    ...config,
    experiments: {
      ...config.experiments,
      ...(baseUrl ? { baseUrl } : {}),
    },
  };
};
