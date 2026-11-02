import { Server } from "socket.io";
import * as devices from "./attendanceDevice.service.js";

const tokenOf = (socket) => {
  const header = socket.handshake.headers?.authorization || "";
  return (
    socket.handshake.auth?.token ||
    socket.handshake.headers?.["x-device-token"] ||
    (header.startsWith("Bearer ") ? header.slice(7) : "")
  );
};

const answer = (ack, task) =>
  task.then(
    (data) => typeof ack === "function" && ack({ success: true, data }),
    (error) =>
      typeof ack === "function" &&
      ack({
        success: false,
        message: error.message,
        status: error.status || 500,
      }),
  );

export const attachDeviceSocket = (
  httpServer,
  { corsOrigin = true, hotelId = process.env.STAFF_DEFAULT_HOTEL_ID } = {},
) => {
  const io = new Server(httpServer, {
    path: "/socket.io",
    cors: { origin: corsOrigin, credentials: true },
  });

  const kiosks = io.of("/devices");

  kiosks.use(async (socket, next) => {
    try {
      const device = await devices.authenticateDevice(tokenOf(socket));
      socket.data.deviceId = String(device._id);
      next();
    } catch (error) {
      next(new Error(error.message || "Unauthorized"));
    }
  });

  kiosks.on("connection", async (socket) => {
    const room = `device:${socket.data.deviceId}`;
    socket.join(room);

    socket.on("heartbeat", (body, ack) =>
      answer(
        ack,
        devices.heartbeat(
          tokenOf(socket),
          body && typeof body === "object" ? body : {},
        ),
      ),
    );

    socket.on("command:ack", (body = {}, ack) =>
      answer(
        ack,
        devices.ackCommand(tokenOf(socket), String(body.commandId ?? ""), body),
      ),
    );

    try {
      const first = await devices.heartbeat(tokenOf(socket), {});
      first.commands.forEach((command) => socket.emit("command", command));
    } catch {}
  });

  const admins = io.of("/admin");
  admins.on("connection", (socket) => socket.join(`hotel:${hotelId}`));

  devices.deviceBus.on("event", (event) => {
    admins.to(`hotel:${event.hotelId}`).emit("device:event", event);
  });

  devices.deviceBus.on(
    "command",
    async ({ hotelId: hotel, deviceId, command }) => {
      admins.to(`hotel:${hotel}`).emit("device:command", command);

      if (command.status === "PENDING") {
        const connected = await kiosks.in(`device:${deviceId}`).fetchSockets();
        if (connected.length) {
          kiosks
            .to(`device:${deviceId}`)
            .emit("command", { _id: command._id, type: command.type });
          const sent = await devices.markCommandSent(command._id);
          if (sent)
            admins
              .to(`hotel:${hotel}`)
              .emit("device:command", { ...command, status: "SENT" });
        }
      }
    },
  );

  return io;
};
