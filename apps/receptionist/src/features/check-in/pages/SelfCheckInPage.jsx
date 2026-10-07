import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import { ArrowLeft, ArrowRight, AlertCircle, Globe } from "lucide-react";
import { InlineBanner } from "@hotelos/ui/components";

import {
  resolveCheckIn,
  saveCheckInStep,
  submitCheckIn,
  uploadCheckInFile,
} from "../checkInApi.js";
import WelcomeStep from "../components/steps/WelcomeStep.jsx";
import BookingStep from "../components/steps/BookingStep.jsx";
import GuestStep from "../components/steps/GuestStep.jsx";
import CaptureIdStep from "../components/steps/CaptureIdStep.jsx";
import PhotoStep from "../components/steps/PhotoStep.jsx";
import RegistrationCardStep from "../components/steps/RegistrationCardStep.jsx";
import SignatureStep from "../components/steps/SignatureStep.jsx";
import PreferencesStep from "../components/steps/PreferencesStep.jsx";
import ReviewStep from "../components/steps/ReviewStep.jsx";
import SuccessStep from "../components/steps/SuccessStep.jsx";

const STEP_COUNT = 10;

// saveStep payload key per step index (wizard steps 0..9).
const STEP_KEYS = {
  2: "guest",
  3: "id",
  4: "photo",
  6: "signature",
  7: "preferences",
};

