___TERMS_OF_SERVICE___

By creating or modifying this file you agree to Google Tag Manager's Community
Template Gallery Developer Terms of Service available at
https://developers.google.com/tag-manager/gallery-tos (or such other URL as
Google may provide), as modified from time to time.


___INFO___

{
  "type": "CLIENT",
  "id": "cvt_temp_public_id",
  "version": 1,
  "securityGroups": [],
  "displayName": "Edge peer echo",
  "brand": {
    "id": "brand_utekos",
    "displayName": "Utekos"
  },
  "description": "Response-only client. Returns the connecting address as {\"client_ip_address\": \"...\"} on one exact path for the Meta Parameter Builder getIpFn on utekos.no. Never runs the container, sets no cookies and logs nothing.",
  "containerContexts": [
    "SERVER"
  ]
}


___TEMPLATE_PARAMETERS___

[]


___SANDBOXED_JS_FOR_SERVER___

const claimRequest = require('claimRequest');
const getRemoteAddress = require('getRemoteAddress');
const getRequestHeader = require('getRequestHeader');
const getRequestMethod = require('getRequestMethod');
const getRequestPath = require('getRequestPath');
const JSON = require('JSON');
const makeNumber = require('makeNumber');
const returnResponse = require('returnResponse');
const setResponseBody = require('setResponseBody');
const setResponseHeader = require('setResponseHeader');
const setResponseStatus = require('setResponseStatus');

// Must equal META_EDGE_CLIENT_IP_URL in utekos-v2
// src/lib/analytics/fetchMetaClientIp.ts.
const ECHO_PATH = '/MeS07gRdh1IMJ8Mtg0';
// Exact production origin only. Preview and every other origin get no CORS
// allowance and fall back to the same-origin IPv4 lookup.
const ALLOWED_ORIGIN = 'https://utekos.no';
const DIGITS = '0123456789';
const HEX = '0123456789abcdef';

if (getRequestPath() !== ECHO_PATH) return;
claimRequest();

setResponseHeader('Cache-Control', 'no-store, private');
setResponseHeader('Vary', 'Origin');
if (getRequestHeader('origin') === ALLOWED_ORIGIN) {
  setResponseHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
}

const method = getRequestMethod();
if (method === 'OPTIONS') {
  setResponseHeader('Access-Control-Allow-Methods', 'POST');
  setResponseStatus(204);
  returnResponse();
} else if (method !== 'POST') {
  setResponseHeader('Allow', 'POST, OPTIONS');
  setResponseStatus(405);
  returnResponse();
} else {
  const ip = normalizeIp(getRemoteAddress());
  if (!ip) {
    // No usable address: the browser falls back to the same-origin lookup.
    setResponseStatus(204);
  } else {
    setResponseHeader('Content-Type', 'application/json');
    setResponseStatus(200);
    setResponseBody(JSON.stringify({ client_ip_address: ip }));
  }
  returnResponse();
}

function onlyChars(value, allowed) {
  for (let i = 0; i < value.length; i++) {
    if (allowed.indexOf(value.charAt(i)) < 0) return false;
  }
  return true;
}

function isIpv4(value) {
  const parts = value.split('.');
  if (parts.length !== 4) return false;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part.length < 1 || part.length > 3 || !onlyChars(part, DIGITS)) return false;
    if (part.length > 1 && part.charAt(0) === '0') return false;
    if (makeNumber(part) > 255) return false;
  }
  return true;
}

function isIpv6(value) {
  if (value.length < 2 || value.length > 39) return false;
  if (value.indexOf(':') < 0 || !onlyChars(value, HEX + ':')) return false;
  if (value.indexOf(':::') >= 0) return false;
  const compressed = value.split('::').length - 1;
  if (compressed > 1) return false;
  const groups = value.split(':');
  if (groups.length > 8 || (compressed === 0 && groups.length !== 8)) return false;
  for (let i = 0; i < groups.length; i++) {
    if (groups[i].length > 4) return false;
  }
  return true;
}

function normalizeIp(value) {
  if (typeof value !== 'string') return '';
  const candidate = value.trim().toLowerCase();
  if (candidate.indexOf('::ffff:') === 0 && isIpv4(candidate.substring(7))) {
    return candidate.substring(7);
  }
  if (isIpv4(candidate) || isIpv6(candidate)) return candidate;
  return '';
}


___SERVER_PERMISSIONS___

[
  {
    "instance": {
      "key": {
        "publicId": "read_request",
        "versionId": "1"
      },
      "param": [
        {
          "key": "requestAccess",
          "value": {
            "type": 1,
            "string": "any"
          }
        },
        {
          "key": "headerAccess",
          "value": {
            "type": 1,
            "string": "any"
          }
        },
        {
          "key": "queryParameterAccess",
          "value": {
            "type": 1,
            "string": "any"
          }
        }
      ]
    },
    "clientAnnotations": {
      "isEditedByUser": true
    },
    "isRequired": true
  },
  {
    "instance": {
      "key": {
        "publicId": "access_response",
        "versionId": "1"
      },
      "param": [
        {
          "key": "writeResponseAccess",
          "value": {
            "type": 1,
            "string": "any"
          }
        },
        {
          "key": "writeHeaderAccess",
          "value": {
            "type": 1,
            "string": "any"
          }
        }
      ]
    },
    "clientAnnotations": {
      "isEditedByUser": true
    },
    "isRequired": true
  },
  {
    "instance": {
      "key": {
        "publicId": "return_response",
        "versionId": "1"
      },
      "param": []
    },
    "isRequired": true
  }
]


___TESTS___

scenarios: []


___NOTES___

Utekos: response-only IP echo for the Meta Parameter Builder getIpFn.
Publishing requires the owner's explicit approval. Do not combine with a web
container publish. Verify the IPv6 probe first (docs/tracking/meta-client-ip-ipv6.md).
