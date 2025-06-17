package app.xpensia.com.plugins.backgroundsmslistener;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import com.getcapacitor.JSObject;

public class SmsProcessingService extends Service {
    private static final String TAG = "SmsProcessingService";
    private static final String CHANNEL_ID = "SmsProcessingChannel";
    private static final int NOTIFICATION_ID = 1;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("SMS Listener")
            .setContentText("Processing incoming SMS")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .build();
        startForeground(NOTIFICATION_ID, notification);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String sender = intent.getStringExtra("sender");
        String body = intent.getStringExtra("body");

        if (sender != null && body != null) {
            Log.d(TAG, "Processing SMS from " + sender + ": " + body);
            BackgroundSmsListenerPlugin.notifySmsReceived(sender, body);
        }

        return START_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "SmsProcessingService destroyed");
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "SMS Processing",
                NotificationManager.IMPORTANCE_LOW
            );
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }
}
