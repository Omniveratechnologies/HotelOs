import { useState } from "react";

import { Input } from "./ui/Input.jsx";
import { sendReceptionistInvitation } from "../services/invitation.service.js";

export default function AddMembers({ onInvited }) {
  const [showReceptionistForm, setShowReceptionistForm] = useState(false);

  const [receptionistData, setReceptionistData] = useState({
    name: "",
    username: "",
    email: "",
  });

  const [sendingInvite, setSendingInvite] = useState(false);

  const [inviteMessage, setInviteMessage] = useState("");

  const [receptionistInviteError, setReceptionistInviteError] = useState({
    name: "",
    username: "",
    email: "",
    other: "",
  });

  const handleReceptionistInputChange = (e) => {
    const { name, value } = e.target;

    setReceptionistData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSendReceptionistInvite = async (e) => {
    e.preventDefault();

    setInviteMessage("");
    setReceptionistInviteError({});

    // check each required field is filled
    if (
      !receptionistData.name ||
      !receptionistData.username ||
      !receptionistData.email
    ) {
      setReceptionistInviteError((prevErrors) => ({
        ...prevErrors,
        name: "Name is required.",
      }));
      return;
    }

    if (!receptionistData.username) {
      setReceptionistInviteError((prevErrors) => ({
        ...prevErrors,
        username: "Username is required.",
      }));
      return;
    }

    if (!receptionistData.email) {
      setReceptionistInviteError((prevErrors) => ({
        ...prevErrors,
        email: "Email is required.",
      }));
      return;
    }

    if (!receptionistData.email.includes("@")) {
      setReceptionistInviteError((prevErrors) => ({
        ...prevErrors,
        email: "Please enter a valid email address.",
      }));
      return;
    }

    try {
      setSendingInvite(true);

      await sendReceptionistInvitation(receptionistData);

      setInviteMessage(
        `Invitation sent successfully to ${receptionistData.email}`,
      );

      setReceptionistData({
        name: "",
        username: "",
        email: "",
      });

      onInvited?.();
    } catch (error) {
      console.error("Receptionist invitation error:", error);

      setReceptionistInviteError((prevErrors) => ({
        ...prevErrors,
        other: error.message || "Failed to send receptionist invitation.",
      }));
    } finally {
      setSendingInvite(false);
    }
  };

  return (
    <div className="border-beige-border bg-cream shadow-card mb-8 rounded-2xl border p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-navy text-xl font-semibold">
            Add Members
          </h2>

          <p className="text-muted mt-1 text-sm">
            Add staff members to your hotel.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowReceptionistForm(!showReceptionistForm);

            setInviteMessage("");
            setReceptionistInviteError({});
          }}
          className="bg-navy text-cream inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 font-medium transition hover:opacity-90"
        >
          <span className="text-lg">{showReceptionistForm ? "-" : "+"}</span>
          Add Receptionist
        </button>
      </div>

      {/* ===============================================
          RECEPTIONIST INVITATION FORM
      =============================================== */}

      <div
        className={`overflow-hidden transition-all duration-500 ease-linear ${showReceptionistForm ? "border-beige-border mt-6 max-h-[1000px] border-t pt-6 " : "max-h-0"}`}
      >
        <form onSubmit={handleSendReceptionistInvite} className="max-w-xl">
          <Input
            type="text"
            value={receptionistData.name}
            onChange={handleReceptionistInputChange}
            name="name"
            placeholder="John Doe"
            disabled={sendingInvite}
            label="Receptionist Name"
            error={receptionistInviteError.name}
          />

          <Input
            type="email"
            value={receptionistData.email}
            onChange={handleReceptionistInputChange}
            name="email"
            placeholder="receptionist@example.com"
            disabled={sendingInvite}
            label="Receptionist Email"
            error={receptionistInviteError.email}
          />

          <Input
            type="text"
            value={receptionistData.username}
            onChange={handleReceptionistInputChange}
            name="username"
            placeholder="receptionist123"
            disabled={sendingInvite}
            label="Receptionist Username"
            error={receptionistInviteError.username}
          />

          <p className="text-muted mt-2 text-xs">
            An invitation link will be sent to this email. The receptionist will
            create their own account and password.
          </p>

          {receptionistInviteError.other && (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {receptionistInviteError.other}
            </div>
          )}

          {inviteMessage && (
            <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {inviteMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={sendingInvite}
            className="bg-gold text-navy hover:bg-gold-hover mt-5 rounded-lg px-6 py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sendingInvite ? "Sending Invite..." : "Send Invite"}
          </button>
        </form>
      </div>
    </div>
  );
}
