package app.xpensia.com;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

import com.getcapacitor.BridgeActivity;
import com.xpensia.plugins.smsreader.SmsReaderPlugin;

import app.xpensia.com.plugins.backgroundsmslistener.BackgroundSmsListenerPlugin;
import app.xpensia.com.plugins.settings.AndroidSettingsPlugin;

public class MainActivity extends BridgeActivity {
  private static final String TAG = "XpensiaMainActivity";

  @Override
  public void onCreate(Bundle savedInstanceState) {
    Log.d(TAG, "MainActivity.onCreate() - START");
    super.onCreate(savedInstanceState);

    try {
      registerPlugin(SmsReaderPlugin.class);
      Log.d(TAG, "SmsReaderPlugin registered");
    } catch (Exception e) {
      Log.e(TAG, "Error registering SmsReaderPlugin", e);
    }

    try {
      registerPlugin(BackgroundSmsListenerPlugin.class);
      Log.d(TAG, "BackgroundSmsListenerPlugin registered");
    } catch (Exception e) {
      Log.e(TAG, "Error registering BackgroundSmsListenerPlugin", e);
    }

    try {
      registerPlugin(AndroidSettingsPlugin.class);
      Log.d(TAG, "AndroidSettingsPlugin registered");
    } catch (Exception e) {
      Log.e(TAG, "Error registering AndroidSettingsPlugin", e);
    }

    handleRouteIntent(getIntent());
    Log.d(TAG, "MainActivity.onCreate() - END");
  }

  @Override
  protected void onNewIntent(Intent intent) {
    super.onNewIntent(intent);
    setIntent(intent);
    handleRouteIntent(intent);
  }

  private void handleRouteIntent(Intent intent) {
    if (intent == null) {
      return;
    }

    String route = intent.getStringExtra("xpensia_open_route");
    String source = intent.getStringExtra("xpensia_open_source");
    if (route == null || route.isEmpty()) {
      return;
    }

    BackgroundSmsListenerPlugin.setPendingOpenRoute(this, route, source != null ? source : "unknown");
    Log.d(TAG, "Stored pending route=" + route + " source=" + source);
    intent.removeExtra("xpensia_open_route");
    intent.removeExtra("xpensia_open_source");
  }
}
