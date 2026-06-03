// =====================================================================
//  Custom NPC Pro Editor - Utility helpers
// =====================================================================
import { system } from "@minecraft/server";
import { FormCancelationReason } from "@minecraft/server-ui";

/** Wait a number of ticks (returns a promise). */
export function waitTicks(ticks) {
  return new Promise((resolve) => system.runTimeout(resolve, ticks));
}

/**
 * Show a form to a player, automatically retrying while the player is
 * "busy" (e.g. the interaction screen is still closing). This is the
 * standard work-around so forms reliably open right after an interaction.
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
  player.sendMessage(text);
}

/** Clamp a number between min and max. */
export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

/** Safe integer parse with fallback. */
export function toInt(value, fallback = 0) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

/** Play a UI sound for the player (best effort). */
export function uiSound(player, sound = "random.orb") {
  try {
    player.playSound(sound, { volume: 0.6, pitch: 1.2 });
  } catch (e) {
    /* ignore */
  }
}
