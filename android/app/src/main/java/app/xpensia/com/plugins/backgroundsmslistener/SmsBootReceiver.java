package app.xpensia.com.plugins.backgroundsmslistener;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

public class SmsBootReceiver extends BroadcastReceiver {
    private static final String TAG = "STATIC_SMS_RECEIVER";

    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d(TAG, "BOOT_COMPLETED received");
        // No action required, messages will be delivered when plugin loads
    }
}
