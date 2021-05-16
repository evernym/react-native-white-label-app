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

import com.evernym.sdk.reactnative.BridgeUtils;
import com.evernym.sdk.vcx.VcxException;
import com.evernym.sdk.vcx.wallet.WalletApi;
import com.evernym.sdk.vcx.connection.ConnectionApi;
import com.evernym.sdk.vcx.credential.CredentialApi;
import com.evernym.sdk.vcx.credential.GetCredentialCreateMsgidResult;
import com.evernym.sdk.vcx.proof.CreateProofMsgIdResult;
import com.evernym.sdk.vcx.proof.DisclosedProofApi;
import com.evernym.sdk.vcx.proof.ProofApi;
import com.evernym.sdk.vcx.proof.GetProofResult;
import com.evernym.sdk.vcx.proof.CreateProofMsgIdResult;
import com.evernym.sdk.vcx.token.TokenApi;
import com.evernym.sdk.vcx.utils.UtilsApi;
import com.evernym.sdk.vcx.vcx.AlreadyInitializedException;
import com.evernym.sdk.vcx.vcx.VcxApi;
import com.evernym.sdk.vcx.indy.IndyApi;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

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

public class RNUtils extends ReactContextBaseJavaModule {
    public static final String REACT_CLASS = "RNUtils";

    public RNIndyModule(ReactApplicationContext context) {
        super(context);

        reactContext = context;
    }

    @Override
    public String getName() {
        return REACT_CLASS;
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
    public @Nullable
    Map<String, Object> totalMemory() {
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
            Log.e(TAG, "getRequestRedirectionUrl - Error: ", e);
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
        Log.d(TAG, "getGenesisPathWithConfig()");
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
}
