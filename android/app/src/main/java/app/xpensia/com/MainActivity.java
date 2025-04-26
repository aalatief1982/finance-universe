package app.xpensia.com;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import app.xpensia.com.plugins.smsreader.SmsReaderPlugin;
import java.util.ArrayList;

public class MainActivity extends BridgeActivity {

  @Override
  public void onCreate(android.os.Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    registerPlugin(SmsReaderPlugin.class);
  }
}
