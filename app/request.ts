export interface HttpRequest {
  method: string;
  path: string;
  version: string;
  headers: Record<string, string>;
  body?: string;
}

export const parseRequest = (data: string | Buffer): HttpRequest => {
  const lines = data.toString().split("\r\n");
  if (lines.length === 0) {
    throw new Error("Cannot parse incoming request");
  }

  const requestLineParts = lines[0]?.split(" ", 3);
  if (requestLineParts.length !== 3) {
    throw new Error(`Cannot parse the request line: ${requestLineParts}`);
  }

  const [method, path, version] = requestLineParts;

  let body: string | undefined;
  const headers: Record<string, string> = {};
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].includes(": ")) {
      const [key, value] = lines[i].split(": ", 2);
      headers[key.toLowerCase()] = value;
    } else if (lines[i] !== "") {
      body = lines[lines.length - 1];
    }
  }

  return {
    method,
    path,
    version,
    headers,
    body,
  };
};
