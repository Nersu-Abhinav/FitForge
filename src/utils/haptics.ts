// ============================================================================
// FitForge Mobile & Desktop Haptic Engine
// Compliant with Web Autoplay & User Gesture Policies (Chrome, Safari, Firefox)
// ============================================================================

export type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'pr' | 'selection' | 'tap';

// Track if the user has performed at least one interaction on the page
let hasUserInteracted = false;
let audioCtx: AudioContext | null = null;

if (typeof window !== 'undefined') {
  const markInteracted = () => {
    hasUserInteracted = true;
    // Safely unlock AudioContext on initial user gesture
    try {
      if (!audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioCtx = new AudioContextClass();
        }
      } else if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
    } catch {}

    window.removeEventListener('pointerdown', markInteracted);
    window.removeEventListener('touchstart', markInteracted);
    window.removeEventListener('keydown', markInteracted);
  };

  window.addEventListener('pointerdown', markInteracted, { passive: true });
  window.addEventListener('touchstart', markInteracted, { passive: true });
  window.addEventListener('keydown', markInteracted, { passive: true });
}

// Synthesizes a crisp, sub-audible micro-thud for acoustic-tactile feel
function playAcousticHaptic(frequency: number = 90, durationSec: number = 0.015, volume: number = 0.08) {
  if (!hasUserInteracted || !audioCtx || audioCtx.state !== 'running') {
    return;
  }

  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + durationSec);

    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + durationSec);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + durationSec);
  } catch {
    // Gracefully ignore
  }
}

export function triggerHaptic(style: HapticStyle = 'light') {
  if (typeof window === 'undefined' || !hasUserInteracted) {
    return;
  }

  // 1. Native Hardware Vibration Engine (Android / Chrome Mobile)
  if ('navigator' in window && typeof navigator.vibrate === 'function') {
    try {
      switch (style) {
        case 'tap':
        case 'selection':
          navigator.vibrate(8);
          break;
        case 'light':
          navigator.vibrate(12);
          break;
        case 'medium':
          navigator.vibrate(25);
          break;
        case 'heavy':
          navigator.vibrate(45);
          break;
        case 'success':
          navigator.vibrate([15, 40, 20]);
          break;
        case 'warning':
          navigator.vibrate([30, 60, 35]);
          break;
        case 'pr':
          navigator.vibrate([25, 40, 30, 40, 45, 50, 70]);
          break;
        default:
          navigator.vibrate(15);
      }
    } catch {
      // Gracefully ignore
    }
  }

  // 2. Acoustic-Tactile Synthesis (iOS Safari / Cross-platform tactile resonance)
  try {
    switch (style) {
      case 'tap':
      case 'selection':
        playAcousticHaptic(120, 0.01, 0.04);
        break;
      case 'light':
        playAcousticHaptic(95, 0.015, 0.06);
        break;
      case 'medium':
        playAcousticHaptic(80, 0.022, 0.08);
        break;
      case 'heavy':
        playAcousticHaptic(65, 0.035, 0.1);
        break;
      case 'success':
        playAcousticHaptic(140, 0.02, 0.06);
        setTimeout(() => playAcousticHaptic(180, 0.025, 0.08), 50);
        break;
      case 'warning':
        playAcousticHaptic(60, 0.03, 0.09);
        setTimeout(() => playAcousticHaptic(50, 0.04, 0.09), 70);
        break;
      case 'pr':
        playAcousticHaptic(100, 0.02, 0.07);
        setTimeout(() => playAcousticHaptic(150, 0.025, 0.09), 60);
        setTimeout(() => playAcousticHaptic(220, 0.035, 0.1), 130);
        break;
    }
  } catch {}
}
