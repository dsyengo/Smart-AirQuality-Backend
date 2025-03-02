import crypto from 'crypto';

const Algorithm = "SDK-HMAC-SHA256";
const HeaderXDate = "X-Sdk-Date";
const HeaderAuthorization = "Authorization";
const HeaderContentSha256 = "x-sdk-content-sha256";

const hexTable = new Array(256);
for (let i = 0; i < 256; ++i) {
    hexTable[i] = '%' + ((i < 16 ? '0' : '') + i.toString(16)).toUpperCase();
}

const noEscape = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0 - 15
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 16 - 31
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, // 32 - 47
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, // 48 - 63
    0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, // 64 - 79
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, // 80 - 95
    0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, // 96 - 111
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0  // 112 - 127
];

/**
 * URL encodes a string.
 * Based on the implementation in Node's querystring module.
 * @param {string} str 
 * @returns {string}
 */
export function urlEncode(str) {
    if (typeof str !== 'string') {
        if (typeof str === 'object')
            str = String(str);
        else
            str += '';
    }
    let out = '';
    let lastPos = 0;
    for (let i = 0; i < str.length; ++i) {
        const c = str.charCodeAt(i);
        // ASCII
        if (c < 0x80) {
            if (noEscape[c] === 1)
                continue;
            if (lastPos < i)
                out += str.slice(lastPos, i);
            lastPos = i + 1;
            out += hexTable[c];
            continue;
        }
        if (lastPos < i)
            out += str.slice(lastPos, i);
        // Multi-byte characters ...
        if (c < 0x800) {
            lastPos = i + 1;
            out += hexTable[0xC0 | (c >> 6)] + hexTable[0x80 | (c & 0x3F)];
            continue;
        }
        if (c < 0xD800 || c >= 0xE000) {
            lastPos = i + 1;
            out += hexTable[0xE0 | (c >> 12)] +
                hexTable[0x80 | ((c >> 6) & 0x3F)] +
                hexTable[0x80 | (c & 0x3F)];
            continue;
        }
        // Surrogate pair
        ++i;
        if (i >= str.length)
            throw new URIError('ERR_INVALID_URI');
        const c2 = str.charCodeAt(i) & 0x3FF;
        lastPos = i + 1;
        const cp = 0x10000 + (((c & 0x3FF) << 10) | c2);
        out += hexTable[0xF0 | (cp >> 18)] +
            hexTable[0x80 | ((cp >> 12) & 0x3F)] +
            hexTable[0x80 | ((cp >> 6) & 0x3F)] +
            hexTable[0x80 | (cp & 0x3F)];
    }
    if (lastPos === 0)
        return str;
    if (lastPos < str.length)
        return out + str.slice(lastPos);
    return out;
}

/**
 * HttpRequest class that holds request details.
 */
export class HttpRequest {
    constructor(method = "", url = "", headers = {}, body = "") {
        this.method = method;
        this.headers = headers;
        this.body = body;
        this.query = {};

        if (url) {
            // Remove protocol
            const posProtocol = url.indexOf("://");
            if (posProtocol !== -1) {
                url = url.substr(posProtocol + 3);
            }
            // Parse query parameters if any
            const posQuery = url.indexOf("?");
            if (posQuery !== -1) {
                const queryStr = url.substr(posQuery + 1);
                url = url.substr(0, posQuery);
                const parts = queryStr.split("&");
                for (const part of parts) {
                    const index = part.indexOf('=');
                    let key, value;
                    if (index >= 0) {
                        key = decodeURI(part.substr(0, index));
                        value = decodeURI(part.substr(index + 1));
                    } else {
                        key = decodeURI(part);
                        value = "";
                    }
                    if (key !== "") {
                        if (!this.query[key]) {
                            this.query[key] = [value];
                        } else {
                            this.query[key].push(value);
                        }
                    }
                }
            }
            // Parse host and uri
            const posPath = url.indexOf("/");
            if (posPath === -1) {
                this.host = url;
                this.uri = "/";
            } else {
                this.host = url.substr(0, posPath);
                this.uri = decodeURI(url.substr(posPath));
            }
        } else {
            this.host = "";
            this.uri = "";
        }
    }
}

/**
 * Finds the header value in a case-insensitive way.
 * @param {HttpRequest} r 
 * @param {string} header 
 * @returns {string|null}
 */
export function findHeader(r, header) {
    for (const k in r.headers) {
        if (k.toLowerCase() === header.toLowerCase()) {
            return r.headers[k];
        }
    }
    return null;
}

/**
 * Builds the canonical query string from the request.
 * @param {HttpRequest} r 
 * @returns {string}
 */
function CanonicalQueryString(r) {
    const keys = Object.keys(r.query).sort();
    const a = [];
    for (const key of keys) {
        const encKey = urlEncode(key);
        const value = r.query[key];
        if (Array.isArray(value)) {
            value.sort();
            for (const val of value) {
                a.push(encKey + '=' + urlEncode(val));
            }
        } else {
            a.push(encKey + '=' + urlEncode(value));
        }
    }
    return a.join('&');
}

/**
 * Builds the canonical URI from the request.
 * @param {HttpRequest} r 
 * @returns {string}
 */
