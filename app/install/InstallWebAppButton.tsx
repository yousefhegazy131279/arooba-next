"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function InstallWebAppButton() {
  const [promptEvent, setPromptEvent] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(display-mode: standalone)");
    const updateInstalled = () => setInstalled(media.matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPrompt);
    };
    const onInstalled = () => {
      setPromptEvent(null);
      setInstalled(true);
    };

    updateInstalled();
    media.addEventListener("change", updateInstalled);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      media.removeEventListener("change", updateInstalled);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return <p className={styles.installed}>عُروبة مثبتة بالفعل على هذا الجهاز.</p>;
  if (!promptEvent) return <p className={styles.hint}>إذا ظهر خيار «تثبيت التطبيق» في قائمة المتصفح، يمكنك استخدامه مباشرة.</p>;

  return (
    <button
      className={styles.browserButton}
      type="button"
      onClick={async () => {
        await promptEvent.prompt();
        await promptEvent.userChoice;
        setPromptEvent(null);
      }}
    >
      ثبّت نسخة الويب الآن
    </button>
  );
}
