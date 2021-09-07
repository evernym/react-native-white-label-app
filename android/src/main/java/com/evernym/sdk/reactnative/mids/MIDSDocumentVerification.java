package com.evernym.sdk.reactnative.mids;

import android.app.Activity;
import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactApplicationContext;

import com.mastercard.dis.mids.base.verification.MIDSVerificationBaseManager;
import com.mastercard.dis.mids.base.verification.data.enumeration.MIDSDocumentType;
import com.mastercard.dis.mids.base.verification.data.enumeration.MIDSDocumentVariant;
import com.mastercard.dis.mids.base.verification.data.enumeration.MIDSScanSide;
import com.mastercard.dis.mids.base.verification.data.model.MIDSVerificationResponse;
import com.mastercard.dis.mids.base.verification.data.presenter.MIDSVerificationScanPresenter;
import com.mastercard.dis.mids.base.verification.enrollment.MIDSEnrollmentManager;
import com.mastercard.dis.mids.base.verification.data.listener.IMidsVerificationListener;
import com.mastercard.dis.mids.base.verification.data.model.MIDSVerificationError;
import com.mastercard.dis.mids.base.verification.data.model.MIDSCountry;
import com.mastercard.dis.mids.base.verification.data.enumeration.MIDSDataCenter;
import com.mastercard.dis.mids.base.verification.views.MIDSVerificationScanView;
import com.mastercard.dis.mids.base.verification.views.MIDSVerificationConfirmationView;
import com.mastercard.dis.mids.base.verification.data.listener.IMidsVerificationScanListener;

import com.facebook.react.bridge.ReactMethod;

import org.jetbrains.annotations.NotNull;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

import com.evernym.sdk.reactnative.mids.PERMISSIONS;
import com.evernym.sdk.reactnative.R;

public class MIDSDocumentVerification extends ReactContextBaseJavaModule {
  public static final String REACT_CLASS = "MIDSDocumentVerification";
  private static ReactApplicationContext reactContext = null;

  private MIDSEnrollmentManager sdkManager = null;
  private ArrayList<MIDSScanSide> scanSidesDV = new ArrayList<MIDSScanSide>();
  private Callback resolve = null;
  private Callback reject = null;
  private MIDSCountry selectedCountry = null;
  private MIDSVerificationConfirmationView midsVerificationConfirmationView = null;
  private MIDSVerificationScanView midsVerificationScanView = null;
  private IMidsVerificationScanListener scanListener = null;
  private MIDSVerificationScanPresenter presenter = null;
  private int sideIndex = 0;

