package app.xpensia.com.plugins.backgroundsmslistener;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import java.text.Normalizer;
import java.util.regex.Pattern;

import org.json.JSONArray;

/**
 * Triple-gate financial SMS classifier aligned with the JS messageFilter.ts.
 * Gates: keyword match AND currency-amount match AND date match.
 * Also rejects OTP / verification-code messages before the gates.
 *
 * User-customised keywords are read from SharedPreferences
 * (synced from JS localStorage via Capacitor Preferences).
 */
final class FinancialSmsClassifier {
    private static final String TAG = "FinancialClassifier";
    private static final String CAP_PREFS = "CapacitorStorage";
    private static final String KEYWORDS_KEY = "xpensia_native_financial_keywords";

    // ── Fallback keywords (27, aligned with messageFilter.ts) ──────────────
    private static final String[] FALLBACK_KEYWORDS = {
            // Arabic
            "مبلغ", "حوالة", "رصيد", "بطاقة", "شراء", "تحويل", "دفع", "إيداع",
            "عملية", "مشتريات", "سحب", "استلام", "رسوم", "الرسوم", "خصم",
            "الرصيد", "مدفوعات",
            // English
            "transaction", "purchase", "debit", "debited", "credit", "credited",
            "withdrawal", "withdraw", "deposit", "deposited", "payment", "paid",
            "transfer", "transferred", "remittance", "charged", "balance", "fee", "fees",
    };

    // ── OTP / verification-code negative keywords ──────────────────────────
    private static final String[] OTP_KEYWORDS = {
            "otp", "verification code", "رمز التحقق", "رمز التفعيل",
            "one-time", "one time password", "passcode", "pin code",
            "security code", "auth code", "كلمة المرور", "رمز التأكيد",
    };

    // ── Amount regex (fixed: no \b, uses flexible boundary) ────────────────
    // Supports: SAR 1,234.56 | 1,234.56 SAR | بـSAR 4 | ب SAR 4 | مبلغ: 500 ر.س
    private static final Pattern AMOUNT_PATTERN = Pattern.compile(
            "(?i)" +
            "(?:" +
                // Branch 1: currency code then number (flexible left boundary)
                "(?:^|[^\\p{L}\\w])" +
                "(?:ب(?:ـ)?\\s*)?" +
                "(?:SAR|USD|EGP|AED|BHD|EUR|GBP|JPY|INR|CNY|CAD|AUD)" +
                "[\\s:]*" +
                "\\d{1,3}(?:,\\d{3})*(?:[.,]\\d{1,2})?" +
            "|" +
                // Branch 2: number then currency code
                "\\d{1,3}(?:,\\d{3})*(?:[.,]\\d{1,2})?" +
                "[\\s:]*" +
                "(?:SAR|USD|EGP|AED|BHD|EUR|GBP|JPY|INR|CNY|CAD|AUD)" +
                "(?:$|[^\\p{L}\\w])" +
            "|" +
                // Branch 3: number then Arabic currency symbols
                "\\d{1,3}(?:,\\d{3})*(?:[.,]\\d{1,2})?" +
                "[\\s:]*" +
                "(?:ر\\.?\\s?س|ريال|جنيه(?:\\s?مصري)?)" +
            "|" +
                // Branch 4: Arabic prefix (مبلغ) then optional currency then number
                "(?:مبلغ)[\\s:]*" +
                "(?:(?:SAR|USD|EGP|AED|BHD|EUR|GBP|ر\\.?\\s?س|ريال)[\\s:]*)?" +
                "\\d{1,3}(?:,\\d{3})*(?:[.,]\\d{1,2})?" +
            ")"
    );

