// // import { SearchParamError, useRouterState } from '@tanstack/react-router';

// // import { MainFooter } from '~/modules/common/main-footer';
// import { Button } from "@kaa/ui/components/button";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from "@kaa/ui/components/card";
// import {
//   ChevronDown,
//   Home,
//   MessageCircleQuestion,
//   RefreshCw,
// } from "lucide-react";
// import type React from "react";
// import { useState } from "react";
// import { Dialoger } from "@/components/common/dialoger";
// import { dialog } from "@/components/common/dialoger/state";
// import type { ApiError } from "@/lib/axios";
// // import type { ApiError } from '~/lib/api';
// import ContactForm from "./contact-form/contact-form";
// import { useTranslations } from "next-intl";
// import { usePathname } from "next/navigation";

// export type ErrorNoticeError = ApiError | Error | null;

// type ErrorNoticeProps = {
//   error?: ErrorNoticeError;
//   resetErrorBoundary?: () => void;
//   level: "root" | "app" | "public";
// };

// declare global {
//   // biome-ignore lint/nursery/useConsistentTypeDefinitions: false positive
//   interface Window {
//     Gleap: any;
//   }
// }

// export const handleAskForHelp = () => {
//   if (!window.Gleap) {
//     return dialog(<ContactForm dialog />, {
//       id: "contact-form",
//       drawerOnMobile: false,
//       className: "sm:max-w-5xl",
//       title: "Contact us",
//       description: "Contact us",
//     });
//   }
//   window.Gleap.openConversations();
// };

// type TFunction = (key: string, params?: any) => string;

// // interface SearchParamError extends Error {
// //   message: string;
// //   status: string;
// //   entityType: string;
// //   type: string;
// // }

// export const getErrorTitle = (
//   t: TFunction,
//   error?: ErrorNoticeError,
//   errorFromQuery?: string
// ) => {
//   if (errorFromQuery) return t(`error:${errorFromQuery}`);
//   if (!error) return;

//   if (error instanceof SearchParamError) return t("error:invalid_param");

//   if ("status" in error) {
//     if (error.entityType)
//       return t(`error:resource_${error.type}`, {
//         resource: t(error.entityType),
//       });
//     if (error.type) return t(`error:${error.type}`);
//     if (error.message) return error.message;
//   }

//   if (error.name) return error.name;
// };

// export const getErrorText = (
//   t: TFunction,
//   error?: ErrorNoticeError,
//   errorFromQuery?: string
// ) => {
//   if (errorFromQuery) return t(`error:${errorFromQuery}.text`);
//   if (!error) return;

//   if (error instanceof SearchParamError) return t("error:invalid_param.text");

//   if ("status" in error) {
//     // Check if the error has an entityType
//     if (error.entityType)
//       return t(`error:resource_${error.type}.text`, {
//         resource: error.entityType,
//       });
//     // If no entityType, check if error has a type
//     if (error.type) return t(`error:${error.type}.text`);
//     if (error.message) return error.message;
//   }
// };

// // Error can be shown in multiple levels
// // - root: no footer can be shown because services are not available
// // - app: no footer required
// // - public: show footer
// const ErrorNotice: React.FC<ErrorNoticeProps> = ({
//   error,
//   resetErrorBoundary,
//   level,
// }) => {
//   const t = useTranslations();
//   const location = usePathname();
//   const { error: errorFromQuery, severity: severityFromQuery } =
//     location.search;

//   const dateNow = new Date().toUTCString();
//   const severity =
//     error && "status" in error ? error.severity : severityFromQuery;

//   const [showError, setShowError] = useState(false);

//   const handleReload = () => {
//     resetErrorBoundary?.();
//     window.location.reload();
//   };

//   const handleGoToHome = () => {
//     resetErrorBoundary?.();
//     window.location.replace("/");
//   };

//   return (
//     <>
//       {level === "root" && <Dialoger />}
//       <div className="container flex min-h-[calc(100vh-20rem)] flex-col items-center">
//         <div className="mt-auto mb-auto">
//           <Card className="m-4 max-w-[36rem]">
//             <CardHeader className="text-center">
//               <CardTitle className="mb-2 text-2xl">
//                 {getErrorTitle(t, error, errorFromQuery) || t("error:error")}
//               </CardTitle>
//               <CardDescription className="text-base">
//                 <span>
//                   {getErrorText(t, error, errorFromQuery) ||
//                     t("error:reported_try_or_contact")}
//                 </span>
//                 <span className="ml-1">
//                   {severity === "warn" && t("error:contact_mistake")}
//                 </span>
//                 <span className="ml-1">
//                   {severity === "error" && t("error:try_again_later")}
//                 </span>
//               </CardDescription>
//             </CardHeader>
//             {error && "status" in error && (
//               <CardContent className="whitespace-pre-wrap font-mono text-red-600">
//                 {error.type && !showError && (
//                   <Button
//                     className="w-full whitespace-pre-wrap text-red-600"
//                     onClick={() => setShowError(true)}
//                     size="sm"
//                     variant="link"
//                   >
//                     <span>{t("error:show_details")}</span>
//                     <ChevronDown className="ml-1" size={12} />
//                   </Button>
//                 )}
//                 {error.type && showError && (
//                   <div className="grid grid-cols-[1fr_1fr] place-items-start gap-1 text-sm">
//                     <div className="place-self-end pr-4 font-medium">
//                       Log ID
//                     </div>
//                     <div>{error.logId || "na"}</div>
//                     <div className="place-self-end pr-4 font-medium">
//                       Timestamp
//                     </div>
//                     <div>{dateNow}</div>
//                     <div className="place-self-end pr-4 font-medium">
//                       Message
//                     </div>
//                     <div>{error.message || "na"}</div>
//                     <div className="place-self-end pr-4 font-medium">Type</div>
//                     <div>{error.type || "na"}</div>
//                     <div className="place-self-end pr-4 font-medium">
//                       Resource type
//                     </div>
//                     <div>{error.entityType || "na"}</div>
//                     <div className="place-self-end pr-4 font-medium">
//                       HTTP status
//                     </div>
//                     <div>{error.status || "na"}</div>
//                     <div className="place-self-end pr-4 font-medium">
//                       Severity
//                     </div>
//                     <div>{error.severity || "na"}</div>
//                     <div className="place-self-end pr-4 font-medium">
//                       User ID
//                     </div>
//                     <div>{error.usr || "na"}</div>
//                     <div className="place-self-end pr-4 font-medium">
//                       Organization ID
//                     </div>
//                     <div>{error.org || "na"}</div>
//                   </div>
//                 )}
//               </CardContent>
//             )}
//             <CardFooter className="mt-4 flex justify-center gap-2">
//               <Button onClick={handleGoToHome} variant="secondary">
//                 <Home className="mr-1" size={16} />
//                 {t("common:home")}
//               </Button>
//               {!location.pathname.startsWith("/error") && (
//                 <Button onClick={handleReload}>
//                   <RefreshCw className="mr-1" size={16} />
//                   {t("common:reload")}
//                 </Button>
//               )}
//               {severity && ["warn", "error"].includes(severity) && (
//                 <Button onClick={handleAskForHelp} variant="plain">
//                   <MessageCircleQuestion className="mr-1" size={16} />
//                   {t("common:ask_for_help")}
//                 </Button>
//               )}
//             </CardFooter>
//           </Card>
//           {/* {level !== "app" && <MainFooter className="mt-10 items-center" />} */}
//         </div>
//       </div>
//     </>
//   );
// };

// export default ErrorNotice;
