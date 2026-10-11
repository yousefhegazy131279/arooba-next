# Arooba Android APK

This directory is the Bubblewrap 1.27.0 Trusted Web Activity for `https://arooba-hgz.vercel.app/`. The Android package ID is `com.hgz.arooba.mobile`. The first public APK used `com.hgz.arooba`; the ID changed after an Android 13 tablet rejected installation even after the user removed that version. Both IDs remain in `assetlinks.json`, but only the current ID is built here. The web content remains on the live site, so the app requires internet access.

The production signing key is `android/release-key.jks` and is ignored by Git. Its password is encrypted for the current Windows account at `%LOCALAPPDATA%\Arooba\android-signing-password.dpapi`. **Back up the key and its password securely.** The DPAPI password file works only for this Windows account, so it is not a portable password backup. Losing either the key or its password prevents signing future APK updates for the same Android package. Never commit either file or the decrypted password.

To place the password in your own password manager, run this locally under the same Windows account (it prints the password in that terminal only):

```powershell
$secret = Get-Content "$env:LOCALAPPDATA\Arooba\android-signing-password.dpapi" -Raw | ConvertTo-SecureString
[Net.NetworkCredential]::new('', $secret).Password
```

The GitHub Actions workflow `.github/workflows/android-apk.yml` builds an **unsigned** release APK. Download its `arooba-android-unsigned` artifact, then run `./scripts/sign-android-apk.ps1 -UnsignedApk <path>` on the configured Windows machine. The signing script uses the local key, verifies the APK signature and certificate against `public/.well-known/assetlinks.json`, and writes `public/downloads/arooba-android.apk`. It downloads the pinned `apksig` Java library and checks its SHA-256 hash. For a fully local build with JDK 17 and Android SDK 36 installed, `./scripts/build-android.ps1` also works.

For each update, increase `appVersionCode` and `appVersionName` in `twa-manifest.json` and the corresponding values in `app/build.gradle` before rebuilding. Keep the package ID and signing key unchanged. After changing TWA settings, regenerate the native project with Bubblewrap and reapply the signing configuration if its generated Gradle file is replaced.