    // ── Date regex (ported from messageFilter.ts) ──────────────────────────
    private static final Pattern DATE_PATTERN = Pattern.compile(
            "(?i)" +
            "(?:في[:\\s]*)?(?:on\\s*)?" +
            "(?:" +
                "\\d{1,2}[/\\-.](\\d{1,2})[/\\-.]\\d{1,4}" +          // DD/MM/YYYY or YY/M/D
            "|" +
                "\\d{4}[/\\-.]\\d{1,2}[/\\-.]\\d{1,2}" +              // YYYY-MM-DD
            "|" +
                "\\d{1,2}-(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-\\d{2,4}" +
            "|" +
                "\\d{1,2}\\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\\s+\\d{4}" +
            "|" +
                "(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\\s+\\d{1,2},?\\s+\\d{4}" +
            "|" +
                // Compact bank-style: 09MAR26, 09MAR2026, 09-Mar-26
                "\\d{2}[\\s-]?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\\s-]?\\d{2,4}" +
            "|" +
                "\\d{2}[01]\\d{3}" +                                    // YYDDD (julian)
            "|" +
                "\\d{8}" +                                               // YYYYMMDD
            ")" +
            "(?:\\s+\\d{1,2}:\\d{2}(?::\\d{2})?)?"                       // optional time
    );

    private FinancialSmsClassifier() {
    }

    /**
     * Triple-gate classifier: OTP rejection → keyword → amount → date.
     *
     * @param context Android context for reading SharedPreferences
     * @param body    SMS body text
     * @return true if the SMS looks like a financial transaction
     */
    static boolean isFinancialTransactionMessage(Context context, String body) {
        if (body == null || body.isEmpty()) {
            Log.d(TAG, "Rejected: null/empty body");
            return false;
        }

        // NFC normalization (aligned with JS)
        String normalized = Normalizer.normalize(body, Normalizer.Form.NFC)
                .replaceAll("\\s+", " ")
                .trim()
                .toLowerCase();

        // ── Gate 0: OTP exclusion ──────────────────────────────────────────
        for (String otp : OTP_KEYWORDS) {
            if (normalized.contains(otp.toLowerCase())) {
                Log.d(TAG, "Rejected: OTP keyword found [" + otp + "]");
                return false;
            }
        }

        // ── Load keywords (dynamic from SharedPreferences, fallback to hardcoded) ──
        String[] keywords = loadKeywords(context);

        // ── Gate 1: keyword match ──────────────────────────────────────────
        boolean keywordMatch = false;
        String matchedKeyword = null;
        for (String kw : keywords) {
            if (normalized.contains(kw.toLowerCase())) {
                keywordMatch = true;
                matchedKeyword = kw;
                break;
            }
        }
        if (!keywordMatch) {
            Log.d(TAG, "Rejected: no keyword match");
            return false;
        }
        Log.d(TAG, "Gate 1 passed: keyword [" + matchedKeyword + "]");

        // ── Gate 2: amount match ───────────────────────────────────────────
        boolean amountMatch = AMOUNT_PATTERN.matcher(body).find();
        if (!amountMatch) {
            Log.d(TAG, "Rejected: no amount match");
            return false;
        }
        Log.d(TAG, "Gate 2 passed: amount found");

        // ── Gate 3: date match ─────────────────────────────────────────────
        boolean dateMatch = DATE_PATTERN.matcher(body).find();
        if (!dateMatch) {
            Log.d(TAG, "Rejected: no date match");
            return false;
        }
        Log.d(TAG, "Gate 3 passed: date found → ACCEPTED as financial SMS");

        return true;
    }

    /**
     * Read user-customised keywords from Capacitor SharedPreferences.
     * Falls back to FALLBACK_KEYWORDS if nothing stored or parsing fails.
     */
    private static String[] loadKeywords(Context context) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(CAP_PREFS, Context.MODE_PRIVATE);
            String raw = prefs.getString(KEYWORDS_KEY, null);
            if (raw != null && !raw.isEmpty()) {
                JSONArray arr = new JSONArray(raw);
                if (arr.length() > 0) {
                    String[] result = new String[arr.length()];
                    for (int i = 0; i < arr.length(); i++) {
                        result[i] = arr.optString(i, "");
                    }
                    Log.d(TAG, "Loaded " + result.length + " keywords from SharedPreferences");
                    return result;
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "Failed to load keywords from SharedPreferences, using fallback", e);
        }
        return FALLBACK_KEYWORDS;
    }
}
