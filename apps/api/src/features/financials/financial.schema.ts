import { t } from "elysia";

export const financialReportSchema = t.Object({
	_id: t.String(),
	reportType: t.Union([
		t.Literal("profit_loss"),
		t.Literal("tax_summary"),
		t.Literal("cash_flow"),
		t.Literal("balance_sheet"),
	]),
	period: t.Object({
		startDate: t.Date(),
		endDate: t.Date(),
		type: t.Union([
			t.Literal("monthly"),
			t.Literal("quarterly"),
			t.Literal("yearly"),
			t.Literal("custom"),
		]),
	}),
	landlord: t.String(),
	property: t.Optional(t.String()),
	data: t.Object({
		income: t.Object({
			rental: t.Object({
				amount: t.Number(),
				count: t.Number(),
				properties: t.Array(
					t.Object({
						propertyId: t.String(),
						propertyName: t.String(),
						amount: t.Number(),
						payments: t.Number(),
					})
				),
			}),
			deposits: t.Object({
				amount: t.Number(),
				count: t.Number(),
			}),
			fees: t.Object({
				amount: t.Number(),
				count: t.Number(),
				breakdown: t.Object({
					application: t.Number(),
					late: t.Number(),
					service: t.Number(),
					other: t.Number(),
				}),
			}),
			other: t.Object({
				amount: t.Number(),
				count: t.Number(),
				description: t.Array(t.String()),
			}),
			total: t.Number(),
		}),
		expenses: t.Object({
			maintenance: t.Object({
				amount: t.Number(),
				count: t.Number(),
				breakdown: t.Array(
					t.Object({
						category: t.String(),
						amount: t.Number(),
						count: t.Number(),
					})
				),
			}),
			utilities: t.Object({
				amount: t.Number(),
				count: t.Number(),
				breakdown: t.Object({
					electricity: t.Number(),
					water: t.Number(),
					gas: t.Number(),
					internet: t.Number(),
					other: t.Number(),
				}),
			}),
			insurance: t.Object({
				amount: t.Number(),
				count: t.Number(),
			}),
			taxes: t.Object({
				amount: t.Number(),
				breakdown: t.Object({
					property: t.Number(),
					income: t.Number(),
					vat: t.Number(),
				}),
			}),
			management: t.Object({
				amount: t.Number(),
				platformFees: t.Number(),
				professionalServices: t.Number(),
			}),
			marketing: t.Object({
				amount: t.Number(),
				count: t.Number(),
			}),
			depreciation: t.Object({
				amount: t.Number(),
				assets: t.Array(
					t.Object({
						assetId: t.String(),
						assetName: t.String(),
						depreciationAmount: t.Number(),
					})
				),
			}),
			other: t.Object({
				amount: t.Number(),
				count: t.Number(),
				description: t.Array(t.String()),
			}),
			total: t.Number(),
		}),
		summary: t.Object({
			grossIncome: t.Number(),
			totalExpenses: t.Number(),
			netIncome: t.Number(),
			profitMargin: t.Number(),
			taxableIncome: t.Number(),
			estimatedTax: t.Number(),
			cashFlow: t.Number(),
			roi: t.Number(),
		}),
	}),
	generatedAt: t.Date(),
	status: t.Union([t.Literal("draft"), t.Literal("final"), t.Literal("archived")]),
	createdAt: t.Date(),
	updatedAt: t.Date(),
});

export const taxReportSchema = t.Object({
	_id: t.String(),
	taxYear: t.Number(),
	landlord: t.String(),
	properties: t.Array(t.String()),
	income: t.Object({
		rental: t.Number(),
		deposits: t.Number(),
		fees: t.Number(),
		other: t.Number(),
		total: t.Number(),
	}),
	deductions: t.Object({
		mortgage: t.Number(),
		maintenance: t.Number(),
		utilities: t.Number(),
		insurance: t.Number(),
		depreciation: t.Number(),
		professionalFees: t.Number(),
		advertising: t.Number(),
		travel: t.Number(),
		other: t.Number(),
		total: t.Number(),
	}),
	taxableIncome: t.Number(),
	estimatedTax: t.Number(),
	quarterlyPayments: t.Array(
		t.Object({
			quarter: t.Union([t.Literal(1), t.Literal(2), t.Literal(3), t.Literal(4)]),
			dueDate: t.Date(),
			amount: t.Number(),
			paid: t.Boolean(),
			paidDate: t.Optional(t.Date()),
		})
	),
	status: t.Union([t.Literal("draft"), t.Literal("submitted"), t.Literal("approved")]),
	submittedAt: t.Optional(t.Date()),
	createdAt: t.Date(),
	updatedAt: t.Date(),
});

