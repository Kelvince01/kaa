type Decoder = (str: string) => string;
export const tryDecode = (str: string, decoder: Decoder): string => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match) => {
      try {
        return decoder(match);
      } catch {
        return match;
      }
    });
  }
};

/**
 * Try to apply decodeURI() to given string.
 * If it fails, skip invalid percent encoding or invalid UTF-8 sequences, and apply decodeURI() to the rest as much as possible.
 * @param str The string to decode.
 * @returns The decoded string that sometimes contains undecodable percent encoding.
 * @example
 * tryDecodeURI('Hello%20World') // 'Hello World'
 * tryDecodeURI('Hello%20World/%A4%A2') // 'Hello World/%A4%A2'
 */
const tryDecodeURI = (str: string) => tryDecode(str, decodeURI);

export const getPath = (request: Request): string => {
  const url = request.url;
  const start = url.indexOf(
    "/",
    url.charCodeAt(9) === 58
      ? 13 // http+unix://
      : 8 // http:// or https://
  );
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      // '%'
      // If the path contains percent encoding, use `indexOf()` to find '?' and return the result immediately.
      // Although this is a performance disadvantage, it is acceptable since we prefer cases that do not include percent encoding.
      const queryIndex = url.indexOf("?", i);
      const path = url.slice(start, queryIndex === -1 ? undefined : queryIndex);
      return tryDecodeURI(
        path.includes("%25") ? path.replace(/%25/g, "%2525") : path
      );
    }
    if (charCode === 63) {
      // '?'
      break;
    }
  }
  return url.slice(start, i);
};
