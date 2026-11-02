import { useEffect, useState } from "react";

import ActionButton from "../ui/button/ActionButton.jsx";
import Modal from "../ui/Modal.jsx";
import StatusBadge from "../ui/StatusBadge.jsx";
import FaceAvatar from "./FaceAvatar.jsx";
import { api, formatDate, imageUrl } from "../../utils/faceUtils.js";

const ANGLE_LABEL = {
  FRONT: "Front",
  LEFT: "Left",
  RIGHT: "Right",
  UP: "Up",
  DOWN: "Down",
};

const FaceDetailModal = ({ row, onClose, onUpdate, onDelete }) => {
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!row) return undefined;
    const controller = new AbortController();
    setDetail(null);
    setError("");
    api(`/${row._id}`, { signal: controller.signal })
      .then((res) => setDetail(res.data))
      .catch((e) => e.name !== "AbortError" && setError(e.message));
    return () => controller.abort();
  }, [row]);

  if (!row) return null;

  return (
    <Modal
      open
      onClose={onClose}
      title="Face photos"
      maxWidth="max-w-lg"
      footer={
        <>
          <ActionButton variant="outline" onClick={onClose}>
            Close
          </ActionButton>
          <ActionButton variant="outline" onClick={() => onUpdate(row)}>
            Update face
          </ActionButton>
          <ActionButton variant="danger" onClick={() => onDelete(row)}>
            Delete face data
          </ActionButton>
        </>
      }
    >
      <div className="flex items-center gap-3">
        <FaceAvatar src={row.photoUrl} name={row.name} size="h-11 w-11" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">
            {row.name}
          </p>
          <p className="text-[11px] text-gray-400">
            {row.staffId} · {row.department} · {row.designation}
          </p>
        </div>
        <StatusBadge status={detail?.faceStatus || row.faceStatus} />
      </div>

      {error && (
        <p role="alert" className="mt-4 text-xs text-red-300">
          {error}
        </p>
      )}
      {!detail && !error && (
        <p className="mt-4 text-xs text-gray-400">Loading...</p>
      )}

      {detail && (
        <>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
            <dt className="text-gray-500">Registered on</dt>
            <dd className="text-gray-200">{formatDate(detail.registeredAt)}</dd>
            <dt className="text-gray-500">Last updated</dt>
            <dd className="text-gray-200">
              {formatDate(detail.lastEnrolledAt)}
              {detail.lastEnrolledBy ? ` by ${detail.lastEnrolledBy}` : ""}
            </dd>
            <dt className="text-gray-500">Average quality</dt>
            <dd className="text-gray-200">
              {Math.round(detail.avgQuality * 100)}%
            </dd>
            <dt className="text-gray-500">Consent</dt>
            <dd className="text-gray-200">
              {detail.consent.given
                ? `Given on ${formatDate(detail.consent.givenAt)}`
                : "Not recorded"}
            </dd>
          </dl>

          <div
            className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5"
            aria-label="Stored photos"
          >
            {detail.samples.map((sample) => (
              <figure key={sample._id} className="space-y-1">
                <img
                  src={imageUrl(sample.imagePath)}
                  alt={`${ANGLE_LABEL[sample.angle] || sample.angle} photo of ${row.name}`}
                  loading="lazy"
                  decoding="async"
                  className="aspect-square w-full rounded-md border border-gray-700 bg-[#151515] object-cover"
                />
                <figcaption className="text-center text-[10px] text-gray-400">
                  {ANGLE_LABEL[sample.angle] || sample.angle} ·{" "}
                  {Math.round(sample.qualityScore * 100)}%
                </figcaption>
              </figure>
            ))}
            {!detail.samples.length && (
              <p className="col-span-full text-xs text-gray-500">
                No photos stored.
              </p>
            )}
          </div>
        </>
      )}
    </Modal>
  );
};

export default FaceDetailModal;
