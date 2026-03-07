/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [{ source: "/", destination: "/edit", permanent: false }];
  },
  reactCompiler: true,
};

module.exports = nextConfig;
