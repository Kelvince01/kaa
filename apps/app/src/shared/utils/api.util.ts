import type { Entity, Severity } from "@kaa/config";

export type ClientErrorStatusCode =
	| 400
	| 401
	| 402
	| 403
	| 404
	| 405
	| 406
	| 407
	| 408
	| 409
	| 410
	| 411
	| 412
	| 413
	| 414
	| 415
	| 416
	| 417
	| 418
	| 421
	| 422
	| 423
	| 424
	| 425
	| 426
	| 428
	| 429
	| 431
	| 451;
export type ServerErrorStatusCode = 500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511;

type HttpErrorStatus = ClientErrorStatusCode | ServerErrorStatusCode;

// Custom error class to handle API errors
export class ApiError extends Error {
	status: HttpErrorStatus;
	type?: string;
	entityType?: Entity;
	severity?: Severity;
	logId?: string;
	path?: string;
	method?: string;
	timestamp?: string;
	usr?: string;
	org?: string;

	constructor(error: ApiError) {
		super(error.message);
		this.status = error.status;
		this.type = error.type;
		this.entityType = error.entityType;
		this.severity = error.severity;
		this.logId = error.logId;
		this.path = error.path;
		this.method = error.method;
		this.timestamp = error.timestamp;
		this.usr = error.usr;
		this.org = error.org;
	}
}
