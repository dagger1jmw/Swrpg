// The wounded commander (m8-audit A4, Jared, 26 Nov 2026). Pure.
//
// By default a commander out of the fight (dying, or incapacitated: health §6, cannot fight) hands command to the next in line at
// once and is taken to medical help if any can reach them (a medic, an evacuation, the ship's medical bay); otherwise they lie where
// they fell. A severe wound that leaves them in the fight keeps command, with the wound's penalty on their rolls.
// The exception is the player's choice only: staying in command while out of the fight, as a sacrifice (staying aboard to set the
// self-destruct, a suicide run, holding the line). The code offers it as its own option ("Stay at your post"); the narrator never
// forces it; the dying clock keeps running (no medic comes). NPC commanders follow the same rule (the fleet's commander passing on,
// rules.ts), canon fates by the tag rules. It fits the boarding rule: a commander keeps command unless out of the fight.

/** What the rule reads of the commander's health (health selectors: dying, incapacitated, dead). */
export interface CommanderCondition {
  dying: boolean;
  incapacitated: boolean;
  dead: boolean;
}

export const FIT: CommanderCondition = { dying: false, incapacitated: false, dead: false };

/** Out of the fight: dying, incapacitated (cannot fight) or dead. A severe wound alone is not. */
export const outOfFight = (c: CommanderCondition): boolean => c.dead || c.dying || c.incapacitated;

/** Whether the commander keeps command: in the fight, or out of it and staying at their post by their own choice (alive). */
export const keepsCommand = (c: CommanderCondition, stayAtPost: boolean): boolean => !outOfFight(c) || (stayAtPost && !c.dead);

/** May the player choose to stay at their post: out of the fight, alive, not already staying. */
export const mayStayAtPost = (c: CommanderCondition, stayAtPost: boolean): boolean => outOfFight(c) && !c.dead && !stayAtPost;

/** The option's words: dying means the clock keeps running. */
export const stayAtPostLabel = (c: CommanderCondition): { label: string; why: string } => ({
  label: 'Stay at your post',
  why: c.dying ? 'you are dying: you keep command, no medic comes, and the clock keeps running' : 'you cannot fight: you keep command from where you lie, and no medic comes',
});

/**
 * A second-in-command nobody named (invented, m8-audit A4): an experienced field officer's Tactics, used for the next in line when
 * no named leader of ours is on the field.
 */
export const SECOND_IN_COMMAND_TACTICS = 40;
