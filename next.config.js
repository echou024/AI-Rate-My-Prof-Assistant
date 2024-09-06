/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Ignore onnxruntime-node binary files
    config.externals.push({
      'onnxruntime-node': 'commonjs onnxruntime-node',
    });

    return config;
  },
};

module.exports = nextConfig;