  public MIDSDocumentVerification(ReactApplicationContext context) {
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

  private void rejectToReact() {
    if (reject != null) {
      reject.invoke();
      reject = null;
    }
  }

  private void resolveToReact() {
    if (resolve != null) {
      resolve.invoke();
      resolve = null;
    }
  }

  private void resolveToReact(String args) {
    System.out.println(resolve);
    if (resolve != null) {
      resolve.invoke(args);
      resolve = null;
    }
  }

  private void resetSdk() {
    sdkManager = null;
    scanSidesDV = new ArrayList<MIDSScanSide>();
    resolve = null;
    reject = null;
    selectedCountry = null;
    scanListener = null;
    presenter = null;
    sideIndex = 0;
  }

  private MIDSEnrollmentManager getEnrollmentManagerInstance() {
    if (sdkManager == null) {
      System.out.println("getEnrollmentManagerInstance");
      sdkManager = new MIDSEnrollmentManager(
        new EnrollmentSDKListener()
      );
    }
    return sdkManager;
  }

  private MIDSDataCenter getDataCenter(String dataCenter) {
    for (MIDSDataCenter data : MIDSDataCenter.values()) {
      if (data.name().equals(dataCenter)) {
        return data;
      }
    }
    return MIDSDataCenter.SG;
  }

  private void requestPermissionsForSDK(Activity currentActivity, Context currentContext) {
    MIDSVerificationBaseManager.requestSDKPermissions(currentActivity, PERMISSIONS.ENROLLMENT_PERMISSION);
    MIDSVerificationBaseManager.requestSDKPermissions(currentActivity, PERMISSIONS.ENROLLMENT_SCAN_PERMISSION);
    MIDSVerificationBaseManager.requestSDKPermissions(currentActivity, PERMISSIONS.AUTHENTICATION_PERMISSION);
    while(!MIDSVerificationBaseManager.hasAllRequiredPermissions(currentContext)) {
      try {
        Thread.sleep(5000);
      } catch (InterruptedException e) {
        e.printStackTrace();
      }
    }
  }

  private class EnrollmentSDKListener implements IMidsVerificationListener {

    @Override
    public void onError(@NotNull MIDSVerificationError error) {
      System.out.println("EnrollmentSDKListener - method: onError - error: " + error.getMessage().toString());

      rejectToReact();
    }

    @Override
    public void onInitializedSuccessfully() {
      System.out.println("EnrollmentSDKListener - method: onInitializedSuccessfully");

      resolve.invoke();
      resolve = null;
    }

    @Override
    public void onSDKConfigured(@NotNull List<? extends MIDSScanSide> scanSides) {
      scanSidesDV.clear();
      scanSidesDV.addAll(scanSides);

      System.out.println("EnrollmentSDKListener - method: onSDKConfigured - scan sides: " + scanSidesDV);

      firstTimeScan();
    }

    @Override
    public void onVerificationFinished(@NotNull String referenceNumber) {
      System.out.println("EnrollmentSDKListener - method: onVerificationFinished - reference number: " + referenceNumber);

      getEnrollmentManagerInstance().endScan();
      getEnrollmentManagerInstance().terminateSDK();
      resolveToReact(referenceNumber);
      resetSdk();
    }
  }

  private class ScanListener implements IMidsVerificationScanListener {

    @Override
    public void onCameraAvailable() {
      System.out.println("ScanListener - method: onCameraAvailable ");
      presenter.resume();
    }

    @Override
    public void onProcessStarted() {
      System.out.println("ScanListener - method: onProcessStarted ");
    }

    @Override
    public void onDocumentCaptured() {
      System.out.println("ScanListener - method: onDocumentCaptured ");
      presenter.confirmScan();
    }

    @Override
    public void onError(MIDSVerificationError error) {
      if (error == MIDSVerificationError.PRESENTER_ERROR_SHOW_BLUR_HINT) {
        System.out.println("ScanListener - method: onError - error: " + error.getMessage());
      } else {
        System.out.println("ScanListener - method: onError - error: " + error.getMessage());
        presenter.destroy();

        rejectToReact();
      }
    }

    @Override
    public void onPreparingScan() {
      System.out.println("ScanListener - method: onPreparingScan ");
    }

    @Override
    public void onProcessCancelled(MIDSVerificationError error) {
      System.out.println("ScanListener - method: onProcessCancelled - error: " + error.getMessage().toString());
      if (error == MIDSVerificationError.PRESENTER_ERROR_GENERIC_ERROR) {
        presenter.retryScan();
      }
    }

    @Override
    public void onProcessFinished(MIDSScanSide scanSide, boolean allPartsScanned) {
      System.out.println("ScanListener - method: onProcessFinished - scan side: " + scanSide + " - is all parts scanned: " + allPartsScanned);
      presenter.destroy();
      presenter = null;

      sideIndex++;
      if (scanSidesDV.size() - 1 >= sideIndex && !allPartsScanned) {
        scanNextSide(scanSidesDV.get(sideIndex));
      }
      if (allPartsScanned) {
        getEnrollmentManagerInstance().endScan();
      }
    }
  }

  @ReactMethod
  public void initMIDSSDK(String token, String withDataCenter, Callback resolve, Callback reject) {
    Activity currentActivity = reactContext.getCurrentActivity();
    Context currentContext = reactContext.getApplicationContext();

    this.resolve = resolve;
    this.reject = reject;
    MIDSDataCenter dataCanter = getDataCenter(withDataCenter);

    requestPermissionsForSDK(currentActivity, currentContext);

    getEnrollmentManagerInstance().initializeSDK(currentActivity, token, dataCanter);
  }

  @ReactMethod
  public void getCountryList(Callback resolve, Callback reject)  {
    try {
      List<MIDSCountry> countryList = getEnrollmentManagerInstance().getCountryList().getResponse();
      JSONObject countries = new JSONObject();
      if (countryList != null) {
        for (MIDSCountry country : countryList) {
          String countryName = country.getName();
          String countryCode = country.getIsoCode();
          countries.put(countryName, countryCode);
        }
      }
      resolve.invoke(countries.toString());
    } catch (JSONException ignored) {
      reject.invoke();
    }
  }

  @ReactMethod
  public void getDocumentTypes(String countryCode, Callback resolve, Callback reject) {
    try {
      MIDSCountry code = new MIDSCountry(countryCode);
      this.selectedCountry = code;
      MIDSVerificationResponse<List<MIDSDocumentType>> documentTypeResponse = getEnrollmentManagerInstance().getDocumentTypes(code);
      List<MIDSDocumentType> documentType = documentTypeResponse.getResponse();
      resolve.invoke(documentType.toString());
    } catch (Exception ignored) {
      reject.invoke();
    }
  }

  private MIDSDocumentType getMIDSDocumentTypeFromString(String documentType) {
    if (documentType.equals("Passport")) {
      return MIDSDocumentType.PASSPORT;
    } else if (documentType.equals("Driver's license")) {
      return MIDSDocumentType.DRIVING_LICENSE;
    } else if (documentType.equals("Identity card")) {
      return MIDSDocumentType.IDENTITY_CARD;
    } else if (documentType.equals("Visa")) {
      return MIDSDocumentType.VISA;
    }
    return MIDSDocumentType.PASSPORT;
  }

  private void inflateScanFragment() {
    Activity currentActivity = reactContext.getCurrentActivity();
    if (currentActivity != null && midsVerificationScanView == null && midsVerificationConfirmationView == null) {
      LayoutInflater inflater = currentActivity.getLayoutInflater();
      ViewGroup viewGroup = (ViewGroup) ((ViewGroup) currentActivity.findViewById(android.R.id.content)).getRootView();
      View view = inflater.inflate(R.layout.fragment_scan, viewGroup, true);

      this.midsVerificationScanView = (MIDSVerificationScanView) view.findViewById(R.id.sv_scan);
      this.midsVerificationConfirmationView = (MIDSVerificationConfirmationView) view.findViewById(R.id.cv_scan);
    } else {
      System.out.println("Inflate scan fragment error");
    }
  }

  private void initScanListener() {
    this.scanListener = new ScanListener();
  }

  private void firstTimeScan() {
    initScanListener();
    inflateScanFragment();
    scanNextSide(scanSidesDV.get(sideIndex));
  }

  private void scanNextSide(MIDSScanSide scanSide) {
    if (scanSide == MIDSScanSide.FACE) {
      this.midsVerificationScanView.setMode(MIDSVerificationScanView.MODE_FACE);
    } else {
      this.midsVerificationScanView.setMode(MIDSVerificationScanView.MODE_ID);
    }

    MIDSVerificationResponse<MIDSVerificationScanPresenter> presenterResponse = getEnrollmentManagerInstance().getPresenter(
      scanSide,
      this.midsVerificationScanView,
      this.midsVerificationConfirmationView,
      this.scanListener
    );

    MIDSVerificationError error = presenterResponse.getError();
    if (error != null) {
      System.out.println("MIDSVerificationError" + error.getMessage().toString());
    }

    this.presenter = presenterResponse.response;

    if (this.presenter != null) {
      System.out.println("VerificationScanPresenter - startScan");
      this.presenter.startScan();
    } else {
      System.out.println("Scan error");
    }
  }

  @ReactMethod
  public void startMIDSSDKScan(
    String documentType,
    String policyVersion,
    Callback resolve,
    Callback reject
  ) {
    this.resolve = resolve;
    this.reject = reject;

    MIDSDocumentType type = getMIDSDocumentTypeFromString(documentType);
    System.out.println("start MIDS SDK Scan - type: " + type + " selected country: " + selectedCountry);
    getEnrollmentManagerInstance().startScan(selectedCountry, type, MIDSDocumentVariant.PLASTIC);
  }
}
