"use client";
import { useState } from "react";

export default function PreviewLockPage() {
  const [pass, setPass] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    try {
      const res = await fetch("/api/preview-lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pass }),
      });
      if (res.ok) {
        window.location.href = "/";
      } else {
        const t = await res.text();
        setMsg(t || "Clave incorrecta");
      }
    } catch (err) {
      setMsg("Error de red");
    }
  }

  return (
    <main style={{minHeight:"100vh", display:"grid", placeItems:"center", padding:"24px", fontFamily:"system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"}}>
      <form onSubmit={submit} style={{width:"100%", maxWidth:"420px", border:"1px solid #e5e7eb", borderRadius:"12px", padding:"24px", boxShadow:"0 4px 10px rgba(0,0,0,0.06)"}}>
        <h1 style={{fontSize:"20px", marginBottom:"12px"}}>Acceso a Preview</h1>
        <p style={{fontSize:"14px", color:"#6b7280", marginBottom:"16px"}}>Ingresá la clave de acceso para ver esta versión.</p>
        <label htmlFor="pass" style={{display:"block", fontSize:"14px", marginBottom:"6px"}}>Clave</label>
        <input id="pass" type="password" value={pass} onChange={e=>setPass(e.target.value)}
               style={{width:"100%", padding:"10px 12px", border:"1px solid #d1d5db", borderRadius:"8px"}} />
        <button type="submit" style={{marginTop:"14px", width:"100%", padding:"10px 12px", border:"0", borderRadius:"8px", background:"#111827", color:"#fff"}}>
          Entrar
        </button>
        {msg && <p style={{marginTop:"10px", color:"#b91c1c"}}>{msg}</p>}
      </form>
    </main>
  );
}
