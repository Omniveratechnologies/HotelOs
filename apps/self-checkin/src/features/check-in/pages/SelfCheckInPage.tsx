import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Globe,
  Calendar,
  Pencil,
  Loader2,
} from "lucide-react";
import { InlineBanner } from "@hotelos/ui/components";
import { isKioskEnvironment } from "@hotelos/utils";

import { loadCheckInDraft, saveCheckInDraft } from "../utils/draftStorage";

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

const TOTAL_STEPS = 8;
const MAX_STEP_INDEX = 9;

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
  const isKiosk = useMemo(() => isKioskEnvironment(), []);
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
  const [isEditing, setIsEditing] = useState(false);

  // Form fields seeded from session's stored stepData
  const [guest, setGuest] = useState({
    name: "",
    email: "",
    phone: "",
    nationality: "",
  });

  const [documents, setDocuments] = useState<IdDocumentItem[]>([
    {
      id: "doc_init_0",
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
  const [pendingSignature, setPendingSignature] = useState<string | null>(null);
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

  const isAlreadyCheckedIn = booking?.status === "checked-in";
  const isCheckOutPassed = useMemo(() => {
    if (booking?.status === "checked-out") return true;
    if (!booking?.checkOut) return false;
    try {
      return new Date() > new Date(booking.checkOut);
    } catch {
      return false;
    }
  }, [booking?.status, booking?.checkOut]);

  // Resolve check-in on mount
  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    resolveCheckIn(token)
      .then((data) => {
        if (cancelled) return;
        setSession(data);
        setState({ kind: "ready" });

        // Merge backend stepData with any local token draft
        const cachedDraft = loadCheckInDraft(token);
        const sd = data.stepData || {};

        setGuest({
          name:
            cachedDraft?.guest?.name || sd.guestName || data.guest?.name || "",
          email:
            cachedDraft?.guest?.email || sd.email || data.guest?.email || "",
          phone:
            cachedDraft?.guest?.phone || sd.phone || data.guest?.phone || "",
          nationality:
            cachedDraft?.guest?.nationality ||
            sd.nationality ||
            data.guest?.nationality ||
            "",
        });

        // Merge backend documents with cached draft documents
        const backendDocs = Array.isArray(sd.documents) ? sd.documents : [];
        if (cachedDraft?.documents && cachedDraft.documents.length > 0) {
          setDocuments(
            cachedDraft.documents.map((d, i) => {
              const bDoc = backendDocs[i];
              const frontUrl =
                bDoc?.front?.url ||
                (d.front?.url && d.front.url.startsWith("http")
                  ? d.front.url
                  : null) ||
                (d.front?.previewUrl && d.front.previewUrl.startsWith("http")
                  ? d.front.previewUrl
                  : null);

              const backUrl =
                bDoc?.back?.url ||
                (d.back?.url && d.back.url.startsWith("http")
                  ? d.back.url
                  : null) ||
                (d.back?.previewUrl && d.back.previewUrl.startsWith("http")
                  ? d.back.previewUrl
                  : null);

              return {
                ...d,
                id: d.id || `doc_${i}_${Date.now()}`,
                front: d.front
                  ? {
                      ...d.front,
                      ...bDoc?.front,
                      url: frontUrl || undefined,
                      previewUrl: frontUrl || undefined,
                    }
                  : bDoc?.front
                    ? { ...bDoc.front, previewUrl: bDoc.front.url }
                    : null,
                back: d.back
                  ? {
                      ...d.back,
                      ...bDoc?.back,
                      url: backUrl || undefined,
                      previewUrl: backUrl || undefined,
                    }
                  : bDoc?.back
                    ? { ...bDoc.back, previewUrl: bDoc.back.url }
                    : null,
              };
            }),
          );
        } else if (backendDocs.length > 0) {
          setDocuments(
            backendDocs.map((d, i) => ({
              id: d.id || `doc_${i}_${Date.now()}`,
              idType: d.idType || "Aadhaar",
              idNumber: d.idNumber || "",
              front: d.front ? { ...d.front, previewUrl: d.front.url } : null,
              back: d.back ? { ...d.back, previewUrl: d.back.url } : null,
            })),
          );
        } else {
          setDocuments([
            {
              id: "doc_init_0",
              idType: "Aadhaar",
              idNumber: "",
              front: null,
              back: null,
            },
          ]);
        }

        // Hydrate selfie
        const selfieUrl =
          sd.selfie?.url ||
          (cachedDraft?.selfie?.url && cachedDraft.selfie.url.startsWith("http")
            ? cachedDraft.selfie.url
            : null) ||
          (cachedDraft?.selfie?.previewUrl &&
          cachedDraft.selfie.previewUrl.startsWith("http")
            ? cachedDraft.selfie.previewUrl
            : null);

        if (selfieUrl || cachedDraft?.selfie?.key || sd.selfie?.key) {
          setSelfie({
            ...cachedDraft?.selfie,
            ...sd.selfie,
            url: selfieUrl || undefined,
            previewUrl: selfieUrl || undefined,
          });
        } else {
          setSelfie(null);
        }

        const sigUrl =
          sd.signature?.url ||
          (cachedDraft?.signature?.ref?.url &&
          cachedDraft.signature.ref.url.startsWith("http")
            ? cachedDraft.signature.ref.url
            : null) ||
          (cachedDraft?.signature?.dataUrl &&
          cachedDraft.signature.dataUrl.startsWith("http")
            ? cachedDraft.signature.dataUrl
            : null);

        if (cachedDraft?.signature || sd.signature) {
          const baseDataUrl =
            cachedDraft?.signature?.dataUrl || sd.signature?.url || "";
          setSignature({
            dataUrl: baseDataUrl,
            ref: {
              ...cachedDraft?.signature?.ref,
              ...sd.signature,
              url: sigUrl || undefined,
            },
          });
        } else {
          setSignature(null);
        }

        setTerms(cachedDraft?.terms ?? Boolean(sd.termsAcceptedAt));
        setPrefs(cachedDraft?.prefs || sd.preferences || []);
        setRemarks(cachedDraft?.remarks ?? (sd.remarks || ""));

        // If already submitted, approved, rejected, or checked in, show the full submission summary
        const isTerminalStatus =
          data.status === "submitted" ||
          data.status === "approved" ||
          data.status === "rejected" ||
          data.status === "checked-in" ||
          data.booking?.status === "checked-in";

        if (
          cachedDraft?.isEditing &&
          cachedDraft.savedStep > 0 &&
          cachedDraft.savedStep < 9
        ) {
          setIsEditing(true);
          setStep(cachedDraft.savedStep);
        } else if (isTerminalStatus) {
          setStep(9);
        } else if (
          cachedDraft?.savedStep !== undefined &&
          cachedDraft.savedStep > 0 &&
          cachedDraft.savedStep < 9
        ) {
          // Resume at in-progress step if guest refreshed while filling
          setStep(cachedDraft.savedStep);
        } else {
          // Fresh open: start at 1st page (WelcomeStep)
          setStep(0);
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

  // Keep entered/submitted data persisted per token across page refreshes
  useEffect(() => {
    if (!token || !session) return;
    saveCheckInDraft(token, {
      guest,
      documents,
      selfie,
      signature,
      terms,
      prefs,
      remarks,
      savedStep: step,
      isEditing,
    });
  }, [
    token,
    session,
    guest,
    documents,
    selfie,
    signature,
    terms,
    prefs,
    remarks,
    step,
    isEditing,
  ]);

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
          documents.every(
            (d) =>
              Boolean(d.idNumber.trim()) &&
              Boolean(d.front?.key) &&
              !d.front?.isUploading &&
              !d.front?.error &&
              (!d.back || (!d.back.isUploading && !d.back.error)),
          )
        );
      case 4:
        return Boolean(selfie?.key && !selfie?.isUploading && !selfie?.error);
      case 5:
        return true;
      case 6: {
        const hasSig = Boolean(
          signature?.ref?.key ||
          signature?.ref?.url ||
          signature?.dataUrl ||
          pendingSignature,
        );
        return Boolean(hasSig && terms);
      }
      case 7:
      case 8:
        return true;
      default:
        return false;
    }
  }, [
    step,
    guestName,
    guestPhone,
    documents,
    selfie,
    signature,
    pendingSignature,
    terms,
  ]);

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
            signature: signature?.ref?.key
              ? {
                  key: signature.ref.key,
                  filename: signature.ref.filename,
                  mimeType: signature.ref.mimeType,
                  size: signature.ref.size,
                }
              : null,
            termsAcceptedAt: terms
              ? session?.stepData?.termsAcceptedAt || new Date().toISOString()
              : null,
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
      const stepKey = STEP_KEYS[step];
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
  }, [
    token,
    step,
    guest,
    documents,
    selfie,
    signature,
    terms,
    prefs,
    remarks,
    session,
  ]);

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

    if (step === 6) {
      if (!token) return;

      // If user drew a new signature on canvas, upload and save it now
      if (pendingSignature) {
        setUploading(true);
        setStepError("");
        try {
          const blob = await (await fetch(pendingSignature)).blob();
          const file = new File([blob], "signature.png", { type: "image/png" });
          const ref = await uploadCheckInFile(token, file);
          const uploadedUrl = ref.url || pendingSignature;
          const uploadedSignature = {
            dataUrl: pendingSignature,
            ref: {
              ...ref,
              url: uploadedUrl,
              previewUrl: uploadedUrl,
            },
          };
          setSignature(uploadedSignature);
          setPendingSignature(null);

          const data = await saveCheckInStep(token, "signature", {
            signature: {
              key: ref.key,
              filename: ref.filename,
              mimeType: ref.mimeType,
              size: ref.size,
            },
            termsAcceptedAt: terms ? new Date().toISOString() : null,
          });
          setSession(data);
          setStep((s) => Math.min(s + 1, MAX_STEP_INDEX));
        } catch (err: unknown) {
          const msg =
            err instanceof Error ? err.message : "Failed to upload signature";
          setStepError(msg);
        } finally {
          setUploading(false);
        }
        return;
      }

      // If user already had a saved signature and didn't redraw
      const ok = await saveStep();
      if (ok) setStep((s) => Math.min(s + 1, MAX_STEP_INDEX));
      return;
    }

    if (step === 8) {
      if (!token) return;
      try {
        setUploading(true);
        const payload = {
          guestName: guest.name.trim() || guestName.trim(),
          email: guest.email.trim() || guestEmail.trim(),
          phone: guest.phone.trim() || guestPhone.trim(),
          nationality: guest.nationality.trim() || guestNationality.trim(),
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
          selfie: selfie
            ? {
                key: selfie.key,
                filename: selfie.filename,
                mimeType: selfie.mimeType,
                size: selfie.size,
              }
            : null,
          signature: signature?.ref || null,
          termsAcceptedAt: terms
            ? session?.stepData?.termsAcceptedAt || new Date().toISOString()
            : null,
          preferences: prefs,
          remarks: remarks.trim(),
        };

        const data = await submitCheckIn(token, payload);
        setSession(data);
        setIsEditing(false);
        setStep(9);
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Failed to submit check-in";
        setActionError(msg);
      } finally {
        setUploading(false);
      }
      return;
    }

    const ok = await saveStep();
    if (ok) setStep((s) => Math.min(s + 1, MAX_STEP_INDEX));
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
          id: `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
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
      setStepError("");
      const previewUrl = URL.createObjectURL(file);

      // Optimistically store local preview and uploading state immediately
      setDocuments((prev) =>
        prev.map((doc, i) =>
          i === index
            ? {
                ...doc,
                [side]: {
                  key: doc[side]?.key || "",
                  filename: file.name || `${side}_${index + 1}.jpg`,
                  mimeType: file.type || "image/jpeg",
                  size: file.size,
                  previewUrl,
                  file,
                  isUploading: true,
                  error: undefined,
                },
              }
            : doc,
        ),
      );

      try {
        setUploading(true);
        const ref = await uploadCheckInFile(token, file);
        try {
          URL.revokeObjectURL(previewUrl);
        } catch {
          // ignore
        }

        const uploadedUrl = ref.url || ref.previewUrl || previewUrl;
        const uploadedRef = {
          ...ref,
          url: uploadedUrl,
          previewUrl: uploadedUrl,
          file: undefined,
          isUploading: false,
          error: undefined,
        };

        setDocuments((prev) => {
          const next = prev.map((doc, i) =>
            i === index
              ? {
                  ...doc,
                  [side]: uploadedRef,
                }
              : doc,
          );

          // Auto-sync step data to backend
          saveCheckInStep(token, "id", {
            documents: next.map((d) => ({
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
          }).catch(() => {
            // background auto-sync
          });

          return next;
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        setStepError(msg);
        setDocuments((prev) =>
          prev.map((doc, i) =>
            i === index
              ? {
                  ...doc,
                  [side]: {
                    ...doc[side],
                    previewUrl,
                    file,
                    filename: file.name,
                    isUploading: false,
                    error: msg,
                  },
                }
              : doc,
          ),
        );
      } finally {
        setUploading(false);
      }
    },
    [token],
  );

  const onPhotoCapture = async (file: File) => {
    if (!token) return;
    setStepError("");
    const previewUrl = URL.createObjectURL(file);

    // Optimistically store local selfie preview immediately
    setSelfie({
      key: "",
      filename: file.name || "selfie.jpg",
      mimeType: file.type || "image/jpeg",
      size: file.size,
      previewUrl,
      file,
      isUploading: true,
      error: undefined,
    });

    try {
      setUploading(true);
      const ref = await uploadCheckInFile(token, file);
      try {
        URL.revokeObjectURL(previewUrl);
      } catch {
        // ignore
      }

      const uploadedUrl = ref.url || ref.previewUrl || previewUrl;
      const uploadedSelfie = {
        ...ref,
        url: uploadedUrl,
        previewUrl: uploadedUrl,
        file: undefined,
        isUploading: false,
        error: undefined,
      };

      setSelfie(uploadedSelfie);

      // Auto-sync photo step to backend
      saveCheckInStep(token, "photo", {
        selfie: {
          key: ref.key,
          filename: ref.filename,
          mimeType: ref.mimeType,
          size: ref.size,
        },
      }).catch(() => {
        // background auto-sync
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setStepError(msg);
      setSelfie((prev) =>
        prev
          ? {
              ...prev,
              previewUrl,
              file,
              isUploading: false,
              error: msg,
            }
          : null,
      );
    } finally {
      setUploading(false);
    }
  };

  const onClearSavedSignature = useCallback(() => {
    setSignature(null);
    setPendingSignature(null);
    setSession((prev) => {
      if (!prev?.stepData) return prev;
      return {
        ...prev,
        stepData: {
          ...prev.stepData,
          signature: null,
        },
      };
    });
  }, []);

  const onDrawingChange = useCallback((dataUrl: string | null) => {
    setPendingSignature(dataUrl);
    setStepError("");
  }, []);

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
  const progressPct = Math.min(100, Math.round((step / TOTAL_STEPS) * 100));
  const correctionMsg = session?.correctionMessage;
  const hotelName = "HotelOS";

  if (
    (booking?.status === "checked-out" ||
      (!isAlreadyCheckedIn && isCheckOutPassed)) &&
    !isEditing
  ) {
    return (
      <div className="bg-brand-950 relative min-h-screen text-slate-900">
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,#1e3a5f_0%,#0f1f3d_50%,#091423_100%)]"
        />
        <header className="fixed inset-x-0 top-0 z-20 flex h-14 items-center justify-between border-b border-white/10 px-4 text-white backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="bg-primary-400 text-brand-950 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold">
              ✦
            </span>
            <span className="text-sm font-semibold">{hotelName}</span>
          </div>
        </header>

        <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-20">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 text-center shadow-2xl sm:p-8">
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
              <Calendar size={28} className="text-amber-600" />
            </span>
            <h2 className="text-brand-900 text-xl font-bold">
              Check-In No Longer Available
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              The scheduled check-out date for this reservation (
              <span className="font-semibold text-gray-800">
                {booking?.checkOut
                  ? new Date(booking.checkOut).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "passed"}
              </span>
              ) has passed. Self check-in is no longer active for this
              reservation.
            </p>
            {(booking?.bookingNumber || booking?.reservationNo) && (
              <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50 p-3.5 text-left text-xs">
                <div className="flex justify-between border-b border-gray-200/60 py-1">
                  <span className="text-gray-500">Booking Reference</span>
                  <span className="font-mono font-semibold text-gray-900">
                    {booking.bookingNumber || booking.reservationNo}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">Guest Name</span>
                  <span className="font-medium text-gray-900">
                    {guestName || "Guest"}
                  </span>
                </div>
              </div>
            )}
            <p className="mt-5 text-xs text-gray-500">
              If you are currently staying with us or need assistance, please
              contact or visit our front desk reception.
            </p>
          </div>
        </main>
      </div>
    );
  }

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
            {isEditing && (
              <div className="flex items-center justify-between border-b border-amber-200 bg-amber-50 px-5 py-2.5 text-xs text-amber-900 sm:px-6">
                <div className="flex items-center gap-1.5 font-medium">
                  <Pencil size={13} className="text-amber-700" />
                  <span>Editing Check-In Submission</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setStep(9);
                  }}
                  className="cursor-pointer font-bold text-amber-800 underline hover:text-amber-950"
                >
                  Cancel &amp; View Summary
                </button>
              </div>
            )}

            {!isTerminal && (
              <div className="px-5 pt-4 sm:px-6">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>
                    Step {step} of {TOTAL_STEPS}
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
                  error={stepError}
                  isKiosk={isKiosk}
                  maxDocuments={maxDocuments}
                  guestCount={guestCount}
                />
              )}
              {step === 4 && (
                <PhotoStep
                  selfie={selfie}
                  onCapture={onPhotoCapture}
                  uploading={uploading}
                  error={stepError}
                  isKiosk={isKiosk}
                  onRetry={
                    selfie?.file
                      ? () => onPhotoCapture(selfie.file!)
                      : undefined
                  }
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
                  signatureUrl={
                    signature?.ref?.url || signature?.dataUrl || null
                  }
                  onClearSavedSignature={onClearSavedSignature}
                  hasDrawing={Boolean(pendingSignature)}
                  onDrawingChange={onDrawingChange}
                  termsAccepted={terms}
                  onTermsChange={setTerms}
                  uploading={uploading}
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
              {step === 9 &&
                booking &&
                (() => {
                  const backendDocs = session?.stepData?.documents || [];
                  const mergedDocs = (
                    backendDocs.length > 0 ? backendDocs : documents
                  ).map((doc, idx) => {
                    const bDoc = backendDocs[idx];
                    const lDoc = documents[idx];
                    return {
                      idType:
                        doc.idType || bDoc?.idType || lDoc?.idType || "Aadhaar",
                      idNumber:
                        doc.idNumber || bDoc?.idNumber || lDoc?.idNumber || "",
                      front: bDoc?.front?.url
                        ? bDoc.front
                        : lDoc?.front?.url
                          ? lDoc.front
                          : lDoc?.front?.previewUrl
                            ? { ...lDoc.front, url: lDoc.front.previewUrl }
                            : bDoc?.front || null,
                      back: bDoc?.back?.url
                        ? bDoc.back
                        : lDoc?.back?.url
                          ? lDoc.back
                          : lDoc?.back?.previewUrl
                            ? { ...lDoc.back, url: lDoc.back.previewUrl }
                            : bDoc?.back || null,
                    };
                  });

                  const bSelfie = session?.stepData?.selfie;
                  const mergedSelfie = bSelfie?.url
                    ? bSelfie
                    : selfie?.url
                      ? selfie
                      : selfie?.previewUrl
                        ? { ...selfie, url: selfie.previewUrl }
                        : bSelfie || null;

                  const bSig = session?.stepData?.signature;
                  const mergedSig = signature?.dataUrl
                    ? { ...(signature.ref || bSig), url: signature.dataUrl }
                    : bSig?.url
                      ? bSig
                      : signature?.ref?.url
                        ? { ...signature.ref, url: signature.ref.url }
                        : bSig || null;

                  return (
                    <SuccessStep
                      booking={booking}
                      guest={guestData}
                      status={
                        session?.status ||
                        (isAlreadyCheckedIn ? "checked-in" : "submitted")
                      }
                      stepData={{
                        ...session?.stepData,
                        guestName:
                          guest.name ||
                          session?.stepData?.guestName ||
                          sessionGuest?.name,
                        email:
                          guest.email ||
                          session?.stepData?.email ||
                          sessionGuest?.email,
                        phone:
                          guest.phone ||
                          session?.stepData?.phone ||
                          sessionGuest?.phone,
                        nationality:
                          guest.nationality ||
                          session?.stepData?.nationality ||
                          sessionGuest?.nationality,
                        documents: mergedDocs,
                        selfie: mergedSelfie,
                        signature: mergedSig,
                        preferences:
                          prefs.length > 0
                            ? prefs
                            : session?.stepData?.preferences,
                        remarks: remarks || session?.stepData?.remarks,
                        termsAcceptedAt: terms
                          ? session?.stepData?.termsAcceptedAt ||
                            new Date().toISOString()
                          : session?.stepData?.termsAcceptedAt,
                      }}
                      correctionMessage={session?.correctionMessage}
                      rejectionMessage={
                        session?.rejectionMessage || session?.review?.message
                      }
                      onEditResponse={() => {
                        setIsEditing(true);
                        setStep(2);
                      }}
                    />
                  );
                })()}
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
                  {uploading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : step === 8 ? (
                    <>
                      {isEditing ||
                      session?.status === "rejected" ||
                      session?.status === "submitted"
                        ? "Re-Submit Check-in"
                        : "Submit Check-in"}{" "}
                      <ArrowRight size={16} />
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