export const expenseSchema = t.Object({
	_id: t.String(),
	amount: t.Number(),
	currency: t.String(),
	category: t.String(),
	subcategory: t.Optional(t.String()),
	description: t.String(),
	date: t.Date(),
	property: t.Optional(t.String()),
	landlord: t.String(),
	receipt: t.Optional(
		t.Object({
			url: t.String(),
			filename: t.String(),
			uploadedAt: t.Date(),
		})
	),
	taxDeductible: t.Boolean(),
	recurring: t.Object({
		isRecurring: t.Boolean(),
		frequency: t.Optional(
			t.Union([t.Literal("monthly"), t.Literal("quarterly"), t.Literal("yearly")])
		),
		nextDue: t.Optional(t.Date()),
		endDate: t.Optional(t.Date()),
	}),
	vendor: t.Optional(
		t.Object({
			name: t.String(),
			contact: t.String(),
			vatNumber: t.Optional(t.String()),
		})
	),
	status: t.Union([t.Literal("pending"), t.Literal("approved"), t.Literal("rejected")]),
	approvedBy: t.Optional(t.String()),
	approvedAt: t.Optional(t.Date()),
	createdAt: t.Date(),
	updatedAt: t.Date(),
});

export const assetSchema = t.Object({
	_id: t.String(),
	name: t.String(),
	description: t.Optional(t.String()),
	category: t.Union([
		t.Literal("property"),
		t.Literal("equipment"),
		t.Literal("furniture"),
		t.Literal("vehicle"),
		t.Literal("other"),
	]),
	purchasePrice: t.Number(),
	purchaseDate: t.Date(),
	currentValue: t.Number(),
	depreciationMethod: t.Union([
		t.Literal("straight_line"),
		t.Literal("declining_balance"),
		t.Literal("units_of_production"),
	]),
	usefulLife: t.Number(),
	salvageValue: t.Number(),
	property: t.Optional(t.String()),
	landlord: t.String(),
	status: t.Union([t.Literal("active"), t.Literal("disposed"), t.Literal("fully_depreciated")]),
	disposalDate: t.Optional(t.Date()),
	disposalPrice: t.Optional(t.Number()),
	createdAt: t.Date(),
	updatedAt: t.Date(),
});

export const financialSettingsSchema = t.Object({
	_id: t.String(),
	landlord: t.String(),
	currency: t.String(),
	taxYear: t.Object({
		startMonth: t.Number(),
		endMonth: t.Number(),
	}),
	taxRates: t.Object({
		income: t.Number(),
		property: t.Number(),
		vat: t.Number(),
	}),
	depreciationRates: t.Record(t.String(), t.Number()),
	reportingPreferences: t.Object({
		frequency: t.Union([t.Literal("monthly"), t.Literal("quarterly"), t.Literal("yearly")]),
		autoGenerate: t.Boolean(),
		emailReports: t.Boolean(),
	}),
	createdAt: t.Date(),
	updatedAt: t.Date(),
});

// Request schemas
export const generateReportRequestSchema = t.Object({
	reportType: t.Union([
		t.Literal("profit_loss"),
		t.Literal("tax_summary"),
		t.Literal("cash_flow"),
		t.Literal("balance_sheet"),
	]),
	period: t.Object({
		startDate: t.Date(),
		endDate: t.Date(),
		type: t.Union([
			t.Literal("monthly"),
			t.Literal("quarterly"),
			t.Literal("yearly"),
			t.Literal("custom"),
		]),
	}),
	propertyId: t.Optional(t.String()),
});

export const createExpenseRequestSchema = t.Object({
	amount: t.Number(),
	currency: t.Optional(t.String()),
	category: t.String(),
	subcategory: t.Optional(t.String()),
	description: t.String(),
	date: t.Date(),
	property: t.Optional(t.String()),
	taxDeductible: t.Optional(t.Boolean()),
	recurring: t.Optional(
		t.Object({
			isRecurring: t.Boolean(),
			frequency: t.Optional(
				t.Union([t.Literal("monthly"), t.Literal("quarterly"), t.Literal("yearly")])
			),
			nextDue: t.Optional(t.Date()),
			endDate: t.Optional(t.Date()),
		})
	),
	vendor: t.Optional(
		t.Object({
			name: t.String(),
			contact: t.String(),
			vatNumber: t.Optional(t.String()),
		})
	),
});

export const createAssetRequestSchema = t.Object({
	name: t.String(),
	description: t.Optional(t.String()),
	category: t.Union([
		t.Literal("property"),
		t.Literal("equipment"),
		t.Literal("furniture"),
		t.Literal("vehicle"),
		t.Literal("other"),
	]),
	purchasePrice: t.Number(),
	purchaseDate: t.Date(),
	depreciationMethod: t.Optional(
		t.Union([
			t.Literal("straight_line"),
			t.Literal("declining_balance"),
			t.Literal("units_of_production"),
		])
	),
	usefulLife: t.Number(),
	salvageValue: t.Optional(t.Number()),
	property: t.Optional(t.String()),
});

