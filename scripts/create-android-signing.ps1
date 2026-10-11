$ErrorActionPreference = 'Stop'

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$keyFile = Join-Path $projectRoot 'android\release-key.jks'
$privateDirectory = Join-Path $env:LOCALAPPDATA 'Arooba'
$passwordFile = Join-Path $privateDirectory 'android-signing-password.dpapi'
$keytool = 'C:\Program Files\Java\jdk1.8.0_351\bin\keytool.exe'

if (Test-Path $keyFile) { throw "Signing key already exists: $keyFile" }
if (Test-Path $passwordFile) { throw "Signing password already exists: $passwordFile" }
if (-not (Test-Path $keytool)) { throw 'JDK keytool is unavailable.' }

New-Item -ItemType Directory -Path $privateDirectory -Force | Out-Null
$password = [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
try {
    & $keytool -genkeypair -noprompt -alias arooba -keyalg RSA -keysize 3072 -validity 10000 -storetype PKCS12 -keystore $keyFile -storepass $password -keypass $password -dname 'CN=Yousef Hegazy, OU=Arooba, O=HGZ, C=EG' | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'keytool failed to create the signing key.' }
    ConvertTo-SecureString $password -AsPlainText -Force | ConvertFrom-SecureString | Set-Content -LiteralPath $passwordFile -NoNewline
    $details = & $keytool -list -v -keystore $keyFile -storepass $password -alias arooba
    if ($LASTEXITCODE -ne 0) { throw 'Unable to inspect the signing key.' }
    $fingerprint = ($details | Select-String 'SHA256: (.+)' | Select-Object -First 1).Matches.Groups[1].Value.Trim()
    Write-Output "Signing key: $keyFile"
    Write-Output "Encrypted password: $passwordFile"
    Write-Output "SHA-256 certificate fingerprint: $fingerprint"
} finally {
    $password = $null
}
