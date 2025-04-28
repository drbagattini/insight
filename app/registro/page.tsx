"use client";

import { useState, ChangeEvent, FormEvent } from "react";

interface FormState {
  nombre: string;
  apellido: string;
  email: string;
  whatsapp: string;
  edad: string;
  canal: "email" | "whatsapp" | "ambos";
  frecuencia: "semanal" | "mensual" | "trimestral";
}

export default function RegistroPage() {
  const [form, setForm] = useState<FormState>({
    nombre: "",
    apellido: "",
    email: "",
    whatsapp: "",
    edad: "",
    canal: "email",
    frecuencia: "semanal",
  });
  const [status, setStatus] = useState<{ success: boolean; message: string } | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus(null);
    try {
      const payload = {
        nombre: form.nombre,
        apellido: form.apellido,
        email: form.email,
        whatsapp: form.whatsapp,
        edad: Number(form.edad),
        canal: form.canal,
        frecuencia: form.frecuencia,
      };
      const res = await fetch("/api/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus({ success: true, message: "Registro exitoso." });
        setForm({ nombre: "", apellido: "", email: "", whatsapp: "", edad: "", canal: "email", frecuencia: "semanal" });
      } else {
        setStatus({ success: false, message: data.error || "Error en el registro." });
      }
    } catch (err: any) {
      setStatus({ success: false, message: err.message });
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-semibold mb-4">Registro de Paciente</h1>
      {status && (
        <div className={`mb-4 p-2 rounded ${status.success ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {status.message}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Nombre</label>
          <input
            type="text"
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            required
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Apellido</label>
          <input
            type="text"
            name="apellido"
            value={form.apellido}
            onChange={handleChange}
            required
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">WhatsApp</label>
          <input
            type="text"
            name="whatsapp"
            value={form.whatsapp}
            onChange={handleChange}
            required
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Edad</label>
          <input
            type="number"
            name="edad"
            value={form.edad}
            onChange={handleChange}
            required
            min="0"
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Canal de Envío</label>
          <select
            name="canal"
            value={form.canal}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
          >
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="ambos">Ambos</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Frecuencia</label>
          <select
            name="frecuencia"
            value={form.frecuencia}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
          >
            <option value="semanal">Semanal</option>
            <option value="mensual">Mensual</option>
            <option value="trimestral">Trimestral</option>
          </select>
        </div>
        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Registrarse
        </button>
      </form>
    </div>
  );
}
