import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

import { SOCKET_ORIGIN } from "../services/deviceApi.js";

const useDeviceSocket = ({ onEvent, onCommand }) => {
  const [connected, setConnected] = useState(false);
  const handlers = useRef({ onEvent, onCommand });

  useEffect(() => {
    handlers.current = { onEvent, onCommand };
  });

  useEffect(() => {
    const socket = io(`${SOCKET_ORIGIN}/admin`, {
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("device:event", (event) => handlers.current.onEvent?.(event));
    socket.on("device:command", (command) =>
      handlers.current.onCommand?.(command),
    );

    return () => {
      socket.removeAllListeners();
      socket.close();
    };
  }, []);

  return { connected };
};

export default useDeviceSocket;
