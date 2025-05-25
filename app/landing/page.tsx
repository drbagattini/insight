'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function LandingPage() {
  useEffect(() => {
    // Smooth scrolling for anchor links
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
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 overflow-y-auto">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            {/* Insight Logo - i in a circle */}
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
            <Link 
              href="/auth/register" 
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Registrarse
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 pt-16 pb-12 max-w-7xl mx-auto text-center">
        <div className="mb-8">
          {/* Large Logo for Hero */}
          <svg width="80" height="80" viewBox="0 0 80 80" className="mx-auto text-blue-600 mb-6">
            <circle cx="40" cy="40" r="36" fill="currentColor" />
            <text x="40" y="54" textAnchor="middle" className="text-white text-4xl font-bold" fill="white">i</text>
          </svg>
        </div>
        <h2 className="text-5xl font-bold text-gray-900 mb-6">
          Plataforma Integral de Gestión Clínica
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Insight revoluciona la práctica psicológica combinando tecnología avanzada con un enfoque 
          centrado en el paciente. Gestione sus consultas, historiales clínicos y seguimientos de 
          manera eficiente y segura.
        </p>
        <div className="flex gap-4 justify-center">
          <Link 
            href="/auth/register" 
            className="bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700 transition-colors text-lg font-semibold"
          >
            Comenzar Ahora
          </Link>
          <a 
            href="#features" 
            className="border border-gray-300 text-gray-700 px-8 py-3 rounded-md hover:bg-gray-50 transition-colors text-lg font-semibold cursor-pointer"
          >
            Conocer Más
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-6 py-16 bg-white">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Características Principales
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <h4 className="text-xl font-semibold text-gray-900 mb-3">
                Gestión de Pacientes
              </h4>
              <p className="text-gray-600">
                Mantenga un registro completo y organizado de todos sus pacientes. 
                Acceda a historiales clínicos, notas de sesiones y evolución del 
                tratamiento en un solo lugar.
              </p>
            </div>
            <div className="text-center p-6">
              <h4 className="text-xl font-semibold text-gray-900 mb-3">
                Agenda Inteligente
              </h4>
              <p className="text-gray-600">
                Optimice su tiempo con nuestro sistema de agendamiento inteligente. 
                Gestione citas, recordatorios automáticos y disponibilidad horaria 
                de manera eficiente.
              </p>
            </div>
            <div className="text-center p-6">
              <h4 className="text-xl font-semibold text-gray-900 mb-3">
                Seguridad y Privacidad
              </h4>
              <p className="text-gray-600">
                Sus datos y los de sus pacientes están protegidos con los más altos 
                estándares de seguridad. Cumplimos con todas las normativas de 
                protección de datos médicos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="px-6 py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            ¿Por qué elegir Insight?
          </h3>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h4 className="text-2xl font-semibold text-gray-900 mb-4">
                Diseñado por y para Profesionales
              </h4>
              <p className="text-gray-600 mb-6">
                Insight fue desarrollado en colaboración directa con psicólogos y 
                profesionales de la salud mental. Cada característica ha sido pensada 
                para facilitar el trabajo diario y mejorar la calidad de atención.
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  <span>Interfaz intuitiva y fácil de usar</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  <span>Acceso desde cualquier dispositivo</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  <span>Soporte técnico especializado</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  <span>Actualizaciones constantes</span>
                </li>
              </ul>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h5 className="text-xl font-semibold text-gray-900 mb-4">
                Comience su prueba gratuita
              </h5>
              <p className="text-gray-600 mb-6">
                Experimente todas las funcionalidades de Insight sin compromiso. 
                No se requiere tarjeta de crédito.
              </p>
              <Link 
                href="/auth/register" 
                className="block w-full text-center bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-semibold"
              >
                Crear Cuenta Gratuita
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="px-6 py-16 bg-white">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Lo que dicen nuestros usuarios
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-600 mb-4 italic">
                "Insight ha transformado completamente la manera en que gestiono 
                mi consulta. La organización de expedientes y el seguimiento de 
                pacientes nunca había sido tan simple."
              </p>
              <p className="font-semibold text-gray-900">Dra. María González</p>
              <p className="text-sm text-gray-500">Psicóloga Clínica</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-600 mb-4 italic">
                "La seguridad y privacidad que ofrece Insight me da tranquilidad 
                total. Sé que la información de mis pacientes está protegida con 
                los más altos estándares."
              </p>
              <p className="font-semibold text-gray-900">Dr. Carlos Ruiz</p>
              <p className="text-sm text-gray-500">Psicoterapeuta</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-600 mb-4 italic">
                "El sistema de agendamiento es excelente. Mis pacientes reciben 
                recordatorios automáticos y yo puedo organizar mi agenda de manera 
                mucho más eficiente."
              </p>
              <p className="font-semibold text-gray-900">Lic. Ana Martínez</p>
              <p className="text-sm text-gray-500">Psicóloga Educativa</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-16 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold text-white mb-4">
            ¿Listo para mejorar su práctica profesional?
          </h3>
          <p className="text-xl text-blue-100 mb-8">
            Únase a miles de profesionales que ya confían en Insight para gestionar 
            sus consultas de manera más eficiente.
          </p>
          <div className="flex gap-4 justify-center">
            <Link 
              href="/auth/register" 
              className="bg-white text-blue-600 px-8 py-3 rounded-md hover:bg-gray-100 transition-colors text-lg font-semibold"
            >
              Comenzar Gratis
            </Link>
            <Link 
              href="/auth/login" 
              className="border border-white text-white px-8 py-3 rounded-md hover:bg-blue-700 transition-colors text-lg font-semibold"
            >
              Iniciar Sesión
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
    </div>
  );
}
