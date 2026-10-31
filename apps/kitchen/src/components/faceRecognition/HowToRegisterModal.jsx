import ActionButton from "../ui/button/ActionButton.jsx";
import Modal from "../ui/Modal.jsx";

const STEPS = [
  [
    "Select the staff member",
    "Pick them from the list or press Register / Update on their row.",
  ],
  [
    "Get their consent",
    "Tell them their face is stored encrypted for attendance, then tick the consent box.",
  ],
  [
    "Capture 3–5 photos",
    "Good light, face inside the green frame, neutral expression. Turn the head a little between photos.",
  ],
  [
    "Save",
    "Press Register Face. Kiosks receive the new face automatically within moments.",
  ],
];

const HowToRegisterModal = ({ open, onClose }) => {
  if (!open) return null;
  return (
    <Modal
      open
      onClose={onClose}
      title="How to register a face"
      maxWidth="max-w-md"
      footer={<ActionButton onClick={onClose}>Got it</ActionButton>}
    >
      <ol className="space-y-3">
        {STEPS.map(([title, text], i) => (
          <li key={title} className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-semibold text-white">
              {i + 1}
            </span>
            <span>
              <span className="block text-xs font-medium text-white">
                {title}
              </span>
              <span className="block text-[11px] text-gray-400">{text}</span>
            </span>
          </li>
        ))}
      </ol>
    </Modal>
  );
};

export default HowToRegisterModal;
