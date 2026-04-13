"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { RequireAuth } from "@/components/auth/require-auth";
import { useAuth } from "@/components/providers/auth-provider";
import { apiRequest } from "@/lib/api";
import { Conversation, Message } from "@/types";

export default function MessagesPage() {
  return (
    <RequireAuth>
      <Suspense fallback={<p className="mx-auto max-w-6xl px-4 py-10 text-sm text-slate-500">Chargement des messages...</p>}>
        <MessagesContent />
      </Suspense>
    </RequireAuth>
  );
}

function MessagesContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const requestedConversationId = searchParams.get("conversation");

  useEffect(() => {
    apiRequest<Conversation[]>("/messages/conversations", { auth: true })
      .then((data) => {
        setConversations(data);
        if (requestedConversationId && data.some((conversation) => conversation.id === requestedConversationId)) {
          setActiveId(requestedConversationId);
        } else if (data[0]) {
          setActiveId(data[0].id);
        }
      })
      .catch((err: Error) => setError(err.message));
  }, [requestedConversationId]);

  useEffect(() => {
    if (!activeId) return;
    apiRequest<Message[]>(`/messages/conversations/${activeId}/messages`, { auth: true })
      .then(setMessages)
      .catch((err: Error) => setError(err.message));
  }, [activeId]);

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeId || !text.trim()) return;

    try {
      await apiRequest(`/messages/conversations/${activeId}/messages`, {
        method: "POST",
        auth: true,
        body: { content: text },
      });
      const refreshed = await apiRequest<Message[]>(`/messages/conversations/${activeId}/messages`, { auth: true });
      setMessages(refreshed);
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'envoyer le message");
    }
  };

  const activeConversation = conversations.find((conversation) => conversation.id === activeId) ?? null;
  const counterparty = activeConversation
    ? activeConversation.buyer.id === user?.id
      ? activeConversation.seller.name
      : activeConversation.buyer.name
    : null;

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-8 lg:grid-cols-[280px,1fr] sm:px-6">
      <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <h1 className="px-2 text-lg font-semibold text-slate-900">Messages</h1>
        <div className="mt-3 space-y-2">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => setActiveId(conversation.id)}
              data-testid={`conversation-${conversation.id}`}
              className={`w-full rounded-xl px-3 py-2 text-left text-sm ${
                activeId === conversation.id ? "bg-teal-50 text-teal-900" : "bg-slate-50 text-slate-700"
              }`}
            >
              <p className="font-medium">{conversation.listing?.title ?? "Conversation directe"}</p>
              <p className="truncate text-xs text-slate-500">{conversation.messages[0]?.content ?? "Aucun message"}</p>
            </button>
          ))}
        </div>
      </aside>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 border-b border-slate-200 pb-4">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Conversation</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">{counterparty ?? "Selectionnez un fil"}</h2>
          <p className="mt-1 text-sm text-slate-600">{activeConversation?.listing?.title ?? "Fil direct de due diligence"}</p>
        </div>

        <div className="space-y-2">
          {messages.map((message) => (
            <article key={message.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">{message.sender.name}</p>
              <p className="mt-1 text-sm text-slate-800">{message.content}</p>
            </article>
          ))}
          {messages.length === 0 ? <p className="text-sm text-slate-500">Selectionnez une conversation pour commencer.</p> : null}
        </div>

        <form onSubmit={sendMessage} className="mt-4 flex gap-2">
          <input
            aria-label="Ecrire un message"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ecrire un message"
            className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-400 focus:ring"
          />
          <button data-testid="send-message" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-600">
            Envoyer
          </button>
        </form>

        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      </section>
    </div>
  );
}
