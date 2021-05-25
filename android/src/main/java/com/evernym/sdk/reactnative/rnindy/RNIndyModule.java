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

public class RNIndyModule extends ReactContextBaseJavaModule {
    public static final String REACT_CLASS = "RNIndy";
    public static final String TAG = "RNIndy::";
    private static final int BUFFER = 2048;
    private static ReactApplicationContext reactContext = null;
    // TODO:Remove this class once integration with vcx is done
    private static RNIndyStaticData staticData = new RNIndyStaticData();

    public RNIndyModule(ReactApplicationContext context) {
        // Pass in the context to the constructor and save it so you can emit events
        // https://facebook.github.io/react-native/docs/native-modules-android.html#the-toast-module
        super(context);

        reactContext = context;
    }

    @Override
    public String getName() {
        // Tell React the name of the module
        // https://facebook.github.io/react-native/docs/native-modules-android.html#the-toast-module
        return REACT_CLASS;
    }

    @ReactMethod
    public void createOneTimeInfo(String agencyConfig, Promise promise) {
        Log.d(TAG, "createOneTimeInfo()");
        // We have top create thew ca cert for the openssl to work properly on android
        BridgeUtils.writeCACert(this.getReactApplicationContext());

        try {
            UtilsApi.vcxAgentProvisionAsync(agencyConfig).exceptionally((t) -> {
                VcxException ex = (VcxException) t;
                ex.printStackTrace();
                Log.e(TAG, "vcxAgentProvisionAsync - Error: ", ex);
                promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                return null;
            }).thenAccept(result -> {
                Log.d(TAG, "vcxGetProvisionToken: Success");
                BridgeUtils.resolveIfValid(promise, result);
            });
        } catch (VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "vcxAgentProvisionAsync - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void getProvisionToken(String agencyConfig, Promise promise) {
        Log.d(TAG, "getProvisionToken()");
        try {
            UtilsApi.vcxGetProvisionToken(agencyConfig)
              .exceptionally((t) -> {
                VcxException ex = (VcxException) t;
                ex.printStackTrace();
                Log.e(TAG, "vcxGetProvisionToken - Error: ", ex);
                promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                return null;
              }).thenAccept(result -> {
                Log.d(TAG, "vcxGetProvisionToken: Success");
                BridgeUtils.resolveIfValid(promise, result);
              });
        } catch (VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "vcxGetProvisionToken - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void createOneTimeInfoWithToken(String agencyConfig, String token, Promise promise) {
        Log.d(TAG, "createOneTimeInfoWithToken()");
        BridgeUtils.writeCACert(this.getReactApplicationContext());

        try {
            UtilsApi.vcxAgentProvisionWithTokenAsync(agencyConfig, token)
              .exceptionally((t) -> {
                VcxException ex = (VcxException) t;
                ex.printStackTrace();
                Log.e(TAG, "createOneTimeInfoWithToken - Error: ", ex);
                promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                return null;
              }).thenAccept(result -> {
                Log.d(TAG, "createOneTimeInfoWithToken: Success");
                BridgeUtils.resolveIfValid(promise, result);
              });
        } catch (VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "createOneTimeInfoWithToken - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
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

    @ReactMethod
    public void init(String config, Promise promise) {
        Log.d(TAG, "init()");
        // When we restore data, then we are not calling createOneTimeInfo
        // and hence ca-crt is not written within app directory
        // since the logic to write ca cert checks for file existence
        // we won't have to pay too much cost for calling this function inside init
        BridgeUtils.writeCACert(this.getReactApplicationContext());

        try {
            int retCode = VcxApi.initSovToken();
            if(retCode != 0) {
                promise.reject("Could not init sovtoken", String.valueOf(retCode));
            } else {
                VcxApi.vcxInitWithConfig(config).exceptionally((t) -> {
                    VcxException ex = (VcxException) t;
                    ex.printStackTrace();
                    Log.e(TAG, "vcxInitWithConfig - Error: ", ex);
                    promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                    return -1;
                }).thenAccept(result -> {
                    // Need to put this logic in every accept because that is how ugly Java's
                    // promise API is
                    // even if exceptionally is called, then also thenAccept block will be called
                    // we either need to switch to complete method and pass two callbacks as
                    // parameter
                    // till we change to that API, we have to live with this IF condition
                    // also reason to add this if condition is because we already rejected promise
                    // in
                    // exceptionally block, if we call promise.resolve now, then it `thenAccept`
                    // block
                    // would throw an exception that would not be caught here, because this is an
                    // async
                    // block and above try catch would not catch this exception
                    if (result != -1) {
                        promise.resolve(true);
                    }
                });
            }

        } catch (AlreadyInitializedException e) {
            // even if we get already initialized exception
            // then also we will resolve promise, because we don't care if vcx is already
            // initialized
            promise.resolve(true);
        } catch (VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "vcxInitWithConfig - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void createConnectionWithInvite(String invitationId, String inviteDetails, Promise promise) {
        Log.d(TAG, "createConnectionWithInvite()");
        try {
            ConnectionApi.vcxCreateConnectionWithInvite(invitationId, inviteDetails).exceptionally((t) -> {
                VcxException ex = (VcxException) t;
                ex.printStackTrace();
                Log.e(TAG, "vcxCreateConnectionWithInvite - Error: ", ex);
                promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                return -1;
            }).thenAccept(result -> {
                if (result != -1) {
                    BridgeUtils.resolveIfValid(promise, result);
                }
            });

        } catch (VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "vcxCreateConnectionWithInvite - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void createConnectionWithOutOfBandInvite(String invitationId, String inviteDetails, Promise promise) {
        Log.d(TAG, "createConnectionWithOutOfBandInvite() called with: invitationId = [" + invitationId +
              "], inviteDetails = [" + inviteDetails + "]," + promise + "]");
        try {
            ConnectionApi.vcxCreateConnectionWithOutofbandInvite(invitationId, inviteDetails).exceptionally((t) -> {
                Log.e(TAG, "createConnectionWithOutOfBandInvite - Error: ", t);
                promise.reject("FutureException", t.getMessage());
                return -1;
            }).thenAccept(result -> {
                if (result != -1) {
                    BridgeUtils.resolveIfValid(promise, result);
                }
            });
        } catch (Exception e) {
            promise.reject("VCXException", e.getMessage());
        }
    }

    @ReactMethod
    public void vcxAcceptInvitation(int connectionHandle, String connectionType, Promise promise) {
        Log.d(TAG, "acceptInvitation()");
        try {
            ConnectionApi.vcxAcceptInvitation(connectionHandle, connectionType).exceptionally((t) -> {
                VcxException ex = (VcxException) t;
                ex.printStackTrace();
                Log.e(TAG, "vcxAcceptInvitation - Error: ", ex);
                promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                return null;
            }).thenAccept(result -> BridgeUtils.resolveIfValid(promise, result));
        } catch (VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "vcxAcceptInvitation - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void vcxUpdatePushToken(String config, Promise promise) {
        try {
            UtilsApi.vcxUpdateAgentInfo(config).whenComplete((result, t) -> {
                if (t != null) {
                    VcxException ex = (VcxException) t;
                    ex.printStackTrace();
                    Log.e(TAG, "vcxUpdateAgentInfo - Error: ", ex);
                    promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                } else {
                    promise.resolve(0);
                }
            });
        } catch (VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "vcxUpdateAgentInfo - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void connectionSendMessage(int connectionHandle, String message, String sendMessageOptions, Promise promise) {
        try {
            ConnectionApi.connectionSendMessage(connectionHandle, message, sendMessageOptions).exceptionally((t) -> {
                VcxException ex = (VcxException) t;
                ex.printStackTrace();
                Log.e(TAG, "connectionSendMessage - Error: ", ex);
                promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                return null;
            }).thenAccept(result -> {
                BridgeUtils.resolveIfValid(promise, result);
            });
        } catch(VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "connectionSendMessage - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void connectionSignData(int connectionHandle, String data, String base64EncodingOption, boolean encode, Promise promise) {
        try {
            int base64EncodeOption = base64EncodingOption.equalsIgnoreCase("NO_WRAP") ? Base64.NO_WRAP : Base64.URL_SAFE;
            byte[] dataToSign = encode ? Base64.encode(data.getBytes(), base64EncodeOption) : data.getBytes();
            ConnectionApi.connectionSignData(connectionHandle, dataToSign, dataToSign.length).exceptionally((t) -> {
                VcxException ex = (VcxException) t;
                ex.printStackTrace();
                Log.e(TAG, "connectionSignData - Error: ", ex);
                promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                return null;
            }).thenAccept(result -> {
                try {
                    // We would get Byte array from libvcx
                    // we cannot perform operation on Buffer inside react-native due to react-native limitations for Buffer
                    // so, we are converting byte[] to Base64 encoded string and then returning that data to react-native
                    if (result != null) {
                        // since we took the data from JS layer as simple string and
                        // then converted that string to Base64 encoded byte[]
                        // we need to pass same Base64 encoded byte[] back to JS layer, so that it can included in full message response
                        // otherwise we would be doing this calculation again in JS layer which does not handle Buffer
                        WritableMap signResponse = Arguments.createMap();
                        signResponse.putString("data", new String(dataToSign));
                        signResponse.putString("signature", Base64.encodeToString(result, base64EncodeOption));
                        promise.resolve(signResponse);
                    } else {
                        promise.reject("NULL-VALUE", "Null value was received as result from wrapper");
                    }
                } catch(Exception e) {
                    // it might happen that we get value of result to not be a byte array
                    // or we might get empty byte array
                    // in all those case outer try...catch will not work because this inside callback of a Future
                    // so we need to handle the case for Future callback inside that callback
                    promise.reject(e);
                }
            });
        } catch(VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "connectionSignData - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void connectionVerifySignature(int connectionHandle, String data, String signature, Promise promise) {
        // Base64 decode signature because we encoded signature returned by libvcx to base64 encoded string
        // Convert data to just byte[], because base64 encoded byte[] was used to generate signature
        byte[] dataToVerify = data.getBytes();
        byte[] signatureToVerify = Base64.decode(signature, Base64.NO_WRAP);
        try {
            ConnectionApi.connectionVerifySignature(
                    connectionHandle, dataToVerify, dataToVerify.length, signatureToVerify, signatureToVerify.length
            ).exceptionally((t) -> {
                VcxException ex = (VcxException) t;
                ex.printStackTrace();
                Log.e(TAG, "connectionVerifySignature - Error: ", ex);
                promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                return null;
            }).thenAccept(result -> {
                BridgeUtils.resolveIfValid(promise, result);
            });
        } catch(VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "connectionVerifySignature - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
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
    public void connectionGetState(int connectionHandle, Promise promise) {
        try {
            ConnectionApi.connectionGetState(connectionHandle).exceptionally((t) -> {
                VcxException ex = (VcxException) t;
                ex.printStackTrace();
                Log.e(TAG, "connectionGetState - Error: ", ex);
                promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                return -1;
            }).thenAccept(result -> {
                if (result != -1) {
                    BridgeUtils.resolveIfValid(promise, result);
                }
            });
        } catch(VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "connectionGetState - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void connectionUpdateState(int connectionHandle, Promise promise) {
        try {
            ConnectionApi.vcxConnectionUpdateState(connectionHandle).exceptionally((t) -> {
                VcxException ex = (VcxException) t;
                ex.printStackTrace();
                Log.e(TAG, "vcxConnectionUpdateState - Error: ", ex);
                promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                return -1;
            }).thenAccept(result -> {
                if (result != -1) {
                    BridgeUtils.resolveIfValid(promise, result);
                }
            });
        } catch(VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "connectionGetState - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void connectionUpdateStateWithMessage(int connectionHandle, String message, Promise promise) {
        try {
            ConnectionApi.vcxConnectionUpdateStateWithMessage(connectionHandle, message).exceptionally((t) -> {
                VcxException ex = (VcxException) t;
                ex.printStackTrace();
                Log.e(TAG, "vcxConnectionUpdateStateWithMessage - Error: ", ex);
                promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                return -1;
            }).thenAccept(result -> {
                if (result != -1) {
                    BridgeUtils.resolveIfValid(promise, result);
                }
            });
        } catch(VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "vcxConnectionUpdateStateWithMessage - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void generateProof(String proofRequestId, String requestedAttrs, String requestedPredicates,
            String revocationInterval, String proofName, Promise promise) {
        try {
            ProofApi.proofCreate(proofRequestId, requestedAttrs, requestedPredicates, revocationInterval, proofName).exceptionally((t) -> {
                VcxException ex = (VcxException) t;
                ex.printStackTrace();
                Log.e(TAG, "proofCreate - Error: ", ex);
                promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                return -1;
            }).thenAccept(result -> {
                if (result != -1) {
                    BridgeUtils.resolveIfValid(promise, result);
                }
            });
        } catch (VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "connectionGetState - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
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
    public void reset(boolean reset, final Promise promise) {
        // TODO: call vcx_reset or vcx_shutdown if later is available
        // pass true to indicate that we delete both pool and wallet objects
        Timer t = new Timer();
        t.schedule(new TimerTask() {
            @Override
            public void run() {
                promise.resolve(true);
            }
        }, (long) (Math.random() * 1000));
    }

    @ReactMethod
    public void backupWallet(String documentDirectory, String encryptionKey, String agencyConfig, Promise promise) {
        // TODO: Remove this file, this is a dummy file, testing for backup the wallet
        String fileName = "backup.txt";
        File file = new File(documentDirectory, fileName);
        String contentToWrite = "Dummy Content";
        try (FileWriter fileWriter = new FileWriter(file)) {
            fileWriter.append(contentToWrite);
            fileWriter.flush();
        } catch (IOException e) {
            promise.reject(e);
        }

        // convert the file to zip
        String inputDir = documentDirectory + "/" + fileName;
        String zipPath = documentDirectory + "/backup.zip";
        try (FileOutputStream dest = new FileOutputStream(zipPath);
                ZipOutputStream out = new ZipOutputStream(new BufferedOutputStream(dest));
                FileInputStream fi = new FileInputStream(inputDir);
                BufferedInputStream origin = new BufferedInputStream(fi);) {
            byte data[] = new byte[BUFFER];
            // fileName will be the wallet filename
            ZipEntry entry = new ZipEntry(fileName);
            out.putNextEntry(entry);
            int count;
            while ((count = origin.read(data, 0, BUFFER)) != -1) {
                out.write(data, 0, count);
            }
            out.closeEntry();
            promise.resolve(zipPath);
        } catch (IOException e) {
            promise.reject(e);
        }
    }

    @ReactMethod
    public void getSerializedConnection(int connectionHandle, Promise promise) {
        // TODO:KS call vcx_connection_serialize and pass connectionHandle
        try {
            ConnectionApi.connectionSerialize(connectionHandle).exceptionally((t) -> {
                VcxException ex = (VcxException) t;
                ex.printStackTrace();
                Log.e(TAG, "connectionSerialize - Error: ", ex);
                promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                return null;
            }).thenAccept(result -> {
                BridgeUtils.resolveIfValid(promise, result);
            });
        } catch (VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "connectionSerialize - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
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
                            RNIndyStaticData.REQUEST_WRITE_EXTERNAL_STORAGE);
                }
            }).show();

        } else {
            // permission has not been granted yet. Request it directly.
            ActivityCompat.requestPermissions((Activity)context,
                    new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE},
                    RNIndyStaticData.REQUEST_WRITE_EXTERNAL_STORAGE);
        }
    }

    private static int getLogLevel(String levelName) {
        if("Error".equalsIgnoreCase(levelName)) {
            return 1;
        } else if("Warning".equalsIgnoreCase(levelName) || levelName.toLowerCase().contains("warn")) {
            return 2;
        } else if("Info".equalsIgnoreCase(levelName)) {
            return 3;
        } else if("Debug".equalsIgnoreCase(levelName)) {
            return 4;
        } else if("Trace".equalsIgnoreCase(levelName)) {
            return 5;
        } else {
            return 3;
        }
    }

    @ReactMethod
    public void encryptVcxLog(String logFilePath, String key, Promise promise) {

        try {
            RandomAccessFile logFile = new RandomAccessFile(logFilePath, "r");
            byte[] fileBytes = new byte[(int)logFile.length()];
            logFile.readFully(fileBytes);
            logFile.close();

            IndyApi.anonCrypt(key, fileBytes).exceptionally((t) -> {
                Log.e(TAG, "anonCrypt - Error: ", t);
                promise.reject("FutureException", "Error occurred while encrypting file: " + logFilePath + " :: " + t.getMessage());
                return null;
            }).thenAccept(result -> {
                try {
                    RandomAccessFile encLogFile = new RandomAccessFile(RNIndyStaticData.ENCRYPTED_LOG_FILE_PATH, "rw");
                    encLogFile.write(result, 0, result.length);
                    encLogFile.close();
                    BridgeUtils.resolveIfValid(promise, RNIndyStaticData.ENCRYPTED_LOG_FILE_PATH);
                } catch(IOException ex) {
                    promise.reject("encryptVcxLog Exception", ex.getMessage());
                    ex.printStackTrace();
                }
            });
        } catch (VcxException | IOException e) {
            promise.reject("encryptVcxLog - Error", e.getMessage());
            e.printStackTrace();
        }
    }

    @ReactMethod
    public  void writeToVcxLog(String loggerName, String logLevel, String message, String logFilePath, Promise promise) {
        VcxApi.logMessage(loggerName, getLogLevel(logLevel), message);
        promise.resolve(0);
    }

    @ReactMethod
    public void setVcxLogger(String logLevel, String uniqueIdentifier, int MAX_ALLOWED_FILE_BYTES, Promise promise) {

        ContextWrapper cw = new ContextWrapper(reactContext);
        RNIndyStaticData.MAX_ALLOWED_FILE_BYTES = MAX_ALLOWED_FILE_BYTES;
        RNIndyStaticData.LOG_FILE_PATH = cw.getFilesDir().getAbsolutePath() +
                "/connectme.rotating." + uniqueIdentifier + ".log";
        RNIndyStaticData.ENCRYPTED_LOG_FILE_PATH = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS).getAbsolutePath() +
                "/connectme.rotating." + uniqueIdentifier + ".log.enc";
        //get the documents directory:
        Log.d(TAG, "Setting vcx logger to: " + RNIndyStaticData.LOG_FILE_PATH);

        if (Environment.MEDIA_MOUNTED.equals(Environment.getExternalStorageState())) {
            RNIndyStaticData.initLoggerFile(cw);
        }
        promise.resolve(RNIndyStaticData.LOG_FILE_PATH);

    }

    @ReactMethod
    public void deserializeConnection(String serializedConnection, Promise promise) {
        // TODO call vcx_connection_deserialize and pass serializedConnection
        // it would return an error code and an integer connection handle in callback
        try {
            ConnectionApi.connectionDeserialize(serializedConnection).exceptionally((t) -> {
                VcxException ex = (VcxException) t;
                ex.printStackTrace();
                Log.e(TAG, "connectionDeserialize - Error: ", ex);
                promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                return -1;
            }).thenAccept(result -> {
                if (result != -1) {
                    BridgeUtils.resolveIfValid(promise, result);
                }
            });
        } catch (VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "connectionDeserialize - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void credentialCreateWithOffer(String sourceId, String credOffer, Promise promise) {
        try {
            CredentialApi.credentialCreateWithOffer(sourceId, credOffer).exceptionally((t) -> {
                VcxException ex = (VcxException) t;
                ex.printStackTrace();
                Log.e(TAG, "credentialCreateWithOffer - Error: ", ex);
                promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                return -1;
            }).thenAccept(result -> {
                Log.e(TAG, ">>>><<<< got result back");
                if (result != -1) {
                    BridgeUtils.resolveIfValid(promise, result);
                }
            });
        } catch(VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "credentialCreateWithOffer - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void serializeClaimOffer(int credentialHandle, Promise promise) {
        // it would return error code, json string of credential inside callback

        try {
            CredentialApi.credentialSerialize(credentialHandle).exceptionally((t) -> {
                VcxException ex = (VcxException) t;
                ex.printStackTrace();
                Log.e(TAG, "credentialSerialize - Error: ", ex);
                promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                return null;
            }).thenAccept(result -> {
                BridgeUtils.resolveIfValid(promise, result);
            });
        } catch (VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "credentialSerialize - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }

    }

    @ReactMethod
    public void deserializeClaimOffer(String serializedCredential, Promise promise) {
        // it would return an error code and an integer credential handle in callback

        try {
            CredentialApi.credentialDeserialize(serializedCredential).exceptionally((t) -> {
                VcxException ex = (VcxException) t;
                ex.printStackTrace();
                Log.e(TAG, "credentialDeserialize - Error: ", ex);
                promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                return -1;
            }).thenAccept(result -> {
                if (result != -1) {
                    BridgeUtils.resolveIfValid(promise, result);
                }
            });
        } catch (VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "credentialDeserialize - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void sendClaimRequest(int credentialHandle, int connectionHandle, int paymentHandle, Promise promise) {
        // it would return an error code in callback
        // we resolve promise with an empty string after success
        // or reject promise with error code

        try {
            CredentialApi.credentialSendRequest(credentialHandle, connectionHandle, paymentHandle).whenComplete((result, t) -> {
                if (t != null) {
                    VcxException ex = (VcxException) t;
                    ex.printStackTrace();
                    Log.e(TAG, "credentialSendRequest - Error: ", ex);
                    promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                } else {
                    promise.resolve(0);
                }
            });
        } catch (VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "credentialSendRequest - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void updateClaimOfferState(int credentialHandle, Promise promise) {
        try {
            CredentialApi.credentialUpdateState(credentialHandle).exceptionally((t) -> {
                VcxException ex = (VcxException) t;
                ex.printStackTrace();
                Log.e(TAG, "credentialUpdateState - Error: ", ex);
                promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                return -1;
            }).thenAccept(result -> {
                if (result != -1) {
                    BridgeUtils.resolveIfValid(promise, result);
                }
            });
        } catch (VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "credentialUpdateState - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void updateClaimOfferStateWithMessage(int credentialHandle, String message, Promise promise) {
        try {
            CredentialApi.credentialUpdateStateWithMessage(credentialHandle, message).exceptionally((t) -> {
                VcxException ex = (VcxException) t;
                ex.printStackTrace();
                Log.e(TAG, "updateClaimOfferStateWithMessage - Error: ", ex);
                promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                return -1;
            }).thenAccept(result -> {
                if (result != -1) {
                    BridgeUtils.resolveIfValid(promise, result);
                }
            });
        } catch (VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "updateClaimOfferStateWithMessage - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void getClaimOfferState(int credentialHandle, Promise promise) {
        try {
            CredentialApi.credentialGetState(credentialHandle).exceptionally((t) -> {
                VcxException ex = (VcxException) t;
                ex.printStackTrace();
                Log.e(TAG, "credentialGetState - Error: ", ex);
                promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                return -1;
            }).thenAccept(result -> {
                if (result != -1) {
                    BridgeUtils.resolveIfValid(promise, result);
                }
            });
        } catch (VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "credentialGetState - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void getClaimVcx(int credentialHandle, Promise promise) {
        try {
            CredentialApi.getCredential(credentialHandle).exceptionally((t) -> {
                VcxException ex = (VcxException) t;
                ex.printStackTrace();
                Log.e(TAG, "getClaimVcx - Error: ", ex);
                promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                return null;
            }).thenAccept(result -> {
                BridgeUtils.resolveIfValid(promise, result);
            });
        } catch (VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "getClaimVcx - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void exportWallet(String exportPath, String encryptionKey, Promise promise) {
        Log.d(TAG, "exportWallet()");
        try {
            WalletApi.exportWallet(exportPath, encryptionKey).exceptionally((t) -> {
                VcxException ex = (VcxException) t;
                ex.printStackTrace();
                Log.e(TAG, "exportWallet - Error: ", ex);
                promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                return -1;
            }).thenAccept(result -> {
                if(result != -1){
                   BridgeUtils.resolveIfValid(promise, result);
                }
            });


        } catch (VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "vcxAgentProvisionAsync - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void decryptWalletFile(String config, Promise promise) {
        try {
            WalletApi.importWallet(config).exceptionally((t) -> {
                VcxException ex = (VcxException) t;
                ex.printStackTrace();
                Log.e(TAG, "importWallet - Error: ", ex);
                promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                return -1;
            }).thenAccept(result -> {
                if (result != -1) {
                    BridgeUtils.resolveIfValid(promise, result);
                }
            });
        } catch (VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "vcxAgentProvisionAsync - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
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
    public void setWalletItem(String key, String value, Promise promise) {
        try {
            WalletApi.addRecordWallet("record_type", key, value).whenComplete((result, t) -> {
                if (t != null) {
                    VcxException ex = (VcxException) t;
                    ex.printStackTrace();
                    Log.e(TAG, "addRecordWallet - Error: ", ex);
                    promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                } else {
                    promise.resolve(0);
                }
            });
        } catch (VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "addRecordWallet - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void getWalletItem(String key, Promise promise) {
        try {
            WalletApi.getRecordWallet("record_type", key, "").exceptionally((t) -> {
                VcxException ex = (VcxException) t;
                ex.printStackTrace();
                Log.e(TAG, "getRecordWallet - Error: ", ex);
                promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                return null;
            }).thenAccept(result -> {
                BridgeUtils.resolveIfValid(promise, result);
            });
        } catch (VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "getRecordWallet - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void deleteWalletItem(String key, Promise promise) {
        try {
            WalletApi.deleteRecordWallet("record_type", key).whenComplete((result, t) -> {
                if (t != null) {
                    VcxException ex = (VcxException) t;
                    ex.printStackTrace();
                    Log.e(TAG, "deleteRecordWallet - Error: ", ex);
                    promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                } else {
                    promise.resolve(0);
                }
            });
        } catch (VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "deleteRecordWallet - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void updateWalletItem(String key, String value, Promise promise) {
        try {
            WalletApi.updateRecordWallet("record_type", key, value).whenComplete((result, t) -> {
                if (t != null) {
                    VcxException ex = (VcxException) t;
                    ex.printStackTrace();
                    Log.e(TAG, "updateRecordWallet - Error: ", ex);
                    promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                } else {
                    promise.resolve(0);
                }
            });
        } catch (VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "updateRecordWallet - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void createWalletBackup(String sourceID, String backupKey, Promise promise) {
        try {
            WalletApi.createWalletBackup(sourceID, backupKey).exceptionally((t) -> {
                VcxException ex = (VcxException) t;
                ex.printStackTrace();
                Log.e(TAG, "createWalletBackup - Error: ", ex);
                promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                return null;
            }).thenAccept(result -> {
                BridgeUtils.resolveIfValid(promise, result);
            });
        } catch (VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "createWalletBackup - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }


    @ReactMethod
    public void backupWalletBackup(int walletBackupHandle, String path, Promise promise) {
        try {
            WalletApi.backupWalletBackup(walletBackupHandle, path).whenComplete((result, t) -> {
                if (t != null) {
                    VcxException ex = (VcxException) t;
                    ex.printStackTrace();
                    Log.e(TAG, "backupWalletBackup - Error: ", ex);
                    promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                } else {
                    promise.resolve(0);
                }
            });
        } catch (VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "createWalletBackup - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void updateWalletBackupState(int walletBackupHandle, Promise promise) {
        try {
            WalletApi.updateWalletBackupState(walletBackupHandle).exceptionally((t) -> {
                VcxException ex = (VcxException) t;
                ex.printStackTrace();
                Log.e(TAG, "updateWalletBackupState - Error: ", ex);
                promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                return null;
            }).thenAccept(result -> {
                BridgeUtils.resolveIfValid(promise, result);
            });
        } catch (VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "updateWalletBackupState - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void updateWalletBackupStateWithMessage(int walletBackupHandle, String message, Promise promise ) {
        try {
            WalletApi.updateWalletBackupStateWithMessage(walletBackupHandle, message ).exceptionally((t) -> {
                VcxException ex = (VcxException) t;
                ex.printStackTrace();
                Log.e(TAG, "updateWalletBackupStateWithMessage - Error: ", ex);
                promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                return null;
            }).thenAccept(result -> {
                BridgeUtils.resolveIfValid(promise, result);
            });
        } catch (VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "updateWalletBackupState - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void serializeBackupWallet(int walletBackupHandle, Promise promise) {
        try {
            WalletApi.serializeBackupWallet(walletBackupHandle).exceptionally((t) -> {
                VcxException ex = (VcxException) t;
                ex.printStackTrace();
                Log.e(TAG, "serializeBackupWallet - Error: ", ex);
                promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                return null;
            }).thenAccept(result -> {
                BridgeUtils.resolveIfValid(promise, result);
            });
        } catch (VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "serializeBackupWallet - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void deserializeBackupWallet(String message, Promise promise) {
        try {
            WalletApi.deserializeBackupWallet(message).exceptionally((t) -> {
                VcxException ex = (VcxException) t;
                ex.printStackTrace();
                Log.e(TAG, "deserializeBackupWallet - Error: ", ex);
                promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                return null;
            }).thenAccept(result -> {
                BridgeUtils.resolveIfValid(promise, result);
            });
        } catch (VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "serializeBackupWallet - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void restoreWallet(String config, Promise promise) {
        try {
            WalletApi.restoreWalletBackup(config).whenComplete((result, t) -> {
                if (t != null) {
                    VcxException ex = (VcxException) t;
                    ex.printStackTrace();
                    Log.e(TAG, "restoreWalletBackup - Error: ", ex);
                    promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                } else {
                    promise.resolve(0);
                }
            });
        } catch (VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "restoreWalletBackup - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void exitAppAndroid() {
        android.os.Process.killProcess(android.os.Process.myPid());
    }

    @ReactMethod
    public void proofRetrieveCredentials(int proofHandle, Promise promise) {
        try {
            DisclosedProofApi.proofRetrieveCredentials(proofHandle).exceptionally((t) -> {
                VcxException ex = (VcxException) t;
                ex.printStackTrace();
                Log.e(TAG, "proofRetrieveCredentials - Error: ", ex);
                promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                return null;
            }).thenAccept(result -> {
                BridgeUtils.resolveIfValid(promise, result);
            });
        } catch (VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "proofRetrieveCredentials - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void proofGenerate(int proofHandle, String selectedCredentials, String selfAttestedAttributes,
                              Promise promise) {
        try {
            DisclosedProofApi.proofGenerate(proofHandle, selectedCredentials, selfAttestedAttributes).whenComplete((result, t) -> {
                if (t != null) {
                    VcxException ex = (VcxException) t;
                    ex.printStackTrace();
                    Log.e(TAG, "proofGenerate - Error: ", ex);
                    promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                } else {
                    promise.resolve(0);
                }
            });
        } catch (VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "proofGenerate - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void proofSend(int proofHandle, int connectionHandle, Promise promise) {
        try {
            DisclosedProofApi.proofSend(proofHandle, connectionHandle).whenComplete((result, t) -> {
                if (t != null) {
                    VcxException ex = (VcxException) t;
                    ex.printStackTrace();
                    Log.e(TAG, "proofSend - Error: ", ex);
                    promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                } else {
                    promise.resolve(0);
                }
            });
        } catch (VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "proofSend - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void proofGetState(int proofHandle, Promise promise) {
        try {
            DisclosedProofApi.proofGetState(proofHandle).exceptionally((t) -> {
                VcxException ex = (VcxException) t;
                ex.printStackTrace();
                Log.e(TAG, "proofGetState - Error: ", ex);
                promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                return -1;
            }).thenAccept(result -> {
                if (result != -1) {
                    BridgeUtils.resolveIfValid(promise, result);
                }
            });
        } catch(VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "proofGetState - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void shutdownVcx(Boolean deleteWallet, Promise promise) {
        Log.d(TAG, "shutdownVcx()");
        try {
            VcxApi.vcxShutdown(deleteWallet);
            promise.resolve("");
        } catch (VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "vcxShutdown - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void getTokenInfo(int paymentHandle, Promise promise) {
        try {
            TokenApi.getTokenInfo(paymentHandle).exceptionally((t) -> {
                VcxException ex = (VcxException) t;
                ex.printStackTrace();
                Log.e(TAG, "getTokenInfo - Error: ", ex);
                promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                return null;

            }).thenAccept(result -> {
                BridgeUtils.resolveIfValid(promise, result);
            });
        } catch (VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "getTokenInfo - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void sendTokens(int paymentHandle, String tokens, String recipient, Promise promise) {
        try {
            TokenApi.sendTokens(paymentHandle, tokens, recipient).exceptionally((t) -> {
                VcxException ex = (VcxException) t;
                ex.printStackTrace();
                Log.e(TAG, "sendTokens - Error: ", ex);
                promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                return null;
            }).thenAccept(result -> {
                BridgeUtils.resolveIfValid(promise, result);
            });
        } catch (VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "sendTokens - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void createPaymentAddress(String seed, Promise promise) {
        try {
            TokenApi.createPaymentAddress(seed).exceptionally((t) -> {
                VcxException ex = (VcxException) t;
                ex.printStackTrace();
                Log.e(TAG, "createPaymentAddress - Error: ", ex);
                promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                return null;
            }).thenAccept(result -> {
                BridgeUtils.resolveIfValid(promise, result);
            });
        } catch (VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "createPaymentAddress - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void deleteConnection(int connectionHandle, Promise promise) {
        try {
            ConnectionApi.deleteConnection(connectionHandle).whenComplete((result, t) -> {
                if (t != null) {
                    VcxException ex = (VcxException) t;
                    ex.printStackTrace();
                    Log.e(TAG, "deleteConnection - Error: ", ex);
                    promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                } else {
                    promise.resolve(0);
                }
            });
        } catch (VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "deleteConnection - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void downloadMessages(String messageStatus, String uid_s, String pwdids, Promise promise) {
      Log.d(TAG, "downloadMessages()");
      try {
        UtilsApi.vcxGetMessages(messageStatus, uid_s, pwdids).exceptionally((t) -> {
            VcxException ex = (VcxException) t;
            ex.printStackTrace();
            Log.e(TAG, "vcxGetMessages - Error: ", ex);
            promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
            return null;
        }).thenAccept(result -> BridgeUtils.resolveIfValid(promise, result));

      } catch (VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "vcxGetMessages - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
      }
    }

    @ReactMethod
    public void vcxGetAgentMessages(String messageStatus, String uid_s, Promise promise) {
        Log.d(TAG, "vcxGetAgentMessages()");
        try {
            UtilsApi.vcxGetAgentMessages(messageStatus, uid_s).exceptionally((t) -> {
                VcxException ex = (VcxException) t;
                ex.printStackTrace();
                Log.e(TAG, "vcxGetAgentMessages - Error: ", ex);
                promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                return null;
            }).thenAccept(result -> BridgeUtils.resolveIfValid(promise, result));

        } catch (VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "vcxGetAgentMessages - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void updateMessages(String messageStatus, String pwdidsJson, Promise promise) {
      Log.d(TAG, "updateMessages()");

      try {
          UtilsApi.vcxUpdateMessages(messageStatus, pwdidsJson).whenComplete((result, t) -> {
              if (t != null) {
                  VcxException ex = (VcxException) t;
                  ex.printStackTrace();
                  Log.e(TAG, "vcxUpdateMessages - Error: ", ex);
                  promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
              } else {
                  promise.resolve(0);
              }
          });
      } catch (VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "vcxUpdateMessages - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
      }
    }

    @ReactMethod
    public void proofCreateWithRequest(String sourceId, String proofRequest, Promise promise) {
        Log.d(TAG, "proofCreateWithRequest()");

        try {
            DisclosedProofApi.proofCreateWithRequest(sourceId, proofRequest).exceptionally((t)-> {
                VcxException ex = (VcxException) t;
                ex.printStackTrace();
                Log.e(TAG, "proofCreateWithRequest - Error: ", ex);
                promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                return -1;
            }).thenAccept(result -> {
                if (result != -1) {
                    BridgeUtils.resolveIfValid(promise, result);
                }
            });
        } catch(VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "proofCreateWithRequest - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void proofSerialize(int proofHandle, Promise promise) {
        Log.d(TAG, "proofSerialize()");
        try {
            DisclosedProofApi.proofSerialize(proofHandle).exceptionally((e) -> {
                VcxException ex = (VcxException) e;
                ex.printStackTrace();
                Log.e(TAG, "proofSerialize - Error: ", ex);
                promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                return null;
            }).thenAccept(result -> {
                BridgeUtils.resolveIfValid(promise, result);
            });
        } catch(VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "proofSerialize - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void proofDeserialize(String serializedProof, Promise promise) {
        Log.d(TAG, "proofDeserialize()");

        try {
            DisclosedProofApi.proofDeserialize(serializedProof).exceptionally((e)-> {
                VcxException ex = (VcxException) e;
                ex.printStackTrace();
                Log.e(TAG, "proofDeserialize - Error: ", ex);
                promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                return -1;
            }).thenAccept(result -> {
                if (result != -1) {
                    BridgeUtils.resolveIfValid(promise, result);
                }
            });
        } catch(VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "proofDeserialize - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void proofReject(int proofHandle, int connectionHandle, Promise promise) {
        Log.d(TAG, "proofReject()");
        try {
            DisclosedProofApi.proofReject(proofHandle, connectionHandle).whenComplete((result, e) -> {
                if (e != null) {
                    VcxException ex = (VcxException) e;
                    ex.printStackTrace();
                    Log.e(TAG, "proofReject - Error: ", ex);
                    promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                } else {
                    promise.resolve(0);
                }
            });
        } catch (VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "proofReject - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void connectionRedirect(int redirectConnectionHandle, int connectionHandle, Promise promise) {
        Log.d(TAG, "connectionRedirect()");

        try {
            ConnectionApi.vcxConnectionRedirect(connectionHandle, redirectConnectionHandle).whenComplete((result, t) -> {
                if (t != null) {
                    VcxException ex = (VcxException) t;
                    ex.printStackTrace();
                    Log.e(TAG, "vcxConnectionRedirect - Error: ", ex);
                    promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                } else {
                    promise.resolve(0);
                }
            });
        } catch(VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "vcxConnectionRedirect - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void getRedirectDetails(int connectionHandle, Promise promise) {
        Log.d(TAG, "getRedirectDetails()");

        try {
            ConnectionApi.vcxConnectionGetRedirectDetails(connectionHandle).exceptionally((e) -> {
                VcxException ex = (VcxException) e;
                ex.printStackTrace();
                Log.e(TAG, "vcxConnectionGetRedirectDetails - Error: ", ex);
                promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                return null;
            }).thenAccept(result -> {
                BridgeUtils.resolveIfValid(promise, result);
            });
        } catch (VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "getRedirectDetails - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void connectionReuse(int connectionHandle, String invite, Promise promise) {
        Log.d(TAG, "connectionReuse() called with connectionHandle = " + connectionHandle + ", promise = " + promise);

        try {
            ConnectionApi.connectionSendReuse(connectionHandle, invite).whenComplete((result, t) -> {
                if (t != null) {
                    Log.e(TAG, "connectionReuse - Error: ", t);
                    promise.reject("VcxException", t.getMessage());
                } else {
                    promise.resolve(0);
                }
            });
        } catch(VcxException e) {
            promise.reject("VcxException", e.getMessage());
        }
    }

    @ReactMethod
    public void createWalletKey(int lengthOfKey, Promise promise) {
        try {
            SecureRandom random = new SecureRandom();
            byte bytes[] = new byte[lengthOfKey];
            random.nextBytes(bytes);
            promise.resolve(Base64.encodeToString(bytes, Base64.NO_WRAP));
        } catch(Exception e) {
            e.printStackTrace();
            Log.e(TAG, "createWalletKey - Error: ", e);
            promise.reject("Exception", e.getMessage());
        }
    }

    @ReactMethod
    public void getLedgerFees(Promise promise) {
        Log.d(TAG, "getLedgerFees()");

        try {
            UtilsApi.getLedgerFees().exceptionally((e)-> {
                VcxException ex = (VcxException) e;
                ex.printStackTrace();
                Log.e(TAG, "getLedgerFees - Error: ", ex);
                promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                return null;
            }).thenAccept(result -> {
                BridgeUtils.resolveIfValid(promise, result);
            });
        } catch(VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "getLedgerFees - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @Override
    public @Nullable
    Map<String, Object> getConstants() {
    HashMap<String, Object> constants = new HashMap<String, Object>();
      ActivityManager actManager = (ActivityManager) reactContext.getSystemService(Context.ACTIVITY_SERVICE);
      MemoryInfo memInfo = new ActivityManager.MemoryInfo();
      actManager.getMemoryInfo(memInfo);
      constants.put("totalMemory", memInfo.totalMem);
      return constants;
    }

    @ReactMethod
    public void getTxnAuthorAgreement(Promise promise) {
        try {
            // IndyApi.getTxnAuthorAgreement(submitterDid, data).exceptionally((e) -> {
            UtilsApi.getLedgerAuthorAgreement().exceptionally((e) -> {
                VcxException ex = (VcxException) e;
                ex.printStackTrace();
                Log.e(TAG, "getLedgerAuthorAgreement - Error: ", ex);
                promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                return null;
            }).thenAccept(result -> {
                BridgeUtils.resolveIfValid(promise, result);
            });
        } catch (VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "getLedgerAuthorAgreement - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void getAcceptanceMechanisms(String submitterDid, int timestamp, String version, Promise promise) {
        Long longtimestamp= new Long(timestamp);
        try {
            IndyApi.getAcceptanceMechanisms(submitterDid, longtimestamp, version).exceptionally((e) -> {
                VcxException ex = (VcxException) e;
                ex.printStackTrace();
                Log.e(TAG, "getAcceptanceMechanisms - Error: ", ex);
                promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                return null;
            }).thenAccept(result -> {
                BridgeUtils.resolveIfValid(promise, result);
            });
        } catch (VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "getAcceptanceMechanisms - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void setActiveTxnAuthorAgreementMeta(String text, String version, String taaDigest, String mechanism, int timestamp, Promise promise) {
         Long longtimestamp= new Long(timestamp);
        try {
            UtilsApi.setActiveTxnAuthorAgreementMeta(text, version, taaDigest, mechanism, longtimestamp);
            promise.resolve("");
        } catch (VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "setActiveTxnAuthorAgreementMeta - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void appendTxnAuthorAgreement(String requestJson, String text, String version, String taaDigest, String mechanism, int timestamp, Promise promise) {
        Long longtimestamp= new Long(timestamp);
        try {
            IndyApi.appendTxnAuthorAgreement(requestJson, text, version, taaDigest, mechanism, longtimestamp).exceptionally((e) -> {
                VcxException ex = (VcxException) e;
                ex.printStackTrace();
                Log.e(TAG, "appendTxnAuthorAgreement - Error: ", ex);
                promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                return null;
            }).thenAccept(result -> {
                BridgeUtils.resolveIfValid(promise, result);
            });
        } catch (VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "appendTxnAuthorAgreement - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void fetchPublicEntities(Promise promise) {
        Log.d(TAG, "fetchPublicEntities() called");
        try {
            UtilsApi.vcxFetchPublicEntities().whenComplete((result, e) -> {
                if (e != null) {
                VcxException ex = (VcxException) e;
                ex.printStackTrace();
                Log.e(TAG, "vcxFetchPublicEntities - Error: ", ex);
                promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                } else {
                    promise.resolve(0);
                }
            });
        } catch (VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "vcxFetchPublicEntities - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void connectionSendAnswer(int connectionHandle, String question, String answer, Promise promise) {
        Log.d(TAG, "connectionSendAnswer() called");
        try {
            ConnectionApi.connectionSendAnswer(connectionHandle, question, answer).whenComplete((result, e) -> {
                if (e != null) {
                    Log.e(TAG, "connectionSendAnswer", e);
                    promise.reject("VcxException", e.getMessage());
                } else {
                    promise.resolve(0);
                }
            });
        } catch (VcxException e) {
            promise.reject("VcxException", e.getMessage());
        }
    }

    @ReactMethod
    public void deleteCredential(int credentialHandle, Promise promise) {
        try {
            CredentialApi.deleteCredential(credentialHandle).whenComplete((result, t) -> {
                if (t != null) {
                    Log.e(TAG, "deleteCredential: ", t);
                    promise.reject("FutureException", t.getMessage());
                } else {
                    promise.resolve(0);
                }
            });
        } catch (VcxException e) {
            promise.reject("VCXException", e.getMessage());
        }
    }

    @ReactMethod
    public void vcxInitPool(String config, Promise promise) {
        Log.d(TAG, "vcxInitPool() called");
        try {
            VcxApi.vcxInitPool(config).whenComplete((result, e) -> {
                if (e != null) {
                    VcxException ex = (VcxException) e;
                    ex.printStackTrace();
                    Log.e(TAG, "vcxInitPool - Error: ", ex);
                    promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                } else {
                    promise.resolve(0);
                }
            });
        } catch (VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "vcxInitPool - Error: ", e);
        }
    }

    @ReactMethod
    public void credentialReject(int credentialHandle, int connectionHandle, String comment, Promise promise) {
        Log.d(TAG, "credentialReject()");
        try {
            CredentialApi.credentialReject(credentialHandle, connectionHandle, comment).whenComplete((result, e) -> {
                if (e != null) {
                    VcxException ex = (VcxException) e;
                    ex.printStackTrace();
                    Log.e(TAG, "credentialReject - Error: ", ex);
                    promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                } else {
                    promise.resolve(0);
                }
            });
        } catch (VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "credentialReject - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void credentialGetPresentationProposal(int credentialHandle, Promise promise) {
        Log.d(TAG, "credentialGetPresentationProposal()");
        try {
            CredentialApi.credentialGetPresentationProposal(credentialHandle).exceptionally((t) -> {
                VcxException ex = (VcxException) t;
                ex.printStackTrace();
                Log.e(TAG, "credentialGetPresentationProposal - Error: ", ex);
                promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                return null;
            }).thenAccept(result -> BridgeUtils.resolveIfValid(promise, result));

        } catch (VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "credentialGetPresentationProposal - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void createConnection(String sourceId, Promise promise) {
        Log.d(TAG, "vcxConnectionCreate()");
        try {
            ConnectionApi.vcxConnectionCreate(sourceId).whenComplete((result, e) -> {
                if (e != null) {
                    VcxException ex = (VcxException) e;
                    ex.printStackTrace();
                    Log.e(TAG, "vcxConnectionCreate - Error: ", ex);
                    promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                } else {
                    BridgeUtils.resolveIfValid(promise, result);
                }
            });
        } catch (VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "vcxConnectionCreate - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void createOutOfBandConnection(String sourceId, String goalCode, String goal, boolean handshake, String requestAttach, Promise promise) {
        Log.d(TAG, "connectionCreateOutofband()");
        try {
            ConnectionApi.vcxConnectionCreateOutofband(sourceId, goalCode, goal, handshake, requestAttach).whenComplete((result, e) -> {
                if (e != null) {
                    VcxException ex = (VcxException) e;
                    ex.printStackTrace();
                    Log.e(TAG, "connectionCreateOutofband - Error: ", ex);
                    promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                } else {
                    BridgeUtils.resolveIfValid(promise, result);
                }
            });
        } catch (VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "connectionCreateOutofband - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void getConnectionInvite(int connectionHandle, Promise promise) {
        Log.d(TAG, "connectionInviteDetails()");
        try {
            ConnectionApi.connectionInviteDetails(connectionHandle, 0).exceptionally((t) -> {
                VcxException ex = (VcxException) t;
                ex.printStackTrace();
                Log.e(TAG, "connectionInviteDetails - Error: ", ex);
                promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                return null;
            }).thenAccept(result -> BridgeUtils.resolveIfValid(promise, result));
        } catch (VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "connectionInviteDetails - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
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

  /*
   * Proof Verifier API
   */

   @ReactMethod
   public void createProofVerifierWithProposal(String sourceId, String presentationProposal, String name, Promise promise) {
       Log.d(TAG, "createProofVerifierWithProposal()");
       try {
           ProofApi.proofCreateWithProposal(sourceId, presentationProposal, name).exceptionally((t) -> {
               VcxException ex = (VcxException) t;
               ex.printStackTrace();
               Log.e(TAG, "createProofVerifierWithProposal - Error: ", ex);
               promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
               return -1;
           }).thenAccept(result -> {
               if (result != -1) {
                   BridgeUtils.resolveIfValid(promise, result);
               }
           });

       } catch (VcxException e) {
           e.printStackTrace();
           Log.e(TAG, "createProofVerifierWithProposal - Error: ", e);
           promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
       }
   }

    @ReactMethod
    public void proofVerifierUpdateState(int proofHandle, Promise promise) {
       Log.d(TAG, "proofVerifierUpdateState()");
         try {
            ProofApi.proofUpdateState(proofHandle).exceptionally((t) -> {
                VcxException ex = (VcxException) t;
                ex.printStackTrace();
                Log.e(TAG, "proofVerifierUpdateState - Error: ", ex);
                promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                return -1;
            }).thenAccept(result -> {
                if (result != -1) {
                    BridgeUtils.resolveIfValid(promise, result);
                }
            });
        } catch(VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "proofVerifierUpdateState - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void proofVerifierUpdateStateWithMessage(int proofHandle, String message, Promise promise) {
       Log.d(TAG, "proofVerifierUpdateStateWithMessage()");
         try {
            ProofApi.proofUpdateStateWithMessage(proofHandle, message).exceptionally((t) -> {
                VcxException ex = (VcxException) t;
                ex.printStackTrace();
                Log.e(TAG, "proofVerifierUpdateStateWithMessage - Error: ", ex);
                promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                return -1;
            }).thenAccept(result -> {
                if (result != -1) {
                    BridgeUtils.resolveIfValid(promise, result);
                }
            });
        } catch(VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "proofVerifierUpdateStateWithMessage - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void proofVerifierGetState(int proofHandle, Promise promise) {
       Log.d(TAG, "proofVerifierGetState()");
         try {
            ProofApi.proofGetState(proofHandle).exceptionally((t) -> {
                VcxException ex = (VcxException) t;
                ex.printStackTrace();
                Log.e(TAG, "proofVerifierGetState - Error: ", ex);
                promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                return -1;
            }).thenAccept(result -> {
                if (result != -1) {
                    BridgeUtils.resolveIfValid(promise, result);
                }
            });
        } catch(VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "proofVerifierGetState - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void proofVerifierSerialize(int proofHandle, Promise promise) {
       Log.d(TAG, "proofVerifierSerialize()");
         try {
            ProofApi.proofSerialize(proofHandle).exceptionally((t) -> {
                VcxException ex = (VcxException) t;
                ex.printStackTrace();
                Log.e(TAG, "proofVerifierSerialize - Error: ", ex);
                promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                return null;
            }).thenAccept(result -> {
                if (result != null) {
                    BridgeUtils.resolveIfValid(promise, result);
                }
            });
        } catch(VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "proofVerifierSerialize - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void proofVerifierDeserialize(String serialized, Promise promise) {
       Log.d(TAG, "proofVerifierDeserialize()");
         try {
            ProofApi.proofDeserialize(serialized).exceptionally((t) -> {
                VcxException ex = (VcxException) t;
                ex.printStackTrace();
                Log.e(TAG, "proofVerifierDeserialize - Error: ", ex);
                promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                return -1;
            }).thenAccept(result -> {
                if (result != -1) {
                    BridgeUtils.resolveIfValid(promise, result);
                }
            });
        } catch(VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "proofVerifierDeserialize - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void proofVerifierSendRequest(int proofHandle, int connectionHandle, Promise promise) {
        Log.d(TAG, "proofVerifierSendRequest()");
        try {
            ProofApi.proofSendRequest(proofHandle, connectionHandle).whenComplete((result, t) -> {
                if (t != null) {
                    Log.e(TAG, "proofVerifierSendRequest - Error: ", t);
                    promise.reject("VcxException", t.getMessage());
                } else {
                    promise.resolve(0);
                }
            });
        } catch(VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "proofVerifierSendRequest - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void proofVerifierGetProofMessage(int proofHandle, Promise promise) {
        try {
            ProofApi.getProofMsg(proofHandle).exceptionally((t) -> {
                VcxException ex = (VcxException) t;
                ex.printStackTrace();
                Log.e(TAG, "proofVerifierGetProofMessage - Error: ", ex);
                promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                return null;
            }).thenAccept(result -> {
                if (result != null) {
                    GetProofResult typedResult = (GetProofResult) result;
                    WritableMap obj = Arguments.createMap();
                    obj.putInt("proofState", typedResult.getProof_state());
                    obj.putString("message", typedResult.getResponse_data());
                    BridgeUtils.resolveIfValid(promise, obj);
                }
            });
        } catch(VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "proofVerifierGetProofMessage - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void proofVerifierGetPresentationRequest(int proofHandle, Promise promise) {
        try {
            ProofApi.proofGetRequestMsg(proofHandle).exceptionally((t) -> {
                VcxException ex = (VcxException) t;
                ex.printStackTrace();
                Log.e(TAG, "proofVerifierGetPresentationRequest - Error: ", ex);
                promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                return null;
            }).thenAccept(result -> BridgeUtils.resolveIfValid(promise, result));
        } catch (VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "proofVerifierGetPresentationRequest - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }

    @ReactMethod
    public void createPairwiseAgent(Promise promise) {
        try {
            UtilsApi.vcxCreatePairwiseAgent().exceptionally((t) -> {
                VcxException ex = (VcxException) t;
                ex.printStackTrace();
                Log.e(TAG, "createPairwiseAgent - Error: ", ex);
                promise.reject(String.valueOf(ex.getSdkErrorCode()), ex.getSdkMessage());
                return null;
            }).thenAccept(result -> BridgeUtils.resolveIfValid(promise, result));
        } catch (VcxException e) {
            e.printStackTrace();
            Log.e(TAG, "createPairwiseAgent - Error: ", e);
            promise.reject(String.valueOf(e.getSdkErrorCode()), e.getSdkMessage());
        }
    }
}
