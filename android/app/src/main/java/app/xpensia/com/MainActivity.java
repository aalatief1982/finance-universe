
package app.xpensia.com;

import android.os.Bundle;
import android.util.Log;

import com.getcapacitor.BridgeActivity;
import com.xpensia.plugins.smsreader.SmsReaderPlugin;
import app.xpensia.com.plugins.backgroundsmslistener.BackgroundSmsListenerPlugin;

public class MainActivity extends BridgeActivity {
  private static final String TAG = "XpensiaMainActivity";
  
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    
    // Log for debugging
    Log.d(TAG, "MainActivity onCreate - Registering plugins");
    
    // Register our plugins
    registerPlugin(SmsReaderPlugin.class);
    registerPlugin(BackgroundSmsListenerPlugin.class);
    
    Log.d(TAG, "MainActivity onCreate - Plugins registered");
  }
}