function CanonicalURI(r) {
    const parts = r.uri.split('/');
    const encodedParts = parts.map(part => urlEncode(part));
    let urlPath = encodedParts.join('/');
    if (urlPath[urlPath.length - 1] !== '/') {
        urlPath += '/';
    }
    return urlPath;
}

/**
 * Builds the canonical headers string.
 * @param {HttpRequest} r 
 * @param {string[]} signedHeaders 
 * @returns {string}
 */
function CanonicalHeaders(r, signedHeaders) {
    const headersLower = {};
    for (const key in r.headers) {
        headersLower[key.toLowerCase()] = r.headers[key];
    }
    const a = [];
    for (const header of signedHeaders) {
        const value = headersLower[header];
        a.push(header + ':' + value.toString().trim());
    }
    return a.join('\n') + "\n";
}

/**
 * Returns an array of signed header names.
 * @param {HttpRequest} r 
 * @returns {string[]}
 */
export function SignedHeaders(r) {
    const headers = [];
    for (const key in r.headers) {
        headers.push(key.toLowerCase());
    }
    headers.sort();
    return headers;
}

/**
 * Returns the request payload.
 * @param {HttpRequest} r 
 * @returns {string}
 */
function RequestPayload(r) {
    return r.body;
}

/**
 * Builds the canonical request string.
 * @param {HttpRequest} r 
 * @param {string[]} signedHeadersArr 
 * @returns {string}
 */
export function CanonicalRequest(r, signedHeadersArr) {
    let contentSha256 = findHeader(r, HeaderContentSha256);
    if (contentSha256 === null) {
        const data = RequestPayload(r);
        contentSha256 = crypto.createHash('sha256').update(data).digest('hex');
    }
    return r.method + "\n" +
        CanonicalURI(r) + "\n" +
        CanonicalQueryString(r) + "\n" +
        CanonicalHeaders(r, signedHeadersArr) + "\n" +
        signedHeadersArr.join(';') + "\n" +
        contentSha256;
}

/**
 * Builds the string to sign.
 * @param {string} canonicalRequestStr 
 * @param {string} t 
 * @returns {string}
 */
export function StringToSign(canonicalRequestStr, t) {
    const hash = crypto.createHash('sha256').update(canonicalRequestStr).digest('hex');
    return Algorithm + "\n" + t + "\n" + hash;
}

/**
 * Signs the string to sign using the signing key.
 * @param {string} stringToSign 
 * @param {string|Buffer} signingKey 
 * @returns {string}
 */
function SignStringToSign(stringToSign, signingKey) {
    if (!signingKey) {
        throw new Error("Signing key is missing or undefined");
    }
    return crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');
}

/**
 * Generates the Authorization header value.
 * @param {string} signature 
 * @param {string} Key 
 * @param {string[]} signedHeadersArr 
 * @returns {string}
 */
function AuthHeaderValue(signature, Key, signedHeadersArr) {
    return Algorithm + " Access=" + Key + ", SignedHeaders=" + signedHeadersArr.join(';') + ", Signature=" + signature;
}

/**
 * Formats a number to two characters.
 * @param {number} s 
 * @returns {string}
 */
function twoChar(s) {
    return s >= 10 ? "" + s : "0" + s;
}

/**
 * Returns the current time formatted as YYYYMMDDThhmmssZ.
 * @returns {string}
 */
function getTime() {
    const date = new Date();
    return "" + date.getUTCFullYear() +
        twoChar(date.getUTCMonth() + 1) +
        twoChar(date.getUTCDate()) + "T" +
        twoChar(date.getUTCHours()) +
        twoChar(date.getUTCMinutes()) +
        twoChar(date.getUTCSeconds()) + "Z";
}

/**
 * Signer class for signing HTTP requests.
 */
export class Signer {
    constructor() {
        this.Key = process.env.HUAWEI_MODEL_SDK_AK;
        this.Secret = process.env.HUAWEI_MODEL_SDK_SK;
    }

    /**
     * Signs the given HttpRequest.
     * @param {HttpRequest} r 
     * @returns {object} The options object with signed headers.
     */
    Sign(r) {
        if (!this.Secret) {
            throw new Error("Missing Secret key in Signer. Please set the Secret property.");
        }
        if (!this.Key) {
            throw new Error("Missing Access Key in Signer. Please set the Key property.");
        }

        let headerTime = findHeader(r, HeaderXDate);
        if (headerTime === null) {
            headerTime = getTime();
            r.headers[HeaderXDate] = headerTime;
        }
        if (r.method !== "PUT" && r.method !== "PATCH" && r.method !== "POST") {
            r.body = "";
        }
        let queryString = CanonicalQueryString(r);
        if (queryString !== "") {
            queryString = "?" + queryString;
        }
        const options = {
            hostname: r.host,
            path: encodeURI(r.uri) + queryString,
            method: r.method,
            headers: r.headers
        };
        if (findHeader(r, 'host') === null) {
            r.headers.host = r.host;
        }
        const signedHeadersArr = SignedHeaders(r);
        const canonicalRequestStr = CanonicalRequest(r, signedHeadersArr);
        const stringToSign = StringToSign(canonicalRequestStr, headerTime);
        // Use this.Secret as the signing key. Ensure it is defined.
        const signature = SignStringToSign(stringToSign, this.Secret);
        options.headers[HeaderAuthorization] = AuthHeaderValue(signature, this.Key, signedHeadersArr);
        return options;
    }
}