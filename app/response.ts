import * as net from "net";
import type { HttpRequest } from "./request";

enum HttpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  NOT_FOUND = 404,
}

interface HttpResponse {
  version: string;
  status: HttpStatus;
  headers: Record<string, string>;
  body: Uint8Array<ArrayBufferLike>;
}

function reasonPhrase(status: HttpStatus): string {
  switch (status) {
    case HttpStatus.OK:
      return "OK";
    case HttpStatus.CREATED:
      return "Created";
    case HttpStatus.BAD_REQUEST:
      return "Bad Request";
    case HttpStatus.NOT_FOUND:
      return "Not Found";
    default:
      return "Unknown";
  }
}

function toBuffer(response: HttpResponse): Buffer {
  const statusLine = `${response.version} ${response.status} ${reasonPhrase(response.status)}\r\n`;

  const headers = [];
  for (const [key, value] of Object.entries(response.headers)) {
    headers.push(`${key}: ${value}\r\n`);
  }
  headers.push(`content-length: ${response.body.length}\r\n`);

  return Buffer.concat([
    Buffer.from(statusLine + headers.join("") + "\r\n"),
    response.body,
  ]);
}

export function sendResponse(
  socket: net.Socket,
  request: HttpRequest,
  content: string | Buffer,
  contentType: string = "text/plain",
): void {
  const acceptEncoding = request.headers["accept-encoding"] ?? "";
  const supportsGzip = acceptEncoding.split(",").some((encoding) => {
    const [name, ...params] = encoding.trim().split(";");
    const quality = params
      .map((param) => param.trim())
      .find((param) => param.startsWith("q="));

    return (
      name.trim().toLowerCase() === "gzip" &&
      (!quality || Number(quality.slice(2)) > 0)
    );
  });

  const shouldClose = request.headers["connection"]?.toLowerCase() === "close";

  const body = Buffer.from(content);

  const response: HttpResponse = {
    version: "HTTP/1.1",
    status: HttpStatus.OK,
    headers: {
      "content-type": contentType,
    },
    body: supportsGzip ? Bun.gzipSync(body) : body,
  };

  if (supportsGzip) {
    response.headers["content-encoding"] = "gzip";
  }

  if (shouldClose) {
    response.headers["connection"] = "close";
    socket.end(toBuffer(response));
  } else {
    socket.write(toBuffer(response));
  }
}

function sendStatusResponse(socket: net.Socket, status: HttpStatus): void {
  const response: HttpResponse = {
    version: "HTTP/1.1",
    status,
    headers: {},
    body: Buffer.alloc(0),
  };

  socket.write(toBuffer(response));
}

export function sendOKResponse(socket: net.Socket): void {
  sendStatusResponse(socket, HttpStatus.OK);
}

export function sendNotFoundResponse(socket: net.Socket): void {
  sendStatusResponse(socket, HttpStatus.NOT_FOUND);
}

export function sendCreatedResponse(socket: net.Socket): void {
  sendStatusResponse(socket, HttpStatus.CREATED);
}

export function sendBadRequestResponse(socket: net.Socket): void {
  sendStatusResponse(socket, HttpStatus.BAD_REQUEST);
}
