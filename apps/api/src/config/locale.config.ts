/**
 * Locale configuration for the application
 * Supports English (en) and Swahili (sw)
 */

import type { Resource } from "i18next";

export const SUPPORTED_LOCALES = ["en-KE", "sw-KE"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = "en-KE";

export const LOCALE_NAMES: Record<SupportedLocale, string> = {
  "en-KE": "English",
  "sw-KE": "Kiswahili",
};

// Translation keys organized by feature
export const TRANSLATIONS: Resource = {
  "en-KE": {
    translation: {
      // Auth
      "auth.login.title": "Login",
      "auth.login.success": "Successfully logged in",
      "auth.login.failed": "Invalid email or password",
      "auth.logout.success": "Successfully logged out",
      "auth.register.success": "Registration successful",
      "auth.register.failed": "Registration failed",
      "auth.password.reset": "Password reset email sent",
      "auth.password.updated": "Password updated successfully",
      "auth.session.expired": "Your session has expired, please login again",
      "auth.unauthorized": "Unauthorized access",

      // Organizations
      "org.created": "Organization created successfully",
      "org.updated": "Organization updated successfully",
      "org.deleted": "Organization deleted successfully",
      "org.member.added": "Member added to organization",
      "org.member.removed": "Member removed from organization",
      "org.member.updated": "Member role updated",
      "org.notFound": "Organization not found",

      // General
      "general.success": "Success",
      "general.error": "An error occurred",
      "general.notFound": "Resource not found",
      "general.forbidden": "You do not have permission to access this resource",
      "general.validation": "Validation error",

      // API
      "api.rateLimited": "Too many requests, please try again later",
      "api.serverError": "Server error, please try again later",
    },
  },
  "sw-KE": {
    translation: {
      // Auth
      "auth.login.title": "Ingia",
      "auth.login.success": "Umeingia kwa mafanikio",
      "auth.login.failed": "Barua pepe au nenosiri batili",
      "auth.logout.success": "Umetoka kwa mafanikio",
      "auth.register.success": "Usajili umefanikiwa",
      "auth.register.failed": "Usajili umeshindwa",
      "auth.password.reset": "Barua pepe ya kuweka upya nenosiri imetumwa",
      "auth.password.updated": "Nenosiri limesasishwa kwa mafanikio",
      "auth.session.expired": "Kipindi chako kimeisha, tafadhali ingia tena",
      "auth.unauthorized": "Ufikiaji usioruhusiwa",

      // Organizations
      "org.created": "Shirika limeundwa kwa mafanikio",
      "org.updated": "Shirika limesasishwa kwa mafanikio",
      "org.deleted": "Shirika limefutwa kwa mafanikio",
      "org.member.added": "Mwanachama ameongezwa kwenye shirika",
      "org.member.removed": "Mwanachama ameondolewa kwenye shirika",
      "org.member.updated": "Jukumu la mwanachama limesasishwa",
      "org.notFound": "Shirika halijapatikana",

      // General
      "general.success": "Mafanikio",
      "general.error": "Hitilafu imetokea",
      "general.notFound": "Rasilimali haijapatikana",
      "general.forbidden": "Huna ruhusa ya kufikia rasilimali hii",
      "general.validation": "Hitilafu ya uthibitishaji",

      // API
      "api.rateLimited": "Maombi mengi sana, tafadhali jaribu tena baadaye",
      "api.serverError": "Hitilafu ya seva, tafadhali jaribu tena baadaye",
    },
  },
};

/**
 * Get translation for a key in the specified locale
 * @param key Translation key
 * @param locale Locale to use
 * @returns Translated string or key if translation not found
 */
export function getTranslation(
  key: string,
  _locale: SupportedLocale = DEFAULT_LOCALE
): string {
  // return TRANSLATIONS[locale]["translation"]?.[key] || TRANSLATIONS[DEFAULT_LOCALE][key] || key;
  return key;
}

/**
 * Get the user's preferred locale from the request
 * @param acceptLanguage Accept-Language header value
 * @returns Supported locale code
 */
export function getPreferredLocale(acceptLanguage?: string): SupportedLocale {
  if (!acceptLanguage) {
    return DEFAULT_LOCALE;
  }

  // Parse Accept-Language header
  const locales = acceptLanguage
    .split(",")
    .map((part) => {
      const [locale, qValue] = part.trim().split(";q=");
      return {
        locale: locale.split("-")[0], // Get primary language tag
        quality: qValue ? Number.parseFloat(qValue) : 1.0,
      };
    })
    .sort((a, b) => b.quality - a.quality);

  // Find first supported locale
  const matchedLocale = locales.find(({ locale }) =>
    SUPPORTED_LOCALES.includes(locale as SupportedLocale)
  );

  return matchedLocale
    ? (matchedLocale.locale as SupportedLocale)
    : DEFAULT_LOCALE;
}

export enum Errors {
  NoApp = "No app found",
  WrongClientType = "Wrong client type",
  WrongClientSecret = "Wrong client secret",
  WrongOrigin = "Request from unexpected origin",
  AppDisabled = "This app has been disabled",
  EmailTaken = "The email address is already in use.",
  WrongRedirectUri = "Invalid redirect_uri",
  NoUser = "No user found",
  SocialAccountNotSupported = "This function is unavailable for social login accounts.",
  AccountLocked = "Account temporarily locked due to excessive login failures",
  OtpMfaLocked = "Too many failed OTP verification attempts. Please try again after 30 minutes.",
  SmsMfaLocked = "Too many SMS verification attempts. Please try again after 30 minutes.",
  EmailMfaLocked = "Too many Email verification attempts. Please try again after 30 minutes.",
  PasswordResetLocked = "Too many password reset email requests. Please try again tomorrow.",
  ChangeEmailLocked = "Too many password change email requests. Please try again after 30 minutes.",
  UserDisabled = "This account has been disabled",
  UserAlreadyLinked = "This account has already been linked with one account",
  TargetUserAlreadyLinked = "Target account has already been linked with one account",
  EmailAlreadyVerified = "Email already verified",
  OtpAlreadySet = "OTP authentication already set",
  MfaEnrolled = "User already enrolled with MFA",
  NoConsent = "User consent required",
  WrongAuthCode = "Invalid auth code",
  WrongCode = "Invalid code",
  WrongMfaCode = "Invalid MFA code",
  InvalidRequest = "Invalid request",
  RequireDifferentPassword = "New password same as old password",
  RequireDifferentEmail = "New email address same as old email address",
  MfaNotVerified = "MFA code not verified",
  WrongCodeVerifier = "Invalid code_verifier",
  WrongGrantType = "Invalid grant_type",
  WrongRefreshToken = "Invalid refresh_token",
  WrongTokenType = "Unsupported token type",
  UniqueKey = "Unique key constraint failed",
  NoEmailSender = "No email sender",
  NoSmsSender = "No sms sender",
  NotFound = "Resource not found",
  EmailLogNotFound = "Email log not found",
  SmsLogNotFound = "Sms log not found",
  SignInLogNotFound = "Sign in log not found",
}
export const common = Object.freeze({
  documentTitle: {
    en: "Kaa",
    sw: "Kaa",
  },
  poweredBy: {
    en: "Powered by",
    sw: "Propulsé par",
  },
  poweredByAuth: {
    en: "Powered by Kaa",
    sw: "Propulsé par Kaa",
  },
  selectLocale: {
    en: "Select Locale",
    sw: "Sélectionner la langue",
  },
});

export const validateError = Object.freeze({
  passwordIsRequired: {
    en: "Password is required!",
    sw: "Le mot de passe est requis !",
  },
  passwordFormat: {
    en: "Password must be at least 8 characters, contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
    sw: "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.",
  },
  phoneNumberIsRequired: {
    en: "Phone number is required!",
    sw: "Le numéro de téléphone est requis !",
  },
  wrongPhoneFormat: {
    en:
      "the format must be a number up to fifteen digits in length starting with a " +
      " with country code.",
    sw:
      "Le format doit être un numéro de maximum quinze chiffres commençant par un " +
      " avec lindicatif du pays.",
  },
  emailIsRequired: {
    en: "Email is required!",
    sw: "L'adresse e-mail est requise !",
  },
  wrongEmailFormat: {
    en: "Wrong email format.",
    sw: "Format d'e-mail incorrect.",
  },
  isNotEmail: {
    en: "Wrong email format.",
    sw: "Format d'e-mail incorrect.",
  },
  isWeakPassword: {
    en: "Password must be at least 8 characters, contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
    sw: "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.",
  },
  passwordNotMatch: {
    en: "The password and confirm password do not match.",
    sw: "Le mot de passe et la confirmation ne correspondent pas.",
  },
  firstNameIsEmpty: {
    en: "First name can not be empty.",
    sw: "Le prénom ne peut pas être vide.",
  },
  lastNameIsEmpty: {
    en: "Last name can not be empty.",
    sw: "Le nom de famille ne peut pas être vide.",
  },
  otpCodeLengthIssue: {
    en: "OTP code can only be 6 digits numbers.",
    sw: "Le code OTP ne peut être composé que de 6 chiffres.",
  },
  verificationCodeLengthIssue: {
    en: "Verification code can only be 6 characters.",
    sw: "Le code de vérification doit contenir 6 caractères.",
  },
});

export const requestError = Object.freeze({
  authFailed: {
    en: "Authentication Failed.",
    sw: "Échec de l'authentification.",
  },
  noUser: {
    en: "No user found.",
    sw: "Aucun utilisateur trouvé.",
  },
  disabledUser: {
    en: "This account has been disabled.",
    sw: "Ce compte a été désactivé.",
  },
  accountLocked: {
    en: "Account temporarily locked due to excessive login failures.",
    sw: "Compte temporairement bloqué en raison de trop nombreuses tentatives de connexion échouées.",
  },
  requireNewPassword: {
    en: "Your new password can not be same as old password.",
    sw: "Votre nouveau mot de passe ne peut pas être identique à l'ancien mot de passe.",
  },
  optMfaLocked: {
    en: "Too many failed OTP verification attempts. Please try again after 30 minutes.",
    sw: "Nombre trop élevé de tentatives échouées de vérification OTP. Veuillez réessayer dans 30 minutes.",
  },
  smsMfaLocked: {
    en: "Too many SMS verification attempts. Please try again after 30 minutes.",
    sw: "Trop de tentatives de vérification par SMS. Veuillez réessayer dans 30 minutes.",
  },
  emailMfaLocked: {
    en: "Too many email verification attempts. Please try again after 30 minutes.",
    sw: "Trop de tentatives de vérification par email. Veuillez réessayer dans 30 minutes.",
  },
  passwordResetLocked: {
    en: "Too many password reset requests. Please try again tomorrow.",
    sw: "Trop de demandes de réinitialisation de mot de passe. Veuillez réessayer demain.",
  },
  emailTaken: {
    en: "The email address is already in use.",
    sw: "Cette adresse e-mail est déjà utilisée.",
  },
  wrongCode: {
    en: "Invalid code.",
    sw: "Code invalide.",
  },
});

export const authorizePassword = Object.freeze({
  title: {
    en: "Authentication",
    sw: "Authentification",
  },
  email: {
    en: "Email",
    sw: "Adresse e-mail",
  },
  password: {
    en: "Password",
    sw: "Mot de passe",
  },
  submit: {
    en: "Login",
    sw: "Se connecter",
  },
  signUp: {
    en: "Create a new account",
    sw: "Créer un nouveau compte",
  },
  passwordReset: {
    en: "Reset password",
    sw: "Réinitialiser le mot de passe",
  },
  githubSignIn: {
    en: "Log in with GitHub",
    sw: "Se connecter avec GitHub",
  },
  continue: {
    en: "Continue",
    sw: "Continuer",
  },
  withPasskey: {
    en: "Log in with Passkey",
    sw: "Se connecter avec Passkey",
  },
});

export const authorizeAccount = Object.freeze({
  title: {
    en: "Create an account",
    sw: "Créer un compte",
  },
  email: {
    en: "Email",
    sw: "Adresse e-mail",
  },
  password: {
    en: "Password",
    sw: "Mot de passe",
  },
  confirmPassword: {
    en: "Confirm Password",
    sw: "Confirmer le mot de passe",
  },
  firstName: {
    en: "First Name",
    sw: "Prénom",
  },
  lastName: {
    en: "Last Name",
    sw: "Nom",
  },
  signUp: {
    en: "Confirm",
    sw: "Confirmer",
  },
  signIn: {
    en: "Already have an account? Sign in",
    sw: "Vous avez déjà un compte ? Connectez-vous.",
  },
  bySignUp: {
    en: "By signing up, you agree to our",
    sw: "En vous inscrivant, vous acceptez nos",
  },
  linkConnect: {
    en: "and",
    sw: "et",
  },
  terms: {
    en: "Terms of Service",
    sw: "Conditions dtilisation",
  },
  privacyPolicy: {
    en: "Privacy Policy",
    sw: "Politique de confidentialité",
  },
});

export const authorizeOtpMfa = Object.freeze({
  setup: {
    en: "Use your authenticator app to scan the image below:",
    sw: "Utilisez votre application d'authentification pour scanner l'image ci-dessous :",
  },
  code: {
    en: "Enter the code generated by your authenticator app",
    sw: "Entrez le code généré par votre application d'authentification",
  },
  verify: {
    en: "Verify",
    sw: "Vérifier",
  },
  switchToEmail: {
    en: "Receive MFA Code by Email",
    sw: "Recevoir le code MFA par e-mail",
  },
});

export const authorizeConsent = Object.freeze({
  title: {
    en: "Authorize App",
    sw: "Autoriser l'application",
  },
  requestAccess: {
    en: "is requesting access to your account.",
    sw: "demande l'accès à votre compte.",
  },
  accept: {
    en: "Accept",
    sw: "Accepter",
  },
  decline: {
    en: "Decline",
    sw: "Refuser",
  },
});

export const authorizeMfaEnroll = Object.freeze({
  title: {
    en: "Select one of the MFA type",
    sw: "Sélectionnez un type de MFA",
  },
  email: {
    en: "Email",
    sw: "E-mail",
  },
  otp: {
    en: "Authenticator",
    sw: "Authentificateur",
  },
  sms: {
    en: "SMS",
    sw: "message texte",
  },
});

export const authorizeSmsMfa = Object.freeze({
  title: {
    en: "SMS Verification",
    sw: "Vérification par SMS",
  },
  phoneNumber: {
    en: "Phone Number",
    sw: "Numéro de téléphone",
  },
  code: {
    en: "Verification Code",
    sw: "Code de vérification",
  },
  sendCode: {
    en: "Send code",
    sw: "Envoyer le code",
  },
  verify: {
    en: "Verify",
    sw: "Vérifier",
  },
  resend: {
    en: "Resend a new code",
    sw: "Renvoyer un nouveau code",
  },
  resent: {
    en: "New code sent.",
    sw: "Nouveau code envoyé.",
  },
  switchToEmail: {
    en: "Receive MFA Code by Email",
    sw: "Recevoir le code MFA par e-mail",
  },
});

export const authorizeEmailMfa = Object.freeze({
  title: {
    en: "A verification code has been sent to your email.",
    sw: "Un code de vérification a été envoyé à votre adresse e-mail.",
  },
  verify: {
    en: "Verify",
    sw: "Vérifier",
  },
  code: {
    en: "Enter your verification code here",
    sw: "Entrez votre code de vérification ici",
  },
  resend: {
    en: "Resend a new code",
    sw: "Renvoyer un nouveau code",
  },
  resent: {
    en: "New code sent.",
    sw: "Nouveau code envoyé.",
  },
});

export const authorizePasskeyEnroll = Object.freeze({
  title: {
    en: "Enroll Passkey for a faster and more secure login process",
    sw: "Enregistrer Passkey pour un processus de connexion plus rapide et plus sécurisé",
  },
  enroll: {
    en: "Enroll",
    sw: "Enregistrer",
  },
  skip: {
    en: "Skip",
    sw: "Passer",
  },
  rememberSkip: {
    en: "Do not ask again",
    sw: "Ne pas demander à nouveau",
  },
});

export const authorizeReset = Object.freeze({
  title: {
    en: "Reset your password",
    sw: "Réinitialiser votre mot de passe",
  },
  success: {
    en: "Password reset successful!",
    sw: "Réinitialisation du mot de passe réussie !",
  },
  signIn: {
    en: "Sign in",
    sw: "Se connecter",
  },
  backSignIn: {
    en: "Back to sign in",
    sw: "Retour à la connexion",
  },
  desc: {
    en: "Enter your email address, we will send you a reset code by email",
    sw: "Entrez votre adresse e-mail, nous vous enverrons un code de réinitialisation par e-mail.",
  },
  email: {
    en: "Email",
    sw: "Adresse e-mail",
  },
  code: {
    en: "Code",
    sw: "Code",
  },
  password: {
    en: "Password",
    sw: "Mot de passe",
  },
  confirmPassword: {
    en: "Confirm Password",
    sw: "Confirmer le mot de passe",
  },
  send: {
    en: "Send",
    sw: "Envoyer",
  },
  reset: {
    en: "Reset",
    sw: "Réinitialiser",
  },
  resend: {
    en: "Resend a new code",
    sw: "Renvoyer un nouveau code",
  },
  resent: {
    en: "New code sent.",
    sw: "Nouveau code envoyé.",
  },
});

export const updateInfo = Object.freeze({
  title: {
    en: "Update your info",
    sw: "Mettre à jour vos informations",
  },
  firstName: {
    en: "First Name",
    sw: "Prénom",
  },
  lastName: {
    en: "Last Name",
    sw: "Nom",
  },
  success: {
    en: "Info updated!",
    sw: "Informations mises à jour !",
  },
  confirm: {
    en: "Confirm",
    sw: "Confirmer",
  },
  redirect: {
    en: "Redirect back",
    sw: "Rediriger en arrière",
  },
});

export const changePassword = Object.freeze({
  title: {
    en: "Update your password",
    sw: "Mettez à jour votre mot de passe",
  },
  success: {
    en: "Password updated!",
    sw: "Mot de passe mis à jour !",
  },
  newPassword: {
    en: "New Password",
    sw: "Nouveau mot de passe",
  },
  confirmNewPassword: {
    en: "Confirm New Password",
    sw: "Confirmez le nouveau mot de passe",
  },
  confirm: {
    en: "Confirm",
    sw: "Confirmer",
  },
  redirect: {
    en: "Redirect back",
    sw: "Rediriger en arrière",
  },
});

export const changeEmail = Object.freeze({
  title: {
    en: "Change your email",
    sw: "Changer votre adresse e-mail",
  },
  email: {
    en: "Email Address",
    sw: "Adresse e-mail",
  },
  confirm: {
    en: "Confirm",
    sw: "Confirmer",
  },
  redirect: {
    en: "Redirect back",
    sw: "Retourner en arrière",
  },
  sendCode: {
    en: "Send Verification Code",
    sw: "Envoyer le code de vérification",
  },
  code: {
    en: "Verification Code",
    sw: "Code de vérification",
  },
  resend: {
    en: "Resend a new code",
    sw: "Renvoyer un nouveau code",
  },
  resent: {
    en: "New code sent.",
    sw: "Nouveau code envoyé.",
  },
});

export const verifyEmail = Object.freeze({
  title: {
    en: "Verify your email",
    sw: "Vérifiez votre e-mail",
  },
  desc: {
    en: "Enter your verification code received by email",
    sw: "Entrez le code de vérification reçu par e-mail",
  },
  verify: {
    en: "Verify",
    sw: "Vérifier",
  },
  success: {
    en: "Verification successful! You can close this page now.",
    sw: "Vérification réussie ! Vous pouvez fermer cette page maintenant.",
  },
});

export const resetMfa = Object.freeze({
  title: {
    en: "Reset your MFA",
    sw: "Réinitialisez votre MFA",
  },
  success: {
    en: "Reset success!",
    sw: "Réinitialisation réussie!",
  },
  desc: {
    en: "Your current Multi-Factor Authentication (MFA) method will be reset. After this reset, you will need to set up MFA again to ensure continued secure access to your account.",
    sw: "Votre méthode actuelle d'authentification multifactorielle (MFA) sera réinitialisée. Après cette réinitialisation, vous devrez configurer à nouveau votre MFA pour garantir un accès sécurisé continu à votre compte.",
  },
  confirm: {
    en: "Confirm",
    sw: "Confirmer",
  },
  redirect: {
    en: "Redirect back",
    sw: "Rediriger en arrière",
  },
});

export const managePasskey = Object.freeze({
  title: {
    en: "Manage Passkey",
    sw: "Gérer Passkey",
  },
  active: {
    en: "Active Key",
    sw: "Clé active",
  },
  loginCount: {
    en: "Login count",
    sw: "Compteur de connexion",
  },
  remove: {
    en: "Remove",
    sw: "Supprimer",
  },
  enroll: {
    en: "Enroll",
    sw: "Enregistrer",
  },
  redirect: {
    en: "Redirect back",
    sw: "Rediriger en arrière",
  },
  removeSuccess: {
    en: "Passkey removed!",
    sw: "Passkey supprimé !",
  },
  noPasskey: {
    en: "No passkey found",
    sw: "Aucun Passkey trouvé",
  },
  enrollSuccess: {
    en: "Passkey enrolled!",
    sw: "Passkey enregistré !",
  },
});

export const emailVerificationEmail = Object.freeze({
  subject: {
    en: "Welcome to Melody Auth! Please verify your email address",
    sw: "Bienvenue sur Melody Auth ! Veuillez vérifier votre adresse e-mail",
  },
  title: {
    en: "Welcome to Melody Auth",
    sw: "Bienvenue sur Melody Auth",
  },
  desc: {
    en: "Thanks for signing up! Please verify your email address with us, your verification code is",
    sw: "Merci de vous être inscrit ! Veuillez vérifier votre adresse e-mail. Votre code de vérification est :",
  },
  expiry: {
    en: "This link will expire after 2 hours",
    sw: "Ce lien expirera après 2 heures",
  },
  verify: {
    en: "Verify your email",
    sw: "Vérifiez votre e-mail",
  },
});

export const passwordResetEmail = Object.freeze({
  subject: {
    en: "Reset your password",
    sw: "Réinitialisez votre mot de passe",
  },
  title: {
    en: "Reset your password",
    sw: "Réinitialisez votre mot de passe",
  },
  desc: {
    en: "Here is your reset code, this code will be expired after 2 hour",
    sw: "Voici votre code de réinitialisation. Ce code expirera après 2 heures.",
  },
});

export const changeEmailVerificationEmail = Object.freeze({
  subject: {
    en: "Verify your email",
    sw: "Vérifiez votre adresse e-mail",
  },
  title: {
    en: "Verify your email",
    sw: "Vérifiez votre adresse e-mail",
  },
  desc: {
    en: "Here is your verification code, this code will be expired after 2 hours",
    sw: "Voici votre code de vérification, ce code expirera après 2 heures",
  },
});

export const emailMfaEmail = Object.freeze({
  subject: {
    en: "Account verification code",
    sw: "Code de vérification du compte",
  },
  title: {
    en: "Account verification code",
    sw: "Code de vérification du compte",
  },
  desc: {
    en: "Here is your MFA code, this code will be expired after 5 minutes",
    sw: "Voici votre code MFA. Ce code expirera après 5 minutes.",
  },
});

export const smsMfaMsg = Object.freeze({
  body: {
    en: "Your verification code is",
    sw: "Votre code de vérification est",
  },
});

export const authCodeExpired = Object.freeze({
  msg: {
    en: "Your login state has expired. Please try initializing authentication again.",
    sw: "Votre état de connexion a expiré. Veuillez réessayer dinitialiser lauthentification.",
  },
});
