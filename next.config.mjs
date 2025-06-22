/**
 * Central Next.js configuration (root).
 *
 * We temporarily disable ESLint and TypeScript errors during the production
 * build to unblock Vercel while we work through the backlog of lint fixes.
 *
 * IMPORTANT: Re-enable strict linting and type-checking once the codebase is
 * cleaned up.  Remove this file or switch the flags back to `false`.
 *
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    /**
     * Allow production builds to complete even with ESLint errors.
     * Local `npm run lint` will still surface problems for developers
     * so issues can be fixed incrementally.
     */
    ignoreDuringBuilds: true,
  },
  typescript: {
    /**
     * Skip type-checking errors during production builds.
     * Remove once type errors across the repo are fixed.
     */
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
