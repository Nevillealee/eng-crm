import { createRequire } from "node:module";
import { extractRequestIp } from "../../../lib/request-ip";
import { PROFILE_CITY_MAX_LENGTH } from "../../constants/text-limits";

const require = createRequire(import.meta.url);
let geoipLookupInstance;

export function deriveCityFromIp(request) {
  const ip = extractRequestIp(request);
  if (!ip) {
    return null;
  }

  if (!geoipLookupInstance) {
    try {
      geoipLookupInstance = require("geoip-lite");
    } catch {
      return null;
    }
  }

  const location = geoipLookupInstance.lookup(ip);
  if (!location) {
    return null;
  }

  const city = typeof location.city === "string" ? location.city.trim() : "";
  if (city) {
    return city.slice(0, PROFILE_CITY_MAX_LENGTH);
  }

  const region = typeof location.region === "string" ? location.region.trim() : "";
  const country = typeof location.country === "string" ? location.country.trim() : "";
  const fallback = [region, country].filter(Boolean).join(", ");
  return fallback ? fallback.slice(0, PROFILE_CITY_MAX_LENGTH) : null;
}
