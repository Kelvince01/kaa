export const AI_PERMISSIONS = {
	CREATE_MODEL: "ai-models:create",
	CREATE_PREDICTION: "ai-predictions:create",
	VIEW_MODEL: "ai-models:view",
	UPDATE_MODEL: "ai-models:update",
	DELETE_MODEL: "ai-models:delete",
} as const;

export type AIPermission = (typeof AI_PERMISSIONS)[keyof typeof AI_PERMISSIONS];
