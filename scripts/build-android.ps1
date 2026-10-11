$ErrorActionPreference = 'Stop'

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$androidRoot = Join-Path $projectRoot 'android'
$keyFile = Join-Path $androidRoot 'release-key.jks'
$passwordFile = Join-Path $env:LOCALAPPDATA 'Arooba\android-signing-password.dpapi'
$sdkRoot = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { Join-Path $env:USERPROFILE '.bubblewrap\android_sdk' }
$jdkRoot = if ($env:JAVA_HOME) { $env:JAVA_HOME } else { Join-Path $env:USERPROFILE '.bubblewrap\jdk' }

if (-not (Test-Path $keyFile)) { throw "Missing release signing key: $keyFile" }
if (-not (Test-Path $passwordFile)) { throw "Missing encrypted signing password: $passwordFile" }
if (-not (Test-Path (Join-Path $jdkRoot 'bin\java.exe'))) { throw "JDK is unavailable: $jdkRoot" }
if (-not (Test-Path (Join-Path $sdkRoot 'build-tools'))) { throw "Android SDK is unavailable: $sdkRoot" }

$securePassword = Get-Content -LiteralPath $passwordFile -Raw | ConvertTo-SecureString
$passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
try {
    $env:AROOBA_ANDROID_KEY_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
    $env:JAVA_HOME = $jdkRoot
    $env:ANDROID_HOME = $sdkRoot
    Push-Location $androidRoot
    try {
        & .\gradlew.bat --no-daemon assembleRelease
        if ($LASTEXITCODE -ne 0) { throw 'Android release build failed.' }
    } finally {
        Pop-Location
    }

    $apk = Join-Path $androidRoot 'app\build\outputs\apk\release\app-release.apk'
    if (-not (Test-Path $apk)) { throw "Release APK is missing: $apk" }
    $buildTools = Get-ChildItem (Join-Path $sdkRoot 'build-tools') -Directory | Sort-Object Name -Descending | Select-Object -First 1
    $apksigner = Join-Path $buildTools.FullName 'apksigner.bat'
    if (-not (Test-Path $apksigner)) { throw 'apksigner is unavailable.' }
    $verification = & $apksigner verify --print-certs $apk
    if ($LASTEXITCODE -ne 0) { throw 'APK signature verification failed.' }
    $actualFingerprint = (($verification | Select-String 'Signer #1 certificate SHA-256 digest: (.+)' | Select-Object -First 1).Matches.Groups[1].Value -replace ':', '').ToUpperInvariant()
    $assetLinks = Get-Content (Join-Path $projectRoot 'public\.well-known\assetlinks.json') -Raw | ConvertFrom-Json
    $expectedFingerprint = ($assetLinks[0].target.sha256_cert_fingerprints[0] -replace ':', '').ToUpperInvariant()
    if ($actualFingerprint -ne $expectedFingerprint) { throw 'APK signing certificate does not match assetlinks.json.' }

    $destination = Join-Path $projectRoot 'public\downloads\arooba-android.apk'
    New-Item -ItemType Directory -Path (Split-Path $destination) -Force | Out-Null
    Copy-Item -LiteralPath $apk -Destination $destination -Force
    $hash = Get-FileHash -LiteralPath $destination -Algorithm SHA256
    Write-Output "Signed APK: $destination"
    Write-Output "Size: $((Get-Item $destination).Length) bytes"
    Write-Output "SHA-256: $($hash.Hash)"
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
    Remove-Item Env:AROOBA_ANDROID_KEY_PASSWORD -ErrorAction SilentlyContinue
}
