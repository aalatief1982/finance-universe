package app.xpensia.com.plugins.backgroundsmslistener;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import android.content.Context;

import androidx.test.core.app.ApplicationProvider;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;
import org.robolectric.shadows.ShadowLog;

@RunWith(RobolectricTestRunner.class)
@Config(sdk = 32)
public class FinancialSmsClassifierTest {

    private Context context;

    @Before
    public void setUp() {
        context = ApplicationProvider.getApplicationContext();
        ShadowLog.clear();
    }

    @Test
    public void acceptsExistingCurrencyFormats() {
        assertTrue(FinancialSmsClassifier.isFinancialTransactionMessage(
                context,
                "Purchase alert: SAR 123 on 09/03/2026"
        ));

        assertTrue(FinancialSmsClassifier.isFinancialTransactionMessage(
                context,
                "Purchase alert: 123 SAR on 09/03/2026"
        ));

        assertTrue(FinancialSmsClassifier.isFinancialTransactionMessage(
                context,
                "مبلغ: 500 ريال في 09/03/2026"
        ));
    }

    @Test
    public void acceptsArabicPrepositionBeforeCurrencyCode() {
        assertTrue(FinancialSmsClassifier.isFinancialTransactionMessage(
                context,
                "شراء: بـSAR 656 في 09/03/2026"
        ));

        assertTrue(FinancialSmsClassifier.isFinancialTransactionMessage(
                context,
                "شراء: بSAR 656 في 09/03/2026"
        ));

        assertTrue(FinancialSmsClassifier.isFinancialTransactionMessage(
                context,
                "مبلغ بـSAR 656 في 09/03/2026"
        ));
    }

    @Test
    public void rejectsOtpLikeMessagesWithSimilarTokens() {
        assertFalse(FinancialSmsClassifier.isFinancialTransactionMessage(
                context,
                "OTP verification code: مبلغ بـSAR 656 on 09/03/2026"
        ));

        assertFalse(FinancialSmsClassifier.isFinancialTransactionMessage(
                context,
                "رمز التحقق: بSAR 656 في 09/03/2026"
        ));
    }

    @Test
    public void logsGate2AndNotificationPathForReproSms() {
        BackgroundSmsListenerPlugin.handleIncomingSms(
                context,
                "BANK",
                "مبلغ بـSAR 656 في 09/03/2026",
                "static_receiver",
                false
        );

        boolean gate2Passed = ShadowLog.getLogsForTag("FinancialClassifier").stream()
                .anyMatch(item -> item.msg.contains("Gate 2 passed: amount found"));

        boolean notificationAttempted = ShadowLog.getLogsForTag("STATIC_SMS_RECEIVER").stream()
                .anyMatch(item -> item.msg.contains("[XP_NOTIF] notification attempt count="));

        assertTrue("Expected FinancialClassifier Gate 2 pass log", gate2Passed);
        assertTrue("Expected XP_NOTIF notification attempt log", notificationAttempted);
    }
}
