export interface HttpRequest {
  method: string;
  path: string;
  version: string;
  headers: Record<string, string>;
  body?: string;
}

export const parseRequest = (data: string | Buffer): HttpRequest => {
  const lines = data.toString().split("\r\n");
  const [method, path, version] = lines[0].split(" ");

  const headers: Record<string, string> = {};
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].includes(": ")) {
      const [key, value] = lines[i].split(": ");
      headers[key.toLowerCase()] = value;
    }
  }

  // if the last line does not have semicolon,
  // then it should be request's body
  let body;
  if (!lines[lines.length - 1].includes(": ")) {
    body = lines[lines.length - 1];
  }

  return {
    method,
    path,
    version,
    headers,
    body,
  };
};
