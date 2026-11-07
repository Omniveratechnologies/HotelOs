/**
 * In-memory state tracking whether superadmin has explicitly unlocked the kiosk.
 *
 * This state is deliberately stored in RAM only and NOT persisted to AsyncStorage:
 * - On app restart, device reboot, process crash or kill:
 *   RAM resets to false, ensuring the terminal boots directly into the guest dashboard
 *   without flashing Terminal Info or device details.
 * - Only an explicit 'device:exit-kiosk' command dispatched from Super Admin unlocks
 *   the terminal and renders the HomeScreen / Terminal Info screen.
 */
let unlocked = false;

export const kioskUnlockState = {
  isUnlocked: (): boolean => unlocked,
  setUnlocked: (val: boolean): void => {
    unlocked = val;
  },
};
