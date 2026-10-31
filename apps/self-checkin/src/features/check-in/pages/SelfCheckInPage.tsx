import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import { ArrowLeft, ArrowRight, AlertCircle, Globe } from "lucide-react";
import { InlineBanner } from "@hotelos/ui/components";

import {
  resolveCheckIn,
  saveCheckInStep,
  submitCheckIn,
  uploadCheckInFile,
} from "../api/checkInApi";
import WelcomeStep from "../components/steps/WelcomeStep";
import BookingStep from "../components/steps/BookingStep";
import GuestStep from "../components/steps/GuestStep";
import CaptureIdStep from "../components/steps/CaptureIdStep";
import PhotoStep from "../components/steps/PhotoStep";
import RegistrationCardStep from "../components/steps/RegistrationCardStep";
import SignatureStep from "../components/steps/SignatureStep";
import PreferencesStep from "../components/steps/PreferencesStep";
import ReviewStep from "../components/steps/ReviewStep";
import SuccessStep from "../components/steps/SuccessStep";
import type {
  CheckInSessionData,
  FileRef,
  IdDocumentItem,
} from "../types/checkIn.types";

const STEP_COUNT = 10;

// saveStep payload key per step index (wizard steps 0..9)
const STEP_KEYS: Record<number, string> = {
  2: "guest",
  3: "id",
  4: "photo",
  6: "signature",
  7: "preferences",
};

