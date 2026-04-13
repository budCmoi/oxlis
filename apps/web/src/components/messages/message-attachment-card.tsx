"use client";

import { Download, ExternalLink, FileText, ImageIcon, LoaderCircle, Music4, Shield, Video } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchProtectedBlob } from "@/lib/api";
import { MessageAttachment } from "@/types";

export function MessageAttachmentCard({ attachment }: { attachment: MessageAttachment }) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(isPreviewableAttachment(attachment));
  const [isOpening, setIsOpening] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    let disposed = false;
    let previewUrl: string | null = null;

    if (!isPreviewableAttachment(attachment)) {
      setObjectUrl(null);
      setError(null);
      setIsLoadingPreview(false);
      return;
    }

    setObjectUrl(null);
    setError(null);
    setIsLoadingPreview(true);

    void fetchProtectedBlob(attachment.downloadUrl)
      .then((blob) => {
        if (disposed) {
          return;
        }

        previewUrl = URL.createObjectURL(blob);
        setObjectUrl(previewUrl);
        setIsLoadingPreview(false);
      })
      .catch((previewError) => {
        if (disposed) {
          return;
        }

        setError(previewError instanceof Error ? previewError.message : "Apercu indisponible");
        setIsLoadingPreview(false);
      });

    return () => {
      disposed = true;

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [attachment.category, attachment.downloadUrl, attachment.id]);

  const openAttachment = async () => {
    let popup: Window | null = null;

    try {
      setError(null);
      setIsOpening(true);

      popup = window.open("", "_blank");
      if (!popup) {
        throw new Error("L'ouverture a ete bloquee par le navigateur");
      }

      popup.document.title = `Ouverture de ${attachment.fileName}`;
      popup.document.body.innerHTML = "<p style=\"font-family:ui-sans-serif,system-ui,sans-serif;padding:24px;color:#475569\">Chargement du fichier securise...</p>";

      const resolvedObjectUrl =
        isPreviewableAttachment(attachment) && objectUrl
          ? objectUrl
          : await fetchProtectedBlobAsObjectUrl(attachment.downloadUrl, attachment.fileName);

      popup.location.href = resolvedObjectUrl;
    } catch (openError) {
      if (popup) {
        popup.close();
      }

      setError(openError instanceof Error ? openError.message : "Ouverture impossible");
    } finally {
      setIsOpening(false);
    }
  };

  const downloadAttachment = async () => {
    try {
      setError(null);
      setIsDownloading(true);

      const blob = await fetchProtectedBlob(attachment.downloadUrl, { download: true });
      const downloadUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = attachment.fileName;
      anchor.click();
      setTimeout(() => {
        URL.revokeObjectURL(downloadUrl);
      }, 0);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "Telechargement impossible");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div data-testid="message-attachment-card" className="rounded-[1.1rem] border border-slate-200 bg-white/90 p-2.5 shadow-sm">
      {renderAttachmentPreview(attachment, objectUrl, isLoadingPreview, error)}

      <div className="mt-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-800">{attachment.fileName}</p>
          <p className="text-xs text-slate-500">
            {formatAttachmentCategory(attachment.category)} · {formatFileSize(attachment.sizeBytes)}
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-slate-400">{attachment.mimeType}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={openAttachment}
            disabled={isOpening}
            data-testid="message-attachment-open"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition hover:border-teal-300 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label={`Ouvrir ${attachment.fileName}`}
          >
            {isOpening ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
            <span className="hidden sm:inline">Ouvrir</span>
          </button>

          <button
            type="button"
            onClick={downloadAttachment}
            disabled={isDownloading}
            data-testid="message-attachment-download"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition hover:border-teal-300 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label={`Telecharger ${attachment.fileName}`}
          >
            {isDownloading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            <span className="hidden sm:inline">Telecharger</span>
          </button>
        </div>
      </div>

      {error ? <p className="mt-2 text-xs text-amber-700">{error}</p> : null}
    </div>
  );
}

function renderAttachmentPreview(
  attachment: MessageAttachment,
  objectUrl: string | null,
  isLoadingPreview: boolean,
  error: string | null,
) {
  if (!isPreviewableAttachment(attachment)) {
    const extension = getAttachmentExtension(attachment.fileName);

    return (
      <div className="relative overflow-hidden rounded-[1rem] border border-slate-200 bg-[radial-gradient(circle_at_top_right,#dbeafe,transparent_45%),linear-gradient(135deg,#f8fafc,#eef2ff_55%,#f8fafc)] px-4 py-4 text-slate-700">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/70 blur-2xl" />
        <div className="relative flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
            <FileText className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                {formatAttachmentCategory(attachment.category)}
              </span>
              {extension ? (
                <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white">
                  {extension}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
                <Shield className="h-3 w-3" />
                Chiffre
              </span>
            </div>

            <p className="mt-3 text-sm font-medium text-slate-800">Document securise pret pour revue ou export.</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Le fichier reste chiffre en base et n'est decrypte qu'a l'ouverture authentifiee.</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoadingPreview) {
    return (
      <div className="flex min-h-28 items-center justify-center rounded-[1rem] border border-slate-200 bg-slate-50 text-slate-500">
        <LoaderCircle className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (error || !objectUrl) {
    return (
      <div className="flex min-h-28 items-center justify-center gap-2 rounded-[1rem] border border-slate-200 bg-slate-50 px-4 text-center text-sm text-slate-500">
        {attachment.category === "VIDEO" ? <Video className="h-5 w-5" /> : null}
        {attachment.category === "IMAGE" ? <ImageIcon className="h-5 w-5" /> : null}
        {attachment.category === "AUDIO" ? <Music4 className="h-5 w-5" /> : null}
        <span>{error ?? "Apercu indisponible"}</span>
      </div>
    );
  }

  if (attachment.category === "IMAGE") {
    return (
      <div className="relative overflow-hidden rounded-[1rem] border border-slate-200 bg-slate-100">
        <span className="absolute left-3 top-3 z-10 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-700 shadow-sm">
          Image securisee
        </span>
        <img src={objectUrl} alt={attachment.fileName} className="max-h-72 w-full object-cover" />
      </div>
    );
  }

  if (attachment.category === "VIDEO") {
    return (
      <div className="relative overflow-hidden rounded-[1rem] border border-slate-200 bg-slate-950 shadow-inner">
        <div className="pointer-events-none absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-slate-950/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white backdrop-blur-sm">
          <Video className="h-3.5 w-3.5" />
          Video securisee
        </div>
        <video controls preload="metadata" src={objectUrl} className="aspect-video max-h-80 w-full bg-black object-contain" />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[1rem] border border-slate-200 bg-[linear-gradient(135deg,#f8fafc,#ecfeff_55%,#f8fafc)] px-3 py-3">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
        <Music4 className="h-4 w-4 text-teal-700" />
        Audio securise
      </div>
      <audio controls src={objectUrl} className="mt-3 w-full" />
    </div>
  );
}

function isPreviewableAttachment(attachment: MessageAttachment) {
  return attachment.category === "IMAGE" || attachment.category === "VIDEO" || attachment.category === "AUDIO";
}

function formatAttachmentCategory(category: MessageAttachment["category"]) {
  if (category === "IMAGE") {
    return "Image";
  }

  if (category === "VIDEO") {
    return "Video";
  }

  if (category === "AUDIO") {
    return "Audio";
  }

  if (category === "DOCUMENT") {
    return "Document";
  }

  return "Fichier";
}

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} o`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} Ko`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function getAttachmentExtension(fileName: string) {
  const chunks = fileName.split(".");
  if (chunks.length < 2) {
    return "";
  }

  return chunks.at(-1)?.slice(0, 6) ?? "";
}

async function fetchProtectedBlobAsObjectUrl(path: string, fileName: string) {
  const blob = await fetchProtectedBlob(path);
  const nextObjectUrl = URL.createObjectURL(blob);

  window.setTimeout(() => {
    URL.revokeObjectURL(nextObjectUrl);
  }, 60_000);

  return nextObjectUrl;
}