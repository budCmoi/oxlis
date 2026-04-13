const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

type OpenApiEventStreamOptions = {
  token: string;
  signal: AbortSignal;
  onEvent: (event: string, payload: unknown) => void;
};

function parseEventBlock(block: string) {
  const normalizedBlock = block.replace(/\r/g, "");
  const lines = normalizedBlock.split("\n");
  const dataLines: string[] = [];
  let event = "message";

  for (const line of lines) {
    if (!line || line.startsWith(":")) {
      continue;
    }

    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
      continue;
    }

    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  if (dataLines.length === 0) {
    return null;
  }

  const rawPayload = dataLines.join("\n");

  try {
    return { event, payload: JSON.parse(rawPayload) };
  } catch {
    return { event, payload: rawPayload };
  }
}

export async function openApiEventStream(path: string, options: OpenApiEventStreamOptions) {
  const response = await fetch(`${API_URL}${path}`, {
    method: "GET",
    headers: {
      Accept: "text/event-stream",
      Authorization: `Bearer ${options.token}`,
    },
    cache: "no-store",
    signal: options.signal,
  });

  if (!response.ok) {
    throw new Error("Impossible d'ouvrir le flux temps reel");
  }

  if (!response.body) {
    throw new Error("Flux temps reel indisponible");
  }

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();

    if (done) {
      break;
    }

    buffer += value;

    let separatorIndex = buffer.indexOf("\n\n");

    while (separatorIndex >= 0) {
      const block = buffer.slice(0, separatorIndex);
      buffer = buffer.slice(separatorIndex + 2);

      const parsed = parseEventBlock(block);
      if (parsed) {
        options.onEvent(parsed.event, parsed.payload);
      }

      separatorIndex = buffer.indexOf("\n\n");
    }
  }
}