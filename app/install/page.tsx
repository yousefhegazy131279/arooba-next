import type { Metadata } from "next";
import Link from "next/link";
import InstallWebAppButton from "./InstallWebAppButton";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "عُروبة على هاتفك",
  description: "طريقة تثبيت عُروبة على Android وiPhone من الموقع الرسمي.",
};

export default function InstallPage() {
  return (
    <main className={styles.page}>
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.intro}>
        <span className={styles.eyebrow}>عُروبة معك أينما قرأت</span>
        <h1>حكاياتك في جيبك.</h1>
        <p>افتح مكتبتك، وواصل القراءة والكتابة، وتابع مجتمع عُروبة من شاشة هاتفك الرئيسية.</p>
      </div>

      <div className={styles.cards}>
        <section className={styles.card} aria-labelledby="android-title">
          <div className={styles.platformIcon} aria-hidden="true">APK</div>
          <span className={styles.tag}>Android</span>
          <h2 id="android-title">حمّل عُروبة لأندرويد</h2>
          <p>تُوزّع نسخة Android كملف APK موقّع من موقع عُروبة. يمكنك أيضًا تثبيت نسخة الويب من المتصفح.</p>
          <a className={styles.primaryButton} href="/downloads/arooba-android.apk" download="arooba-android.apk">
            تنزيل APK لأندرويد <span aria-hidden="true">↓</span>
          </a>
          <InstallWebAppButton />
          <p className={styles.note}>عند استخدام APK، قد يطلب Android السماح بالتثبيت من هذا المصدر. نزّل الملف من الرابط الرسمي هنا فقط.</p>
        </section>

        <section className={styles.card} aria-labelledby="iphone-title">
          <div className={styles.platformIcon} aria-hidden="true">iOS</div>
          <span className={styles.tag}>iPhone</span>
          <h2 id="iphone-title">أضف عُروبة إلى شاشة iPhone</h2>
          <p>نسخة iPhone هي تطبيق ويب يُثبّت من Safari، وتفتح عُروبة في نافذة مستقلة دون الحاجة إلى App Store.</p>
          <ol className={styles.steps}>
            <li>افتح <strong>arooba-hgz.vercel.app</strong> في Safari.</li>
            <li>اضغط زر <strong>المشاركة</strong> في Safari.</li>
            <li>اختر <strong>إضافة إلى الشاشة الرئيسية</strong>، ثم <strong>إضافة</strong>.</li>
          </ol>
          <p className={styles.note}>تحتاج القراءة والرسائل ومزامنة المكتبة إلى اتصال بالإنترنت. قد تختلف تسمية الأزرار قليلًا حسب إصدار iOS.</p>
        </section>
      </div>

      <div className={styles.bottomLink}>
        <span>تريد أن تبدأ القراءة قبل التثبيت؟</span>
        <Link href="/novels">استكشف الروايات ←</Link>
      </div>
    </main>
  );
}
