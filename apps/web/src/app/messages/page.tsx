"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, Suspense, startTransition, useCallback, useDeferredValue, useEffect, useEffectEvent, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import { ArrowLeft, Check, CheckCheck, LoaderCircle, Paperclip, Search, SendHorizonal, Trash2, X } from "lucide-react";
import { RequireAuth } from "@/components/auth/require-auth";
import { usePageTransitionRouter } from "@/components/common/page-transition-shell";
import { MessageAttachmentCard } from "@/components/messages/message-attachment-card";
import { MessagesEmptyState } from "@/components/messages/messages-empty-state";
import { useAuth } from "@/components/providers/auth-provider";
import { apiRequest, authStorage, isAbortError, sendConversationMessage } from "@/lib/api";
import { openApiEventStream } from "@/lib/realtime-stream";
import { Conversation, Message } from "@/types";

type MessageStreamPayload = {
  conversationId: string;
  message: Message;
};

type ReadReceiptPayload = {
  conversationId: string;
  messageIds: string[];
  readAt: string | null;
  readerId: string;
};

type PresencePayload = {
  userId: string;
  online: boolean;
};

type ConversationDeletedPayload = {
  conversationId: string;
};

type TimelineItem =
  | { type: "day"; key: string; label: string }
  | { type: "message"; key: string; message: Message };

const MESSAGE_ATTACHMENT_ACCEPT = "image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,.csv,.zip,.json,.xml,.odt,.ods,.odp";
const MAX_ATTACHMENTS_PER_MESSAGE = 8;
const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;

export default function MessagesPage() {
  return (
    <RequireAuth>
      <Suspense fallback={<p className="w-full px-4 py-10 text-sm text-slate-500 sm:px-5 lg:px-6">Chargement des messages...</p>}>
        <MessagesContent />
      </Suspense>
    </RequireAuth>
  );
}

