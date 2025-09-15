import { useAlertStore } from "@/shared/stores/alert.store";
import type { alertVariants } from "@kaa/ui/components/alert";
import { Alert, AlertDescription, AlertTitle } from "@kaa/ui/components/alert";
import { Button } from "@kaa/ui/components/button";
import { cn } from "@kaa/ui/lib/utils";
import type { VariantProps } from "class-variance-authority";
import { type LucideProps, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type React from "react";

export type AlertContextMode = "public" | "app";

export type AlertWrap = {
	className?: string;
	id: string;
	modes?: AlertContextMode[];
	Icon?: React.ElementType<LucideProps>;
	children: React.ReactNode;
	title?: string;
	variant?: VariantProps<typeof alertVariants>["variant"];
};

export const AlertWrap = ({
	id,
	Icon,
	children,
	className = "",
	title = "",
	variant = "default",
}: AlertWrap) => {
	const t = useTranslations();
	const { alertsSeen, setAlertSeen, downAlert } = useAlertStore();
	const showAlert = !alertsSeen.includes(id);
	const closeAlert = () => setAlertSeen(id);

	if (downAlert || !showAlert) return;

	return (
		<Alert variant={variant} className={cn("relative", className)}>
			<Button variant="ghost" size="sm" className="absolute top-2 right-2" onClick={closeAlert}>
				<X size={16} />
			</Button>
			{Icon && <Icon size={16} />}
			{title && (
				<AlertTitle className="pr-8">
					{
						// @ts-expect-error
						t(title)
					}
				</AlertTitle>
			)}

			{children && <AlertDescription className="pr-8 font-light">{children}</AlertDescription>}
		</Alert>
	);
};
