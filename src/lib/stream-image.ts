import { createParser } from "eventsource-parser";
import { flushSync } from "react-dom";

type Frame = (dataUrl: string, isFinal: boolean) => void;

async function readStream(res: Response, onFrame: Frame) {
  let sawAnyEvent = false;
  let sawCompleted = false;
  let streamError: string | undefined;

  const parser = createParser({
    onEvent(event) {
      let payload:
        | { type?: string; b64_json?: string; error?: { message?: string } }
        | undefined;
      try {
        payload = JSON.parse(event.data) as typeof payload;
      } catch {
        /* keep generic message */
      }
      if (event.event === "error" || payload?.type === "error") {
        sawAnyEvent = true;
        streamError = payload?.error?.message ?? "Image generation failed";
        return;
      }
      if (
        event.event !== "image_generation.partial_image" &&
        event.event !== "image_generation.completed" &&
        event.event !== "image_edit.partial_image" &&
        event.event !== "image_edit.completed"
      )
        return;
      if (!payload?.b64_json) return;
      sawAnyEvent = true;
      const isFinal =
        event.event === "image_generation.completed" || event.event === "image_edit.completed";
      const b64 = payload.b64_json;
      flushSync(() => onFrame(`data:image/png;base64,${b64}`, isFinal));
      if (isFinal) sawCompleted = true;
    },
  });

  const reader = res.body!.pipeThrough(new TextDecoderStream()).getReader();
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      parser.feed(value);
    }
  } finally {
    reader.cancel().catch(() => {});
  }
  if (streamError) throw new Error(streamError);
  return { sawAnyEvent, sawCompleted };
}

export async function streamImage(prompt: string, onFrame: Frame): Promise<void> {
  const res = await fetch("/api/generate-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok || !res.body) {
    throw new Error(`Image generation failed: ${res.status}`);
  }
  const { sawAnyEvent, sawCompleted } = await readStream(res, onFrame);
  if (!sawAnyEvent) {
    const replay = await fetch("/api/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, stream: false }),
    });
    if (!replay.ok) throw new Error(`Image generation failed: ${replay.status}`);
    const json = (await replay.json()) as { data?: { b64_json?: string }[] };
    const b64 = json.data?.[0]?.b64_json;
    if (!b64) throw new Error("Image generation returned no image");
    onFrame(`data:image/png;base64,${b64}`, true);
    return;
  }
  if (!sawCompleted) throw new Error("Image stream ended without a completed event");
}

export async function editImage(file: File, prompt: string, onFrame: Frame): Promise<void> {
  const build = (stream: boolean) => {
    const fd = new FormData();
    fd.append("image", file);
    fd.append("prompt", prompt);
    if (!stream) fd.append("stream", "false");
    return fd;
  };

  const res = await fetch("/api/edit-image", { method: "POST", body: build(true) });
  if (!res.ok || !res.body) {
    throw new Error(`Image edit failed: ${res.status}`);
  }
  const { sawAnyEvent, sawCompleted } = await readStream(res, onFrame);
  if (!sawAnyEvent) {
    const replay = await fetch("/api/edit-image", { method: "POST", body: build(false) });
    if (!replay.ok) throw new Error(`Image edit failed: ${replay.status}`);
    const json = (await replay.json()) as { data?: { b64_json?: string }[] };
    const b64 = json.data?.[0]?.b64_json;
    if (!b64) throw new Error("Image edit returned no image");
    onFrame(`data:image/png;base64,${b64}`, true);
    return;
  }
  if (!sawCompleted) throw new Error("Image stream ended without a completed event");
}
