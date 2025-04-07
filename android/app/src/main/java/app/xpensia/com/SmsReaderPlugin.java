
package app.xpensia.com;

import android.Manifest;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.provider.Telephony;
import android.util.Log;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

import org.json.JSONException;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

@CapacitorPlugin(
    name = "SmsReader",
    permissions = {
        @Permission(
            strings = { Manifest.permission.READ_SMS },
            alias = "read_sms"
        )
    }
)
public class SmsReaderPlugin extends Plugin {
    private static final String TAG = "SmsReaderPlugin";
    
    // Method to read SMS messages
    @PluginMethod
    public void readSms(PluginCall call) {
        // Check if we have permission
        if (!hasRequiredPermissions()) {
            call.reject("Permission to read SMS is not granted");
            return;
        }
        
        try {
            String startDateStr = call.getString("startDate");
            long startDateMillis = 0;
            
            if (startDateStr != null && !startDateStr.isEmpty()) {
                try {
                    SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
                    Date startDate = format.parse(startDateStr);
                    if (startDate != null) {
                        startDateMillis = startDate.getTime();
                    }
                } catch (ParseException e) {
                    Log.e(TAG, "Error parsing start date", e);
                }
            }
            
            JSArray messagesArray = new JSArray();
            
            // Set up the SMS URI
            Uri uri = Uri.parse("content://sms/inbox");
            
            // Define the columns we want to retrieve
            String[] projection = new String[] {
                Telephony.Sms._ID,
                Telephony.Sms.ADDRESS,
                Telephony.Sms.BODY,
                Telephony.Sms.DATE
            };
            
            // Set up selection criteria if we have a start date
            String selection = null;
            String[] selectionArgs = null;
            
            if (startDateMillis > 0) {
                selection = Telephony.Sms.DATE + " >= ?";
                selectionArgs = new String[] { String.valueOf(startDateMillis) };
            }
            
            // Define the sort order (newest first)
            String sortOrder = Telephony.Sms.DATE + " DESC";
            
            // Query the SMS content provider
            Cursor cursor = getContext().getContentResolver().query(
                uri,
                projection,
                selection,
                selectionArgs,
                sortOrder
            );
            
            if (cursor != null && cursor.moveToFirst()) {
                do {
                    // Get message details
                    String address = cursor.getString(cursor.getColumnIndexOrThrow(Telephony.Sms.ADDRESS));
                    String body = cursor.getString(cursor.getColumnIndexOrThrow(Telephony.Sms.BODY));
                    long timestamp = cursor.getLong(cursor.getColumnIndexOrThrow(Telephony.Sms.DATE));
                    
                    // Create a JSON object for this message
                    JSObject message = new JSObject();
                    message.put("address", address);
                    message.put("body", body);
                    message.put("timestamp", new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).format(new Date(timestamp)));
                    
                    // Add to our array
                    messagesArray.put(message);
                } while (cursor.moveToNext());
                
                cursor.close();
            }
            
            // Return the messages
            JSObject result = new JSObject();
            result.put("messages", messagesArray);
            call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "Error reading SMS", e);
            call.reject("Error reading SMS: " + e.getMessage(), e);
        }
    }
}
