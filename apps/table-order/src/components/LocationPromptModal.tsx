import { MapPin, AlertCircle, RefreshCw, X } from "lucide-react";
import { useSession } from "../context/SessionContext";

export function LocationPromptModal() {
  const {
    promptLocationModal,
    setPromptLocationModal,
    locationStatus,
    locationError,
    sessionError,
    ensureAuthenticatedSession,
  } = useSession();

  if (!promptLocationModal) return null;

  async function handleRetry() {
    try {
      await ensureAuthenticatedSession();
    } catch {
      // Errors handled within SessionContext
    }
  }

  const isAcquiring = locationStatus === "ACQUIRING";
  const errorMessage = locationError || sessionError;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          maxWidth: "440px",
          width: "100%",
          padding: "24px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
          color: "#1e293b",
          fontFamily: "inherit",
          position: "relative",
        }}
      >
        <button
          onClick={() => setPromptLocationModal(false)}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#64748b",
          }}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              backgroundColor: errorMessage ? "#fee2e2" : "#e0f2fe",
              color: errorMessage ? "#ef4444" : "#0284c7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
            }}
          >
            {errorMessage ? <AlertCircle size={28} /> : <MapPin size={28} />}
          </div>

          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 8px" }}>
            {errorMessage
              ? "Location Verification Needed"
              : "Confirm Table Presence"}
          </h2>
          <p
            style={{
              fontSize: "14px",
              color: "#64748b",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            To protect your order and verify you are dining at this table,
            HotelOS requires browser location access.
          </p>
        </div>

        {errorMessage && (
          <div
            style={{
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              padding: "12px",
              borderRadius: "10px",
              fontSize: "13px",
              lineHeight: 1.4,
              marginBottom: "16px",
            }}
          >
            {errorMessage}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button
            onClick={handleRetry}
            disabled={isAcquiring}
            style={{
              backgroundColor: "#0284c7",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              padding: "12px 16px",
              fontSize: "15px",
              fontWeight: 600,
              cursor: isAcquiring ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              opacity: isAcquiring ? 0.7 : 1,
            }}
          >
            {isAcquiring ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>Checking your location…</span>
              </>
            ) : (
              <span>Allow Location &amp; Continue</span>
            )}
          </button>

          <button
            onClick={() => setPromptLocationModal(false)}
            style={{
              backgroundColor: "#f1f5f9",
              color: "#475569",
              border: "none",
              borderRadius: "10px",
              padding: "10px 16px",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Browse Menu First
          </button>
        </div>

        <p
          style={{
            fontSize: "11px",
            color: "#94a3b8",
            textAlign: "center",
            marginTop: "14px",
            marginBottom: 0,
          }}
        >
          Coordinates are used solely to verify physical table proximity and are
          never sold or shared.
        </p>
      </div>
    </div>
  );
}
