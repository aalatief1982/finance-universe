
package app.xpensia.com;

import android.os.Bundle;
import android.util.Log;

import com.getcapacitor.BridgeActivity;





public class MainActivity extends BridgeActivity {
  private static final String TAG = "XpensiaMainActivity";





  @Override
  public void onCreate(Bundle savedInstanceState) {
    Log.d(TAG, "MainActivity.onCreate() - START");
    super.onCreate(savedInstanceState);
    
    // Log for debugging
    Log.d(TAG, "MainActivity onCreate - Registering plugins");
    
    // Capacitor plugin registration is handled automatically.

    Log.d(TAG, "MainActivity onCreate - Plugins registered");
    Log.d(TAG, "MainActivity.onCreate() - END");
  }
}
