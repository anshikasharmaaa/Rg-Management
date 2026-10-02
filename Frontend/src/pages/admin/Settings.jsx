import { useState, useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";

const Settings = () => {
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("notification_sound_enabled");
    setSoundEnabled(stored !== "false");
  }, []);

  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem("notification_sound_enabled", String(newValue));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your RG Restaurant admin preferences
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-card">
        <p className="mb-4 text-sm font-semibold text-gray-900">
          Notifications
        </p>
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gold-600">
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900">
                Notification Sound
              </p>
              <p className="truncate text-xs text-gray-500">
                Play a sound when a new notification arrives
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={soundEnabled}
            aria-label="Toggle notification sound"
            onClick={toggleSound}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 ${
              soundEnabled
                ? "bg-gold-500 hover:bg-gold-600"
                : "bg-gray-300 hover:bg-gray-400"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ease-in-out ${
                soundEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