export default function SelfCheckInPage() {
  const { token } = useParams();
  const [session, setSession] = useState(null);
  const [state, setState] = useState({ kind: "loading" }); // loading | error | ready
  const [step, setStep] = useState(0);

  // Form fields seeded from the session's stored stepData.
  const [guest, setGuest] = useState({
    name: "",
    email: "",
    phone: "",
    nationality: "",
  });
  const [id, setId] = useState({
    idType: "Aadhaar",
    idNumber: "",
    idFront: null,
    idBack: null,
  });
  const [selfie, setSelfie] = useState(null); // { key, filename, previewUrl }
  const [signature, setSignature] = useState(null); // { dataUrl, ref }
  const [terms, setTerms] = useState(false);
  const [prefs, setPrefs] = useState([]);
  const [remarks, setRemarks] = useState("");

  const [uploading, setUploading] = useState(false);
  const [stepError, setStepError] = useState("");
  const [actionError, setActionError] = useState("");

  const booking = session?.booking || null;
  const sessionGuest = session?.guest || null;

  const guestName = guest.name || sessionGuest?.name || "";
  const guestEmail = guest.email || sessionGuest?.email || "";
  const guestPhone = guest.phone || sessionGuest?.phone || "";
  const guestNationality = guest.nationality || sessionGuest?.nationality || "";

  // ---- resolve on mount ----
  useEffect(() => {
    let cancelled = false;
    resolveCheckIn(token)
      .then((data) => {
        if (cancelled) return;
        setSession(data);
        setState({ kind: "ready" });

        // Seed form from stored stepData (resume-friendly).
        const sd = data.stepData || {};
        setGuest({
          name: sd.guestName || data.guest?.name || "",
          email: sd.email || data.guest?.email || "",
          phone: sd.phone || data.guest?.phone || "",
          nationality: sd.nationality || data.guest?.nationality || "",
        });
        setId({
          idType: sd.idType || "Aadhaar",
          idNumber: sd.idNumber || "",
          idFront: sd.idFront
            ? { ...sd.idFront, previewUrl: sd.idFront.url }
            : null,
          idBack: sd.idBack
            ? { ...sd.idBack, previewUrl: sd.idBack.url }
            : null,
        });
        setSelfie(
          sd.selfie ? { ...sd.selfie, previewUrl: sd.selfie.url } : null,
        );
        setSignature(
          sd.signature
            ? { dataUrl: sd.signature.url, ref: sd.signature }
            : null,
        );
        setTerms(Boolean(sd.termsAcceptedAt));
        setPrefs(sd.preferences || []);
        setRemarks(sd.remarks || "");

        setStep(Math.min(data.currentStep ? data.currentStep - 1 : 0, 8));
      })
      .catch((err) => {
        if (cancelled) return;
        const msg = err?.message || "";
        setState({
          kind: "error",
          message: msg.includes("no longer valid")
            ? msg
            : msg || "This check-in link is invalid.",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Steps that require a value before continuing.
  const canContinue = useMemo(() => {
    switch (step) {
      case 0:
      case 1:
        return true;
      case 2:
        return guestName.trim() && guestPhone.trim();
      case 3:
        return Boolean(id.idNumber.trim()) && Boolean(id.idFront);
      case 4:
        return Boolean(selfie);
      case 5:
        return true;
      case 6:
        return Boolean(signature && terms);
      case 7:
        return true;
      case 8:
        return true;
      default:
        return false;
    }
  }, [
    step,
    guestName,
    guestPhone,
    id.idNumber,
    id.idFront,
    selfie,
    signature,
    terms,
  ]);

  const saveStep = useCallback(async () => {
    setStepError("");
    try {
      const payload = {};
      switch (step) {
        case 2:
          Object.assign(payload, {
            guestName: guest.name.trim(),
            email: guest.email.trim(),
            phone: guest.phone.trim(),
            nationality: guest.nationality.trim(),
          });
          break;
        case 3:
          Object.assign(payload, {
            idType: id.idType,
            idNumber: id.idNumber.trim(),
            idFront: id.idFront
              ? {
                  key: id.idFront.key,
                  filename: id.idFront.filename,
                  mimeType: id.idFront.mimeType,
                  size: id.idFront.size,
                }
              : null,
            idBack: id.idBack
              ? {
                  key: id.idBack.key,
                  filename: id.idBack.filename,
                  mimeType: id.idBack.mimeType,
                  size: id.idBack.size,
                }
              : null,
          });
          break;
        case 4:
          Object.assign(payload, {
            selfie: selfie
              ? {
                  key: selfie.key,
                  filename: selfie.filename,
                  mimeType: selfie.mimeType,
                  size: selfie.size,
                }
              : null,
          });
          break;
        case 6:
          Object.assign(payload, {
            signature: signature?.ref || null,
            termsAcceptedAt: terms ? new Date().toISOString() : null,
          });
          break;
        case 7:
          Object.assign(payload, {
            preferences: prefs,
            remarks: remarks.trim(),
          });
          break;
        default:
          break;
      }

      const noOps = [0, 1, 5, 8].includes(step);
      if (!noOps) {
        const data = await saveCheckInStep(token, STEP_KEYS[step + 1], payload);
        setSession(data);
      }
      return true;
    } catch (err) {
      setStepError(err?.message || "Unable to save step");
      return false;
    }
  }, [token, step, guest, id, selfie, signature, terms, prefs, remarks]);

  const onContinue = async () => {
    setActionError("");
    setStepError("");

    if (!canContinue) {
      if (step === 2) setStepError("Please fill guest name and phone.");
      else if (step === 3)
        setStepError("Please complete ID details and photo.");
      else if (step === 4) setStepError("Please capture or upload a photo.");
      else if (step === 6) setStepError("Please sign and accept the terms.");
      return;
    }

    if (step === 8) {
      try {
        const data = await submitCheckIn(token);
        setSession(data);
        setStep(9);
      } catch (err) {
        setActionError(err?.message || "Failed to submit");
      }
      return;
    }

    const ok = await saveStep();
    if (ok) setStep((s) => Math.min(s + 1, STEP_COUNT - 1));
  };

  const onBack = () => {
    setStepError("");
    setActionError("");
    setStep((s) => Math.max(0, s - 1));
  };

  const onIdFile = async (kind, file) => {
    setUploading(true);
    setStepError("");
    try {
      const ref = await uploadCheckInFile(token, file);
      const entry = { ...ref, previewUrl: URL.createObjectURL(file) };
      setId((s) => ({ ...s, [kind]: entry }));
    } catch (err) {
      setStepError(err?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onPhotoCapture = async (file) => {
    setUploading(true);
    setStepError("");
    try {
      const ref = await uploadCheckInFile(token, file);
      setSelfie({ file, previewUrl: URL.createObjectURL(file), ...ref });
    } catch (err) {
      setStepError(err?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onSignature = async (dataUrl) => {
    if (!dataUrl) {
      setSignature(null);
      return;
    }
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], "signature.png", { type: "image/png" });
    setUploading(true);
    setStepError("");
    try {
      const ref = await uploadCheckInFile(token, file);
      setSignature({ dataUrl, ref });
    } catch (err) {
      setStepError(err?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const guestData = {
    name: guestName,
    email: guestEmail,
    phone: guestPhone,
    nationality: guestNationality,
  };

  if (state.kind === "loading") {
    return (
      <div className="bg-brand-950 flex min-h-screen items-center justify-center p-4">
        <div className="text-center text-white">
          <p className="text-lg font-semibold">Loading your check-in…</p>
          <p className="mt-1 text-sm text-white/50">One moment please</p>
        </div>
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="bg-brand-950 flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50">
            <AlertCircle size={22} className="text-rose-600" />
          </span>
          <p className="text-brand-900 text-lg font-semibold">
            This check-in link is invalid or expired.
          </p>
          <p className="text-surface-500 mt-2 text-sm">
            Please contact the reception desk for a fresh link.
          </p>
        </div>
      </div>
    );
  }

  const isTerminal = step === 0 || step === 9;
  const progressPct = Math.round((step / (STEP_COUNT - 1)) * 100);
  const correctionMsg = session?.correctionMessage;
  const hotelName = "Stayscape Hotel";

  return (
    <div className="bg-brand-950 min-h-screen">
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,#1e3a5f_0%,#0f1f3d_50%,#091423_100%)]"
      />

      {/* Top bar */}
      <header className="fixed inset-x-0 top-0 z-20 flex h-14 items-center justify-between px-4 text-white sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="bg-primary-400 text-brand-950 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold">
            ✦
          </span>
          <span className="text-sm font-semibold">{hotelName}</span>
        </div>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-full border border-white/20 px-2.5 py-1 text-xs text-white/80"
          aria-label="Language"
          disabled
        >
          <Globe size={12} />
          English
        </button>
      </header>

      <main className="flex min-h-screen items-start justify-center px-4 pt-18 pb-8 sm:pt-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-white shadow-[0_10px_30px_rgba(0,0,0,.25)] sm:rounded-3xl">
            {!isTerminal && (
              <div className="px-5 pt-4 sm:px-6">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>
                    Step {step} of {STEP_COUNT}
                  </span>
                  <span>{progressPct}%</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="bg-brand-700 h-full rounded-full transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            )}

            {correctionMsg && (
              <div className="px-5 pt-3 sm:px-6">
                <InlineBanner variant="warning">
                  Reception requested a correction: {correctionMsg}
                </InlineBanner>
              </div>
            )}

            <div className="p-5 sm:p-6">
              {step === 0 && (
                <WelcomeStep hotelName={hotelName} onStart={() => setStep(1)} />
              )}
              {step === 1 && booking && (
                <BookingStep booking={booking} guest={guestData} />
              )}
              {step === 2 && (
                <GuestStep
                  value={guestData}
                  onChange={(f, v) => setGuest((g) => ({ ...g, [f]: v }))}
                />
              )}
              {step === 3 && (
                <CaptureIdStep
                  value={id}
                  onChange={(f, v) => setId((s) => ({ ...s, [f]: v }))}
                  onFile={onIdFile}
                  uploading={uploading}
                />
              )}
              {step === 4 && (
                <PhotoStep
                  selfie={selfie}
                  onCapture={onPhotoCapture}
                  uploading={uploading}
                />
              )}
              {step === 5 && booking && (
                <RegistrationCardStep
                  booking={booking}
                  guest={guestData}
                  stepData={session?.stepData}
                />
              )}
              {step === 6 && (
                <SignatureStep
                  hasSignature={Boolean(signature)}
                  termsAccepted={terms}
                  onTermsChange={setTerms}
                  onSignatureChange={onSignature}
                  error={stepError}
                />
              )}
              {step === 7 && (
                <PreferencesStep
                  value={prefs}
                  onToggle={(key) =>
                    setPrefs((p) =>
                      p.includes(key)
                        ? p.filter((x) => x !== key)
                        : [...p, key],
                    )
                  }
                  remarks={remarks}
                  onRemarksChange={setRemarks}
                />
              )}
              {step === 8 && booking && (
                <ReviewStep
                  booking={booking}
                  guest={guestData}
                  checks={{
                    selfieUrl:
                      selfie?.previewUrl ||
                      session?.stepData?.selfie?.url ||
                      null,
                    items: [
                      {
                        key: "guest",
                        label: "Guest Details",
                        done: Boolean(guestName.trim() && guestPhone.trim()),
                        step: 2,
                      },
                      {
                        key: "id",
                        label: "ID Verification",
                        done: Boolean(id.idNumber && id.idFront),
                        step: 3,
                      },
                      {
                        key: "photo",
                        label: "Photo Captured",
                        done: Boolean(selfie),
                        step: 4,
                      },
                      {
                        key: "registration",
                        label: "Registration Card",
                        done: true,
                        step: 5,
                      },
                      {
                        key: "signature",
                        label: "Signature",
                        done: Boolean(signature && terms),
                        step: 6,
                      },
                      {
                        key: "preferences",
                        label: "Preferences",
                        done: prefs.length > 0 || remarks.trim() !== "",
                        step: 7,
                      },
                    ],
                  }}
                  onJump={setStep}
                />
              )}
              {step === 9 && booking && (
                <SuccessStep
                  booking={booking}
                  guest={guestData}
                  approved={session?.status === "approved"}
                />
              )}
            </div>

            {step > 0 && step < 9 && (
              <div className="flex gap-2 border-t border-gray-100 px-5 py-3 sm:px-6">
                <button
                  type="button"
                  onClick={onBack}
                  className="border-surface-300 text-brand-900 hover:bg-background-100 flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border bg-white text-sm font-medium disabled:opacity-40"
                  disabled={uploading}
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  type="button"
                  onClick={onContinue}
                  disabled={!canContinue || uploading}
                  className="bg-brand-900 hover:bg-brand-800 flex h-10 flex-1 items-center justify-center gap-2 rounded-lg text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {step === 8 ? (
                    <>
                      Submit Check-in <ArrowRight size={16} />
                    </>
                  ) : (
                    <>
                      Continue <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            )}

            {actionError && (
              <div className="px-5 pb-4 sm:px-6">
                <p role="alert" className="text-xs font-medium text-rose-500">
                  {actionError}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
