'use client';
import type { ReaderSettings as Settings } from '@/lib/reader';
import styles from './reader.module.css';

export default function ReaderSettings({ settings, onChange }: { settings: Settings; onChange: (value: Settings) => void }) {
  return <fieldset className={styles.settings}>
    <legend>راحة القراءة</legend>
    <label>حجم الخط<select value={settings.font_size} onChange={event => onChange({ ...settings, font_size: event.target.value as Settings['font_size'] })}><option value="small">صغير</option><option value="medium">متوسط</option><option value="large">كبير</option></select></label>
    <label>الخط<select value={settings.font_family} onChange={event => onChange({ ...settings, font_family: event.target.value as Settings['font_family'] })}><option value="Amiri">أميري</option><option value="Cairo">القاهرة</option><option value="sans-serif">خط النظام</option></select></label>
    <label>خلفية القراءة<select value={settings.theme} onChange={event => onChange({ ...settings, theme: event.target.value as Settings['theme'] })}><option value="light">نهاري</option><option value="dark">ليلي</option><option value="sepia">ورق دافئ</option></select></label>
    <label>السطوع {settings.brightness}%<input aria-label="السطوع" type="range" min="40" max="100" value={settings.brightness} onChange={event => onChange({ ...settings, brightness: Number(event.target.value) })} /></label>
  </fieldset>;
}
