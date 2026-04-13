export type Listing = {
  id: string;
  title: string;
  summary: string;
  description: string;
  imageUrls: string[];
  niche: string;
  type: string;
  askingPrice: number;
  monthlyRevenue: number;
  monthlyProfit: number;
  techStack: string[];
  status: "ACTIVE" | "SOLD" | "DRAFT";
  owner: { id: string; name: string };
  _count?: { offers: number };
};

export type Offer = {
  id: string;
  amount: number;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "COUNTERED";
  message?: string;
  buyer?: { id: string; name: string };
  listing?: { id: string; title: string; ownerId?: string };
  escrow?: {
    id: string;
    amount: number;
    status: "INITIATED" | "FUNDED" | "RELEASED" | "CANCELLED";
  };
  createdAt?: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: "BUYER" | "SELLER" | "BOTH";
};

export type MessageAttachment = {
  id: string;
  category: "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT" | "OTHER";
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  downloadUrl: string;
};

export type ConversationMessagePreview = {
  id: string;
  content: string;
  createdAt: string;
  readAt: string | null;
  sender: { id: string; name: string };
  attachments: MessageAttachment[];
};

export type Conversation = {
  id: string;
  buyer: { id: string; name: string; online?: boolean };
  seller: { id: string; name: string; online?: boolean };
  listing?: { id: string; title: string };
  createdAt: string;
  unreadCount: number;
  messages: ConversationMessagePreview[];
};

export type Message = {
  id: string;
  content: string;
  createdAt: string;
  readAt: string | null;
  sender: { id: string; name: string };
  attachments: MessageAttachment[];
};
