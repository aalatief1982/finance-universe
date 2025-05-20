
package app.xpensia.com;

import android.os.Bundle;
import android.util.Log;

import com.getcapacitor.BridgeActivity;
import com.xpensia.plugins.smsreader.SmsReaderPlugin;

public class MainActivity extends BridgeActivity {
  private static final String TAG = "XpensiaMainActivity";
  
  @Override
  public void onCreate(Bundle savedInstanceState) {
    Log.d(TAG, "MainActivity.onCreate() - START");
    super.onCreate(savedInstanceState);
    
    // Log for debugging
    Log.d(TAG, "MainActivity onCreate - Registering plugins");
    
    // Register our plugins
    try {
      registerPlugin(SmsReaderPlugin.class);
      Log.d(TAG, "SmsReaderPlugin registered");
    } catch (Exception e) {
      Log.e(TAG, "Error registering SmsReaderPlugin", e);
    }
    
    try {
      
      Log.d(TAG, "BackgroundSmsListenerPlugin registered");
    } catch (Exception e) {
      Log.e(TAG, "Error registering BackgroundSmsListenerPlugin", e);
    }
    
    Log.d(TAG, "MainActivity onCreate - Plugins registered");
    Log.d(TAG, "MainActivity.onCreate() - END");
  }
}
