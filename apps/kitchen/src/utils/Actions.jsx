const Actions = {
  NEW: {
    buttons: [
      {
        label: "✓ ACCEPT",
        nextStatus: "PREPARING",
        className: "bg-green-500 hover:bg-green-600 active:scale-95 text-black",
      },
      {
        label: "✕ REJECT",
        nextStatus: "REJECTED",
        className: "bg-red-500 hover:bg-red-600 active:scale-95 text-black",
      },
    ],
  },

  PREPARING: {
    buttons: [
      {
        label: "MARK PREPARING",
        nextStatus: "READY",
        className:
          "bg-yellow-600 hover:bg-yellow-500 active:scale-95 text-black font-semibold",
      },
    ],
  },

  READY: {
    buttons: [
      {
        label: "SEND FOR DELIVERY",
        nextStatus: "OUT FOR DELIVERY",
        className:
          "bg-yellow-600 hover:bg-yellow-500 active:scale-95 text-black",
      },
    ],
  },

  "OUT FOR DELIVERY": {
    buttons: [
      {
        label: "MARK DELIVERED",
        nextStatus: "Delivered",
        className: "bg-yellow-600 text-black cursor-default disabled",
      },
    ],
  },

  REJECTED: {
    buttons: [],
  },
};

export default Actions;
