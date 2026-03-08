package app.xpensia.com;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

import com.getcapacitor.BridgeActivity;
import com.xpensia.plugins.smsreader.SmsReaderPlugin;

import app.xpensia.com.plugins.backgroundsmslistener.BackgroundSmsListenerPlugin;
import app.xpensia.com.plugins.sharetarget.ShareTargetPlugin;
import app.xpensia.com.plugins.settings.AndroidSettingsPlugin;
import app.xpensia.com.plugins.speechtotext.SpeechToTextPlugin;

public class MainActivity extends BridgeActivity {
  private static final String TAG = "XpensiaMainActivity";

  @Override
  public void onCreate(Bundle savedInstanceState) {
    Log.d(TAG, "MainActivity.onCreate() - START");

    // Register plugins BEFORE super.onCreate() so the Capacitor bridge discovers them
    registerPlugin(SmsReaderPlugin.class);
    registerPlugin(BackgroundSmsListenerPlugin.class);
    registerPlugin(AndroidSettingsPlugin.class);
    registerPlugin(ShareTargetPlugin.class);
    Log.d(TAG, "All plugins registered");

    // Handle any launch intent payload before Capacitor bridge boot so JS can reliably
    // consume pending data even on cold start.
    handleRouteIntent(getIntent());
    handleShareIntent(getIntent());

    super.onCreate(savedInstanceState);

    Log.d(TAG, "MainActivity.onCreate() - END");
  }

  @Override
  protected void onNewIntent(Intent intent) {
    super.onNewIntent(intent);
    setIntent(intent);
    handleRouteIntent(intent);
    handleShareIntent(intent);
  }

  private void handleRouteIntent(Intent intent) {
    if (intent == null) {
      return;
    }

    String route = intent.getStringExtra("xpensia_open_route");
    String source = intent.getStringExtra("xpensia_open_source");
    Log.d(TAG, "[SMS_NOTIFICATION_FLOW][NATIVE] handleRouteIntent extras route=" + route + " source=" + source);
    if (route == null || route.isEmpty()) {
      Log.d(TAG, "[SMS_NOTIFICATION_FLOW][NATIVE] no pending route extras found");
      return;
    }

    String resolvedSource = source != null ? source : "unknown";
    BackgroundSmsListenerPlugin.setPendingOpenRoute(this, route, resolvedSource);
    Log.d(TAG, "[SMS_NOTIFICATION_FLOW][NATIVE] Stored pending route=" + route + " source=" + resolvedSource);
    intent.removeExtra("xpensia_open_route");
    intent.removeExtra("xpensia_open_source");
  }

  private void handleShareIntent(Intent intent) {
    if (intent == null) {
      Log.d(TAG, "[SHARE_FLOW][NATIVE] handleShareIntent skipped: intent is null");
      return;
    }

    String action = intent.getAction();
    String type = intent.getType();
    Log.d(TAG, "[SHARE_FLOW][NATIVE] handleShareIntent received action=" + action + " type=" + type);
    if (!Intent.ACTION_SEND.equals(action) || type == null || !"text/plain".equals(type)) {
      Log.d(TAG, "[SHARE_FLOW][NATIVE] handleShareIntent ignored action=" + action + " type=" + type);
      return;
    }

    String sharedText = intent.getStringExtra(Intent.EXTRA_TEXT);
    if (sharedText == null || sharedText.trim().isEmpty()) {
      Log.d(TAG, "[SHARE_FLOW][NATIVE] handleShareIntent ignored: empty EXTRA_TEXT");
      return;
    }

    ShareTargetPlugin.setPendingSharedText(this, sharedText, "android_share_sheet");
    Log.d(TAG, "[SHARE_FLOW][NATIVE] Stored pending shared text from Android share sheet. length=" + sharedText.trim().length());
    intent.removeExtra(Intent.EXTRA_TEXT);
  }
}
