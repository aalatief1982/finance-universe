package app.xpensia.com.plugins.backgroundsmslistener;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.provider.Telephony;
import android.telephony.SmsMessage;
import android.util.Log;

import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;

public class SmsBroadcastReceiver extends BroadcastReceiver {
    private static final String TAG = "STATIC_SMS_RECEIVER";
    private static final String CHANNEL_ID = "xpensia_sms_inbox";
    private static final int INBOX_NOTIFICATION_ID = 41001;

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || !Telephony.Sms.Intents.SMS_RECEIVED_ACTION.equals(intent.getAction())) {
            Log.d(TAG, "Ignored intent action=" + (intent != null ? intent.getAction() : "null"));
            return;
        }

        if (BackgroundSmsListenerPlugin.isPluginActive()) {
            Log.d(TAG, "Plugin active, ignoring static receiver event");
            return;
        }

        SmsMessage[] messages = Telephony.Sms.Intents.getMessagesFromIntent(intent);
        if (messages == null || messages.length == 0) {
            Log.d(TAG, "SMS intent had no PDUs");
            return;
        }

        StringBuilder bodyBuilder = new StringBuilder();
        String sender = messages[0].getOriginatingAddress();
        for (SmsMessage message : messages) {
            bodyBuilder.append(message.getMessageBody());
        }
        String body = bodyBuilder.toString();
        long receivedAt = System.currentTimeMillis();
        String hash = buildHash(sender, body);

        int queueSize = BackgroundSmsListenerPlugin.persistMessage(
                context,
                sender != null ? sender : "",
                body,
                receivedAt,
                "static_receiver",
                hash);

        Log.d(TAG, "Persisted SMS hash=" + hash + " queueSize=" + queueSize);
        postOrUpdateSummaryNotification(context, queueSize);
    }

    private String buildHash(String sender, String body) {
        String normalizedSender = sender == null ? "" : sender.trim().replaceAll("\\s+", "").toLowerCase();
        String normalizedBody = body == null ? "" : body.trim().replaceAll("\\s+", " ").toLowerCase();
        String base = normalizedSender + "|" + normalizedBody + "|" + normalizedBody.length();
        return Integer.toHexString(base.hashCode());
    }

    private void postOrUpdateSummaryNotification(Context context, int messageCount) {
        if (messageCount <= 0) {
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
                && ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) {
            Log.d(TAG, "POST_NOTIFICATIONS not granted, skipping notification");
            return;
        }

        NotificationManager notificationManager =
                (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (notificationManager == null) {
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "SMS Inbox Alerts",
                    NotificationManager.IMPORTANCE_DEFAULT);
            channel.setDescription("Alerts for new SMS waiting in Xpensia inbox review");
            notificationManager.createNotificationChannel(channel);
        }

        PackageManager pm = context.getPackageManager();
        Intent openIntent = pm.getLaunchIntentForPackage(context.getPackageName());
        if (openIntent == null) {
            openIntent = new Intent(Intent.ACTION_MAIN)
                    .addCategory(Intent.CATEGORY_LAUNCHER)
                    .setPackage(context.getPackageName());
        }
        openIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        openIntent.putExtra("xpensia_open_route", "/import-transactions");
        openIntent.putExtra("xpensia_open_source", "sms_notification");

        PendingIntent pendingIntent = PendingIntent.getActivity(
                context,
                1001,
                openIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.stat_notify_more)
                .setContentTitle("Xpensia")
                .setContentText("You have " + messageCount + " new SMS to review")
                .setAutoCancel(true)
                .setContentIntent(pendingIntent)
                .setOnlyAlertOnce(true)
                .setPriority(NotificationCompat.PRIORITY_DEFAULT);

        notificationManager.notify(INBOX_NOTIFICATION_ID, builder.build());
        Log.d(TAG, "Posted/updated SMS summary notification count=" + messageCount);
    }
}
