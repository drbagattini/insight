/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      {
        source: '/dashboard/patients/:patientId', // only match when a patientId is provided
        destination: '/dashboard/perfil-del-paciente/:patientId',
        permanent: true,
      }
    ];
  },
};

export default nextConfig;
