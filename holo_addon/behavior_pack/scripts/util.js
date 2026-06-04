// =====================================================================
//  Floating Holograms Pro - Utility helpers
// =====================================================================
import { system } from "@minecraft/server";
import { FormCancelationReason } from "@minecraft/server-ui";

/** Wait a number of ticks (returns a promise). */
export function waitTicks(ticks) {
  return new Promise((resolve) => system.runTimeout(resolve, ticks));
}

/**
 * Show a form to a player, automatically retrying while the player is
 * "busy" (e.g. an interaction screen is still closing). Standard work-around
 * so forms reliably open right after an item use / interaction.
 */
export async function forceShow(player, form, retries = 20) {
  for (let i = 0; i < retries; i++) {
    const response = await form.show(player);
    if (
      response.canceled &&
      response.cancelationReason === FormCancelationReason.UserBusy
    ) {
      await waitTicks(5);
      continue;
    }
    return response;
  }
  return undefined;
}

/** Send a coloured chat message to a player. */
export function msg(player, text) {
  try { player.sendMessage(text); } catch (e) { /* ignore */ }
}

/** Clamp a number between min and max. */
export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

/** Convert "&" colour codes to the section sign understood by Minecraft. */
export function colorize(text) {
  return (text ?? "").toString().replace(/&/g, "\u00a7");
}

/** Play a UI sound for the player (best effort). */
export function uiSound(player, sound = "random.orb", pitch = 1.2) {
  try {
    player.playSound(sound, { volume: 0.6, pitch });
  } catch (e) { /* ignore */ }
}

/** True if the entity reference is still alive/valid. */
export function isValid(entity) {
  if (!entity) return false;
  try {
    return typeof entity.isValid === "function" ? entity.isValid() : !!entity.isValid;
  } catch (e) {
    return false;
  }
}
