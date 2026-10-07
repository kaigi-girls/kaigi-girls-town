/* Visitor counter — anonymous TOTAL only.
   Nothing about the visitor is sent or stored: no IP, no user agent, no IDs, no cookies.
   Interface: { label, hit(): Promise<number|null>, read(): Promise<number|null> }
   To wire a hosted counter later, implement serverCounter's endpoint (POST -> {"count": n}). */
(function () {
  const C = window.KG_CONFIG.counter || { mode: "off" };

  function serverCounter(endpoint) {
    const call = async (method) => {
      const r = await fetch(endpoint, { method, cache: "no-store", credentials: "omit",
        headers: method === "POST" ? { "Content-Type": "application/json" } : {}, body: method === "POST" ? "{}" : undefined });
      if (!r.ok) throw new Error("counter " + r.status);
      const j = await r.json();
      if (typeof j.count !== "number") throw new Error("bad counter response");
      return j.count;
    };
    return { kind: "server", label: "ローカル試作サーバー / local prototype server",
      hit: () => call("POST"), read: () => call("GET") };
  }

  // Demo only: a single number in this browser's localStorage (no ID, no visitor data).
  function localCounter() {
    const K = "kg_town_demo_visits";
    const get = () => parseInt(localStorage.getItem(K) || "0", 10) || 0;
    return { kind: "local", label: "デモ（この端末だけ）/ demo, this device only",
      hit: async () => { const n = get() + 1; localStorage.setItem(K, String(n)); return n; },
      read: async () => get() };
  }

  async function create() {
    if (C.mode === "off") return null;
    if (C.mode === "local") return localCounter();
    if (C.mode === "server") return serverCounter(C.endpoint);
    // auto: probe the local server, fall back to the localStorage demo
    try { const s = serverCounter(C.endpoint); await s.read(); return s; }
    catch (e) { try { return localCounter(); } catch (_) { return null; } }
  }

  window.KG_COUNTER = { create };
})();
