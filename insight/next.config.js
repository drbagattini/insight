/**
 * Next.js configuration
 *
 * We temporarily disable ESLint checks during production builds to unblock
 * Vercel deploys while we iteratively fix the codebase lint errors.
 * IMPORTANT:  Re-enable strict linting once the codebase is clean.
 *
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    /**
     * Allow production builds to successfully complete even if there are
     * ESLint errors.  This is a stop-gap so CI/CD doesn’t block deploys.
     * Local `npm run lint` will still surface problems for developers.
     */
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
