import { PrismaClient } from "@prisma/client";
import { env } from "../config/env";

let prismaClient: PrismaClient | null = null;

function getPrismaClient() {
	if (!env.DATABASE_URL) {
		throw new Error("La base de donnees n'est pas configuree sur le serveur");
	}

	if (!prismaClient) {
		prismaClient = new PrismaClient();
	}

	return prismaClient;
}

export const prisma = new Proxy({} as PrismaClient, {
	get(_target, property, receiver) {
		const client = getPrismaClient();
		return Reflect.get(client, property, receiver);
	},
});
