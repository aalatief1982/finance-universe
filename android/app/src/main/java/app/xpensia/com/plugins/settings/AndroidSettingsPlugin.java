package app.xpensia.com.plugins.settings;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.annotation.NonNull;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AndroidSettings")
public class AndroidSettingsPlugin extends Plugin {

  @PluginMethod
  public void openNotificationSettings(PluginCall call) {
    try {
      Intent notificationIntent = buildNotificationSettingsIntent(getContext().getPackageName());
      getActivity().startActivity(notificationIntent);
      call.resolve();
    } catch (ActivityNotFoundException e) {
      try {
        Intent appDetailsIntent = buildAppDetailsIntent(getContext().getPackageName());
        getActivity().startActivity(appDetailsIntent);
        call.resolve();
      } catch (Exception fallbackError) {
        call.reject("Unable to open notification settings", fallbackError);
      }
    } catch (Exception e) {
      call.reject("Unable to open notification settings", e);
    }
  }

  @PluginMethod
  public void openAppDetailsSettings(PluginCall call) {
    try {
      Intent appDetailsIntent = buildAppDetailsIntent(getContext().getPackageName());
      getActivity().startActivity(appDetailsIntent);
      call.resolve(new JSObject());
    } catch (Exception e) {
      call.reject("Unable to open app details settings", e);
    }
  }

  @NonNull
  private Intent buildNotificationSettingsIntent(String packageName) {
    Intent intent = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
    intent.putExtra(Settings.EXTRA_APP_PACKAGE, packageName);

    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      intent.putExtra("app_package", packageName);
      intent.putExtra("app_uid", getContext().getApplicationInfo().uid);
    }

    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    return intent;
  }

  @NonNull
  private Intent buildAppDetailsIntent(String packageName) {
    Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
    intent.setData(Uri.parse("package:" + packageName));
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    return intent;
  }
}
