import { defineSecret } from "firebase-functions/params";
import { setGlobalOptions } from "firebase-functions/v2";

// Set global options for cost control
setGlobalOptions({ maxInstances: 10, region: "europe-southwest1" });

export const emailUser = defineSecret("EMAIL_USER");
export const emailPass = defineSecret("EMAIL_PASS");

export const BASE_URL = process.env.BASE_URL || 'https://ecoanuncios.com';
