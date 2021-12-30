//  Created by react-native-create-bridge

package com.evernym.sdk.reactnative.rnindy;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import androidx.core.app.ActivityCompat;
import androidx.palette.graphics.Palette;
import android.util.Base64;
import android.util.Log;
import android.app.ActivityManager;
import android.app.ActivityManager.MemoryInfo;
import android.content.Context;
import android.content.ContextWrapper;
import android.net.Uri;
import android.os.Environment;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.NativeModule;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.FileWriter;
import java.io.IOException;
import java.io.RandomAccessFile;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.List;
import java.util.Scanner;
import java.util.Timer;
import java.util.TimerTask;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;

import javax.annotation.Nullable;

import androidx.annotation.NonNull;

import android.content.pm.ApplicationInfo;
import android.content.Intent;
import android.provider.Settings;

import com.google.android.gms.safetynet.SafetyNet;
import com.google.android.gms.safetynet.SafetyNetApi;
import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.GoogleApiAvailability;

import java.lang.IllegalArgumentException;

public class RNUtils extends ReactContextBaseJavaModule {
    public static final String REACT_CLASS = "RNUtils";
    private static ReactApplicationContext reactContext = null;
    private static final int BUFFER = 2048;
    public static final int REQUEST_WRITE_EXTERNAL_STORAGE = 501;
    private boolean isGmsEnabled;

    private Thread t = null;
    private int TwoMinutes = 2 * 60 * 1000;

    public RNUtils(ReactApplicationContext context) {
        super(context);

        reactContext = context;
        this.initializeGMSStatus();
    }

    @Override
    public String getName() {
        return REACT_CLASS;
    }

