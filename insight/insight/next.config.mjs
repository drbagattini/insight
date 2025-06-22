/** @type {import('next').NextConfig} */
const nextConfig = {
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
