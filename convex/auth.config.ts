import type { AuthConfig } from "convex/server";

/**
 * Clerk JWT template name and audience must both be convex.
 * Set CLERK_JWT_ISSUER_DOMAIN on your own Convex deployment.
 */
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
