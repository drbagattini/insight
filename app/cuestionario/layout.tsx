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
  // Los layouts anidados no deben renderizar <html> o <body>.
  // Esas etiquetas son manejadas por el layout raíz (app/layout.tsx).
  // Si se necesita un contenedor específico para esta sección, se puede usar un <div>.
  // Por ahora, simplemente devolvemos los children, o un fragmento si es necesario.
  return <>{children}</>;
  // Alternativamente, si cuestionario.css necesita un elemento específico para aplicar estilos:
  // return <div className="cuestionario-container">{children}</div>;
}
