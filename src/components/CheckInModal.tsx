import { useState } from "react";
import type { CheckInFormData } from "../types";

interface CheckInModalProps {
   roomNumber: string;
   onConfirm: (data: CheckInFormData) => void;
   onClose: () => void;
}

export function CheckInModal({
   roomNumber,
   onConfirm,
   onClose,
}: CheckInModalProps) {
   const [form, setForm] = useState<CheckInFormData>({
      guestName: "",
      phone: "",
      guests: 1,
      nights: 1,
      idProof: "",
   });

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!form.guestName.trim() || !form.phone.trim() || !form.idProof.trim())
         return;
      onConfirm(form);
   };

   return (
      <div className="modal-overlay anim-fadeIn" onClick={onClose}>
         <div
            className="modal-box anim-slideUp"
            style={{ maxWidth: 480 }}
            onClick={(e) => e.stopPropagation()}
         >
            <div className="modal-gold-bar" />

            <div
               className="flex items-start justify-between"
               style={{ padding: "18px 18px 0" }}
            >
               <div>
                  <h2
                     className="italic font-bold"
                     style={{ fontSize: 18, color: "#1a2744" }}
                  >
                     Check in — Room {roomNumber}
                  </h2>
                  <p className="label-sm" style={{ marginTop: 4 }}>
                     ENTER GUEST DETAILS TO OCCUPY THIS ROOM
                  </p>
               </div>
               <button className="modal-close" onClick={onClose}>
                  ×
               </button>
            </div>

            <form
               onSubmit={handleSubmit}
               className="flex flex-col gap-4"
               style={{ padding: "16px 18px 20px" }}
            >
               <div className="modal-form-grid">
                  <div className="flex flex-col gap-1.5">
                     <label className="label-sm">GUEST NAME</label>
                     <input
                        className="form-input"
                        placeholder="Full name"
                        value={form.guestName}
                        onChange={(e) =>
                           setForm({ ...form, guestName: e.target.value })
                        }
                        required
                     />
                  </div>
                  <div className="flex flex-col gap-1.5">
                     <label className="label-sm">PHONE</label>
                     <input
                        className="form-input"
                        placeholder="10-digit number"
                        value={form.phone}
                        maxLength={10}
                        onChange={(e) =>
                           setForm({ ...form, phone: e.target.value })
                        }
                        required
                     />
                  </div>
               </div>

               <div className="modal-form-grid">
                  <div className="flex flex-col gap-1.5">
                     <label className="label-sm">GUESTS</label>
                     <input
                        className="form-input"
                        type="number"
                        min={1}
                        max={10}
                        value={form.guests}
                        onChange={(e) =>
                           setForm({ ...form, guests: Number(e.target.value) })
                        }
                     />
                  </div>
                  <div className="flex flex-col gap-1.5">
                     <label className="label-sm">NIGHTS</label>
                     <input
                        className="form-input"
                        type="number"
                        min={1}
                        max={365}
                        value={form.nights}
                        onChange={(e) =>
                           setForm({ ...form, nights: Number(e.target.value) })
                        }
                     />
                  </div>
               </div>

               <div className="flex flex-col gap-1.5">
                  <label className="label-sm">ID PROOF</label>
                  <input
                     className="form-input"
                     placeholder="Aadhaar / Passport no."
                     value={form.idProof}
                     onChange={(e) =>
                        setForm({ ...form, idProof: e.target.value })
                     }
                     required
                  />
               </div>

               <button
                  type="submit"
                  className="btn-navy"
                  style={{ marginTop: 4 }}
               >
                  CONFIRM CHECK-IN
               </button>
            </form>
         </div>
      </div>
   );
}
