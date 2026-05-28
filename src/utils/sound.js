// Programmatically generated beep — no audio file dependency
// Works in all modern browsers. Requires prior user gesture.

let audioCtx = null;
let userHasInteracted = false;

// Call this once on any user interaction (click, keydown) at app level
export const initAudio = () => {
  if (userHasInteracted) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    userHasInteracted = true;
    console.log('[Sound] AudioContext initialized');
  } catch (e) {
    console.warn('[Sound] AudioContext not supported:', e);
  }
};

export const playKDSBeep = () => {
  if (!audioCtx || !userHasInteracted) {
    console.warn('[Sound] Audio not initialized — user has not interacted yet');
    return;
  }
  try {
    // Play three short ascending beeps — classic KDS notification
    const beepTimes = [0, 0.15, 0.30];
    const frequencies = [880, 1046, 1318]; // A5, C6, E6 — pleasant ascending chord
    beepTimes.forEach((startTime, i) => {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequencies[i], audioCtx.currentTime + startTime);
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime + startTime);
      gainNode.gain.linearRampToValueAtTime(0.4, audioCtx.currentTime + startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + startTime + 0.18);
      oscillator.start(audioCtx.currentTime + startTime);
      oscillator.stop(audioCtx.currentTime + startTime + 0.18);
    });
  } catch (e) {
    console.error('[Sound] Beep failed:', e);
  }
};

export const playPaymentSound = () => {
  if (!audioCtx || !userHasInteracted) return;
  try {
    // Single soft chime for payment confirmation
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1046, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(523, audioCtx.currentTime + 0.4);
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.5);
  } catch (e) {
    console.error('[Sound] Payment chime failed:', e);
  }
};

export const playAlertSound = () => {
  if (!audioCtx || !userHasInteracted) return;
  try {
    // Two low urgent beeps for alerts/voids
    [0, 0.25].forEach((startTime) => {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(440, audioCtx.currentTime + startTime);
      gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime + startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + startTime + 0.2);
      oscillator.start(audioCtx.currentTime + startTime);
      oscillator.stop(audioCtx.currentTime + startTime + 0.2);
    });
  } catch (e) {
    console.error('[Sound] Alert sound failed:', e);
  }
};
