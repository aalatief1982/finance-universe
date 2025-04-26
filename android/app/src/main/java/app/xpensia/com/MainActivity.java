
package app.xpensia.com;

import com.getcapacitor.BridgeActivity;
import com.xpensia.plugins.smsreader.SmsReaderPlugin;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(android.os.Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    // Register our SmsReaderPlugin
    registerPlugin(SmsReaderPlugin.class);
  }
}
