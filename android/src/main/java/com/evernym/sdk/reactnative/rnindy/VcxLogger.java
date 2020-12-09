package com.evernym.sdk.reactnative.rnindy;

import com.sun.jna.*;

//import java9.util.concurrent.CompletableFuture;
import java.util.Map;
import java.util.HashMap;

public class VcxLogger {

  private Map<Integer, String> levelMappings;
  public Pointer context;
  public Callback enabled;
  public Callback log;
  public Callback flush;
  private int logLevel;

  public void VcxLogger() {
    levelMappings = new HashMap<Integer, String>();
    levelMappings.put(1, "Error");
    levelMappings.put(2, "Warning");
    levelMappings.put(3, "Info");
    levelMappings.put(4, "Debug");
    levelMappings.put(5, "Trace");

    context = null;
    enabled = null;
//    enabled = new Callback() {
//      @SuppressWarnings({"unused", "unchecked"})
//      public int callback(Pointer context, int level, String target) {
//        System.out.println("Calling the enabled callback!!");
//  //        CompletableFuture<Void> future = (CompletableFuture<Void>) removeFuture(xcommand_handle);
//  //        if (!checkResult(future, err)) return;
//  //
//  //        Void result = null;
//  //        future.complete(result);
//        return 1;
//      }
//    };

    log = new Callback() {
      @SuppressWarnings({"unused", "unchecked"})
      public void callback(Pointer context, int level, String target, String message, String modulePath, String file, int line) {
        System.out.println("calling the android callback for logging");
        if(level <= logLevel) {
          System.out.println(levelMappings.get(level) + "    " + file + ":" + line + " | " + message);
  //        CompletableFuture<Void> future = (CompletableFuture<Void>) removeFuture(xcommand_handle);
  //        if (!checkResult(future, err)) return;
  //
  //        Void result = null;
  //        future.complete(result);
        }
      }
    };

    flush = null;
//    flush = new Callback() {
//      @SuppressWarnings({"unused", "unchecked"})
//      public void callback(Pointer context) {
//        System.out.println("Calling the flush callback!!");
//  //        CompletableFuture<Void> future = (CompletableFuture<Void>) removeFuture(xcommand_handle);
//  //        if (!checkResult(future, err)) return;
//  //
//  //        Void result = null;
//  //        future.complete(result);
//      }
//    };
  }

  public void setLogLevel(String levelName) {
    if("Error".equalsIgnoreCase(levelName)) {
      this.logLevel = 1;
    } else if("Warning".equalsIgnoreCase(levelName)) {
      this.logLevel = 2;
    } else if("Info".equalsIgnoreCase(levelName)) {
      this.logLevel = 3;
    } else if("Debug".equalsIgnoreCase(levelName)) {
      this.logLevel = 4;
    } else if("Trace".equalsIgnoreCase(levelName)) {
      this.logLevel = 5;
    }
  }
}
