import * as net from "net";
import { readFileSync, existsSync, writeFileSync } from "fs";
import {
  sendResponse,
  sendNotFoundResponse,
  sendOKResponse,
  sendCreatedResponse,
} from "./response";
import { parseRequest } from "./request";

const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    const request = parseRequest(data);

    const path = request.path;
    if (path === "/") {
      sendOKResponse(socket);
    } else if (path.startsWith("/echo")) {
      const content = path.substring("/echo/".length);
      sendResponse(socket, request, content);
    } else if (path.startsWith("/user-agent")) {
      const content = request.headers["user-agent"];
      sendResponse(socket, request, content);
    } else if (path.startsWith("/files")) {
      const dir = process.argv[3];
      const filename = path.substring("/files/".length);
      const fullPath = `${dir}${filename}`;

      if (request.method === "POST") {
        writeFileSync(fullPath, request.body ?? "");
        sendCreatedResponse(socket);
        return;
      }

      if (!existsSync(fullPath)) {
        sendNotFoundResponse(socket);
        return;
      }

      const content = readFileSync(fullPath);
      sendResponse(socket, request, content, "application/octet-stream");
    } else {
      sendNotFoundResponse(socket);
    }

    const connection = request.headers["connection"] ?? "";
    if (connection === "close") {
      socket.end();
    }
  });

  socket.on("close", () => socket.end());
});

server.listen(4221, "localhost");
