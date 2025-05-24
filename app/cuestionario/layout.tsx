import type { Metadata } from 'next';
import './cuestionario.css';

export const metadata: Metadata = {
  title: 'Cuestionario',
  description: 'Complete el cuestionario',
};

export default function CuestionarioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="cuestionario-body">
        {children}
      </body>
    </html>
  );
}
