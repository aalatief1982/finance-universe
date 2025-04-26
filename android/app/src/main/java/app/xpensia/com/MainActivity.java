package app.xpensia.com;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;

import java.util.ArrayList;

import app.xpensia.com.plugins.smsreader.SmsReaderPlugin; // ✅ Import your plugin manually

public class MainActivity extends BridgeActivity {

  @Override
  public void onCreate(android.os.Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    // ✅ Manually register your custom plugin
    registerPlugin(SmsReaderPlugin.class);
  }
}
