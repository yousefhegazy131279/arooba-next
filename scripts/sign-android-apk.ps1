param([Parameter(Mandatory = $true)][string]$UnsignedApk)
$ErrorActionPreference = 'Stop'

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$keyFile = Join-Path $projectRoot 'android\release-key.jks'
$passwordFile = Join-Path $env:LOCALAPPDATA 'Arooba\android-signing-password.dpapi'
$javaRoot = 'C:\Program Files\Java\jdk1.8.0_351\bin'
$cacheDirectory = Join-Path $env:LOCALAPPDATA 'Arooba\tools'
$apksigJar = Join-Path $cacheDirectory 'apksig-8.9.1.jar'
$apksigHash = 'C070ED1394629D74641AA0906F60B2FFA1EE77E6366A1F93437F59717B1AEB89'
$classesDirectory = Join-Path $cacheDirectory 'classes'
$signedApk = Join-Path $projectRoot 'public\downloads\arooba-android-v2.apk'

if (-not (Test-Path $UnsignedApk)) { throw "Unsigned APK is missing: $UnsignedApk" }
if (-not (Test-Path $keyFile)) { throw "Signing key is missing: $keyFile" }
if (-not (Test-Path $passwordFile)) { throw "Signing password is missing: $passwordFile" }
New-Item -ItemType Directory -Path $cacheDirectory, $classesDirectory, (Split-Path $signedApk) -Force | Out-Null
if (-not (Test-Path $apksigJar)) {
    Invoke-WebRequest 'https://dl.google.com/dl/android/maven2/com/android/tools/build/apksig/8.9.1/apksig-8.9.1.jar' -OutFile $apksigJar
}
if ((Get-FileHash $apksigJar -Algorithm SHA256).Hash -ne $apksigHash) { throw 'apksig JAR checksum mismatch.' }

& (Join-Path $javaRoot 'javac.exe') -cp $apksigJar -d $classesDirectory (Join-Path $PSScriptRoot 'SignApk.java')
if ($LASTEXITCODE -ne 0) { throw 'Could not compile the APK signing helper.' }

$securePassword = Get-Content -LiteralPath $passwordFile -Raw | ConvertTo-SecureString
$passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
try {
    $password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
    $signingOutput = $password | & (Join-Path $javaRoot 'java.exe') -cp "$classesDirectory;$apksigJar" SignApk (Resolve-Path $UnsignedApk) $signedApk $keyFile
    if ($LASTEXITCODE -ne 0) { throw 'APK signing failed.' }
    $actual = (($signingOutput | Select-String '^certSHA256=(.+)$' | Select-Object -First 1).Matches.Groups[1].Value).ToUpperInvariant()
    $links = Get-Content (Join-Path $projectRoot 'public\.well-known\assetlinks.json') -Raw | ConvertFrom-Json
    $expected = ($links[0].target.sha256_cert_fingerprints[0] -replace ':', '').ToUpperInvariant()
    if ($actual -ne $expected) { throw 'APK certificate does not match the website assetlinks.json.' }
    $signingOutput | Where-Object { $_ -match '^verified=' }
    Write-Output "Signed APK: $signedApk"
    Write-Output "SHA-256: $((Get-FileHash $signedApk -Algorithm SHA256).Hash)"
    Write-Output "Size: $((Get-Item $signedApk).Length) bytes"
} finally {
    $password = $null
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
}
