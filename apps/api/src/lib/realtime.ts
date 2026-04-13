import { randomUUID } from "node:crypto";
import type { Response } from "express";
import { prisma } from "./prisma";

type StreamConnection = {
  id: string;
  response: Response;
  heartbeat: NodeJS.Timeout;
};

const userConnections = new Map<string, Map<string, StreamConnection>>();

function writeEvent(response: Response, event: string, payload: unknown) {
  response.write(`event: ${event}\n`);
  response.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function getConnectionBucket(userId: string) {
  let bucket = userConnections.get(userId);

  if (!bucket) {
    bucket = new Map<string, StreamConnection>();
    userConnections.set(userId, bucket);
  }

  return bucket;
}

function removeConnection(userId: string, connectionId: string) {
  const bucket = userConnections.get(userId);
  if (!bucket) {
    return true;
  }

  const connection = bucket.get(connectionId);
  if (!connection) {
    return bucket.size === 0;
  }

  clearInterval(connection.heartbeat);
  bucket.delete(connectionId);

  if (bucket.size === 0) {
    userConnections.delete(userId);
    return true;
  }

  return false;
}

async function broadcastPresence(userId: string, online: boolean) {
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ buyerId: userId }, { sellerId: userId }],
    },
    select: {
      buyerId: true,
      sellerId: true,
    },
  });

  const recipients = new Set<string>();

  for (const conversation of conversations) {
    if (conversation.buyerId !== userId) {
      recipients.add(conversation.buyerId);
    }

    if (conversation.sellerId !== userId) {
      recipients.add(conversation.sellerId);
    }
  }

  for (const recipientId of recipients) {
    emitToUser(recipientId, "presence:update", { userId, online });
  }
}

export function isUserOnline(userId: string) {
  return (userConnections.get(userId)?.size ?? 0) > 0;
}

export async function registerRealtimeClient(userId: string, response: Response) {
  response.status(200);
  response.setHeader("Content-Type", "text/event-stream");
  response.setHeader("Cache-Control", "no-cache, no-transform");
  response.setHeader("Connection", "keep-alive");
  response.setHeader("X-Accel-Buffering", "no");
  response.flushHeaders();
  response.write("retry: 1500\n\n");

  const connectionId = randomUUID();
  const heartbeat = setInterval(() => {
    if (!response.writableEnded) {
      response.write(": ping\n\n");
    }
  }, 25_000);

  getConnectionBucket(userId).set(connectionId, {
    id: connectionId,
    response,
    heartbeat,
  });

  writeEvent(response, "stream:ready", {
    userId,
    connectedAt: new Date().toISOString(),
  });

  if ((userConnections.get(userId)?.size ?? 0) === 1) {
    await broadcastPresence(userId, true);
  }

  return connectionId;
}

export async function unregisterRealtimeClient(userId: string, connectionId: string) {
  const becameOffline = removeConnection(userId, connectionId);

  if (becameOffline) {
    await broadcastPresence(userId, false);
  }
}

export function emitToUser(userId: string, event: string, payload: unknown) {
  const bucket = userConnections.get(userId);
  if (!bucket) {
    return;
  }

  for (const [connectionId, connection] of bucket.entries()) {
    if (connection.response.writableEnded || connection.response.destroyed) {
      removeConnection(userId, connectionId);
      continue;
    }

    try {
      writeEvent(connection.response, event, payload);
    } catch {
      removeConnection(userId, connectionId);
    }
  }
}

export function emitToUsers(userIds: string[], event: string, payload: unknown) {
  const uniqueUserIds = new Set(userIds);

  for (const userId of uniqueUserIds) {
    emitToUser(userId, event, payload);
  }
}