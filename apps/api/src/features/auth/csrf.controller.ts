import Elysia, { t } from "elysia";
import { generateCSRFToken, verifyCSRFToken } from "../../shared/utils/csrf.util";

export const csrfController = new Elysia().get("/csrf-token", async ({ set, headers }) => {
	try {
		const correlationId = headers["x-correlation-id"] || crypto.randomUUID();
		const token = generateCSRFToken();

		set.headers["x-correlation-id"] = correlationId;
		set.status = 200;

		return {
			data: { token },
			message: "CSRF token generated successfully",
			status: 200,
			correlationId,
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		const correlationId = headers["x-correlation-id"] || crypto.randomUUID();
		set.headers["x-correlation-id"] = correlationId;
		set.status = 500;

		return {
			code: "CSRF_TOKEN_GENERATION_FAILED",
			message: "Failed to generate CSRF token",
			correlationId,
			timestamp: new Date().toISOString(),
		};
	}
});
