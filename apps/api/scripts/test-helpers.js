require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const baseUrl = process.env.API_URL || "http://127.0.0.1:4000/api";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function request(path, options = {}) {
  const headers = {};

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  let payload = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { raw: text };
    }
  }

  if (options.expectedStatus && response.status !== options.expectedStatus) {
    throw new Error(
      `Unexpected ${response.status} for ${options.method || "GET"} ${path}: ${JSON.stringify(payload)}`,
    );
  }

  return { status: response.status, body: payload };
}

function createTracker() {
  return {
    userIds: [],
    listingIds: [],
    conversationIds: [],
    offerIds: [],
  };
}

function remember(tracker, key, value) {
  if (value) {
    tracker[key].push(value);
  }
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}

function createUniqueEmail(prefix) {
  return `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`;
}

async function registerUser({ name, role, password = "secret123", emailPrefix, tracker }) {
  const email = createUniqueEmail(emailPrefix);
  const response = await request("/auth/register", {
    method: "POST",
    expectedStatus: 201,
    body: {
      name,
      email,
      password,
      role,
    },
  });

  remember(tracker, "userIds", response.body.user.id);

  return {
    email,
    password,
    token: response.body.token,
    user: response.body.user,
  };
}

async function cleanupTracker(tracker) {
  const conversationIds = uniqueValues(tracker.conversationIds);
  const offerIds = uniqueValues(tracker.offerIds);
  const listingIds = uniqueValues(tracker.listingIds);
  const userIds = uniqueValues(tracker.userIds);

  if (conversationIds.length > 0) {
    await prisma.message.deleteMany({ where: { conversationId: { in: conversationIds } } });
    await prisma.conversation.deleteMany({ where: { id: { in: conversationIds } } });
  }

  if (offerIds.length > 0) {
    await prisma.escrowTransaction.deleteMany({ where: { offerId: { in: offerIds } } });
    await prisma.offer.deleteMany({ where: { id: { in: offerIds } } });
  }

  if (listingIds.length > 0) {
    await prisma.listing.deleteMany({ where: { id: { in: listingIds } } });
  }

  if (userIds.length > 0) {
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  }
}

async function disconnect() {
  await prisma.$disconnect();
}

module.exports = {
  assert,
  cleanupTracker,
  createTracker,
  disconnect,
  prisma,
  registerUser,
  remember,
  request,
};