export default function SelfCheckInPage() {
  const { token } = useParams<{ token: string }>();
  const [session, setSession] = useState<CheckInSessionData | null>(null);
  const [state, setState] = useState<{
    kind: "loading" | "error" | "ready";
    message?: string;
  }>(() =>
    token
      ? { kind: "loading" }
      : { kind: "error", message: "Check-in token is missing" },
  );
  const [step, setStep] = useState(0);

  // Form fields seeded from session's stored stepData
  const [guest, setGuest] = useState({
    name: "",
    email: "",
    phone: "",
    nationality: "",
  });

  const [documents, setDocuments] = useState<IdDocumentItem[]>([
    {
      idType: "Aadhaar",
      idNumber: "",
      front: null,
      back: null,
    },
  ]);

  const [selfie, setSelfie] = useState<
    (FileRef & { previewUrl?: string; file?: File }) | null
  >(null);
  const [signature, setSignature] = useState<{
    dataUrl: string;
    ref: FileRef;
  } | null>(null);
  const [terms, setTerms] = useState(false);
  const [prefs, setPrefs] = useState<string[]>([]);
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

  // Resolve check-in on mount
  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    resolveCheckIn(token)
      .then((data) => {
        if (cancelled) return;
        setSession(data);
        setState({ kind: "ready" });

        // Seed form from stored stepData
        const sd = data.stepData || {};
        setGuest({
          name: sd.guestName || data.guest?.name || "",
          email: sd.email || data.guest?.email || "",
          phone: sd.phone || data.guest?.phone || "",
          nationality: sd.nationality || data.guest?.nationality || "",
        });

        if (Array.isArray(sd.documents) && sd.documents.length > 0) {
          setDocuments(
            sd.documents.map((d) => ({
              idType: d.idType || "Aadhaar",
              idNumber: d.idNumber || "",
              front: d.front ? { ...d.front, previewUrl: d.front.url } : null,
              back: d.back ? { ...d.back, previewUrl: d.back.url } : null,
            })),
          );
        } else {
          setDocuments([
            {
              idType: "Aadhaar",
              idNumber: "",
              front: null,
              back: null,
            },
          ]);
        }

        setSelfie(
          sd.selfie ? { ...sd.selfie, previewUrl: sd.selfie.url } : null,
        );

        setSignature(
          sd.signature
            ? { dataUrl: sd.signature.url || "", ref: sd.signature }
            : null,
        );
        setTerms(Boolean(sd.termsAcceptedAt));
        setPrefs(sd.preferences || []);
        setRemarks(sd.remarks || "");

        // If already submitted or approved, jump straight to success screen
        if (data.status === "submitted" || data.status === "approved") {
          setStep(9);
        } else {
          setStep(Math.min(data.currentStep ? data.currentStep - 1 : 0, 8));
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "";
        setState({
          kind: "error",
          message: msg.includes("no longer valid")
            ? msg
            : msg || "This check-in link is invalid or expired.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  // Steps that require input before continuing
  const canContinue = useMemo(() => {
    switch (step) {
      case 0:
      case 1:
        return true;
      case 2:
        return Boolean(guestName.trim() && guestPhone.trim());
      case 3:
        return (
          documents.length > 0 &&
          documents.every((d) => Boolean(d.idNumber.trim()) && Boolean(d.front))
        );
      case 4:
        return Boolean(selfie);
      case 5:
        return true;
      case 6:
        return Boolean(signature && terms);
      case 7:
      case 8:
        return true;
      default:
        return false;
    }
  }, [step, guestName, guestPhone, documents, selfie, signature, terms]);

  const saveStep = useCallback(async () => {
    if (!token) return false;
    setStepError("");
    try {
      const payload: Record<string, unknown> = {};
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
            documents: documents.map((d) => ({
              idType: d.idType,
              idNumber: d.idNumber.trim(),
              front: d.front
                ? {
                    key: d.front.key,
                    filename: d.front.filename,
                    mimeType: d.front.mimeType,
                    size: d.front.size,
                  }
                : null,
              back: d.back
                ? {
                    key: d.back.key,
                    filename: d.back.filename,
                    mimeType: d.back.mimeType,
                    size: d.back.size,
                  }
                : null,
            })),
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
      const stepKey = STEP_KEYS[step + 1];
      if (!noOps && stepKey) {
        const data = await saveCheckInStep(token, stepKey, payload);
        setSession(data);
      }
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to save step";
      setStepError(msg);
      return false;
    }
  }, [token, step, guest, documents, selfie, signature, terms, prefs, remarks]);

  const onContinue = async () => {
    setActionError("");
    setStepError("");

    if (!canContinue) {
      if (step === 2) setStepError("Please fill guest name and phone.");
      else if (step === 3)
        setStepError(
          "Please complete ID number and front side for all documents.",
        );
      else if (step === 4) setStepError("Please capture or upload a photo.");
      else if (step === 6) setStepError("Please sign and accept the terms.");
      return;
    }

    if (step === 8) {
      if (!token) return;
      try {
        const data = await submitCheckIn(token);
        setSession(data);
        setStep(9);
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Failed to submit check-in";
        setActionError(msg);
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

  const guestCount = Math.max(
    1,
    (booking?.guests?.adults || booking?.adults || 1) +
      (booking?.guests?.children || booking?.children || 0),
  );
  const maxDocuments = Math.max(5, 2 * guestCount);

  const onAddDocument = useCallback(() => {
    setDocuments((prev) => {
      if (prev.length >= maxDocuments) return prev;
      return [
        ...prev,
        {
          idType: "Aadhaar",
          idNumber: "",
          front: null,
          back: null,
        },
      ];
    });
  }, [maxDocuments]);

  const onRemoveDocument = useCallback((index: number) => {
    setDocuments((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const onDocumentChange = useCallback(
    (index: number, field: keyof IdDocumentItem, val: unknown) => {
      setDocuments((prev) =>
        prev.map((doc, i) => (i === index ? { ...doc, [field]: val } : doc)),
      );
    },
    [],
  );

  const onDocumentFile = useCallback(
    async (index: number, side: "front" | "back", file: File) => {
      if (!token) return;
      setUploading(true);
      setStepError("");
      try {
        const ref = await uploadCheckInFile(token, file);
        const entry = { ...ref, previewUrl: URL.createObjectURL(file) };
        setDocuments((prev) =>
          prev.map((doc, i) => (i === index ? { ...doc, [side]: entry } : doc)),
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        setStepError(msg);
      } finally {
        setUploading(false);
      }
    },
    [token],
  );

  const onPhotoCapture = async (file: File) => {
    if (!token) return;
    setUploading(true);
    setStepError("");
    try {
      const ref = await uploadCheckInFile(token, file);
      setSelfie({ file, previewUrl: URL.createObjectURL(file), ...ref });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setStepError(msg);
    } finally {
      setUploading(false);
    }
  };

  const onSignature = async (dataUrl: string | null) => {
    if (!token) return;
    if (!dataUrl) {
      setSignature(null);
      return;
    }
    setUploading(true);
    setStepError("");
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "signature.png", { type: "image/png" });
      const ref = await uploadCheckInFile(token, file);
      setSignature({ dataUrl, ref });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setStepError(msg);
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
            {state.message || "This check-in link is invalid or expired."}
          </p>
          <p className="text-surface-500 mt-2 text-sm">
            Please contact the reception desk or use the kiosk home screen to
            request a fresh code.
          </p>
        </div>
      </div>
    );
  }

  const isTerminal = step === 0 || step === 9;
  const progressPct = Math.round((step / (STEP_COUNT - 1)) * 100);
  const correctionMsg = session?.correctionMessage;
  const hotelName = "HotelOS";

  return (
    <div className="bg-brand-950 relative min-h-screen text-slate-900">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,#1e3a5f_0%,#0f1f3d_50%,#091423_100%)]"
      />

      {/* Top bar */}
      <header className="fixed inset-x-0 top-0 z-20 flex h-14 items-center justify-between border-b border-white/10 px-4 text-white backdrop-blur-md sm:px-6">
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

      <main className="relative z-10 flex min-h-screen items-start justify-center px-4 pt-20 pb-8 sm:pt-20">
        <div className="w-full max-w-lg">
          <div className="overflow-hidden rounded-2xl bg-white shadow-[0_10px_30px_rgba(0,0,0,.25)] sm:rounded-3xl">
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
                    className="h-full rounded-full bg-blue-600 transition-all"
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
                  documents={documents}
                  onAddDocument={onAddDocument}
                  onRemoveDocument={onRemoveDocument}
                  onDocumentChange={onDocumentChange}
                  onDocumentFile={onDocumentFile}
                  uploading={uploading}
                  maxDocuments={maxDocuments}
                  guestCount={guestCount}
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
                  stepData={{ ...session?.stepData, documents }}
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
                        label: `Identity Documents (${documents.length} verified)`,
                        done:
                          documents.length > 0 &&
                          documents.every((d) => d.idNumber.trim() && d.front),
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
              <div className="flex gap-2 border-t border-gray-100 bg-slate-50 px-5 py-3 sm:px-6">
                <button
                  type="button"
                  onClick={onBack}
                  className="border-surface-300 text-brand-900 hover:bg-background-100 flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border bg-white text-sm font-medium disabled:opacity-40"
                  disabled={uploading}
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  type="button"
                  onClick={onContinue}
                  disabled={!canContinue || uploading}
                  className="flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
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
