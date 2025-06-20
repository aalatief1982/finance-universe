package app.xpensia.com.plugins.backgroundsmslistener;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.provider.Telephony;
import android.telephony.SmsMessage;
import android.util.Log;
import app.xpensia.com.plugins.backgroundsmslistener.BackgroundSmsListenerPlugin;

import androidx.core.content.ContextCompat;

public class SmsBroadcastReceiver extends BroadcastReceiver {
    private static final String TAG = "STATIC_SMS_RECEIVER";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (Telephony.Sms.Intents.SMS_RECEIVED_ACTION.equals(intent.getAction())) {
            if (BackgroundSmsListenerPlugin.isPluginActive()) {
                Log.d(TAG, "Plugin active, ignoring static receiver event");
                return;
            }

            SmsMessage[] messages = null;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                messages = Telephony.Sms.Intents.getMessagesFromIntent(intent);
            } else {
                Object[] pdus = (Object[]) intent.getExtras().get("pdus");
                if (pdus != null) {
                    messages = new SmsMessage[pdus.length];
                    for (int i = 0; i < pdus.length; i++) {
                        messages[i] = SmsMessage.createFromPdu((byte[]) pdus[i]);
                    }
                }
            }

            if (messages != null && messages.length > 0) {
                StringBuilder bodyBuilder = new StringBuilder();
                String sender = messages[0].getOriginatingAddress();

                for (SmsMessage message : messages) {
                    bodyBuilder.append(message.getMessageBody());
                }
                String body = bodyBuilder.toString();

                Log.d(TAG, "SMS received from " + sender + ": " + body);
                try {
                    BackgroundSmsListenerPlugin.persistMessage(context, sender, body);
                } catch (Exception e) {
                    Log.e(TAG, "Failed to store SMS", e);
                }

                Intent serviceIntent = new Intent(context, SmsProcessingService.class);
                serviceIntent.putExtra("sender", sender);
                serviceIntent.putExtra("body", body);

                ContextCompat.startForegroundService(context, serviceIntent);
            }
        }
    }
}