function MessagesContent() {
  const { replace } = usePageTransitionRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [queuedFiles, setQueuedFiles] = useState<File[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isDeletingConversation, setIsDeletingConversation] = useState(false);
  const [, setConnectionState] = useState<"connecting" | "connected" | "reconnecting">("connecting");
  const [isMobileListOpen, setIsMobileListOpen] = useState(true);
  const requestedConversationId = searchParams.get("conversation");
  const deferredSearch = useDeferredValue(search);
  const messagesViewportRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const readMarkerRef = useRef<Record<string, string>>({});

  const applyReceipt = useEffectEvent((receipt: ReadReceiptPayload) => {
    startTransition(() => {
      setMessages((current) => applyReadReceiptToMessages(current, receipt));
      setConversations((current) => applyReadReceiptToConversations(current, receipt, user?.id ?? null));
    });
  });

  const loadConversations = useEffectEvent(async (signal?: AbortSignal) => {
    setError(null);

    try {
      const data = await apiRequest<Conversation[]>("/messages/conversations", {
        auth: true,
        signal,
        memoryCache: false,
      });

      if (signal?.aborted) {
        return;
      }

      startTransition(() => {
        const sorted = sortConversations(data);
        setConversations(sorted);
        setActiveId((current) => {
          if (current && sorted.some((conversation) => conversation.id === current)) {
            return current;
          }

          if (requestedConversationId && sorted.some((conversation) => conversation.id === requestedConversationId)) {
            return requestedConversationId;
          }

          return sorted[0]?.id ?? null;
        });

        if (sorted.length === 0) {
          setMessages([]);
          setIsMobileListOpen(true);
        }
      });
    } catch (err) {
      if (isAbortError(err)) {
        return;
      }

      setError(err instanceof Error ? err.message : "Impossible de charger les conversations");
    }
  });

  const loadMessages = useEffectEvent(async (conversationId: string, signal?: AbortSignal) => {
    setError(null);

    try {
      const data = await apiRequest<Message[]>(`/messages/conversations/${conversationId}/messages`, {
        auth: true,
        signal,
        memoryCache: false,
      });

      if (signal?.aborted) {
        return;
      }

      startTransition(() => setMessages(sortMessages(data)));
    } catch (err) {
      if (isAbortError(err)) {
        return;
      }

      setError(err instanceof Error ? err.message : "Impossible de charger les messages");
    }
  });

  const markConversationRead = useEffectEvent(async (conversationId: string, messageIds: string[]) => {
    const signature = [...messageIds].sort().join("|");
    if (!signature) {
      return;
    }

    if (readMarkerRef.current[conversationId] === signature) {
      return;
    }

    readMarkerRef.current[conversationId] = signature;

    try {
      const receipt = await apiRequest<ReadReceiptPayload>(`/messages/conversations/${conversationId}/read`, {
        method: "POST",
        auth: true,
      });

      if (receipt.messageIds.length > 0) {
        applyReceipt(receipt);
      }
    } catch (err) {
      if (!isAbortError(err)) {
        setError(err instanceof Error ? err.message : "Impossible de confirmer la lecture");
      }
    } finally {
      delete readMarkerRef.current[conversationId];
    }
  });

  const applyConversationDeletion = useCallback((conversationId: string) => {
    const remainingConversations = conversations.filter((conversation) => conversation.id !== conversationId);
    const nextActiveId = activeId === conversationId ? remainingConversations[0]?.id ?? null : activeId;

    startTransition(() => {
      setConversations(remainingConversations);

      if (activeId === conversationId) {
        setActiveId(nextActiveId);
        setMessages([]);
        setText("");
        setQueuedFiles([]);
        setIsMobileListOpen(remainingConversations.length === 0);
      }
    });

    if (activeId === conversationId) {
      void replace(nextActiveId ? `/messages?conversation=${nextActiveId}` : "/messages");
    }
  }, [activeId, conversations, replace]);

  const handleStreamEvent = useEffectEvent((event: string, payload: unknown) => {
    if (event === "stream:ready") {
      setConnectionState("connected");
      return;
    }

    if (event === "presence:update") {
      const presence = payload as PresencePayload;
      startTransition(() => {
        setConversations((current) =>
          current.map((conversation) => ({
            ...conversation,
            buyer:
              conversation.buyer.id === presence.userId
                ? { ...conversation.buyer, online: presence.online }
                : conversation.buyer,
            seller:
              conversation.seller.id === presence.userId
                ? { ...conversation.seller, online: presence.online }
                : conversation.seller,
          })),
        );
      });
      return;
    }

    if (event === "conversation:read") {
      applyReceipt(payload as ReadReceiptPayload);
      return;
    }

    if (event === "conversation:deleted") {
      applyConversationDeletion((payload as ConversationDeletedPayload).conversationId);
      return;
    }

    if (event === "message:new") {
      const nextMessage = payload as MessageStreamPayload;

      startTransition(() => {
        if (nextMessage.conversationId === activeId) {
          setMessages((current) => upsertMessage(current, nextMessage.message));
        }

        setConversations((current) => {
          const updated = applyIncomingMessageToConversations(
            current,
            nextMessage.conversationId,
            nextMessage.message,
            user?.id ?? null,
            activeId,
          );

          if (!updated) {
            void loadConversations();
            return current;
          }

          return updated;
        });
      });

      if (nextMessage.conversationId === activeId && nextMessage.message.sender.id !== user?.id) {
        void markConversationRead(nextMessage.conversationId, [nextMessage.message.id]);
      }
    }
  });

  useEffect(() => {
    const controller = new AbortController();
    void loadConversations(controller.signal);

    return () => controller.abort();
  }, [requestedConversationId]);

  useEffect(() => {
    if (!activeId) {
      startTransition(() => setMessages([]));
      return;
    }

    const controller = new AbortController();

    startTransition(() => setMessages([]));
    setQueuedFiles([]);
    void loadMessages(activeId, controller.signal);

    return () => controller.abort();
  }, [activeId]);

  useEffect(() => {
    if (!requestedConversationId) {
      return;
    }

    setIsMobileListOpen(false);
  }, [requestedConversationId]);

  useEffect(() => {
    if (!activeId || !user?.id) {
      return;
    }

    const unreadIncomingIds = messages.filter((message) => message.sender.id !== user.id && !message.readAt).map((message) => message.id);
    if (unreadIncomingIds.length === 0) {
      return;
    }

    void markConversationRead(activeId, unreadIncomingIds);
  }, [activeId, messages, user?.id]);

  useEffect(() => {
    const viewport = messagesViewportRef.current;
    if (!viewport) {
      return;
    }

    viewport.scrollTop = viewport.scrollHeight;
  }, [activeId, messages.length]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const token = authStorage.getToken();
    if (!token) {
      return;
    }

    const controller = new AbortController();
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    const connect = async () => {
      if (disposed) {
        return;
      }

      setConnectionState((current) => (current === "connected" ? "reconnecting" : "connecting"));

      try {
        await openApiEventStream("/messages/stream", {
          token,
          signal: controller.signal,
          onEvent: handleStreamEvent,
        });

        if (!disposed && !controller.signal.aborted) {
          setConnectionState("reconnecting");
          reconnectTimer = setTimeout(() => {
            void connect();
          }, 1200);
        }
      } catch (err) {
        if (disposed || controller.signal.aborted || isAbortError(err)) {
          return;
        }

        setConnectionState("reconnecting");
        reconnectTimer = setTimeout(() => {
          void connect();
        }, 1200);
      }
    };

    void connect();

    return () => {
      disposed = true;
      controller.abort();

      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
    };
  }, [user?.id]);

  const handleAttachmentSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (selectedFiles.length === 0) {
      return;
    }

    const nextQueuedFiles = [...queuedFiles];
    const selectionErrors: string[] = [];

    for (const file of selectedFiles) {
      if (file.size > MAX_ATTACHMENT_BYTES) {
        selectionErrors.push(`${file.name} depasse 20 Mo.`);
        continue;
      }

      const fileSignature = buildLocalFileSignature(file);
      if (nextQueuedFiles.some((queuedFile) => buildLocalFileSignature(queuedFile) === fileSignature)) {
        continue;
      }

      if (nextQueuedFiles.length >= MAX_ATTACHMENTS_PER_MESSAGE) {
        selectionErrors.push(`Maximum ${MAX_ATTACHMENTS_PER_MESSAGE} pieces jointes par message.`);
        break;
      }

      nextQueuedFiles.push(file);
    }

    setQueuedFiles(nextQueuedFiles);

    if (selectionErrors.length > 0) {
      setError(selectionErrors.join(" "));
      return;
    }

    setError(null);
  };

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeId || (!text.trim() && queuedFiles.length === 0)) return;

    const content = text.trim();

    try {
      setError(null);
      setIsSending(true);
      const message = await sendConversationMessage<Message>({
        conversationId: activeId,
        content,
        attachments: queuedFiles,
      });

      startTransition(() => {
        setMessages((current) => upsertMessage(current, message));
        setConversations((current) => applyIncomingMessageToConversations(current, activeId, message, user?.id ?? null, activeId) ?? current);
      });

      setText("");
      setQueuedFiles([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'envoyer le message");
    } finally {
      setIsSending(false);
    }
  };

  const deleteConversation = async () => {
    if (!activeConversation) {
      return;
    }

    const confirmed = window.confirm(
      "Supprimer ce chat pour tous les participants ? Tous les messages et pieces jointes seront effaces de la base.",
    );

    if (!confirmed) {
      return;
    }

    try {
      setError(null);
      setIsDeletingConversation(true);
      const payload = await apiRequest<ConversationDeletedPayload>(`/messages/conversations/${activeConversation.id}`, {
        method: "DELETE",
        auth: true,
      });

      applyConversationDeletion(payload.conversationId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de supprimer la conversation");
    } finally {
      setIsDeletingConversation(false);
    }
  };

  const activeConversation = conversations.find((conversation) => conversation.id === activeId) ?? null;
  const counterparty = activeConversation ? getCounterparty(activeConversation, user?.id ?? null) : null;
  const totalUnread = conversations.reduce((count, conversation) => count + conversation.unreadCount, 0);
  const timeline = buildTimeline(messages);
  const filteredConversations = conversations.filter((conversation) => matchesConversation(conversation, deferredSearch, user?.id ?? null));
  const canSendMessage = Boolean(text.trim() || queuedFiles.length > 0);

  return (
    <div className="page-shell page-stack pt-4 sm:pt-6">
      <section className="studio-shell overflow-hidden px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-3xl">
            <p className="studio-kicker">Chat deal flow en direct</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl lg:text-6xl">Messagerie instantanee, lecture en direct et fils negocies comme une vraie app de chat.</h1>
            <p className="mt-4 text-sm leading-7 text-slate-700 sm:text-base">
              Les nouveaux messages, la presence, les confirmations de lecture et les pieces jointes chiffrees se synchronisent sans actualiser la page.
            </p>
          </div>

          <div className="grid w-full gap-3 self-start sm:grid-cols-2 xl:ml-auto xl:max-w-[460px] xl:min-w-0">
            <MetricCard label="Fils" value={`${conversations.length}`} helper="Tous vos deals ouverts" />
            <MetricCard label="Non lus" value={`${totalUnread}`} helper="Badges en direct" />
          </div>
        </div>
      </section>

      {error ? <p className="rounded-[1.4rem] border border-rose-200 bg-rose-50/80 px-4 py-4 text-sm text-rose-700">{error}</p> : null}

      {conversations.length === 0 ? <MessagesEmptyState /> : null}

      {conversations.length > 0 ? (
        <div className="overflow-hidden rounded-[2rem] border border-[var(--line)] bg-white/72 shadow-sm backdrop-blur-xl">
          <div className="grid h-[72dvh] max-h-[840px] min-h-[420px] sm:min-h-[520px] md:grid-cols-[320px_minmax(0,1fr)] lg:grid-cols-[360px_minmax(0,1fr)]">
            <aside
              className={clsx(
                "flex min-h-0 min-w-0 flex-col border-b border-[var(--line)] bg-[linear-gradient(180deg,rgba(255,251,245,0.92),rgba(255,255,255,0.8))] md:border-b-0 md:border-r",
                activeConversation && !isMobileListOpen ? "hidden md:flex" : "flex",
              )}
            >
              <div className="border-b border-[var(--line)] px-4 py-3 sm:px-5">
                <div>
                  <p className="studio-kicker !text-[0.62rem] !tracking-[0.18em]">Conversations</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">Messages</h2>
                </div>

                <label className="mt-3 flex items-center gap-3 rounded-[1.3rem] border border-[var(--line)] bg-white/78 px-3 py-2.5 shadow-sm">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Rechercher un deal ou un contact"
                    className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                  />
                </label>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-2 dashboard-scrollbar sm:p-3">
                <div className="space-y-2">
                  {filteredConversations.map((conversation) => {
                    const counterpart = getCounterparty(conversation, user?.id ?? null);
                    const lastMessage = conversation.messages[0] ?? null;
                    const isActive = activeId === conversation.id;

                    return (
                      <button
                        key={conversation.id}
                        type="button"
                        onClick={() => {
                          setActiveId(conversation.id);
                          setIsMobileListOpen(false);
                        }}
                        data-testid={`conversation-${conversation.id}`}
                        className={clsx(
                          "w-full rounded-[1.4rem] border px-3 py-2.5 text-left transition",
                          isActive
                            ? "border-lime-300/45 bg-lime-300/10 shadow-sm"
                            : "border-[var(--line)] bg-white/76 hover:-translate-y-0.5 hover:bg-white",
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <AvatarLabel name={counterpart?.name ?? "?"} online={Boolean(counterpart?.online)} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-900">{counterpart?.name ?? "Contact prive"}</p>
                                <p className="mt-0.5 truncate text-xs text-slate-500">{conversation.listing?.title ?? "Conversation directe"}</p>
                              </div>
                              <div className="flex shrink-0 flex-col items-end gap-2">
                                <span className="text-[11px] font-medium text-slate-400">
                                  {lastMessage ? formatConversationTime(lastMessage.createdAt) : formatConversationTime(conversation.createdAt)}
                                </span>
                                {conversation.unreadCount > 0 ? (
                                  <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-2 py-1 text-[11px] font-semibold text-[color:var(--accent-ink)]">
                                    {conversation.unreadCount}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              {lastMessage && lastMessage.sender.id === user?.id ? <MessageStateIcon isOwn readAt={lastMessage.readAt} /> : null}
                              <p className="truncate text-sm text-slate-600">{formatMessagePreview(lastMessage)}</p>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  {filteredConversations.length === 0 ? (
                    <div className="rounded-[1.6rem] border border-dashed border-[var(--line)] bg-white/58 px-4 py-6 text-sm text-slate-500">
                      Aucun fil ne correspond a votre recherche.
                    </div>
                  ) : null}
                </div>
              </div>
            </aside>

            <section
              className={clsx(
                "flex min-h-0 min-w-0 flex-col bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(247,242,234,0.7))]",
                !activeConversation || isMobileListOpen ? "hidden md:flex" : "flex",
              )}
            >
              {activeConversation ? (
                <>
                  <header className="border-b border-[var(--line)] bg-white/86 px-4 py-3 backdrop-blur-sm sm:px-5">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setIsMobileListOpen(true)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line)] bg-white/78 text-slate-600 md:hidden"
                        aria-label="Retour aux conversations"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </button>

                      <AvatarLabel name={counterparty?.name ?? "?"} online={Boolean(counterparty?.online)} large />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="truncate text-lg font-semibold text-slate-900">{counterparty?.name ?? "Selectionnez un fil"}</h2>
                          <span
                            className={clsx(
                              "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                              counterparty?.online ? "border border-lime-300/35 bg-lime-300/14 text-lime-800" : "bg-slate-100 text-slate-500",
                            )}
                          >
                            {counterparty?.online ? "En ligne" : "Hors ligne"}
                          </span>
                        </div>
                        <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2 text-sm text-slate-500">
                          <span className="max-w-full truncate">{activeConversation.listing?.title ?? "Conversation directe"}</span>
                          {activeConversation.listing?.id ? (
                            <>
                              <span className="text-slate-300">/</span>
                              <Link href={`/listings/${activeConversation.listing.id}`} className="font-medium text-slate-950 hover:text-slate-700">
                                Voir l&apos;annonce
                              </Link>
                            </>
                          ) : null}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={deleteConversation}
                        disabled={isDeletingConversation}
                        data-testid="delete-conversation"
                        className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 text-xs font-medium text-rose-700 transition hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label="Supprimer ce chat"
                      >
                        {isDeletingConversation ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        <span className="hidden sm:inline">Supprimer</span>
                      </button>
                    </div>
                  </header>

                  <div
                    ref={messagesViewportRef}
                    className="min-h-0 flex-1 overflow-y-auto bg-[linear-gradient(180deg,rgba(255,255,255,0.22),rgba(255,250,244,0.45))] px-3 py-2 dashboard-scrollbar sm:px-4 sm:py-3"
                  >
                    <div className="flex w-full flex-col gap-2">
                      {timeline.map((item) =>
                        item.type === "day" ? (
                          <div key={item.key} className="self-start rounded-full border border-[var(--line)] bg-white/80 px-4 py-1.5 text-xs font-medium text-slate-500">
                            {item.label}
                          </div>
                        ) : (
                          <MessageBubble key={item.key} message={item.message} isOwn={item.message.sender.id === user?.id} />
                        ),
                      )}

                      {timeline.length === 0 ? (
                        <div className="max-w-md rounded-2xl border border-[var(--line)] bg-white/80 px-4 py-4 text-left text-sm text-slate-500">
                          Aucun message pour le moment. Lancez la conversation pour faire avancer le deal.
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <form onSubmit={sendMessage} className="border-t border-[var(--line)] bg-white/86 px-3 py-2 backdrop-blur-sm sm:px-4 sm:py-2.5">
                    <input
                      ref={fileInputRef}
                      type="file"
                      data-testid="message-attachments-input"
                      multiple
                      accept={MESSAGE_ATTACHMENT_ACCEPT}
                      onChange={handleAttachmentSelection}
                      className="hidden"
                    />

                    {queuedFiles.length > 0 ? (
                      <div className="mb-2 flex flex-wrap gap-2">
                        {queuedFiles.map((file, index) => (
                          <div
                            key={buildLocalFileSignature(file)}
                            className="inline-flex max-w-full items-center gap-2 rounded-full border border-[var(--line)] bg-white/76 px-3 py-1.5 text-xs text-slate-600"
                          >
                            <span className="truncate">{file.name}</span>
                            <span className="text-slate-400">{formatFileSize(file.size)}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setQueuedFiles((current) => current.filter((_, queuedIndex) => queuedIndex !== index));
                              }}
                              className="inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                              aria-label={`Retirer ${file.name}`}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    <div className="flex items-end gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        data-testid="message-attachments-trigger"
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--line)] bg-white/80 text-slate-600 transition hover:-translate-y-0.5 hover:bg-white"
                        aria-label="Ajouter des pieces jointes"
                      >
                        <Paperclip className="h-4 w-4" />
                      </button>

                      <label className="flex-1 rounded-[1.4rem] border border-[var(--line)] bg-white/76 px-3 py-2">
                        <textarea
                          aria-label="Ecrire un message"
                          value={text}
                          onChange={(event) => setText(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && !event.shiftKey) {
                              event.preventDefault();
                              event.currentTarget.form?.requestSubmit();
                            }
                          }}
                          placeholder="Ecrire un message"
                          rows={1}
                          className="max-h-32 w-full resize-none bg-transparent text-sm leading-5 text-slate-800 outline-none placeholder:text-slate-400"
                        />
                      </label>

                      <button
                        type="submit"
                        data-testid="send-message"
                        disabled={isSending || !canSendMessage}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] text-[color:var(--accent-ink)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSending ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <SendHorizonal className="h-5 w-5" />}
                      </button>
                    </div>

                    <div className="mt-1.5 text-[11px] text-slate-500">
                      <p>Entree pour envoyer, Maj + Entree pour une nouvelle ligne. Jusqu&apos;a 8 fichiers et 20 Mo par piece jointe.</p>
                    </div>
                  </form>
                </>
              ) : (
                <div className="hidden flex-1 items-center justify-center p-8 md:flex">
                  <div className="studio-panel max-w-md px-6 py-8 text-center">
                    <p className="studio-kicker justify-center">Messagerie</p>
                    <h2 className="mt-3 text-3xl font-semibold text-slate-950">Selectionnez un fil</h2>
                    <p className="mt-3 text-sm leading-7 text-slate-600">Choisissez une conversation a gauche pour afficher l&apos;historique, voir les confirmations de lecture et repondre en direct.</p>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MetricCard({ label, value, helper, icon }: { label: string; value: string; helper: string; icon?: React.ReactNode }) {
  return (
    <div className="studio-stat">
      <div className="flex items-center justify-between gap-2 text-xs uppercase tracking-[0.12em] text-slate-500">
        <span>{label}</span>
        {icon ? <span className="text-slate-500">{icon}</span> : null}
      </div>
      <p className="mt-3 text-xl font-semibold text-slate-950">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{helper}</p>
    </div>
  );
}

function AvatarLabel({ name, online, large = false }: { name: string; online: boolean; large?: boolean }) {
  return (
    <div className={clsx("relative flex shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#0f172a,#0f766e)] font-semibold text-white shadow-sm", large ? "h-12 w-12 text-sm" : "h-11 w-11 text-xs")}>
      {initials(name)}
      <span
        className={clsx(
          "absolute bottom-0 right-0 rounded-full border-2 border-white",
          large ? "h-3.5 w-3.5" : "h-3 w-3",
          online ? "bg-teal-500" : "bg-slate-300",
        )}
      />
    </div>
  );
}

function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  return (
    <div className="flex justify-start">
      <article
        className={clsx(
          "max-w-[85%] rounded-xl border px-3 py-2 sm:max-w-[75%]",
          isOwn
            ? "border-teal-200 bg-teal-50 text-slate-900"
            : "border-slate-200 bg-white text-slate-900",
        )}
      >
        {message.content ? <p className="text-sm leading-6 whitespace-pre-wrap break-words text-slate-800 [overflow-wrap:anywhere]">{message.content}</p> : null}

        {message.attachments.length > 0 ? (
          <div className={clsx("flex flex-col gap-2", message.content ? "mt-2" : null)}>
            {message.attachments.map((attachment) => (
              <MessageAttachmentCard key={attachment.id} attachment={attachment} />
            ))}
          </div>
        ) : null}

        <div className="mt-1 flex items-center justify-end gap-1.5 text-[10px] text-slate-400">
          <span>{formatMessageTime(message.createdAt)}</span>
          <MessageStateIcon isOwn={isOwn} readAt={message.readAt} />
        </div>
      </article>
    </div>
  );
}

function MessageStateIcon({ isOwn, readAt }: { isOwn: boolean; readAt: string | null }) {
  if (!isOwn) {
    return null;
  }

  if (readAt) {
    return <CheckCheck className="h-3 w-3 text-teal-600" />;
  }

  return <Check className="h-3 w-3 text-slate-400" />;
}

function sortConversations(conversations: Conversation[]) {
  return [...conversations].sort((left, right) => {
    const leftActivity = left.messages[0]?.createdAt ?? left.createdAt;
    const rightActivity = right.messages[0]?.createdAt ?? right.createdAt;
    return new Date(rightActivity).getTime() - new Date(leftActivity).getTime();
  });
}

function sortMessages(messages: Message[]) {
  return [...messages].sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
}

function upsertMessage(messages: Message[], nextMessage: Message) {
  const existing = messages.find((message) => message.id === nextMessage.id);
  if (existing) {
    return sortMessages(messages.map((message) => (message.id === nextMessage.id ? { ...message, ...nextMessage } : message)));
  }

  return sortMessages([...messages, nextMessage]);
}

function applyIncomingMessageToConversations(
  conversations: Conversation[],
  conversationId: string,
  nextMessage: Message,
  currentUserId: string | null,
  activeConversationId: string | null,
) {
  const targetConversation = conversations.find((conversation) => conversation.id === conversationId);
  if (!targetConversation) {
    return null;
  }

  const incomingFromOtherUser = nextMessage.sender.id !== currentUserId;
  const alreadyPreviewed = targetConversation.messages[0]?.id === nextMessage.id;

  const updatedConversation: Conversation = {
    ...targetConversation,
    unreadCount:
      incomingFromOtherUser && activeConversationId !== conversationId && !alreadyPreviewed
        ? targetConversation.unreadCount + 1
        : activeConversationId === conversationId
          ? 0
          : targetConversation.unreadCount,
    messages: [nextMessage],
  };

  return sortConversations(
    conversations.map((conversation) => (conversation.id === conversationId ? updatedConversation : conversation)),
  );
}

function applyReadReceiptToMessages(messages: Message[], receipt: ReadReceiptPayload) {
  if (!receipt.readAt || receipt.messageIds.length === 0) {
    return messages;
  }

  const ids = new Set(receipt.messageIds);
  return messages.map((message) => (ids.has(message.id) ? { ...message, readAt: receipt.readAt } : message));
}

function applyReadReceiptToConversations(conversations: Conversation[], receipt: ReadReceiptPayload, currentUserId: string | null) {
  const ids = new Set(receipt.messageIds);

  return conversations.map((conversation) => {
    if (conversation.id !== receipt.conversationId) {
      return conversation;
    }

    return {
      ...conversation,
      unreadCount: receipt.readerId === currentUserId ? 0 : conversation.unreadCount,
      messages: conversation.messages.map((message) =>
        receipt.readAt && ids.has(message.id) ? { ...message, readAt: receipt.readAt } : message,
      ),
    };
  });
}

function getCounterparty(conversation: Conversation, currentUserId: string | null) {
  return conversation.buyer.id === currentUserId ? conversation.seller : conversation.buyer;
}

function matchesConversation(conversation: Conversation, search: string, currentUserId: string | null) {
  const normalized = search.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  const counterpart = getCounterparty(conversation, currentUserId);
  const preview = formatMessagePreview(conversation.messages[0]);
  const listingTitle = conversation.listing?.title ?? "";
  const attachmentNames = conversation.messages[0]?.attachments.map((attachment) => attachment.fileName).join(" ") ?? "";

  return [counterpart.name, preview, listingTitle, attachmentNames].some((value) => value.toLowerCase().includes(normalized));
}

function buildTimeline(messages: Message[]): TimelineItem[] {
  const items: TimelineItem[] = [];
  let activeDayKey = "";

  for (const message of messages) {
    const dayKey = new Date(message.createdAt).toDateString();

    if (dayKey !== activeDayKey) {
      activeDayKey = dayKey;
      items.push({
        type: "day",
        key: `day-${dayKey}`,
        label: formatTimelineDay(message.createdAt),
      });
    }

    items.push({ type: "message", key: message.id, message });
  }

  return items;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() ?? "")
    .join("");
}

function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatConversationTime(value: string) {
  const date = new Date(value);
  const now = new Date();

  if (date.toDateString() === now.toDateString()) {
    return formatMessageTime(value);
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function formatTimelineDay(value: string) {
  const date = new Date(value);
  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  if (date.toDateString() === now.toDateString()) {
    return "Aujourd'hui";
  }

  if (date.toDateString() === yesterday.toDateString()) {
    return "Hier";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

function formatMessagePreview(message: Conversation["messages"][number] | Message | null | undefined) {
  if (!message) {
    return "Aucun message pour l'instant";
  }

  if (message.content.trim()) {
    return message.content;
  }

  if (message.attachments.length === 0) {
    return "Aucun message pour l'instant";
  }

  if (message.attachments.length === 1) {
    return `${formatAttachmentCategory(message.attachments[0].category)} : ${message.attachments[0].fileName}`;
  }

  return `${message.attachments.length} pieces jointes`;
}

function buildLocalFileSignature(file: File) {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

function formatAttachmentCategory(category: "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT" | "OTHER") {
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
