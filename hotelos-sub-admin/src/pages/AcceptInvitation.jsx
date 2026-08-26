import {
  useEffect,
  useState,
} from "react";

import {
  useSearchParams,
} from "react-router-dom";

import CreateAccount from "./CreateAccount.jsx";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5001";

export default function AcceptInvitation() {
  const [searchParams] =
    useSearchParams();

  const token =
    searchParams.get("token");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    invitation,
    setInvitation,
  ] = useState(null);

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    async function verifyInvitation() {
      if (!token) {
        setError(
          "Invitation token is missing."
        );

        setLoading(false);

        return;
      }

      try {
        const response =
          await fetch(
            `${API_URL}/api/v1/invites/verify`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                token,
              }),
            }
          );

        const result =
          await response.json();

        console.log(
          "Invitation verification response:",
          result
        );

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ||
              "This invitation is not valid."
          );
        }

        setInvitation(
          result.data
        );
      } catch (error) {
        console.error(
          "Invitation verification error:",
          error
        );

        setError(
          error.message ||
            "Unable to verify your invitation."
        );
      } finally {
        setLoading(false);
      }
    }

    verifyInvitation();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <p className="text-navy">
          Verifying your invitation...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center px-6">
        <div className="w-full max-w-md rounded-2xl bg-cream border border-beige-border px-8 py-10 text-center">
          <h1 className="font-display text-2xl font-semibold text-navy">
            Invitation Invalid
          </h1>

          <p className="mt-3 text-navy/60">
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <CreateAccount
      token={token}
      invitation={invitation}
    />
  );
}