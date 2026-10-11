import com.android.apksig.ApkSigner;
import com.android.apksig.ApkVerifier;
import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.security.KeyStore;
import java.security.MessageDigest;
import java.security.PrivateKey;
import java.security.cert.X509Certificate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public final class SignApk {
    public static void main(String[] args) throws Exception {
        if (args.length != 3) {
            throw new IllegalArgumentException("Expected unsigned APK, signed APK, and PKCS12 key path");
        }
        char[] password = new BufferedReader(new InputStreamReader(System.in)).readLine().toCharArray();
        try {
            KeyStore keyStore = KeyStore.getInstance("PKCS12");
            try (java.io.FileInputStream stream = new java.io.FileInputStream(args[2])) {
                keyStore.load(stream, password);
            }
            PrivateKey key = (PrivateKey) keyStore.getKey("arooba", password);
            X509Certificate certificate = (X509Certificate) keyStore.getCertificate("arooba");
            if (key == null || certificate == null) {
                throw new IllegalStateException("Arooba signing key is unavailable");
            }
            List<X509Certificate> certificates = new ArrayList<>();
            certificates.add(certificate);
            ApkSigner.SignerConfig signer = new ApkSigner.SignerConfig.Builder("arooba", key, certificates).build();
            new ApkSigner.Builder(Arrays.asList(signer))
                .setInputApk(new File(args[0]))
                .setOutputApk(new File(args[1]))
                .setMinSdkVersion(24)
                .setV1SigningEnabled(true)
                .setV2SigningEnabled(true)
                .setV3SigningEnabled(true)
                .build()
                .sign();

            ApkVerifier.Result verified = new ApkVerifier.Builder(new File(args[1]))
                .setMinCheckedPlatformVersion(24)
                .build()
                .verify();
            if (!verified.isVerified() || !verified.isVerifiedUsingV2Scheme()) {
                throw new IllegalStateException("APK signature verification failed: " + verified.getErrors());
            }
            byte[] fingerprint = MessageDigest.getInstance("SHA-256").digest(certificate.getEncoded());
            StringBuilder hex = new StringBuilder();
            for (byte b : fingerprint) hex.append(String.format("%02X", b & 0xff));
            System.out.println("verified=true v1=" + verified.isVerifiedUsingV1Scheme()
                + " v2=" + verified.isVerifiedUsingV2Scheme()
                + " v3=" + verified.isVerifiedUsingV3Scheme());
            System.out.println("certSHA256=" + hex);
        } finally {
            Arrays.fill(password, '\0');
        }
    }
}
