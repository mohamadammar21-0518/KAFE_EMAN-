import type { UserIdentity } from "convex/server";

/** Map Clerk "convex" JWT template claims → profile fields */
export function profileFromIdentity(identity: UserIdentity) {
  const extra = identity as UserIdentity & {
    given_name?: string;
    family_name?: string;
    givenName?: string;
    familyName?: string;
    phone_number?: string;
    phoneNumber?: string;
    picture?: string;
    picture_url?: string;
    image_url?: string;
  };

  const firstName =
    extra.givenName?.trim() ||
    extra.given_name?.trim() ||
    identity.name?.trim().split(/\s+/)[0] ||
    undefined;

  const lastName =
    extra.familyName?.trim() ||
    extra.family_name?.trim() ||
    (identity.name?.trim().includes(" ")
      ? identity.name.trim().split(/\s+/).slice(1).join(" ")
      : undefined);

  const phone = extra.phoneNumber?.trim() || extra.phone_number?.trim() || undefined;

  return {
    email: identity.email?.trim() || undefined,
    firstName,
    lastName,
    phone,
    avatarUrl:
      identity.pictureUrl ??
      extra.picture ??
      extra.picture_url ??
      extra.image_url ??
      undefined,
  };
}
