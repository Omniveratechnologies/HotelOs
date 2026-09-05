import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import CreateAccount from "./_components/CreateAccount.jsx";
import { verifyInvitation } from "../../services/invitation.service.js";

export default function AcceptInvitationPage() {
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function verify() {
      if (!token) {
        setError("Invitation token is missing.");
        setLoading(false);
        return;
      }

      try {
        const data = await verifyInvitation(token);
        setInvitation(data);
      } catch (err) {
        console.error("Invitation verification error:", err);
        setError(err.message || "Unable to verify your invitation.");
      } finally {
        setLoading(false);
      }
    }

    verify();
  }, [token]);

  if (loading) {
    return (
      <div className="bg-background-50 flex min-h-screen items-center justify-center">
        <p className="text-brand-900">Verifying your invitation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background-50 flex min-h-screen items-center justify-center px-6">
        <div className="border-brand-900/10 bg-background-100 w-full max-w-md rounded-2xl border px-8 py-10 text-center">
          <h1 className="font-display text-brand-900 text-2xl font-semibold">
            Invitation Invalid
          </h1>
          <p className="text-brand-900/60 mt-3">{error}</p>
        </div>
      </div>
    );
  }

  return <CreateAccount token={token} invitation={invitation} />;
}
