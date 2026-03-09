package app.xpensia.com.plugins.speechtotext;

import android.Manifest;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

import java.util.ArrayList;
import java.util.Locale;

@CapacitorPlugin(
    name = "SpeechToText",
    permissions = {
        @Permission(strings = { Manifest.permission.RECORD_AUDIO }, alias = "microphone")
    }
)
public class SpeechToTextPlugin extends Plugin {

    private static final String TAG = "SpeechToTextPlugin";
    private SpeechRecognizer speechRecognizer;
    private boolean isListening = false;

    private SpeechRecognizer createRecognizer() {
        if (Build.VERSION.SDK_INT >= 31) {
            if (SpeechRecognizer.isOnDeviceRecognitionAvailable(getContext())) {
                Log.d(TAG, "Using on-device speech recognizer (API 31+)");
                return SpeechRecognizer.createOnDeviceSpeechRecognizer(getContext());
            }
            Log.d(TAG, "On-device recognizer not available, falling back to default");
        }
        return SpeechRecognizer.createSpeechRecognizer(getContext());
    }

    @PluginMethod
    public void startListening(PluginCall call) {
        if (!SpeechRecognizer.isRecognitionAvailable(getContext())) {
            call.reject("Speech recognition is not available on this device");
            return;
        }

        String locale = call.getString("locale", "en-US");
        Log.d(TAG, "startListening with locale: " + locale);

        getActivity().runOnUiThread(() -> {
            try {
                if (speechRecognizer != null) {
                    speechRecognizer.destroy();
                }

                speechRecognizer = createRecognizer();
                speechRecognizer.setRecognitionListener(new RecognitionListener() {
                    @Override
                    public void onReadyForSpeech(Bundle params) {
                        Log.d(TAG, "onReadyForSpeech");
                        JSObject event = new JSObject();
                        event.put("status", "ready");
                        notifyListeners("speechState", event);
                    }

                    @Override
                    public void onBeginningOfSpeech() {
                        Log.d(TAG, "onBeginningOfSpeech");
                    }

                    @Override
                    public void onRmsChanged(float rmsdB) {}

                    @Override
                    public void onBufferReceived(byte[] buffer) {}

                    @Override
                    public void onEndOfSpeech() {
                        Log.d(TAG, "onEndOfSpeech");
                        isListening = false;
                    }

                    @Override
                    public void onError(int error) {
                        isListening = false;
                        String message;
                        switch (error) {
                            case SpeechRecognizer.ERROR_NO_MATCH:
                                message = "no_match";
                                break;
                            case SpeechRecognizer.ERROR_SPEECH_TIMEOUT:
                                message = "speech_timeout";
                                break;
                            case SpeechRecognizer.ERROR_AUDIO:
                                message = "audio_error";
                                break;
                            case SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS:
                                message = "permission_denied";
                                break;
                            case SpeechRecognizer.ERROR_NETWORK:
                            case SpeechRecognizer.ERROR_NETWORK_TIMEOUT:
                                message = "network_error";
                                break;
                            default:
                                message = "recognition_error";
                                break;
                        }
                        Log.d(TAG, "onError: " + error + " -> " + message);

                        JSObject event = new JSObject();
                        event.put("error", message);
                        notifyListeners("speechError", event);
                    }

                    @Override
                    public void onResults(Bundle results) {
                        isListening = false;
                        ArrayList<String> matches = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                        if (matches == null || matches.isEmpty()) {
                            return;
                        }

                        float[] scores = results.getFloatArray(SpeechRecognizer.CONFIDENCE_SCORES);
                        String bestText = matches.get(0);
                        float bestConfidence = 1.0f;

                        if (scores != null && scores.length > 0) {
                            int bestIdx = 0;
                            bestConfidence = scores[0];
                            for (int i = 1; i < Math.min(matches.size(), scores.length); i++) {
                                if (scores[i] > bestConfidence) {
                                    bestConfidence = scores[i];
                                    bestIdx = i;
                                }
                            }
                            bestText = matches.get(bestIdx);
                            Log.d(TAG, "onResults: " + matches.size() + " alternatives, best[" + bestIdx + "]=\"" + bestText + "\" confidence=" + bestConfidence);
                        } else {
                            Log.d(TAG, "onResults: no confidence scores, using first match: " + bestText);
                        }

                        JSObject event = new JSObject();
                        event.put("text", bestText);
                        event.put("confidence", (double) bestConfidence);
                        event.put("isFinal", true);
                        notifyListeners("speechResult", event);
                    }

                    @Override
                    public void onPartialResults(Bundle partialResults) {
                        ArrayList<String> matches = partialResults.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                        if (matches != null && !matches.isEmpty()) {
                            String text = matches.get(0);
                            JSObject event = new JSObject();
                            event.put("text", text);
                            event.put("isFinal", false);
                            event.put("confidence", 0.0);
                            notifyListeners("speechResult", event);
                        }
                    }

                    @Override
                    public void onEvent(int eventType, Bundle params) {}
                });

                Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
                intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
                intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, locale);
                intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, locale);
                intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
                intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 5);
                intent.putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true);

                speechRecognizer.startListening(intent);
                isListening = true;
                call.resolve();
            } catch (Exception e) {
                Log.e(TAG, "Failed to start listening", e);
                call.reject("Failed to start speech recognition", e);
            }
        });
    }

    @PluginMethod
    public void stopListening(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            try {
                if (speechRecognizer != null && isListening) {
                    speechRecognizer.stopListening();
                    isListening = false;
                }
                call.resolve();
            } catch (Exception e) {
                call.reject("Failed to stop listening", e);
            }
        });
    }

    @PluginMethod
    public void isAvailable(PluginCall call) {
        boolean available = SpeechRecognizer.isRecognitionAvailable(getContext());
        JSObject result = new JSObject();
        result.put("available", available);
        call.resolve(result);
    }

    @Override
    protected void handleOnDestroy() {
        if (speechRecognizer != null) {
            speechRecognizer.destroy();
            speechRecognizer = null;
        }
    }
}
