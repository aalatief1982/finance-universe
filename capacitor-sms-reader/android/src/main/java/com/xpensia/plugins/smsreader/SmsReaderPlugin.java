package app.xpensia.com.plugins.smsreader;

import android.Manifest;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.util.Log;

import androidx.core.app.ActivityCompat;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.JSObject;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.PermissionState;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.PermissionCallback;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

@CapacitorPlugin(
  name = "SmsReaderPlugin",
  permissions = {
    @com.getcapacitor.annotation.Permission(
      alias = "sms",
      strings = { Manifest.permission.READ_SMS }
    )
  }
)
public class SmsReaderPlugin extends Plugin {

    @PluginMethod
    public void checkPermission(PluginCall call) {
        boolean granted = ActivityCompat.checkSelfPermission(getContext(), Manifest.permission.READ_SMS) == PackageManager.PERMISSION_GRANTED;
        JSObject ret = new JSObject();
        ret.put("granted", granted);
        call.resolve(ret);
        Log.d("SmsReaderPlugin", "checkPermission called. Granted: " + granted);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        Log.d("SmsReaderPlugin", "requestPermission called");
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            requestPermissionForAlias("sms", call, "smsPermsCallback");
        } else {
            JSObject ret = new JSObject();
            ret.put("granted", true);
            call.resolve(ret);
        }
    }

    @PermissionCallback
    private void smsPermsCallback(PluginCall call) {
        boolean granted = getPermissionState("sms") == PermissionState.GRANTED;
        JSObject ret = new JSObject();
        ret.put("granted", granted);
        call.resolve(ret);
        Log.d("SmsReaderPlugin", "smsPermsCallback called. Permission granted: " + granted);
    }

    @PluginMethod
    public void readSmsMessages(PluginCall call) {
        try {
            JSONArray messages = new JSONArray();
            Uri uri = Uri.parse("content://sms/inbox");

            // Options parsing (optional if you want to enhance)
            JSONArray senders = call.getArray("senders");
            Integer limit = call.getInt("limit");

            Cursor cursor = getContext().getContentResolver().query(uri, null, null, null, "date DESC");

            if (cursor != null) {
                int count = 0;
                while (cursor.moveToNext()) {
                    if (limit != null && count >= limit) break;
                    String sender = cursor.getString(cursor.getColumnIndexOrThrow("address"));

                    if (senders != null) {
                        boolean matched = false;
                        for (int i = 0; i < senders.length(); i++) {
                            if (sender != null && sender.contains(senders.getString(i))) {
                                matched = true;
                                break;
                            }
                        }
                        if (!matched) continue;
                    }

                    JSObject msg = new JSObject();
                    msg.put("sender", sender);
                    msg.put("message", cursor.getString(cursor.getColumnIndexOrThrow("body")));
                    msg.put("date", new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
                            .format(new Date(cursor.getLong(cursor.getColumnIndexOrThrow("date")))));
                    messages.put(msg);
                    count++;
                }
                cursor.close();
            }

            JSObject result = new JSObject();
            result.put("messages", messages);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Failed to read SMS", e);
        }
    }
}
