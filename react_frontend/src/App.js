import React, { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

/**
 * Smart GIS Viewer (frontend-only UI scaffold)
 * - Full-screen "map" surface (placeholder; swap in real map library later)
 * - Minimal top header with search + filters
 * - Floating AI assistant chat button bottom-right with slide-in panel
 */

// PUBLIC_INTERFACE
function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [layer, setLayer] = useState("streets");
  const [showBoundaries, setShowBoundaries] = useState(true);
  const [showPointsOfInterest, setShowPointsOfInterest] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const [chatMessages, setChatMessages] = useState(() => [
    {
      id: "m1",
      role: "assistant",
      content:
        "Hi! Ask me about the map (e.g., “Show parks near downtown” or “What’s the zoning here?”).",
    },
  ]);
  const [chatInput, setChatInput] = useState("");

  const mapRef = useRef(null);
  const endOfMessagesRef = useRef(null);

  // Keep the UI feeling like a GIS viewer by updating the "map status bar" text.
  const mapStatusText = useMemo(() => {
    const active = [];
    if (showBoundaries) active.push("Boundaries");
    if (showPointsOfInterest) active.push("POIs");
    if (searchQuery.trim()) active.push(`Search: “${searchQuery.trim()}”`);
    return `${layer.toUpperCase()} • ${active.length ? active.join(" • ") : "No filters"}`;
  }, [layer, showBoundaries, showPointsOfInterest, searchQuery]);

  useEffect(() => {
    // Ensure the app occupies the full viewport without relying on external layout wrappers.
    document.documentElement.setAttribute("data-theme", "light");
  }, []);

  useEffect(() => {
    // Auto-scroll chat to the latest message.
    if (isChatOpen) {
      endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isChatOpen]);

  const backendBase =
    process.env.REACT_APP_API_BASE ||
    process.env.REACT_APP_BACKEND_URL ||
    "";

  // PUBLIC_INTERFACE
  const toggleChat = () => setIsChatOpen((v) => !v);

  // PUBLIC_INTERFACE
  const handleMapClick = (e) => {
    // Placeholder: a real map integration would convert click to lat/lng.
    // Here we compute relative click position just to provide meaningful UI feedback.
    if (!mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    setChatMessages((prev) => [
      ...prev,
      {
        id: `u-${Date.now()}`,
        role: "user",
        content: `Clicked map at approx. x=${(x * 100).toFixed(1)}%, y=${(y * 100).toFixed(1)}%.`,
      },
      {
        id: `a-${Date.now()}-2`,
        role: "assistant",
        content:
          "I can’t geocode that yet (map engine not connected). If you integrate a GIS SDK, I can respond with real coordinates and nearby features.",
      },
    ]);
    setIsChatOpen(true);
  };

  // PUBLIC_INTERFACE
  const handleSubmitChat = async (e) => {
    e.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed) return;

    const userMsg = { id: `u-${Date.now()}`, role: "user", content: trimmed };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");

    // Frontend-only fallback "assistant" response.
    // If a backend exists later, post to `${backendBase}/...` here.
    try {
      let assistantText =
        "Got it. (AI backend not connected yet.) Try: use the filters above, or click the map to add context.";

      // Lightweight optional behavior: if an API base is provided, we can attempt a health ping.
      // This is intentionally non-blocking for the UX; failures are silently handled.
      if (backendBase) {
        // Try a simple GET; do not assume any endpoint shape.
        // Many templates provide /health or similar; if it 404s, we still proceed.
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), 1500);
        try {
          const res = await fetch(backendBase, {
            method: "GET",
            signal: controller.signal,
          });
          clearTimeout(t);
          if (res.ok) {
            assistantText =
              "Backend reachable. Hook me up to your AI endpoint and I can answer with live GIS insights.";
          }
        } catch {
          // ignore
        }
      }

      setChatMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: "assistant", content: assistantText },
      ]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content:
            "Something went wrong sending that message. Please try again.",
        },
      ]);
    }
  };

  return (
    <div className="SgvApp">
      <header className="SgvHeader" role="banner">
        <div className="SgvHeader__left">
          <div className="SgvBrand" aria-label="Smart GIS Viewer">
            <span className="SgvBrand__mark" aria-hidden="true" />
            <div className="SgvBrand__text">
              <div className="SgvBrand__title">Smart GIS Viewer</div>
              <div className="SgvBrand__subtitle">Civic-tech map console</div>
            </div>
          </div>
        </div>

        <div className="SgvHeader__center" role="search">
          <label className="SgvSearch" aria-label="Search places, addresses, or layers">
            <span className="SgvSearch__icon" aria-hidden="true">
              ⌕
            </span>
            <input
              className="SgvSearch__input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search address, parcel, facility, or keyword…"
              type="search"
            />
            {searchQuery ? (
              <button
                type="button"
                className="SgvSearch__clear"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                Clear
              </button>
            ) : null}
          </label>
        </div>

        <div className="SgvHeader__right" aria-label="Map filters">
          <div className="SgvFilters">
            <label className="SgvSelect">
              <span className="SgvSelect__label">Basemap</span>
              <select
                className="SgvSelect__control"
                value={layer}
                onChange={(e) => setLayer(e.target.value)}
                aria-label="Select basemap"
              >
                <option value="streets">Streets</option>
                <option value="satellite">Satellite</option>
                <option value="terrain">Terrain</option>
              </select>
            </label>

            <label className="SgvToggle">
              <input
                type="checkbox"
                checked={showBoundaries}
                onChange={(e) => setShowBoundaries(e.target.checked)}
              />
              <span>Boundaries</span>
            </label>

            <label className="SgvToggle">
              <input
                type="checkbox"
                checked={showPointsOfInterest}
                onChange={(e) => setShowPointsOfInterest(e.target.checked)}
              />
              <span>POIs</span>
            </label>
          </div>
        </div>
      </header>

      <main className="SgvMain" role="main">
        <section
          ref={mapRef}
          className="SgvMap"
          aria-label="Map view"
          onClick={handleMapClick}
        >
          <div className="SgvMap__grid" aria-hidden="true" />
          <div className="SgvMap__attribution">
            Map is a placeholder surface. Integrate a real map SDK (MapLibre/Leaflet) here.
          </div>

          <div className="SgvMap__status" role="status" aria-live="polite">
            <span className="SgvMap__chip">{mapStatusText}</span>
          </div>
        </section>

        {/* Floating AI assistant button */}
        <button
          type="button"
          className="SgvFab"
          onClick={toggleChat}
          aria-label={isChatOpen ? "Close AI assistant" : "Open AI assistant"}
          aria-expanded={isChatOpen}
        >
          <span className="SgvFab__icon" aria-hidden="true">
            AI
          </span>
        </button>

        {/* Slide-in chat panel */}
        <aside
          className={`SgvChat ${isChatOpen ? "is-open" : ""}`}
          aria-label="AI assistant panel"
        >
          <div className="SgvChat__header">
            <div>
              <div className="SgvChat__title">AI Assistant</div>
              <div className="SgvChat__hint">
                Provide context by searching or clicking the map.
              </div>
            </div>
            <button
              type="button"
              className="SgvIconButton"
              onClick={() => setIsChatOpen(false)}
              aria-label="Close AI assistant"
            >
              ✕
            </button>
          </div>

          <div className="SgvChat__messages" role="log" aria-label="Chat messages">
            {chatMessages.map((m) => (
              <div
                key={m.id}
                className={`SgvMsg ${m.role === "user" ? "is-user" : "is-assistant"}`}
              >
                <div className="SgvMsg__bubble">
                  <div className="SgvMsg__role">
                    {m.role === "user" ? "You" : "Assistant"}
                  </div>
                  <div className="SgvMsg__content">{m.content}</div>
                </div>
              </div>
            ))}
            <div ref={endOfMessagesRef} />
          </div>

          <form className="SgvChat__composer" onSubmit={handleSubmitChat}>
            <input
              className="SgvChat__input"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about zoning, permits, facilities…"
              aria-label="Message to AI assistant"
            />
            <button className="SgvChat__send" type="submit">
              Send
            </button>
          </form>

          {backendBase ? (
            <div className="SgvChat__footer" aria-label="Backend info">
              Backend base detected from env: <code>{backendBase}</code>
            </div>
          ) : (
            <div className="SgvChat__footer" aria-label="Backend info">
              Tip: set <code>REACT_APP_API_BASE</code> to connect the assistant to a backend.
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}

export default App;
