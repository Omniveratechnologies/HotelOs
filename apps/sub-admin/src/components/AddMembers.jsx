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
    <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-xs">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-brand-900 text-xl font-semibold">
            Add Members
          </h2>

          <p className="mt-1 text-sm text-gray-500">
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
          className="bg-brand-900 inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 font-medium text-white transition hover:opacity-90"
        >
          <span className="text-lg">{showReceptionistForm ? "-" : "+"}</span>
          Add Receptionist
        </button>
      </div>

      {/* ===============================================
          RECEPTIONIST INVITATION FORM
      =============================================== */}

      <div
        className={`overflow-hidden transition-all duration-500 ease-linear ${showReceptionistForm ? "mt-6 max-h-[1000px] border-t border-gray-100 pt-6 " : "max-h-0"}`}
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

          <p className="mt-2 text-xs text-gray-500">
            An invitation link will be sent to this email. The receptionist will
            create their own account and password.
          </p>

          {receptionistInviteError.other && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
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
            className="bg-primary-400 text-brand-900 hover:bg-primary-500 mt-5 rounded-lg px-6 py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sendingInvite ? "Sending Invite..." : "Send Invite"}
          </button>
        </form>
      </div>
    </div>
  );
}
