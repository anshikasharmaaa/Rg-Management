let audioContext = null;

const getAudioContext = () => {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    audioContext = new AudioContextClass();
  }
  return audioContext;
};

export const playNotificationSound = () => {
  const enabled = localStorage.getItem("notification_sound_enabled");
  if (enabled === "false") return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.0001, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  } catch (error) {
    console.error("Notification sound failed:", error.message);
  }
};
