import type { InviteStatus, Drop, DropVariant } from '@nebula/shared';

// Prüft, ob ein Nutzer Zugang zu einem Drop/Variante hat.
// Regel: Wenn Invite erforderlich ist, muss der Nutzer mindestens 1 erfolgreiche Einladung haben.
export function hasDropAccess(invite: InviteStatus | null | undefined, inviteRequired: boolean): boolean {
  if (!inviteRequired) return true;
  const totalReferrals = invite?.totalReferrals ?? 0;
  return totalReferrals >= 1;
}

// Komfort-Helper für Komponenten: ermittelt Invite-Bedarf aus Drop/Variante
export function canPreorderForVariant(drop: Drop, variant: DropVariant | undefined | null, invite: InviteStatus | null | undefined): boolean {
  const inviteRequired = (variant?.inviteRequired ?? drop.inviteRequired) ?? false;
  return hasDropAccess(invite, inviteRequired);
}













































































