    private static void requestPermission(final Context context) {
        if(ActivityCompat.shouldShowRequestPermissionRationale((Activity) context, Manifest.permission.WRITE_EXTERNAL_STORAGE)) {
            // Provide an additional rationale to the user if the permission was not granted
            // and the user would benefit from additional context for the use of the permission.
            // For example if the user has previously denied the permission.

            new AlertDialog.Builder(context)
                    .setMessage("permission storage")
                    .setPositiveButton("positive button", new DialogInterface.OnClickListener() {
                @Override
                public void onClick(DialogInterface dialog, int which) {
                    ActivityCompat.requestPermissions((Activity) context,
                            new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE},
                            REQUEST_WRITE_EXTERNAL_STORAGE);
                }
            }).show();

        } else {
            // permission has not been granted yet. Request it directly.
            ActivityCompat.requestPermissions((Activity)context,
                    new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE},
                    REQUEST_WRITE_EXTERNAL_STORAGE);
        }
    }

    @ReactMethod
    public void getColor(String imagePath, final Promise promise) {
        Bitmap bitmap = BitmapFactory.decodeFile(imagePath);
        Palette.from(bitmap).generate(new Palette.PaletteAsyncListener() {
            @Override
            public void onGenerated(Palette palette) {
                try {
                    Palette.Swatch swatch = palette.getVibrantSwatch();
                    if (swatch == null) {
                        swatch = palette.getDarkVibrantSwatch();
                    }
                    if (swatch == null) {
                        swatch = palette.getLightVibrantSwatch();
                    }
                    if (swatch == null) {
                        swatch = palette.getMutedSwatch();
                    }
                    if (swatch == null) {
                        swatch = palette.getDarkMutedSwatch();
                    }
                    if (swatch == null) {
                        swatch = palette.getLightMutedSwatch();
                    }
                    if (swatch == null) {
                        swatch = palette.getDominantSwatch();
                    }
                    if (swatch == null) {
                        List<Palette.Swatch> swatchList = palette.getSwatches();
                        for (Palette.Swatch swatchItem : swatchList) {
                            if (swatchItem != null) {
                                swatch = swatchItem;
                                break;
                            }
                        }
                    }

                    int rgb = swatch.getRgb();
                    int r = Color.red(rgb);
                    int g = Color.green(rgb);
                    int b = Color.blue(rgb);
                    WritableArray colors = Arguments.createArray();
                    colors.pushString(String.valueOf(r));
                    colors.pushString(String.valueOf(g));
                    colors.pushString(String.valueOf(b));
                    // add a value for alpha factor
                    colors.pushString("1");
                    promise.resolve(colors);
                } catch (Exception e) {
                    promise.reject("No color", e);
                }
            }
        });
    }

    @ReactMethod
    public void exitAppAndroid() {
        android.os.Process.killProcess(android.os.Process.myPid());
    }

    @ReactMethod
    public HashMap<String, Object> totalMemory() {
      HashMap<String, Object> constants = new HashMap<String, Object>();
      ActivityManager actManager = (ActivityManager) reactContext.getSystemService(Context.ACTIVITY_SERVICE);
      MemoryInfo memInfo = new ActivityManager.MemoryInfo();
      actManager.getMemoryInfo(memInfo);
      constants.put("totalMemory", memInfo.totalMem);
      return constants;
    }

    @ReactMethod
    public void toBase64FromUtf8(String data, String base64EncodingOption, Promise promise) {
        try {
            int base64EncodeOption = base64EncodingOption.equalsIgnoreCase("NO_WRAP") ? Base64.NO_WRAP : Base64.URL_SAFE;
            promise.resolve(Base64.encodeToString(data.getBytes(), base64EncodeOption));
        } catch(Exception e) {
            e.printStackTrace();
            promise.reject(e);
        }
    }

    @ReactMethod
    public void toUtf8FromBase64(String data, String base64EncodingOption, Promise promise) {
        try {
            int base64EncodeOption = base64EncodingOption.equalsIgnoreCase("NO_WRAP") ? Base64.NO_WRAP : Base64.URL_SAFE;
            String decodedUtf8 = new String(Base64.decode(data, base64EncodeOption));
            promise.resolve(decodedUtf8);
        } catch(Exception e) {
            e.printStackTrace();
            promise.reject(e);
        }
    }

    @ReactMethod
    public void generateThumbprint(String data, String base64EncodingOption, Promise promise) {
        try {
            MessageDigest hash = MessageDigest.getInstance("SHA-256");
            hash.update(data.getBytes(StandardCharsets.UTF_8));
            int base64EncodeOption = base64EncodingOption.equalsIgnoreCase("NO_WRAP") ? Base64.NO_WRAP : Base64.URL_SAFE;
            byte[] digest = hash.digest();
            String base64EncodedThumbprint = Base64.encodeToString(digest, base64EncodeOption);
            promise.resolve(base64EncodedThumbprint);
        } catch (Exception e) {
            e.printStackTrace();
            promise.reject(e);
        }
    }


    @ReactMethod
    public void getRequestRedirectionUrl(String url, Promise promise) {
        try {
            URL urlObj = new URL(url);

            HttpURLConnection con = (HttpURLConnection) urlObj.openConnection();
            con.setRequestMethod("GET");
            con.setInstanceFollowRedirects(false);

            int responseCode = con.getResponseCode();

            if (responseCode == 302) {
                String location = con.getHeaderField("location");
                promise.resolve(location);
            }
            promise.reject("Failed to fetch URL", "Failed to fetch URL");
        } catch (Exception e) {
            e.printStackTrace();
            promise.reject(e.toString(), "");
        }
    }

    @ReactMethod
    public void copyToPath(String uri, String zipPath, Promise promise) {

        InputStream input = null;
        BufferedOutputStream output = null;
        try {

            input = reactContext.getContentResolver().openInputStream(Uri.parse(uri));
            output = new BufferedOutputStream(new FileOutputStream(zipPath));

            {
                byte data[] = new byte[BUFFER];
                int count;
                while ((count = input.read(data, 0, BUFFER)) != -1) {
                    output.write(data, 0, count);
                }
                input.close();
                output.close();
                promise.resolve(zipPath);
            }
        }

        catch (IOException e) {
            promise.reject("copyToPathException", e.getMessage());
            e.printStackTrace();
        }
    }

    @ReactMethod
    public void getGenesisPathWithConfig(String poolConfig, String fileName, Promise promise) {
        ContextWrapper cw = new ContextWrapper(reactContext);
        File genFile = new File(cw.getFilesDir().toString() + "/genesis_" + fileName + ".txn");
        if (genFile.exists()) {
            genFile.delete();
        }

        try (FileOutputStream fos = new FileOutputStream(genFile)) {
            fos.write(poolConfig.getBytes());
            promise.resolve(genFile.getAbsolutePath());
        } catch (IOException e) {
            promise.reject("IOException", e.getMessage());
            e.printStackTrace();
        }
    }

    @ReactMethod
    public void resetTimeout() {
      if(t != null) {
        if(t.isAlive()) {
          t.interrupt();
          try {
            t.join();
          } catch (InterruptedException e) {
            e.printStackTrace();
          }
        }
        t = null;
      }
    }

    @ReactMethod
    public void watchApplicationInactivity() {
      t = new Thread() {
        public void run() {
          try {
            sleep(TwoMinutes);
            System.exit(0);
          } catch (InterruptedException e) {
            e.printStackTrace();
          }
        }
      };
      t.start();
    }

    @ReactMethod
    public void createWalletKey(int lengthOfKey, Promise promise) {
        try {
            SecureRandom random = new SecureRandom();
            byte bytes[] = new byte[lengthOfKey];
            random.nextBytes(bytes);
            promise.resolve(Base64.encodeToString(bytes, Base64.NO_WRAP));
        } catch (Exception e) {
            e.printStackTrace();
            promise.reject("Exception", e.getMessage());
        }
    }

    private void initializeGMSStatus() {
        try {
            ApplicationInfo gmsInfo = reactContext.getPackageManager()
                    .getApplicationInfo(GoogleApiAvailability.GOOGLE_PLAY_SERVICES_PACKAGE, 0);
            isGmsEnabled = gmsInfo.enabled;
        } catch (PackageManager.NameNotFoundException e) {
            isGmsEnabled = false;
        }
    }

    @ReactMethod
    public void getGooglePlayServicesStatus(final Promise promise) {
        if (!isGmsEnabled) {
            promise.resolve(GooglePlayServicesStatus.GMS_DISABLED.getStatus());
        }

        int result = GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(reactContext);
        if (result != ConnectionResult.SUCCESS) {
            promise.resolve(GooglePlayServicesStatus.GMS_NEED_UPDATE.getStatus());
        }

        promise.resolve(GooglePlayServicesStatus.AVAILABLE.getStatus());
    }

    private void runActivity(Intent intent) {
        Activity currentActivity = reactContext.getCurrentActivity();
        if (currentActivity == null) {
            throw new NullPointerException();
        }
        currentActivity.startActivity(intent);
    }

    @ReactMethod
    public void goToGooglePlayServicesSetting() {
        Uri uri = Uri.parse("package:" + GoogleApiAvailability.GOOGLE_PLAY_SERVICES_PACKAGE);
        Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
        intent.setData(uri);

        this.runActivity(intent);
    }

    @ReactMethod
    public void goToGooglePlayServicesMarketLink() {
        Uri uri = Uri.parse(
                "http://play.google.com/store/apps/details?id=" + GoogleApiAvailability.GOOGLE_PLAY_SERVICES_PACKAGE);
        Intent intent = new Intent(Intent.ACTION_VIEW, uri);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK);

        this.runActivity(intent);
    }

    @ReactMethod
    public void generateNonce(int length, final Promise promise) {
        this.createWalletKey(length, promise);
    }

    @ReactMethod
    public void sendAttestationRequest(String nonceString, String apiKey, final Promise promise) {
        byte[] nonce;
        Activity activity;
        nonce = stringToBytes(nonceString);
        activity = reactContext.getCurrentActivity();
        SafetyNet.getClient(this.getReactApplicationContext()).attest(nonce, apiKey)
                .addOnSuccessListener(activity, new OnSuccessListener<SafetyNetApi.AttestationResponse>() {
                    @Override
                    public void onSuccess(SafetyNetApi.AttestationResponse response) {
                        String result = response.getJwsResult();
                        promise.resolve(result);
                    }
                }).addOnFailureListener(activity, new OnFailureListener() {
                    @Override
                    public void onFailure(@NonNull Exception e) {
                        promise.reject(e);
                    }
                });
    }

    private byte[] stringToBytes(String string) {
        byte[] bytes;
        bytes = null;
        try {
            bytes = Base64.decode(string, Base64.DEFAULT);
        } catch (IllegalArgumentException e) {
            e.printStackTrace();
        }
        return bytes;
    }
}

enum GooglePlayServicesStatus {
    AVAILABLE(10), GMS_DISABLED(20), GMS_NEED_UPDATE(21), INVALID(30);

    private int status;

    GooglePlayServicesStatus(int i) {
        this.status = i;
    }

    public int getStatus() {
        return this.status;
    }
}
