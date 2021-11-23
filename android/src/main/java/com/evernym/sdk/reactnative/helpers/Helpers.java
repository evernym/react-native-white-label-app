package com.evernym.sdk.reactnative.helpers;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class Helpers extends ReactContextBaseJavaModule {
  private Thread t = null;
  private int TwoMinutes = 2 * 60 * 1000;

  public Helpers(ReactApplicationContext context) {
    super(context);
  }

  @Override
  public String getName() {
    return "Helpers";
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
}
