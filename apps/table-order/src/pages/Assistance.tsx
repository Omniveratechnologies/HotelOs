import { useState } from "react";
import {
  Bell,
  Coffee,
  FileText,
  MessageCircle,
  Send,
  Utensils,
} from "lucide-react";
import { useParams } from "react-router-dom";
import { PageHeader } from "../components/Layout";
import { useCart } from "../context/CartContext";
import { api } from "../services/api";
import type { ServiceRequestType } from "../types";
const actions: Array<[ServiceRequestType, string, string, typeof Bell]> = [
  [
    "CALL_WAITER",
    "Call Waiter",
    "A team member will be with you shortly",
    Bell,
  ],
  [
    "REQUEST_BILL",
    "Request Bill",
    "We will bring your bill to the table",
    FileText,
  ],
  ["REQUEST_WATER", "Request Water", "Fresh water is on its way", Coffee],
  ["REQUEST_CUTLERY", "Request Cutlery", "Cutlery is on its way", Utensils],
];
export default function Assistance() {
  const { hotelId = "", tableId = "" } = useParams();
  useCart();
  const [message, setMessage] = useState("");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [custom, setCustom] = useState("");
  async function send(type: ServiceRequestType, description = "") {
    try {
      await api.createServiceRequest({ hotelId, tableId, type, description });
      setMessage("Request sent. We’ll be with you shortly.");
      window.setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage((error as Error).message);
    }
  }
  return (
    <main className="page">
      <PageHeader title="At your service" />
      <div className="assistance-intro">
        <span className="eyebrow">TABLE ASSISTANCE</span>
        <h1>
          How can we
          <br />
          <em>help?</em>
        </h1>
        <p>One tap and our team will take care of the rest.</p>
      </div>
      <div className="assist-grid">
        {actions.map(([type, label, detail, Icon]) => (
          <button key={type} onClick={() => send(type)}>
            <Icon size={22} />
            <strong>{label}</strong>
            <small>{detail}</small>
          </button>
        ))}
        <button onClick={() => setFeedbackOpen(!feedbackOpen)}>
          <MessageCircle size={22} />
          <strong>Food Feedback</strong>
          <small>Tell us about your meal</small>
        </button>
        <button onClick={() => setCustomOpen(!customOpen)}>
          <Send size={22} />
          <strong>Other Request</strong>
          <small>Send a note to the team</small>
        </button>
      </div>
      {feedbackOpen && (
        <div className="inline-form">
          <label className="field-label">
            Your feedback
            <textarea
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              placeholder="What did you think?"
            />
          </label>
          <button
            className="button primary"
            onClick={() => send("FEEDBACK", feedback)}
          >
            Send feedback
          </button>
        </div>
      )}
      {customOpen && (
        <div className="inline-form">
          <label className="field-label">
            Your request
            <textarea
              value={custom}
              onChange={(event) => setCustom(event.target.value)}
              placeholder="Tell us what you need"
            />
          </label>
          <button
            className="button primary"
            onClick={() => send("OTHER", custom)}
          >
            Send request
          </button>
        </div>
      )}
      {message && <div className="toast">{message}</div>}
    </main>
  );
}
