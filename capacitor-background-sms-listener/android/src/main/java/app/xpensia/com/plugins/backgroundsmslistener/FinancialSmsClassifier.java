package app.xpensia.com.plugins.backgroundsmslistener;

import java.util.regex.Pattern;

final class FinancialSmsClassifier {
    private static final String[] FINANCIAL_KEYWORDS = {
            "مبلغ", "حوالة", "رصيد", "بطاقة", "شراء", "تحويل", "دفع", "إيداع",
            "transaction", "purchase", "debit", "credit", "withdraw", "deposit", "payment"
    };

    private static final Pattern AMOUNT_PATTERN = Pattern.compile(
            "(?i)(?:\\b(?:sar|usd|egp|aed|bhd|eur|gbp|jpy|inr|cny|cad|aud)\\b\\s*\\d+(?:[.,]\\d{1,2})?|\\d+(?:[.,]\\d{1,2})?\\s*\\b(?:sar|usd|egp|aed|bhd|eur|gbp|jpy|inr|cny|cad|aud)\\b|\\d{1,3}(?:,\\d{3})*(?:[.,]\\d{1,2})?\\s*(?:ر\\.?\\s?س|ريال|جنيه))"
    );

    private FinancialSmsClassifier() {
    }

    static boolean isFinancialTransactionMessage(String body) {
        if (body == null) {
            return false;
        }

        String normalized = body.toLowerCase();
        boolean keywordMatch = false;
        for (String keyword : FINANCIAL_KEYWORDS) {
            if (normalized.contains(keyword.toLowerCase())) {
                keywordMatch = true;
                break;
            }
        }

        if (!keywordMatch) {
            return false;
        }

        return AMOUNT_PATTERN.matcher(body).find();
    }
}
