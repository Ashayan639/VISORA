"use client";

import { ArrowUp, ImageIcon, Paperclip, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";

import type { ChatAttachment } from "@/types/visora";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (content: string, attachments?: ChatAttachment[]) => void;
  disabled?: boolean;
  placeholder?: string;
  /**
   * If true, the paperclip becomes a real file picker (image/* only).
   * The selected file is read as a `data:` URL and emitted as a
   * `kind: "image"` attachment alongside the text. Default: `false`.
   */
  enableImageUpload?: boolean;
  /**
   * Imperative trigger for the file picker. /studio's empty-state
   * suggestion uses this to open the picker without the user having
   * to click the paperclip themselves. Increment to trigger.
   */
  imageUploadTrigger?: number;
}

const MAX_TEXTAREA_PX = 200;

/** Cap uploads at 8 MB so we don't blow up localStorage or the API. */
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

/* ─────────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────────── */

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("file read failed"));
    reader.readAsDataURL(file);
  });
}

/* ─────────────────────────────────────────────────────────────
   ChatInput
   ───────────────────────────────────────────────────────────── */

/**
 * VISORA — chat composer.
 *
 * Glass-bar input that auto-grows up to ~200px tall, with an optional
 * image-upload paperclip and a gradient send button.
 *
 * Keyboard:
 *   Enter           → submit
 *   Shift + Enter   → newline
 */
export function ChatInput({
  onSend,
  disabled = false,
  placeholder = "Describe your startup idea or paste a website URL…",
  enableImageUpload = false,
  imageUploadTrigger,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const [attachment, setAttachment] = useState<ChatAttachment | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-grow.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_PX)}px`;
  }, [value]);

  // External imperative trigger (e.g. from a suggestion card).
  useEffect(() => {
    if (!enableImageUpload) return;
    if (imageUploadTrigger === undefined) return;
    fileInputRef.current?.click();
  }, [enableImageUpload, imageUploadTrigger]);

  const canSend = (value.trim().length > 0 || attachment !== null) && !disabled;

  const submit = useCallback(() => {
    if (!canSend) return;
    onSend(value, attachment ? [attachment] : undefined);
    setValue("");
    setAttachment(null);
    setUploadError(null);
  }, [attachment, canSend, onSend, value]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        submit();
      }
    },
    [submit],
  );

  const onPickFile = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    // Reset the input so the same file can be re-selected.
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please pick an image file.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadError("Image is too large (8 MB max).");
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setAttachment({
        kind: "image",
        url: dataUrl,
        name: file.name,
        mimeType: file.type,
        size: file.size,
      });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Could not read file.");
    }
  }, []);

  const removeAttachment = useCallback(() => {
    setAttachment(null);
    setUploadError(null);
  }, []);

  return (
    <div className="w-full px-4 pb-4 sm:px-6 sm:pb-6">
      {/* Attachment / error chip row */}
      {(attachment || uploadError) && (
        <div className="mx-auto mb-2 flex w-full max-w-3xl flex-wrap items-center gap-2">
          {attachment ? (
            <div
              className="
                inline-flex items-center gap-2 rounded-full border border-brand-cyan/30
                bg-brand-cyan/10 py-1 pl-2 pr-1 text-[12px] text-foreground
              "
            >
              <ImageIcon size={12} className="text-brand-cyan" aria-hidden />
              <span className="max-w-[180px] truncate">
                {attachment.name ?? "image"}
              </span>
              <button
                type="button"
                onClick={removeAttachment}
                aria-label="Remove attachment"
                className="
                  inline-flex h-5 w-5 items-center justify-center rounded-full
                  text-muted hover:text-foreground hover:bg-white/10
                "
              >
                <X size={11} />
              </button>
            </div>
          ) : null}
          {uploadError ? (
            <span className="text-[12px] text-state-danger">{uploadError}</span>
          ) : null}
        </div>
      )}

      <div
        className={cn(
          "mx-auto flex w-full max-w-3xl items-end gap-2 rounded-2xl",
          "bg-card/80 backdrop-blur-xl",
          "border border-white/[0.06]",
          "px-3 py-2.5",
          "transition-[border-color,box-shadow] duration-200",
          "focus-within:border-brand-cyan/40 focus-within:shadow-[0_0_30px_-12px_rgba(56,189,248,0.35)]",
        )}
      >
        {enableImageUpload ? (
          <>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Attach an image"
              title="Attach an image"
              disabled={disabled}
              className={cn(
                "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                "text-muted transition-colors",
                "hover:text-foreground hover:bg-white/[0.04]",
                "disabled:opacity-40 disabled:cursor-not-allowed",
              )}
            >
              <Paperclip size={18} strokeWidth={1.75} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPickFile}
              disabled={disabled}
            />
          </>
        ) : (
          <button
            type="button"
            aria-label="Attach an image"
            title="Attach an image (coming soon)"
            disabled
            className="
              inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg
              text-muted opacity-40 cursor-not-allowed
            "
          >
            <Paperclip size={18} strokeWidth={1.75} />
          </button>
        )}

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          rows={1}
          aria-label="Message VISORA"
          className="
            flex-1 resize-none bg-transparent
            px-2 py-1.5 text-[15px] leading-relaxed text-foreground
            placeholder:text-hint
            focus:outline-none
          "
          style={{ maxHeight: MAX_TEXTAREA_PX }}
          disabled={disabled}
        />

        <button
          type="button"
          onClick={submit}
          disabled={!canSend}
          aria-label="Send message"
          className={cn(
            "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white",
            "bg-gradient-to-br from-brand-cyan to-brand-purple",
            "shadow-md shadow-brand-cyan/20",
            "transition-all duration-200",
            canSend
              ? "hover:scale-105 hover:shadow-lg hover:shadow-brand-purple/40"
              : "opacity-40 cursor-not-allowed shadow-none",
          )}
        >
          <ArrowUp size={18} strokeWidth={2.5} />
        </button>
      </div>

      <p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-hint">
        Enter to send · Shift + Enter for newline
      </p>
    </div>
  );
}

export default ChatInput;
