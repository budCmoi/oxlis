import serverless from "serverless-http";
import { app } from "../../src/app";

export const handler = serverless(app, {
	binary: false,
	request(request, event) {
		const contentType = request.headers["content-type"] ?? request.headers["Content-Type"];

		if (typeof event.body === "string" && typeof contentType === "string" && contentType.includes("application/json")) {
			try {
				(request as { body?: unknown }).body = JSON.parse(event.body);
			} catch {
				(request as { body?: unknown }).body = event.body;
			}
		}
	},
});