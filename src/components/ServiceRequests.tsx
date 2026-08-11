import type { ServiceRequest, ServiceRequestType } from "../types";

interface ServiceRequestsProps {
   requests: ServiceRequest[];
   onAcknowledge: (id: string) => void;
}

const TYPE_LABEL: Record<ServiceRequestType, string> = {
   amenity: "Amenity request",
   housekeeping: "Housekeeping request",
   restaurant: "Call restaurant",
};

export function ServiceRequests({
   requests,
   onAcknowledge,
}: ServiceRequestsProps) {
   return (
      <div className="card" style={{ padding: 20, height: "100%" }}>
         <div className="section-title">
            <span className="section-title-bar" />
            <span className="section-title-text">SERVICE REQUESTS</span>
         </div>

         {requests.length === 0 && (
            <p
               style={{
                  fontSize: 13,
                  color: "#9ca3af",
                  textAlign: "center",
                  padding: "24px 0",
               }}
            >
               No service requests at the moment.
            </p>
         )}

         <div className="flex flex-col">
            {requests.map((req, i) => (
               <div
                  key={req.id}
                  className="flex items-center justify-between gap-3"
                  style={{
                     padding: "14px 0",
                     borderBottom:
                        i < requests.length - 1 ? "1px solid #f0ebe3" : "none",
                  }}
               >
                  <div className="flex-1 min-w-0">
                     <div
                        style={{
                           fontSize: 13.5,
                           fontWeight: 600,
                           color: "#1a2744",
                           marginBottom: 2,
                        }}
                     >
                        Room {req.roomNumber} · {TYPE_LABEL[req.type]}
                     </div>
                     <div
                        className="truncate"
                        style={{ fontSize: 12, color: "#6b7280" }}
                     >
                        {req.details}
                     </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                     <span className={`req-badge ${req.status}`}>
                        ● {req.status.toUpperCase()}
                     </span>
                     {req.status === "requested" && (
                        <button
                           className="ack-btn"
                           onClick={() => onAcknowledge(req.id)}
                        >
                           Acknowledge
                        </button>
                     )}
                  </div>
               </div>
            ))}
         </div>
      </div>
   );
}
