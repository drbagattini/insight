'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import './scrollFix.css';

export default function LandingPage() {
  useEffect(() => {
    const handleSmoothScroll = (e: MouseEvent) => {
      const target = e.target as HTMLAnchorElement;
      if (target.hash && target.pathname === window.location.pathname) {
        e.preventDefault();
        const element = document.querySelector(target.hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    };

    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
      link.addEventListener('click', handleSmoothScroll as EventListener);
    });

    return () => {
      links.forEach(link => {
        link.removeEventListener('click', handleSmoothScroll as EventListener);
      });
    };
  }, []);

  return (
    <>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow-md z-50 py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <svg width="32" height="32" viewBox="0 0 40 40" className="text-blue-600">
              <circle cx="20" cy="20" r="18" fill="currentColor" />
              <text x="20" y="27" textAnchor="middle" className="text-white text-xl font-bold" fill="white">i</text>
            </svg>
            <h1 className="text-2xl font-bold text-gray-900">Insight</h1>
          </div>
          <div className="space-x-4">
            <Link href="/auth/login" className="text-gray-600 hover:text-gray-900 transition-colors">
              Iniciar Sesión
            </Link>
            <Link href="/auth/register" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
              Registrarse
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 bg-gray-50 text-gray-800">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-blue-50 to-white py-16 px-4">
          <div className="container mx-auto text-center">
            <div className="flex justify-center items-center mb-6">
              {/* Logo Centro Universitario UNO */}
              <div className="relative h-20 flex items-center"> {/* Aumentado a h-20 */}
                <img 
                  src="/images/centro-uno-logo.png" 
                  alt="Centro Universitario UNO" 
                  className="h-20 w-auto object-contain max-h-full" /* Aumentado a h-20 */
                  onError={(e) => {
                    // Fallback si la imagen no se encuentra
                    const target = e.currentTarget as HTMLImageElement;
                    const fallbackText = target.nextElementSibling as HTMLElement;
                    if (target) target.style.display = 'none';
                    if (fallbackText) fallbackText.classList.remove('hidden');
                  }}
                />
                <div className="hidden text-2xl font-semibold text-gray-700">
                  Logo Centro Universitario UNO
                </div>
              </div>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Un proyecto de investigación para transformar la práctica clínica de la psicoterapia
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Desarrollado por el Centro Universitario UNO, Insight es una herramienta que se integra fácilmente a tu práctica clínica.
            </p>
            <div className="space-x-4">
              <Link href="/auth/register" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors text-lg font-semibold">
                Registrarse
              </Link>
              <Link href="/auth/login" className="inline-block border border-blue-600 text-blue-600 px-6 py-3 rounded-md hover:bg-blue-50 transition-colors text-lg font-semibold">
                Ingresar a la plataforma
              </Link>
            </div>
          </div>
        </section>

        {/* Vision y Aval Academico */}
        <section id="vision" className="py-16 px-4 bg-white">
          <div className="container mx-auto max-w-3xl text-center">
            <h3 className="text-3xl font-bold text-gray-900 mb-6">
              Visión y Aval Académico
            </h3>
            <p className="text-gray-700 leading-relaxed">
              Insight es una iniciativa de investigación aplicada del Centro Universitario UNO, comprometida con el avance de la salud mental a través de la tecnología. Nuestra plataforma está diseñada para evolucionar, incorporando la atención basada en datos y la inteligencia artificial para la formulación clínica y la supervisión asistida, siempre bajo los más altos estándares éticos y científicos.
            </p>
          </div>
        </section>

        {/* Beneficios Clave */}
        <section id="beneficios" className="bg-gray-50 py-16 px-4">
          <div className="container mx-auto">
            <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Beneficios Clave
            </h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow text-center">
                <div className="w-16 h-16 mx-auto mb-4 text-blue-600">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">Seguimiento Continuo y Automatizado</h4>
                <p className="text-gray-600">Monitorización remota y en tiempo real del progreso de los pacientes con datos de cuestionarios validados por investigación.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow text-center">
                <div className="w-16 h-16 mx-auto mb-4 text-blue-600">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">Análisis Inteligente <span className="text-sm text-blue-500">(Módulo IA en desarrollo)</span></h4>
                <p className="text-gray-600">Identificación de patrones y predicción de tendencias con IA.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow text-center">
                <div className="w-16 h-16 mx-auto mb-4 text-blue-600">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">Supervisión Colaborativa <span className="text-sm text-blue-500">(Road-map)</span></h4>
                <p className="text-gray-600">Facilita la supervisión clínica y la colaboración entre profesionales.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Como Funciona */}
        <section id="como-funciona" className="py-16 px-4 bg-white">
          <div className="container mx-auto">
            <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Cómo Funciona Insight
            </h3>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-600">1</span>
                </div>
                <h4 className="text-xl font-semibold mb-2">Registro del Profesional</h4>
                <p className="text-gray-600">Crea tu cuenta y configura tu perfil profesional en minutos.</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-600">2</span>
                </div>
                <h4 className="text-xl font-semibold mb-2">Integración de Pacientes</h4>
                <p className="text-gray-600">Invita a tus pacientes a completar cuestionarios validados.</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-600">3</span>
                </div>
                <h4 className="text-xl font-semibold mb-2">Monitoreo y Análisis</h4>
                <p className="text-gray-600">Visualiza el progreso y recibe insights basados en datos.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Planes y Licenciamiento */}
        <section id="planes" className="py-16 px-4 bg-gray-50">
          <div className="container mx-auto">
            <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Planes y Licenciamiento
            </h3>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="bg-white p-8 rounded-lg shadow-md">
                <h4 className="text-2xl font-bold mb-4">Investigadores</h4>
                <p className="text-gray-600 mb-6">Acceso completo para proyectos de investigación académica.</p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Datos anonimizados
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Exportación de datos
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Análisis estadísticos
                  </li>
                </ul>
              </div>
              <div className="bg-white p-8 rounded-lg shadow-md border-2 border-blue-500">
                <div className="bg-blue-500 text-white text-sm font-semibold px-3 py-1 rounded-full inline-block mb-4">
                  MÁS POPULAR
                </div>
                <h4 className="text-2xl font-bold mb-4">Profesionales</h4>
                <p className="text-gray-600 mb-6">Ideal para psicólogos en práctica privada.</p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Hasta 50 pacientes activos
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Dashboard personalizado
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Soporte prioritario
                  </li>
                </ul>
              </div>
              <div className="bg-white p-8 rounded-lg shadow-md">
                <h4 className="text-2xl font-bold mb-4">Instituciones</h4>
                <p className="text-gray-600 mb-6">Soluciones personalizadas para clínicas y centros de salud.</p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Usuarios ilimitados
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Integración con sistemas
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Capacitación incluida
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section id="faqs" className="py-16 px-4 bg-white">
          <div className="container mx-auto max-w-3xl">
            <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Preguntas Frecuentes
            </h3>
            <div className="space-y-6">
              <div className="border-b pb-6">
                <h4 className="text-xl font-semibold mb-2">¿Cómo se protege la privacidad de los datos?</h4>
                <p className="text-gray-600">Utilizamos encriptación de extremo a extremo y cumplimos con todas las normativas de protección de datos. Los datos están alojados en servidores seguros y solo el profesional tratante tiene acceso a la información de sus pacientes.</p>
              </div>
              <div className="border-b pb-6">
                <h4 className="text-xl font-semibold mb-2">¿Puedo integrar Insight con mi sistema actual?</h4>
                <p className="text-gray-600">Sí, ofrecemos APIs y webhooks para integración con sistemas de gestión clínica existentes. Nuestro equipo técnico puede asistirte en el proceso de integración.</p>
              </div>
              <div className="border-b pb-6">
                <h4 className="text-xl font-semibold mb-2">¿Qué tipo de soporte ofrecen?</h4>
                <p className="text-gray-600">Ofrecemos soporte técnico por email y chat, documentación completa, tutoriales en video, y sesiones de capacitación personalizadas para instituciones.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section id="cta" className="py-16 px-4 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="container mx-auto text-center">
            <h3 className="text-3xl font-bold text-white mb-4">
              Transforma tu práctica clínica hoy
            </h3>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Únete a la comunidad de profesionales que están revolucionando la atención en salud mental con datos e inteligencia artificial.
            </p>
            <div className="space-x-4">
              <Link 
                href="/auth/register" 
                className="inline-block bg-white text-blue-600 px-8 py-3 rounded-md hover:bg-gray-100 transition-colors text-lg font-semibold"
              >
                Comenzar Gratis
              </Link>
              <Link 
                href="mailto:investigacion@centrouno.edu.uy" 
                className="inline-block border border-white text-white px-8 py-3 rounded-md hover:bg-blue-800 transition-colors text-lg font-semibold"
              >
                Solicitar Demo
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-6 py-8 bg-gray-900 text-gray-400">
          <div className="max-w-7xl mx-auto text-center">
            <p>&copy; 2024 Insight. Todos los derechos reservados.</p>
            <p className="mt-2">
              Plataforma de Gestión Clínica para Profesionales de la Salud Mental
            </p>
            <p className="mt-2">
              Contacto: <a href="mailto:investigacion@centrouno.edu.uy" className="hover:text-white transition-colors">investigacion@centrouno.edu.uy</a>
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