export const updateFinancialSettingsRequestSchema = t.Object({
	currency: t.Optional(t.String()),
	taxYear: t.Optional(
		t.Object({
			startMonth: t.Number(),
			endMonth: t.Number(),
		})
	),
	taxRates: t.Optional(
		t.Object({
			income: t.Number(),
			property: t.Number(),
			vat: t.Number(),
		})
	),
	depreciationRates: t.Optional(t.Record(t.String(), t.Number())),
	reportingPreferences: t.Optional(
		t.Object({
			frequency: t.Union([t.Literal("monthly"), t.Literal("quarterly"), t.Literal("yearly")]),
			autoGenerate: t.Boolean(),
			emailReports: t.Boolean(),
		})
	),
});

export const reportFiltersSchema = t.Object({
	reportType: t.Optional(t.String()),
	startDate: t.Optional(t.Date()),
	endDate: t.Optional(t.Date()),
	propertyId: t.Optional(t.String()),
	status: t.Optional(t.String()),
	page: t.Optional(t.Number()),
	limit: t.Optional(t.Number()),
});

export const expenseFiltersSchema = t.Object({
	category: t.Optional(t.String()),
	startDate: t.Optional(t.Date()),
	endDate: t.Optional(t.Date()),
	propertyId: t.Optional(t.String()),
	status: t.Optional(t.String()),
	taxDeductible: t.Optional(t.Boolean()),
	page: t.Optional(t.Number()),
	limit: t.Optional(t.Number()),
});

// Import/Export schemas
export const batchImportRequestSchema = t.Object({
	dataType: t.Union([t.Literal("expenses"), t.Literal("assets")]),
	data: t.Array(t.Record(t.String(), t.Any())),
	options: t.Object({
		skipValidation: t.Optional(t.Boolean()),
		updateExisting: t.Optional(t.Boolean()),
		columnMappings: t.Optional(t.Record(t.String(), t.String())),
	}),
});

export const importResultSchema = t.Object({
	totalRows: t.Number(),
	successCount: t.Number(),
	errorCount: t.Number(),
	warningCount: t.Number(),
	skippedCount: t.Number(),
	errors: t.Array(
		t.Object({
			row: t.Number(),
			field: t.String(),
			message: t.String(),
			value: t.Any(),
		})
	),
	warnings: t.Array(
		t.Object({
			row: t.Number(),
			field: t.String(),
			message: t.String(),
			value: t.Any(),
		})
	),
	created: t.Array(t.String()),
	updated: t.Array(t.String()),
});

export const exportConfigSchema = t.Object({
	dataType: t.Union([t.Literal("expenses"), t.Literal("assets"), t.Literal("reports")]),
	format: t.Union([t.Literal("csv"), t.Literal("excel"), t.Literal("json"), t.Literal("pdf")]),
	filters: t.Optional(
		t.Object({
			startDate: t.Optional(t.Date()),
			endDate: t.Optional(t.Date()),
			propertyId: t.Optional(t.String()),
			category: t.Optional(t.String()),
			status: t.Optional(t.String()),
		})
	),
	options: t.Object({
		includeHeaders: t.Optional(t.Boolean()),
		includeMetadata: t.Optional(t.Boolean()),
		currency: t.Optional(t.String()),
	}),
});

// Analytics schemas
export const expenseTrendSchema = t.Object({
	period: t.String(),
	amount: t.Number(),
	count: t.Number(),
	change: t.Number(),
	changePercentage: t.Number(),
});

export const categoryAnalyticsSchema = t.Object({
	category: t.String(),
	amount: t.Number(),
	count: t.Number(),
	percentage: t.Number(),
	trend: t.Object({
		change: t.Number(),
		changePercentage: t.Number(),
	}),
});

export const performanceMetricsSchema = t.Object({
	totalIncome: t.Number(),
	totalExpenses: t.Number(),
	netIncome: t.Number(),
	profitMargin: t.Number(),
	expenseRatio: t.Number(),
	averageMonthlyExpenses: t.Number(),
	topExpenseCategories: t.Array(categoryAnalyticsSchema),
	monthlyTrends: t.Array(expenseTrendSchema),
});

export const comparativeAnalysisSchema = t.Object({
	currentPeriod: t.Object({
		startDate: t.Date(),
		endDate: t.Date(),
		totalIncome: t.Number(),
		totalExpenses: t.Number(),
		netIncome: t.Number(),
	}),
	previousPeriod: t.Object({
		startDate: t.Date(),
		endDate: t.Date(),
		totalIncome: t.Number(),
		totalExpenses: t.Number(),
		netIncome: t.Number(),
	}),
	comparison: t.Object({
		incomeChange: t.Number(),
		incomeChangePercentage: t.Number(),
		expenseChange: t.Number(),
		expenseChangePercentage: t.Number(),
		netIncomeChange: t.Number(),
		netIncomeChangePercentage: t.Number(),
	}),
});
