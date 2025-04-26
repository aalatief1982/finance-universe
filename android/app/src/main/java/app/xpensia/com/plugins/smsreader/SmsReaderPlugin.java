
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
import com.getcapacitor.PermissionState;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

@CapacitorPlugin(
    name = "SmsReaderPlugin",
    permissions = {
        @Permission(
            alias = "sms",
            strings = { Manifest.permission.READ_SMS }
        )
    }
)
public class SmsReaderPlugin extends Plugin {

    private static final String TAG = "SmsReaderPlugin";

    @PluginMethod
    public void checkPermission(PluginCall call) {
        boolean granted = ActivityCompat.checkSelfPermission(getContext(), Manifest.permission.READ_SMS) == PackageManager.PERMISSION_GRANTED;
        JSObject ret = new JSObject();
        ret.put("granted", granted);
        call.resolve(ret);
        Log.d(TAG, "checkPermission called. Granted: " + granted);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        Log.d(TAG, "requestPermission called");
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
        Log.d(TAG, "smsPermsCallback called. Permission granted: " + granted);
    }

    @PluginMethod
    public void readSmsMessages(PluginCall call) {
        try {
            String startDate = call.getString("startDate");
            String endDate = call.getString("endDate");
            Integer limit = call.getInt("limit", 100);
            JSArray senders = call.getArray("senders");

            StringBuilder selection = new StringBuilder();
            java.util.ArrayList<String> selectionArgs = new java.util.ArrayList<>();

            if (senders != null && senders.length() > 0) {
                selection.append("(");
                for (int i = 0; i < senders.length(); i++) {
                    if (i > 0) selection.append(" OR ");
                    selection.append("address LIKE ?");
                    selectionArgs.add("%" + senders.getString(i) + "%");
                }
                selection.append(")");
            }

            Uri uri = Uri.parse("content://sms/inbox");
            String sortOrder = "date DESC" + (limit != null ? " LIMIT " + limit : "");

            Cursor cursor = getContext().getContentResolver().query(
                uri,
                null,
                selection.length() > 0 ? selection.toString() : null,
                selectionArgs.size() > 0 ? selectionArgs.toArray(new String[0]) : null,
                sortOrder
            );

            JSONArray messages = new JSONArray();
            if (cursor != null) {
                while (cursor.moveToNext()) {
                    JSObject msg = new JSObject();
                    msg.put("sender", cursor.getString(cursor.getColumnIndexOrThrow("address")));
                    msg.put("message", cursor.getString(cursor.getColumnIndexOrThrow("body")));
                    msg.put("date", new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
                            .format(new Date(cursor.getLong(cursor.getColumnIndexOrThrow("date")))));
                    messages.put(msg);
                }
                cursor.close();
            }

            JSObject result = new JSObject();
            result.put("messages", messages);
            call.resolve(result);
            Log.d(TAG, "Successfully read " + messages.length() + " messages");
        } catch (Exception e) {
            Log.e(TAG, "Error reading SMS", e);
            call.reject("Failed to read SMS: " + e.getMessage(), e);
        }
    }
}
