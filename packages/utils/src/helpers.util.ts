export const genRandomString = (length: number) => {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let randomString = "";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    // biome-ignore lint/style/noNonNullAssertion: false positive
    randomString += charset[array[i]! % charset.length];
  }
  return randomString;
};

export const base64UrlEncode = (buffer: ArrayBuffer) => {
  const base64 = btoa(
    String.fromCharCode.apply(null, Array.from(new Uint8Array(buffer)))
  );
  // biome-ignore lint/performance/useTopLevelRegex: false positive
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

export const genCodeChallenge = async (verifier: string): Promise<string> => {
  const content = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest({ name: "SHA-256" }, content);
  return base64UrlEncode(digest);
};

export function getExpTimestamp(seconds: number) {
  const currentTimeMillis = Date.now();
  const secondsIntoMillis = seconds * 1000;
  const expirationTimeMillis = currentTimeMillis + secondsIntoMillis;

  return Math.floor(expirationTimeMillis / 1000);
}
