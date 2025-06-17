"use client";

import { useState } from "react";

export default function TestSendPage() {
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [canal, setCanal] = useState<"email" | "whatsapp">("email");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/test-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, whatsapp, canal }),
      });
      const data = await res.json();
      if (res.ok) setResult(`Éxito: ${JSON.stringify(data)}`);
      else setResult(`Error: ${data.error}`);
    } catch (err) {
      setResult(`Fetch error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Formulario de Test de Envío</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded px-2 py-1"
            placeholder="destino@ejemplo.com"
          />
        </div>
        <div>
          <label className="block mb-1">WhatsApp</label>
          <input
            type="text"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            className="w-full border rounded px-2 py-1"
            placeholder="+59812345678"
          />
        </div>
        <div>
          <label className="block mb-1">Canal</label>
          <select
            value={canal}
            onChange={(e) => setCanal(e.target.value as any)}
            className="w-full border rounded px-2 py-1"
          >
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white rounded px-4 py-2"
        >
          {loading ? "Enviando..." : "Enviar Test"}
        </button>
      </form>
      {result && (
        <div className="mt-4 p-2 border rounded break-words">
          {result}
        </div>
      )}
    </div>
  );
}
