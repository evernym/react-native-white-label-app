//  Created by react-native-create-bridge

#import "RNIndy.h"
#import <LocalAuthentication/LocalAuthentication.h>
#import <React/RCTUtils.h>
#import "React/RCTConvert.h"
#include <pthread/pthread.h>
#import <DeviceCheck/DeviceCheck.h>

// import RCTBridge
#if __has_include(<React/RCTBridge.h>)
#import <React/RCTBridge.h>
#elif __has_include(“RCTBridge.h”)
#import “RCTBridge.h”
#else
#import “React/RCTBridge.h” // Required when used as a Pod in a Swift project
#endif

// import RCTEventDispatcher
#if __has_include(<React/RCTEventDispatcher.h>)
#import <React/RCTEventDispatcher.h>
#elif __has_include(“RCTEventDispatcher.h”)
#import “RCTEventDispatcher.h”
#else
#import “React/RCTEventDispatcher.h” // Required when used as a Pod in a Swift project
#endif

#import "vcx/vcx.h"
#import <CommonCrypto/CommonHMAC.h>
#import "URLSessionWithoutRedirection.h"

@implementation RNIndy

static const unsigned long mask = DISPATCH_VNODE_DELETE | DISPATCH_VNODE_WRITE | DISPATCH_VNODE_EXTEND | DISPATCH_VNODE_ATTRIB | DISPATCH_VNODE_LINK | DISPATCH_VNODE_RENAME | DISPATCH_VNODE_REVOKE;
static dispatch_source_t logSource;
static void (^eventHandler)(void), (^cancelHandler)(void);
static NSNumber *maxLogLevel = nil;

#define levelMappings @{@"1": @"Error", @"2": @"Warning", @"3": @"Info", @"4": @"Debug", @"5": @"Trace"}

@synthesize bridge = _bridge;

// Export a native module
// https://facebook.github.io/react-native/docs/native-modules-ios.html
RCT_EXPORT_MODULE();

// List all your events here
// https://facebook.github.io/react-native/releases/next/docs/native-modules-ios.html#sending-events-to-javascript
- (NSArray<NSString *> *)supportedEvents
{
  return @[@"NoEvent"];
}

#pragma mark - Private methods
// Implement methods that you want to export to the native module
- (void) emitMessageToRN: (NSString *)eventName :(NSDictionary *)params {
  // The bridge eventDispatcher is used to send events from native to JS env
  // No documentation yet on DeviceEventEmitter: https://github.com/facebook/react-native/issues/2819
  [self sendEventWithName: eventName body: params];
}

#pragma mark - React Native exposed methods


+ (void) writeToVcxLogFile:(NSString*)logFilePath
              withLevelName:(NSString*)levelName
               withMessage:(NSString*)message {

  NSNumber *level = @1U;
  if([@"Error" caseInsensitiveCompare:levelName] == NSOrderedSame) {
    level = @1U;
  } else if([@"Warning" caseInsensitiveCompare:levelName] == NSOrderedSame || [[levelName lowercaseString] rangeOfString:@"warn"].location != NSNotFound) {
    level = @2U;
  } else if([@"Info" caseInsensitiveCompare:levelName] == NSOrderedSame) {
    level = @3U;
  } else if([@"Debug" caseInsensitiveCompare:levelName] == NSOrderedSame) {
    level = @4U;
  } else if([@"Trace" caseInsensitiveCompare:levelName] == NSOrderedSame) {
    level = @5U;
  }

  NSComparisonResult levelRes = [level compare:maxLogLevel];
  if (levelRes == NSOrderedSame || levelRes ==
      NSOrderedAscending) {
#if DEBUG
    NSLog(@"%@\n", message);
#endif

    NSFileHandle *fileHandle = [NSFileHandle fileHandleForWritingAtPath:logFilePath];
    if (fileHandle){
      [fileHandle seekToEndOfFile];
      [fileHandle writeData:[[message stringByAppendingString:@"\n"] dataUsingEncoding:NSUTF8StringEncoding]];
      [fileHandle closeFile];
    }
    else{
      [[message stringByAppendingString:@"\n"] writeToFile:logFilePath
                atomically:NO
                  encoding:NSStringEncodingConversionAllowLossy
                     error:nil];
    }

  }
}

// delete connection
RCT_EXPORT_METHOD(deleteConnection:(NSInteger) connectionHandle
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject)
{
  [[[ConnectMeVcx alloc] init] deleteConnection:connectionHandle
                                 withCompletion:^(NSError *error)
  {
     if (error != nil && error.code != 0)
     {
       NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
       reject(indyErrorCode, @"Error occurred while deleting connection", error);
     } else {
       resolve(@true);
     }
  }];
}

RCT_EXPORT_METHOD(init: (NSString *)config
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject)
{
  ConnectMeVcx *conn = [[ConnectMeVcx alloc] init];

  if(retCode != 0) {
    NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)retCode];
    reject(indyErrorCode, [NSString stringWithFormat:@"Error occurred while initializing sovtoken: %ld", (long)retCode], NULL);
  } else {
    [conn initWithConfig:config completion:^(NSError *error) {
      if (error != nil && error.code != 0 && error.code != 1044)
      {
        NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
        reject(indyErrorCode, [NSString stringWithFormat:@"Error occurred while initializing vcx: %@ :: %ld",error.domain, (long)error.code], error);
      }else{
        resolve(@true);
      }
    }];
  }
}

RCT_EXPORT_METHOD(reset:
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject)
{
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(1 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
    resolve(@{});
  });
}

RCT_EXPORT_METHOD(getSerializedConnection: (NSInteger)connectionHandle
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject)
{
  // TODO call vcx_connection_serialize and pass connectionHandle
  // it would return a string
  [[[ConnectMeVcx alloc] init] connectionSerialize:connectionHandle
                                              completion:^(NSError *error, NSString *state) {
    if (error != nil && error.code != 0)
    {
      NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
      reject(indyErrorCode, @"Error occurred while serializing connection handle", error);
    }else{

      resolve(state);
    }
  }];
}


RCT_EXPORT_METHOD(encryptVcxLog: (NSString *) logFilePath
                  withKey: (NSString *) key
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject)
{
  NSData *fileContent = [NSData dataWithContentsOfFile:logFilePath];
  [IndySdk anonCrypt:fileContent theirKey:key
                             completion:^(NSError *error, NSData *encryptedMsg) {
    if (error != nil && error.code != 0) {
      NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
      reject(indyErrorCode, [NSString stringWithFormat:@"Error occurred while encrypting file: %@", logFilePath], error);
    } else {
      NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
      NSString *documentsDirectory = [paths objectAtIndex:0];
      // IMPORTANT NOTE: We are writing the encrypted log file to the applications Documents folder
      // so that the encrypted log file can be sent via email to our support team
      NSString *encryptedLogFile = [NSString stringWithFormat:@"%@/%@.enc", documentsDirectory, [logFilePath lastPathComponent]];
      //NSLog(@"Writing encrypted log file to: %@", encryptedLogFile);

      //NSString *encryptedLogFile = [NSString stringWithFormat:@"%@.enc", logFilePath];
      if(! [[NSFileManager defaultManager] fileExistsAtPath:encryptedLogFile]) {
        [[NSFileManager defaultManager] createFileAtPath:encryptedLogFile contents:encryptedMsg attributes:nil];
      } else {
        //DO NOT USE THIS -- [encryptedMsg writeToFile:encryptedLogFile atomically:YES];
        NSFileHandle *fileHandle = [NSFileHandle fileHandleForWritingAtPath:encryptedLogFile];
        [fileHandle truncateFileAtOffset: 0];
        [fileHandle writeData:encryptedMsg];
        [fileHandle closeFile];
      }

      resolve(encryptedLogFile);
    }
  }];
}

RCT_EXPORT_METHOD(writeToVcxLog: (NSString *) loggerName
                  usingLevel: (NSString *) levelName
                  withMessage: (NSString *) message
                  toLogFile: (NSString *) logFilePath
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject)
{
  [RNIndy writeToVcxLogFile:logFilePath withLevelName:levelName withMessage:message];
  resolve(@{});
}

RCT_EXPORT_METHOD(setVcxLogger: (NSString *) levelName
                  withUniqueId: (NSString *) uniqueIdentifier
                  withMaxSize: (NSInteger) MAX_ALLOWED_FILE_BYTES
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject)
{
  NSString *logFilePath = @"";

  NSArray *paths = NSSearchPathForDirectoriesInDomains(NSLibraryDirectory, NSUserDomainMask, YES);
  NSString *librariesDirectory = [paths objectAtIndex:0];
  // IMPORTANT NOTE: We are using the Library/Caches path so that the plain text log file is hidden
  // from the user and so that the log file is NOT saved as part of an upgrade or backup.
  // It is docuemented here: https://developer.apple.com/library/archive/qa/qa1699/_index.html
  logFilePath = [NSString stringWithFormat:@"%@/%@/connectme.rotating.%@.log", librariesDirectory, @"Caches", uniqueIdentifier];
  //NSLog(@"Setting vcx logger file to: %@", logFilePath);

  //make a file name to write the data to using the documents directory:
  if(! [[NSFileManager defaultManager] fileExistsAtPath:logFilePath]) {
    [[NSFileManager defaultManager] createDirectoryAtPath:[logFilePath stringByDeletingLastPathComponent] withIntermediateDirectories:YES attributes:nil error:NULL];
    [[NSFileManager defaultManager] createFileAtPath:logFilePath contents:nil attributes:nil];
  }

  const char *cLogFilePath = [logFilePath cStringUsingEncoding:NSASCIIStringEncoding];
  int fdes = open(cLogFilePath, O_RDONLY);
  dispatch_queue_t queue = dispatch_get_global_queue(0, 0);

  if (maxLogLevel == nil) {
    maxLogLevel = @1U;
    if([@"Error" caseInsensitiveCompare:levelName] == NSOrderedSame) {
      maxLogLevel = @1U;
    } else if([@"Warning" caseInsensitiveCompare:levelName] == NSOrderedSame || [[levelName lowercaseString] rangeOfString:@"warn"].location != NSNotFound) {
      maxLogLevel = @2U;
    } else if([@"Info" caseInsensitiveCompare:levelName] == NSOrderedSame) {
      maxLogLevel = @3U;
    } else if([@"Debug" caseInsensitiveCompare:levelName] == NSOrderedSame) {
      maxLogLevel = @4U;
    } else if([@"Trace" caseInsensitiveCompare:levelName] == NSOrderedSame) {
      maxLogLevel = @5U;
    }
  }

  static NSDateFormatter *dateFormatter = nil;
  if (dateFormatter == nil) {
    dateFormatter = [[NSDateFormatter alloc] init];
    [dateFormatter setDateFormat:@"yyyy-MM-dd hh:mm:ss.SSSZ"];
  }

  [VcxLogger setLogger:^(NSObject *context, NSNumber *level, NSString *target, NSString *message, NSString *modulePath, NSString *file, NSNumber *line) {
    NSComparisonResult levelRes = [level compare:maxLogLevel];
    if (levelRes == NSOrderedSame || levelRes ==
        NSOrderedAscending) {

      NSString *CurrentTime = [dateFormatter stringFromDate:[NSDate date]];

      __uint64_t threadId;
      if (pthread_threadid_np(0, &threadId)) {
        threadId = pthread_mach_thread_np(pthread_self());
      }

      // NOTE: We must restrict the size of the message because the message could be the whole
      // contents of a file, like a 10 MB log file and we do not want all of that content logged
      // into the log file itself... This is what the log statement would look like
      // 2019-02-19 04:34:12.813-0700 ConnectMe[9216:8454774] Debug indy::commands::crypto | src/commands/crypto.rs:286 | anonymous_encrypt <<< res:
      if ([message length] > 102400) {
        // if message is more than 100K then log only 10K of the message
        message = [message substringWithRange:NSMakeRange(0, 10240)];
      }
      NSString* content = [NSString stringWithFormat:@"%@ ConnectMe[%ld:%llu] %@ %@ | %@:%@ | %@", CurrentTime, (long) getpid(), threadId, [levelMappings valueForKey:[NSString stringWithFormat:@"%@", level]], modulePath, file, line, message];

      [RNIndy writeToVcxLogFile:logFilePath withLevelName:levelName withMessage:content];
    }
  }];

  eventHandler = ^{
    unsigned long l = dispatch_source_get_data(logSource);
    if (l & DISPATCH_VNODE_DELETE) {
      NSLog(@"log file deleted! -- %@  cancelling source\n", logFilePath);
      dispatch_source_cancel(logSource);
    } else if (l & DISPATCH_VNODE_EXTEND) {

      // !!! IMPORTANT NOTE: DO NOT, REPEAT, DO NOT use an NSLog call inside this if statement!!!!!
      // Doing so will cause an infinite loop behavior where the log file will fill up continually, this is bad.

      int fdes = dispatch_source_get_handle(logSource);
      off_t fsize = lseek(fdes, 0, SEEK_END);

      // fsize is the size of the file in bytes
      if(fsize > MAX_ALLOWED_FILE_BYTES) {
        [[NSFileManager defaultManager] createDirectoryAtPath:[logFilePath stringByDeletingLastPathComponent] withIntermediateDirectories:YES attributes:nil error:NULL];
        [[NSFileManager defaultManager] createFileAtPath:logFilePath contents:nil attributes:nil];
      }
    }
  };
  cancelHandler = ^{
    if(logSource) {
      int fdes = dispatch_source_get_handle(logSource);
      close(fdes);
      [[NSFileManager defaultManager] createDirectoryAtPath:[logFilePath stringByDeletingLastPathComponent] withIntermediateDirectories:YES attributes:nil error:NULL];
      [[NSFileManager defaultManager] createFileAtPath:logFilePath contents:nil attributes:nil];
      // Wait for new file to exist.
      while ((fdes = open(cLogFilePath, O_RDONLY)) == -1)
        sleep(1);
      NSLog(@"re-opened target file -- %@ -- in cancel handler\n", logFilePath);
      logSource = dispatch_source_create(DISPATCH_SOURCE_TYPE_VNODE, fdes, mask, queue);
      dispatch_source_set_event_handler(logSource, eventHandler);
      dispatch_source_set_cancel_handler(logSource, cancelHandler);
      dispatch_resume(logSource);
    }
  };

  logSource = dispatch_source_create(DISPATCH_SOURCE_TYPE_VNODE, fdes, mask, queue);
  dispatch_source_set_event_handler(logSource, eventHandler);
  dispatch_source_set_cancel_handler(logSource, cancelHandler);
  dispatch_resume(logSource);

  resolve(logFilePath);
}


RCT_EXPORT_METHOD(deserializeConnection: (NSString *)serializedConnection
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject)
{
  // TODO call vcx_connection_deserialize and pass serializedConnection
  // it would return an error code and an integer connection handle in callback
  [[[ConnectMeVcx alloc] init] connectionDeserialize:serializedConnection completion:^(NSError *error, NSInteger connectionHandle) {
    if (error != nil && error.code != 0)
    {
      NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
      reject(indyErrorCode, @"Error occurred while deserializing claim offer", error);
    }else{
      resolve(@(connectionHandle));
    }
  }];
}

RCT_EXPORT_METHOD(connectionGetState: (NSInteger) connectionHandle
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject)
{
  [[[ConnectMeVcx alloc] init] connectionGetState:connectionHandle
                                   completion:^(NSError *error, NSInteger state) {
    if (error != nil && error.code != 0) {
      NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
      reject(indyErrorCode, @"Error occurred while getting connection state", error);
    } else {
      resolve(@(state));
    }
  }];
}

RCT_EXPORT_METHOD(connectionUpdateState: (NSInteger) connectionHandle
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject)
{
  [[[ConnectMeVcx alloc] init] connectionUpdateState:connectionHandle
                                      withCompletion:^(NSError *error, NSInteger state)
  {
    if (error != nil && error.code != 0) {
      NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
      reject(indyErrorCode, @"Error occurred while updating connection state", error);
    } else {
      resolve(@(state));
    }
  }];
}

RCT_EXPORT_METHOD(connectionUpdateStateWithMessage: (NSInteger) connectionHandle
                  message: (NSString *)message
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject)
{
  [[[ConnectMeVcx alloc] init] connectionUpdateStateWithMessage:connectionHandle
                                                        message:message
                                                 withCompletion:^(NSError *error, NSInteger state)
  {
    if (error != nil && error.code != 0) {
      NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
      reject(indyErrorCode, @"Error occurred while updating connection state", error);
    } else {
      resolve(@(state));
    }
  }];
}

RCT_EXPORT_METHOD(decryptWalletFile: (NSString *) config
                           resolver: (RCTPromiseResolveBlock) resolve
                           rejecter: (RCTPromiseRejectBlock) reject)
{
  [[[ConnectMeVcx alloc] init] importWallet: config
                               completion:^(NSError *error) {
    if(error != nil && error.code != 0){
      NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
      reject(indyErrorCode, [NSString stringWithFormat:@"Error occurred while importing wallet: %@ :: %ld",error.domain, (long)error.code], error);
    }else {
      resolve(@{});
    }
  }];
}


RCT_EXPORT_METHOD(shutdownVcx: (BOOL *) deletePool
                    resolver: (RCTPromiseResolveBlock) resolve
                    rejecter: (RCTPromiseRejectBlock) reject)
{
  resolve([NSNumber numberWithInt:[[[ConnectMeVcx alloc] init] vcxShutdown: deletePool]]);
}

RCT_EXPORT_METHOD(connectionSendMessage: (NSInteger) connectionHandle
                  withMessage: (NSString *) message
                  withSendMessageOptions: (NSString *)sendMessageOptions
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject)
{
  [[[ConnectMeVcx alloc] init] connectionSendMessage:connectionHandle
                                         withMessage:message
                                            withSendMessageOptions:sendMessageOptions
                                      withCompletion:^(NSError *error, NSString *msg_id)
  {
    if (error != nil && error.code != 0) {
      NSString *vcxErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
      reject(vcxErrorCode, @"Error occurred while sending message", error);
    } else {
      resolve(msg_id);
    }
  }];
}

NSString* makeUrlSafe(NSString* base64Encoded) {
  return [[base64Encoded stringByReplacingOccurrencesOfString:@"/" withString:@"_"] stringByReplacingOccurrencesOfString:@"+" withString:@"-"];
}

NSString* makeUrlSafeToNoWrap(NSString* base64Encoded) {
  return [[base64Encoded stringByReplacingOccurrencesOfString:@"_" withString:@"/"] stringByReplacingOccurrencesOfString:@"-" withString:@"+"];
}

RCT_EXPORT_METHOD(connectionSignData: (NSInteger) connectionHandle
                  withData: (NSString *) data
                  withBase64EncodingOption: (NSString *) base64EncodingOption
                  withEncodeBeforeSigning: (BOOL) encode
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject)
{
  NSData *dataToSign = encode == YES
                        ? [[data dataUsingEncoding:NSUTF8StringEncoding] base64EncodedDataWithOptions:0]
                        : [data dataUsingEncoding:NSUTF8StringEncoding];
  [[[ConnectMeVcx alloc] init] connectionSignData:connectionHandle
                                         withData:dataToSign
                                   withCompletion:^(NSError *error, NSData *signature_raw, vcx_u32_t signature_len)
  {
    if (error != nil && error.code != 0) {
      NSString *vcxErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
      reject(vcxErrorCode, @"Error occurred while signing data", error);
    } else {
      NSString* signedData = [[NSString alloc] initWithData:dataToSign encoding:NSUTF8StringEncoding];
      NSString* signature = [signature_raw base64EncodedStringWithOptions:0];
      if ([[base64EncodingOption uppercaseString] isEqualToString:@"URL_SAFE"]) {
        if (encode == YES) {
          signedData = makeUrlSafe(signedData);
        }
        signature = makeUrlSafe(signature);
      }
      // since we took the data from JS layer as simple string and
      // then converted that string to Base64 encoded byte[]
      // we need to pass same Base64 encoded byte[] back to JS layer, so that it can included in full message response
      // otherwise we would be doing this calculation again in JS layer which does not handle Buffer
      resolve(@{
                @"data": signedData,
                @"signature": signature
                });
    }
  }];
}

RCT_EXPORT_METHOD(connectionVerifySignature: (NSInteger) connectionHandle
                  withData: (NSString *) data
                  withSignature: (NSString *)signature
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject)
{
  // Base64 decode signature because we encoded signature returned by libvcx to base64 encoded string
  // Convert data to just byte[], because base64 encoded byte[] was used to generate signature
  NSData *dataToVerify = [data dataUsingEncoding:NSUTF8StringEncoding];
  NSData *signatureToVerify = [[NSData alloc] initWithBase64EncodedString:signature options:0];
  [[[ConnectMeVcx alloc] init] connectionVerifySignature:connectionHandle
                                                withData:dataToVerify
                                       withSignatureData:signatureToVerify
                                          withCompletion:^(NSError *error, vcx_bool_t valid)
  {
    if (error != nil && error.code != 0) {
      NSString *vcxErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
      reject(vcxErrorCode, @"Error occurred while verifying data", error);
    } else {
      if (valid) {
        resolve(@YES);
      } else {
        resolve(@NO);
      }
    }
  }];
}

RCT_EXPORT_METHOD(toBase64FromUtf8: (NSString *)data
                  withBase64EncodingOption: (NSString *) base64EncodingOption
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject)
{
  NSString* base64Encoded = [[data dataUsingEncoding:NSUTF8StringEncoding] base64EncodedStringWithOptions:0];
  if (base64Encoded == nil) {
    reject(@"10001", @"Error occurred while converting to base64 encoded string", nil);
  } else {
    if ([[base64EncodingOption uppercaseString] isEqualToString:@"URL_SAFE"]) {
      base64Encoded = makeUrlSafe(base64Encoded);
    }
    resolve(base64Encoded);
  }
}

RCT_EXPORT_METHOD(toUtf8FromBase64: (NSString *)data
                  withBase64EncodingOption: (NSString *) base64EncodingOption
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject)
{
  NSString* text = data;
  if ([[base64EncodingOption uppercaseString] isEqualToString:@"URL_SAFE"]) {
    text = makeUrlSafeToNoWrap(data);
  }

  NSData* base64DecodedData = [[NSData alloc] initWithBase64EncodedString:text options:NSDataBase64DecodingIgnoreUnknownCharacters];
  NSString* utf8Encoded = [[NSString alloc] initWithData:base64DecodedData encoding:NSUTF8StringEncoding];
  if (utf8Encoded == nil) {
    reject(@"10002", @"Error occurred while converting to utf8 encoded string", nil);
  } else {
    resolve(utf8Encoded);
  }
}


RCT_EXPORT_METHOD(generateThumbprint: (NSString *)data
                  withBase64EncodingOption: (NSString *) base64EncodingOption
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject)
{
  unsigned char hash[CC_SHA256_DIGEST_LENGTH];
  NSData* dataBytes = [data dataUsingEncoding:NSUTF8StringEncoding];
  if (CC_SHA256([dataBytes bytes], [dataBytes length], hash)) {
    NSData* hashedData = [NSData dataWithBytes:hash length:CC_SHA256_DIGEST_LENGTH];
    NSString* base64Encoded = [hashedData base64EncodedStringWithOptions:0];
    if (base64Encoded == nil) {
      reject(@"10004", @"Error occurred while converting hashed data to base64 string", nil);
    } else {
      if ([[base64EncodingOption uppercaseString] isEqualToString:@"URL_SAFE"]) {
        base64Encoded = makeUrlSafe(base64Encoded);
      }
      resolve(base64Encoded);
    }
  } else {
    reject(@"10003", @"Error occurred while hashing data", nil);
  }
}

RCT_EXPORT_METHOD(credentialCreateWithOffer: (NSString *) sourceId
                  withCredOffer: (NSString *) credOffer
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject)
{
    [[[ConnectMeVcx alloc] init] credentialCreateWithOffer:sourceId
                                                     offer:credOffer
                                                completion:^(NSError *error, NSInteger credentialHandle) {
      if (error != nil && error.code != 0)
      {
        NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
        reject(indyErrorCode, @"Error occurred while creating credential handle", error);
      } else {
        resolve(@(credentialHandle));
      }
    }];
}

RCT_EXPORT_METHOD(serializeClaimOffer: (NSInteger)credentialHandle
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject)
{
  // it would return error code, json string of credential inside callback
  [[[ConnectMeVcx alloc] init] credentialSerialize:credentialHandle completion:^(NSError *error, NSString *claimOffer) {
    if (error != nil && error.code != 0)
    {
      NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
      reject(indyErrorCode, @"Error occurred while serializing claim offer", error);
    }else{
      resolve(claimOffer);
    }
  }];
}

RCT_EXPORT_METHOD(deserializeClaimOffer: (NSString *)serializedCredential
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject)
{
  // it would return an error code and an integer credential handle in callback
  [[[ConnectMeVcx alloc] init] credentialDeserialize:serializedCredential
                                          completion:^(NSError *error, NSInteger credentailHandle) {
    if (error != nil && error.code != 0) {
      NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
      reject(indyErrorCode, @"Error occurred while deserializing claim offer", error);
    }
    else {
      resolve(@(credentailHandle));
    }
  }];
}

RCT_EXPORT_METHOD(sendClaimRequest: (NSInteger) credentialHandle
                  withConnectionHandle: (NSInteger) connectionHandle
                  withPaymentHandle: (NSInteger) paymentHandle
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject)
{
  [[[ConnectMeVcx alloc] init] credentialSendRequest:credentialHandle
                                    connectionHandle:connectionHandle
                                       paymentHandle:paymentHandle
                                          completion:^(NSError *error) {
    if (error != nil && error.code != 0)
    {
      NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
      reject(indyErrorCode, @"Error occurred while sending claim request", error);
    }
    else {
      resolve(@{});
    }
  }];
}

RCT_EXPORT_METHOD(initWithConfig: (NSString *)config
              resolver: (RCTPromiseResolveBlock) resolve
              rejecter: (RCTPromiseRejectBlock) reject)
{
  NSError *error = nil; // remove this line after integrating libvcx method
  if (error != nil && error.code != 0)
  {
    NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
    reject(indyErrorCode, @"Init failed with error", error);
  } else {
    resolve(@{});
  }
}

RCT_EXPORT_METHOD(createOneTimeInfo: (NSString *)config
                           resolver: (RCTPromiseResolveBlock) resolve
                           rejecter: (RCTPromiseRejectBlock) reject)
{
  [[[ConnectMeVcx alloc] init] agentProvisionAsync:config completion:^(NSError *error, NSString *oneTimeInfo) {
    NSLog(@"createOneTimeInfo callback:%@",oneTimeInfo);
    if (error != nil && error.code != 0)
    {
      NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
      reject(indyErrorCode, [NSString stringWithFormat:@"Error occurred while creating one time info: %@ :: %ld",error.domain, (long)error.code], error);

    }else{
      resolve(oneTimeInfo);
    }
  }];
}

RCT_EXPORT_METHOD(getProvisionToken: (NSString *)config
                                      resolver: (RCTPromiseResolveBlock) resolve
                                      rejecter: (RCTPromiseRejectBlock) reject)
{
  [[[ConnectMeVcx alloc] init] getProvisionToken:config
                                completion:^(NSError *error, NSString *token) {
    NSLog(@"CONFIG OBJECT", config);
    if (error != nil && error.code != 0)
    {
      NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
      reject(indyErrorCode, @"Error occurred while getting provision token", error);
    } else {
      resolve(token);
    }
  }];
}

RCT_EXPORT_METHOD(createOneTimeInfoWithToken: (NSString *)config
                                        token: (NSString *)token
                                        resolver: (RCTPromiseResolveBlock) resolve
                                        rejecter: (RCTPromiseRejectBlock) reject)
{
  [[[ConnectMeVcx alloc] init] agentProvisionWithTokenAsync:config
                                                      token:token
                                                 completion:^(NSError *error, NSString *result) {
    if (error != nil && error.code != 0)
    {
      NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
      reject(indyErrorCode, @"Error occurred while registering with token", error);
    } else {
      resolve(result);
    }
  }];
}

RCT_EXPORT_METHOD(createConnectionWithInvite: (NSString *)invitationId
                               inviteDetails: (NSString *)inviteDetails
                                    resolver: (RCTPromiseResolveBlock) resolve
                                    rejecter: (RCTPromiseRejectBlock) reject)
{
  [[[ConnectMeVcx alloc] init] connectionCreateWithInvite:invitationId
                                            inviteDetails:inviteDetails
                                               completion:^(NSError *error, NSInteger connectionHandle) {
     if (error != nil && error.code != 0)
     {
       NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
       reject(indyErrorCode, @"Error occurred while creating connection", error);
     } else {
       resolve(@(connectionHandle));
     }
  }];
}

RCT_EXPORT_METHOD(createConnectionWithOutOfBandInvite: (NSString *)invitationId
                                               invite: (NSString *)invite
                                             resolver: (RCTPromiseResolveBlock) resolve
                                             rejecter: (RCTPromiseRejectBlock) reject)
{
  [[[ConnectMeVcx alloc] init] connectionCreateWithOutofbandInvite:invitationId
                                                            invite:invite
                                                        completion:^(NSError *error, NSInteger connectionHandle) {
     if (error != nil && error.code != 0)
     {
       NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
       reject(indyErrorCode, @"Error occurred while creating connection", error);
     } else {
       resolve(@(connectionHandle));
     }
  }];
}

RCT_EXPORT_METHOD(vcxAcceptInvitation: (NSInteger )connectionHandle
                    connectionType: (NSString *)connectionType
                          resolver: (RCTPromiseResolveBlock) resolve
                          rejecter: (RCTPromiseRejectBlock) reject)
{
   [[[ConnectMeVcx alloc] init] connectionConnect:connectionHandle
                                            connectionType:connectionType
                                               completion:^(NSError *error, NSString *inviteDetails) {

    if (error != nil && error.code != 0)
    {
      NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
      reject(indyErrorCode, @"Error occurred while accepitng connection", error);
    } else {
      resolve(inviteDetails);
    }
   }];

}

RCT_EXPORT_METHOD(vcxUpdatePushToken: (NSString *)config
                         resolver: (RCTPromiseResolveBlock) resolve
                         rejecter: (RCTPromiseRejectBlock) reject)
{
  [[[ConnectMeVcx alloc] init] agentUpdateInfo:config completion:^(NSError *error) {
    if (error != nil && error.code != 0)
    {
      NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
      reject(indyErrorCode, @"Error occurred while updating push token", error);
    } else {
      resolve(@{});
    }
  }];
}

RCT_EXPORT_METHOD(getGenesisPathWithConfig: (NSString *)config
                        fileName: (NSString *)fileName
                       resolver: (RCTPromiseResolveBlock) resolve
                       rejecter: (RCTPromiseRejectBlock) reject)
{
  NSError *error;
  NSString *filePath = [[NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) firstObject] stringByAppendingPathComponent:fileName];
  NSFileManager *fileManager = [NSFileManager defaultManager];
  if (![fileManager fileExistsAtPath: filePath])
  {
    NSInteger *success=[config writeToFile:filePath atomically:YES encoding:NSUTF8StringEncoding error:&error];
    if(!success)
    {
      resolve(@"error while creating genesis file");
    }
  }
  resolve(filePath);
}

RCT_EXPORT_METHOD(updateClaimOfferState: (int)credentialHandle
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject)
{
  [[[ConnectMeVcx alloc] init] credentialUpdateState:credentialHandle
                                          completion:^(NSError *error, NSInteger state)
  {
    if (error != nil && error.code != 0) {
      NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
      reject(indyErrorCode, @"Error occurred while updating claim offer state", error);
    }
    else {
      resolve(@(state));
    }
  }];
}

RCT_EXPORT_METHOD(updateClaimOfferStateWithMessage: (int)credentialHandle
                  message: (NSString *)message
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject)
{
  [[[ConnectMeVcx alloc] init] credentialUpdateStateWithMessage:credentialHandle
                                                        message:message
                                          withCompletion:^(NSError *error, NSInteger state)
  {
    if (error != nil && error.code != 0) {
      NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
      reject(indyErrorCode, @"Error occurred while updating claim offer state", error);
    }
    else {
      resolve(@(state));
    }
  }];
}

RCT_EXPORT_METHOD(getClaimOfferState: (int)credentialHandle
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject)
{
  // TODO: Add vcx wrapper method for vcx_credential_get_state
  // call vcx_credential_get_state and pass credentialHandle

  [[[ConnectMeVcx alloc] init] credentialGetState:credentialHandle completion:^(NSError *error, NSInteger state) {
    if (error != nil && error.code != 0) {
      NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
      reject(indyErrorCode, @"Error occurred while getting claim offer state", error);
    }
    else {
      resolve(@(state));
    }
  }];
}

RCT_EXPORT_METHOD(getClaimVcx: (int)credentialHandle
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject)
{
  [[[ConnectMeVcx alloc] init] getCredential:credentialHandle completion:^(NSError *error, NSString *credential) {
    if (error != nil && error.code != 0) {
      NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
      reject(indyErrorCode, @"Error occurred while getting claim", error);
    }
    else {
      resolve(credential);
    }
  }];
}

RCT_EXPORT_METHOD(exportWallet: (NSString *)exportPath
                               encryptWith: (NSString *)encryptionKey
                                    resolver: (RCTPromiseResolveBlock) resolve
                                    rejecter: (RCTPromiseRejectBlock) reject)
{
  [[[ConnectMeVcx alloc] init] exportWallet:exportPath
                                encryptWith:encryptionKey
                                completion:^(NSError *error, NSInteger exportHandle) {
     if (error != nil && error.code != 0)
     {
       NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
       reject(indyErrorCode, @"Error occurred while exporting wallet", error);
     } else {
       resolve(@(exportHandle));
     }
  }];
}

RCT_EXPORT_METHOD(setWalletItem: (NSString *) key
                          value: (NSString *) value
                       resolver: (RCTPromiseResolveBlock) resolve
                       rejecter: (RCTPromiseRejectBlock)reject)
{
  NSString *recordType = @"record_type";
  [[[ConnectMeVcx alloc] init] addRecordWallet:recordType
                                      recordId:key
                                   recordValue:value
                                    completion:^(NSError *error) {
    if (error != nil && error.code != 0)
    {
      NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
      reject(indyErrorCode, [NSString stringWithFormat:@"Error occurred while adding wallet item: %@ :: %ld",error.domain, (long)error.code], error);
    } else {
      resolve(@0);
    }
  }];
}

RCT_EXPORT_METHOD(getWalletItem: (NSString *) key
                       resolver: (RCTPromiseResolveBlock) resolve
                       rejecter: (RCTPromiseRejectBlock) reject)
{
  NSString *recordType = @"record_type";
  [[[ConnectMeVcx alloc] init] getRecordWallet:recordType
                                      recordId:key
                                    completion:^(NSError *error, NSString *result)
   {
     if (error != nil && error.code != 0)
     {
       NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
       reject(indyErrorCode, [NSString stringWithFormat:@"Error occurred while getting wallet item: %@ :: %ld",error.domain, (long)error.code], error);
     } else {
       resolve(result);
     }
   }];
}

RCT_EXPORT_METHOD(deleteWalletItem: (NSString *) key
                       resolver: (RCTPromiseResolveBlock) resolve
                       rejecter: (RCTPromiseRejectBlock) reject)
{
  NSString *recordType = @"record_type";
  [[[ConnectMeVcx alloc] init] deleteRecordWallet:recordType
                                         recordId:key
                                       completion:^(NSError *error) {
     if (error != nil && error.code != 0)
     {
       NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
       reject(indyErrorCode, [NSString stringWithFormat:@"Error occurred while deleting wallet item: %@ :: %ld",error.domain, (long)error.code], error);
     } else {
       resolve(@0);
     }
  }];
}

RCT_EXPORT_METHOD(updateWalletItem: (NSString *) key
                             value: (NSString *) value
                          resolver: (RCTPromiseResolveBlock) resolve
                          rejecter: (RCTPromiseRejectBlock) reject)
{
  NSString *recordType = @"record_type";

  [[[ConnectMeVcx alloc] init] updateRecordWallet:recordType
                                     withRecordId:key
                                  withRecordValue:value
                                   withCompletion:^(NSError *error) {
     if (error != nil && error.code != 0)
     {
       NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
       reject(indyErrorCode, [NSString stringWithFormat:@"Error occurred while updating wallet item: %@ :: %ld",error.domain, (long)error.code], error);
     } else {
       resolve(@0);
     }
  }];
}

RCT_EXPORT_METHOD(createWalletBackup: (NSString *) sourceID
                             withKey: (NSString *) backupKey
                          resolver: (RCTPromiseResolveBlock) resolve
                          rejecter: (RCTPromiseRejectBlock) reject)
{

  [[[ConnectMeVcx alloc] init] createWalletBackup:sourceID
                                  backupKey:backupKey
                                  completion:^(NSError *error, NSInteger walletBackupHandle) {
     if (error != nil && error.code != 0)
     {
       NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
       reject(indyErrorCode, [NSString stringWithFormat:@"Error occurred while creating wallet backup : %@ :: %ld",error.domain, (long)error.code], error);
     } else {
       resolve(@(walletBackupHandle));
     }
  }];
}

RCT_EXPORT_METHOD(backupWalletBackup: (NSInteger) walletBackupHandle
                             path: (NSString *) path
                          resolver: (RCTPromiseResolveBlock) resolve
                          rejecter: (RCTPromiseRejectBlock) reject)
{

  [[[ConnectMeVcx alloc] init] backupWalletBackup: walletBackupHandle
                                  path:path
                                  completion:^(NSError *error) {
     if (error != nil && error.code != 0)
     {
       NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
       reject(indyErrorCode, [NSString stringWithFormat:@"Error occurred while backing up wallet : %@ :: %ld",error.domain, (long)error.code], error);
     } else {
       resolve(@0);
     }
  }];
}

RCT_EXPORT_METHOD(updateWalletBackupState: (NSInteger) walletBackupHandle
                          resolver: (RCTPromiseResolveBlock) resolve
                          rejecter: (RCTPromiseRejectBlock) reject)
{

  [[[ConnectMeVcx alloc] init] updateWalletBackupState: walletBackupHandle
                                  completion:^(NSError *error, NSInteger state) {
     if (error != nil && error.code != 0)
     {
       NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
       reject(indyErrorCode, [NSString stringWithFormat:@"Error occurred while updating wallet backup state : %@ :: %ld",error.domain, (long)error.code], error);
     } else {
       NSNumber *val = [NSNumber numberWithInteger:state];
       resolve(val);
     }
  }];
}


RCT_EXPORT_METHOD(updateWalletBackupStateWithMessage: (NSInteger) walletBackupHandle
                             message: (NSString *) message
                          resolver: (RCTPromiseResolveBlock) resolve
                          rejecter: (RCTPromiseRejectBlock) reject)
{

  [[[ConnectMeVcx alloc] init] updateWalletBackupStateWithMessage: walletBackupHandle
                                  message:message
                                  completion:^(NSError *error, NSInteger state) {
     if (error != nil && error.code != 0)
     {
       NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
       reject(indyErrorCode, [NSString stringWithFormat:@"Error occurred while updating wallet backup state with message: %@ :: %ld",error.domain, (long)error.code], error);
     } else {
       NSNumber *val = [NSNumber numberWithInteger:state];
       resolve(val);
     }
  }];
}

RCT_EXPORT_METHOD(serializeBackupWallet: (NSInteger) walletBackupHandle
                          resolver: (RCTPromiseResolveBlock) resolve
                          rejecter: (RCTPromiseRejectBlock) reject)
{

  [[[ConnectMeVcx alloc] init] serializeBackupWallet: walletBackupHandle
                                  completion:^(NSError *error,  NSString *data) {
     if (error != nil && error.code != 0)
     {
       NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
       reject(indyErrorCode, [NSString stringWithFormat:@"Error occurred while serializing wallet backup : %@ :: %ld",error.domain, (long)error.code], error);
     } else {
       resolve(data);
     }
  }];
}

RCT_EXPORT_METHOD(restoreWallet: (NSString *) config
                          resolver: (RCTPromiseResolveBlock) resolve
                          rejecter: (RCTPromiseRejectBlock) reject)
{

  [[[ConnectMeVcx alloc] init] restoreWallet: config
                                  completion:^(NSError *error) {
     if (error != nil && error.code != 0)
     {
       NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
       reject(indyErrorCode, [NSString stringWithFormat:@"Error occurred while restoring Wallet : %@ :: %ld",error.domain, (long)error.code], error);
     } else {
       resolve(@0);
     }
  }];
}



RCT_EXPORT_METHOD(deserializeBackupWallet: (NSString *) message
                          resolver: (RCTPromiseResolveBlock) resolve
                          rejecter: (RCTPromiseRejectBlock) reject)
{

  [[[ConnectMeVcx alloc] init] deserializeBackupWallet: message
                                  completion:^(NSError *error,  NSInteger walletBackupHandle) {
     if (error != nil && error.code != 0)
     {
       NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
       reject(indyErrorCode, [NSString stringWithFormat:@"Error occurred while deserializing wallet backup : %@ :: %ld",error.domain, (long)error.code], error);
     } else {
       resolve(@(walletBackupHandle));
     }
  }];
}

RCT_EXPORT_METHOD(proofRetrieveCredentials:(NSInteger)proofHandle
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject)
{
  [[[ConnectMeVcx alloc] init] proofRetrieveCredentials:proofHandle
                                         withCompletion:^(NSError *error, NSString *matchingCredentials)
  {
    if (error != nil && error.code != 0) {
      NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
      reject(indyErrorCode, @"Error occurred while retrieving matching credentials", error);
    }
    else {
      resolve(matchingCredentials);
    }
  }];
}

RCT_EXPORT_METHOD(proofGenerate:(NSInteger)proofHandle
                  withSelectedCredentials:(NSString *)selectedCredentials
                  withSelfAttestedAttrs:(NSString *)selfAttestedAttributes
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject)
{
  [[[ConnectMeVcx alloc] init] proofGenerate:proofHandle
                     withSelectedCredentials:selectedCredentials
                       withSelfAttestedAttrs:selfAttestedAttributes
                              withCompletion:^(NSError *error)
  {
    if (error != nil && error.code != 0) {
      NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
      reject(indyErrorCode, @"Error occurred while generating proof", error);
    }
    else {
      resolve(@{});
    }
  }];
}

RCT_EXPORT_METHOD(proofSend:(NSInteger)proof_handle
                  withConnectionHandle:(NSInteger)connection_handle
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject)
{
  [[[ConnectMeVcx alloc] init] proofSend:proof_handle
                    withConnectionHandle:connection_handle
                          withCompletion:^(NSError *error)
  {
    if (error != nil && error.code != 0) {
      NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
      reject(indyErrorCode, @"Error occurred while sending proof", error);
    }
    else {
      resolve(@{});
    }
  }];
}

RCT_EXPORT_METHOD(proofReject:(NSInteger)proof_handle
                  withConnectionHandle:(NSInteger)connection_handle
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject)
{
  [[[ConnectMeVcx alloc] init] proofReject:proof_handle
                      withConnectionHandle:connection_handle
                            withCompletion:^(NSError *error)
   {
     if (error != nil && error.code != 0) {
       NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
       reject(indyErrorCode, @"Error occurred while rejecting proof", error);
     }
     else {
       resolve(@{});
     }
   }];
}

RCT_EXPORT_METHOD(proofGetState: (NSInteger) proofHandle
                               resolver: (RCTPromiseResolveBlock) resolve
                               rejecter: (RCTPromiseRejectBlock) reject)
{
  [[[ConnectMeVcx alloc] init] proofGetState:proofHandle
                                  completion:^(NSError *error, NSInteger state)
  {
    if (error != nil && error.code != 0) {
      NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
      reject(indyErrorCode, @"Error occurred while getting proof state", error);
    } else {
      resolve(@(state));
    }
  }];
}

RCT_EXPORT_METHOD(connectionRedirect:(NSInteger)redirect_connection_handle
                  withConnectionHandle:(NSInteger)connection_handle
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject)
{
  [[[ConnectMeVcx alloc] init] connectionRedirect:redirect_connection_handle
                      withConnectionHandle:connection_handle
                            withCompletion:^(NSError *error)
   {
     if (error != nil && error.code != 0) {
       NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
       reject(indyErrorCode, @"Error occurred while redirecting to existing connection", error);
     }
     else {
       resolve(@{});
     }
   }];
}

RCT_EXPORT_METHOD(getRedirectDetails:(NSInteger)connection_handle
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject)
{
  [[[ConnectMeVcx alloc] init] getRedirectDetails:connection_handle
                      withCompletion:^(NSError *error, NSString *redirectDetails)
  {
     if (error != nil && error.code != 0) {
       NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
       reject(indyErrorCode, @"Error occurred while getting redirect details", error);
     }
     else {
       resolve(redirectDetails);
     }
   }];
}

RCT_EXPORT_METHOD(connectionReuse:(NSInteger)connection_handle
                  invite: (NSString *)invite
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject)
{
  [[[ConnectMeVcx alloc] init] connectionSendReuse:connection_handle
                                            invite:invite
                                    withCompletion:^(NSError *error)
   {
     if (error != nil && error.code != 0) {
       NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
       reject(indyErrorCode, @"Error occurred while reusing to existing connection", error);
     }
     else {
       resolve(@{});
     }
   }];
}

RCT_EXPORT_METHOD(proofCreateWithRequest:(NSString*)sourceId
                  withProofRequest:(NSString*)proofRequest
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject)
{
  [[[ConnectMeVcx alloc] init] proofCreateWithRequest:sourceId
                                     withProofRequest:proofRequest
                                       withCompletion:^(NSError *error, vcx_proof_handle_t proofHandle)
  {
    if (error != nil && error.code != 0) {
      NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
      reject(indyErrorCode, @"Error occurred while creating proof request", error);
    }
    else {
      resolve(@(proofHandle));
    }
  }];
}

RCT_EXPORT_METHOD(proofSerialize:(NSInteger)proofHandle
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject)
{
  [[[ConnectMeVcx alloc] init] proofSerialize:proofHandle
                               withCompletion:^(NSError *error, NSString *proof_request)
  {
    if (error != nil && error.code != 0) {
      NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
      reject(indyErrorCode, @"Error occurred while serializing proof request", error);
    }
    else {
      resolve(proof_request);
    }
  }];
}

RCT_EXPORT_METHOD(proofDeserialize:(NSString *)serializedProof
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject)
{
  [[[ConnectMeVcx alloc] init] proofDeserialize:serializedProof
                                 withCompletion:^(NSError *error, vcx_proof_handle_t proofHandle)
  {
    if (error != nil && error.code != 0) {
      NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
      reject(indyErrorCode, @"Error occurred while de-serializing proof request", error);
    }
    else {
      resolve(@(proofHandle));
    }
  }];
}

RCT_EXPORT_METHOD(downloadMessages: (NSString *) messageStatus
                             uid_s: (NSString *) uid_s
                            pwdids: (NSString *) pwdids
                          resolver: (RCTPromiseResolveBlock) resolve
                          rejecter: (RCTPromiseRejectBlock) reject)
{
  [[[ConnectMeVcx alloc] init] downloadMessages: messageStatus uid_s:uid_s pwdids:pwdids completion:^(NSError *error, NSString *messages) {
    if (error != nil && error.code !=0) {
      NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
      reject(indyErrorCode, @"Error occured while downloading messages", error);
    } else{
      resolve(messages);
    }
  }];
}


RCT_EXPORT_METHOD(vcxGetAgentMessages: (NSString *) messageStatus
                             uid_s: (NSString *) uid_s
                          resolver: (RCTPromiseResolveBlock) resolve
                          rejecter: (RCTPromiseRejectBlock) reject)
{
  [[[ConnectMeVcx alloc] init] downloadAgentMessages: messageStatus uid_s:uid_s completion:^(NSError *error, NSString *messages) {
    if (error != nil && error.code !=0) {
      NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
      reject(indyErrorCode, @"Error occured while getting vcx agent messages", error);
    } else{
      resolve(messages);
    }
  }];
}

 RCT_EXPORT_METHOD(updateMessages: (NSString *)messageStatus
                      pwdidsJson: (NSString *)pwdidsJson
                        resolver: (RCTPromiseResolveBlock) resolve
                        rejecter: (RCTPromiseRejectBlock) reject)
{
  [[[ConnectMeVcx alloc] init] updateMessages:messageStatus pwdidsJson:pwdidsJson completion:^(NSError *error) {
    if (error != nil && error.code !=0) {
      NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
      reject(indyErrorCode, @"Error occured while updating message status", error);
    } else {
      resolve(@{});
    }
  }];
}

RCT_EXPORT_METHOD(getTokenInfo:(NSInteger) paymentHandle
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject)
{
  [[[ConnectMeVcx alloc] init] getTokenInfo:paymentHandle withCompletion:^(NSError *error, NSString *tokenInfo) {
    if (error != nil && error.code != 0)
    {
      NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
      reject(indyErrorCode, @"Error occurred while getting token info", error);
    } else {
      resolve(tokenInfo);
    }
  }];
}

RCT_EXPORT_METHOD(sendTokens:(NSInteger) paymentHandle
                  withTokens:(NSString *) tokens
                  withRecipient:(NSString *) recipient
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject)
{
  [[[ConnectMeVcx alloc] init] sendTokens:paymentHandle
                               withTokens:tokens
                            withRecipient:recipient
                           withCompletion:^(NSError *error, NSString *recipient)
  {
    if (error != nil && error.code != 0)
    {
      NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
      reject(indyErrorCode, @"Error occurred while sending tokens", error);
    } else {
      resolve(recipient);
    }
  }];
}

RCT_EXPORT_METHOD(createPaymentAddress:(NSString*)seed
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject)
{
  [[[ConnectMeVcx alloc] init] createPaymentAddress:seed
                                     withCompletion:^(NSError *error, NSString *address)
  {
    if (error != nil && error.code != 0)
    {
      NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
      reject(indyErrorCode, @"Error occurred while creating payment address", error);
    } else {
      resolve(address);
    }
  }];
}

RCT_EXPORT_METHOD(createWalletKey: (NSInteger) lengthOfKey
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject)
{
  // Generate secure random string
  NSMutableData *data = [NSMutableData dataWithLength:lengthOfKey];
  int result = SecRandomCopyBytes(NULL, lengthOfKey, data.mutableBytes);
  if (result == 0) {
    NSString* value = [data base64EncodedStringWithOptions:0];
    resolve(value);
  } else {
    reject(@"W-001", @"Error occurred while generating wallet key", nil);
  }
}

RCT_EXPORT_METHOD(getLedgerFees: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject)
{
  [[[ConnectMeVcx alloc] init] getLedgerFees:^(NSError *error, NSString *fees) {
    if (error != nil && error.code != 0)
    {
      NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
      reject(indyErrorCode, @"Error occurred while getting ledger fees", error);
    } else {
      resolve(fees);
    }
  }];
}

RCT_EXPORT_METHOD(getBiometricError: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject)
{
    LAContext *context = [[LAContext alloc] init];
    NSError *error;

    if ([context canEvaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics error:&error]) {
      resolve(@"");
        // Device does not support TouchID
    } else {
      NSString *errorReason;
      switch (error.code) {
          case kLAErrorBiometryNotEnrolled:
              errorReason = @"BiometricsNotEnrolled";
              break;
          case kLAErrorBiometryLockout:
              errorReason = @"BiometricsLockOut";
              break;
          default:
              errorReason = @"default";
              break;
        }
        reject(errorReason, @"TouchIDBiometricsLockOut", nil);
    }
}

RCT_EXPORT_METHOD(appendTxnAuthorAgreement:(NSString *)requestJson
                  withAgreement:(NSString *)text
                  withVersion:(NSString *)version
                  withDigest:(NSString *)taaDigest
                  withMechanism:(NSString *)mechanism
                  withTimestamp:(NSInteger)time
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject)
{
  NSNumber *val = [NSNumber numberWithInteger:time];
  [IndySdk appendTxnAuthorAgreement:requestJson
                            withAgreement:text
                            withVersion:version
                            withDigest:taaDigest
                            withMechanism:mechanism
                            withTimestamp:val
                            completion:^(NSError *error, NSString *jsonResult)
  {
    if (error != nil && error.code != 0)
    {
      NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
      reject(indyErrorCode, @"Error occurred while appending TxnAuthorAgreement", error);
    } else {
      resolve(jsonResult);
    }
  }];
}


RCT_EXPORT_METHOD(getTxnAuthorAgreement:(RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject)
{
  [[[ConnectMeVcx alloc] init] getTxnAuthorAgreement: ^(NSError *error, NSString *authorAgreement)
  {
    if (error != nil && error.code != 0)
    {
      NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
      reject(indyErrorCode, @"Error occurred while getting TxnAuthorAgreement", error);
    } else {
      resolve(authorAgreement);
    }
  }];
}


RCT_EXPORT_METHOD(getAcceptanceMechanisms:(NSString *)requesterDID
                  withTimestamp:(NSInteger)timestamp
                  withVersion:(NSString *)version
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject)
{
  NSNumber *val = [NSNumber numberWithInteger: timestamp];
  [IndySdk getAcceptanceMechanisms: val
                  withVersion:version
                  fromRequester:requesterDID
                  completion:^(NSError *error, NSString *jsonResult)
  {
    if (error != nil && error.code != 0)
    {
      NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
      reject(indyErrorCode, @"Error occurred while getting Acceptance Mechanisms", error);
    } else {
      resolve(jsonResult);
    }
  }];
}

RCT_EXPORT_METHOD(setActiveTxnAuthorAgreementMeta:(NSString *)text
                  withVersion:(NSString *)version
                  withDigest:(NSString *)taaDigest
                  withMechanism:(NSString *)mechanism
                  withTimestamp:(NSInteger)time
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject)
{
  [[[ConnectMeVcx alloc] init] activateTxnAuthorAgreement: text
                            withVersion:version
                            withHash: taaDigest
                            withMechanism: mechanism
                            withTimestamp: time
  ];
   resolve(@{});
}

RCT_EXPORT_METHOD(fetchPublicEntities:(RCTPromiseResolveBlock) resolve
                             rejecter: (RCTPromiseRejectBlock) reject)
{
  [[[ConnectMeVcx alloc] init] fetchPublicEntities:^(NSError *error)
   {
     if (error != nil && error.code != 0) {
       NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
       reject(indyErrorCode, @"Error occurred while rejecting proof", error);
     }
     else {
       resolve(@{});
     }
   }];
}

RCT_EXPORT_METHOD(connectionSendAnswer: (NSInteger) connectionHandle
                  question: (NSString *) question
                  answer: (NSString *)answer
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject)
{
  [[[ConnectMeVcx alloc] init] connectionSendAnswer:connectionHandle
                                         question:question
                                            answer:answer
                                      withCompletion:^(NSError *error)
   {
     if (error != nil && error.code != 0) {
       NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
       reject(indyErrorCode, @"Error occurred while sending answer", error);
     }
     else {
       resolve(@{});
     }
   }];
}

// delete connection
RCT_EXPORT_METHOD(deleteCredential:(NSInteger) credentialHandle
                          resolver: (RCTPromiseResolveBlock) resolve
                          rejecter: (RCTPromiseRejectBlock) reject)
{
  [[[ConnectMeVcx alloc] init] deleteCredential:credentialHandle
                                     completion:^(NSError *error)
  {
     if (error != nil && error.code != 0)
     {
       NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
       reject(indyErrorCode, @"Error occurred while deleting connection", error);
     } else {
        resolve(@{});
     }
  }];
}

 RCT_EXPORT_METHOD(vcxInitPool: (NSString *)config
                   resolver: (RCTPromiseResolveBlock) resolve
                   rejecter: (RCTPromiseRejectBlock) reject)
{
  [[[ConnectMeVcx alloc] init] initPool:config completion:^(NSError *error) {
    if (error != nil && error.code !=0) {
      NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
      reject(indyErrorCode, @"Error occurred while updating message status", error);
    } else {
      resolve(@{});
    }
  }];
}

RCT_EXPORT_METHOD(credentialReject:(NSInteger)credential_handle
                  connectionHandle:(NSInteger)connection_handle
                           comment:(NSString *)comment
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject)
{
  [[[ConnectMeVcx alloc] init] credentialReject:credential_handle
                               connectionHandle:connection_handle
                                        comment:comment
                                     completion:^(NSError *error)
   {
     if (error != nil && error.code != 0) {
       NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
       reject(indyErrorCode, @"Error occurred while rejecting proof", error);
     }
     else {
       resolve(@{});
     }
   }];
}

RCT_EXPORT_METHOD(credentialGetPresentationProposal:(NSInteger)credential_handle
                                           resolver: (RCTPromiseResolveBlock) resolve
                                           rejecter: (RCTPromiseRejectBlock) reject)
{
  [[[ConnectMeVcx alloc] init] credentialGetPresentationProposal:credential_handle
                                                      completion:^(NSError *error, NSString *presentationProposal)
  {
    if (error != nil && error.code != 0)
    {
      NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
      reject(indyErrorCode, @"Error occurred while getting Presentation Proposal", error);
    } else {
      resolve(presentationProposal);
    }
  }];
}

RCT_EXPORT_METHOD(createConnection:(NSString *)sourceId
                             resolver: (RCTPromiseResolveBlock) resolve
                             rejecter: (RCTPromiseRejectBlock) reject)
{
  [[[ConnectMeVcx alloc] init] connectionCreateInvite:sourceId
                                           completion:^(NSError *error, NSInteger connectionHandle)
  {
    if (error != nil && error.code != 0)
    {
      NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
      reject(indyErrorCode, @"Error occurred while creating connection", error);
    } else {
      resolve(@(connectionHandle));
    }
  }];
}

RCT_EXPORT_METHOD(createOutOfBandConnection:(NSString *)sourceId
                                   goalCode:(NSString *)goalCode
                                       goal:(NSString *)goal
                                  handshake:(BOOL *)handshake
                              requestAttach:(NSString *)requestAttach
                                   resolver: (RCTPromiseResolveBlock) resolve
                                   rejecter: (RCTPromiseRejectBlock) reject)
{
  [[[ConnectMeVcx alloc] init] connectionCreateOutofband:sourceId
                                                goalCode:goalCode
                                                    goal:goal
                                               handshake:handshake
                                           requestAttach:requestAttach
                                              completion:^(NSError *error, NSInteger connectionHandle)
  {
    if (error != nil && error.code != 0)
    {
      NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
      reject(indyErrorCode, @"Error occurred while creating connection", error);
    } else {
      resolve(@(connectionHandle));
    }
  }];
}

RCT_EXPORT_METHOD(getConnectionInvite:(NSInteger)connection_handle
                             resolver: (RCTPromiseResolveBlock) resolve
                             rejecter: (RCTPromiseRejectBlock) reject)
{
  [[[ConnectMeVcx alloc] init] getConnectionInviteDetails:connection_handle
                                              abbreviated:FALSE
                                               withCompletion:^(NSError *error, NSString *invitation)
  {
    if (error != nil && error.code != 0)
    {
      NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
      reject(indyErrorCode, @"Error occurred while getting connection invitation", error);
    } else {
      resolve(invitation);
    }
  }];
}

RCT_EXPORT_METHOD(getRequestRedirectionUrl:(NSString *)url
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject)
{
  NSURLSession *session = [NSURLSession sessionWithConfiguration:[NSURLSessionConfiguration defaultSessionConfiguration]
                                                        delegate:[URLSessionWithoutRedirection new]
                                                   delegateQueue:[NSOperationQueue mainQueue]];

  NSURL *urlObj = [NSURL URLWithString:url];
  NSURLSessionDataTask *dataTask = [session dataTaskWithURL: urlObj
                completionHandler:^(NSData *data, NSURLResponse *responseObj, NSError *error) {
    if (error != nil) {
      reject(@"Failed to fetch URL", @"Failed to fetch URL", error);
      return;
    }

    NSHTTPURLResponse* response =(NSHTTPURLResponse*)responseObj;

    long stuts = (long)[response statusCode];

    if (stuts != 302) {
      reject(@"Failed to fetch URL: unexpected response status", @"Failed to fetch URL: unexpected response status", error);
      return;
    }

    NSDictionary* headers = [(NSHTTPURLResponse*)response allHeaderFields];
    NSString* location = [headers objectForKey:@"location"];

    resolve(location);
  }];
  [dataTask resume];
}

  /*
   * Proof Verifier API
   */
RCT_EXPORT_METHOD(createProofVerifierWithProposal:(NSString *)sourceId
                              presentationProposal:(NSString *)presentationProposal
                                              name:(NSString *)name
                                          resolver: (RCTPromiseResolveBlock) resolve
                                          rejecter: (RCTPromiseRejectBlock) reject)
{
    [[[ConnectMeVcx alloc] init] createProofVerifierWithProposal:sourceId
                                            presentationProposal:presentationProposal
                                                            name:name
                                                      completion:^(NSError *error, NSInteger handle) {
      if (error != nil && error.code != 0)
      {
        NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
        reject(indyErrorCode, @"Error occurred while creating proof verifier with proposal", error);
      } else {
        resolve(@(handle));
      }
    }];
}

RCT_EXPORT_METHOD(proofVerifierUpdateState: (NSInteger) proofHandle
                                  resolver: (RCTPromiseResolveBlock) resolve
                                  rejecter: (RCTPromiseRejectBlock) reject)
{
  [[[ConnectMeVcx alloc] init] proofVerifierUpdateState:proofHandle
                                             completion:^(NSError *error, NSInteger state)
  {
    if (error != nil && error.code != 0) {
      NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
      reject(indyErrorCode, @"Error occurred while updating proof verifier state", error);
    } else {
      resolve(@(state));
    }
  }];
}

RCT_EXPORT_METHOD(proofVerifierUpdateStateWithMessage: (NSInteger) proofHandle
                                              message:(NSString *)message
                                             resolver: (RCTPromiseResolveBlock) resolve
                                             rejecter: (RCTPromiseRejectBlock) reject)
{
  [[[ConnectMeVcx alloc] init] proofVerifierUpdateStateWithMessage:proofHandle
                                                           message:message
                                                        completion:^(NSError *error, NSInteger state)
  {
    if (error != nil && error.code != 0) {
      NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
      reject(indyErrorCode, @"Error occurred while updating proof verifier state", error);
    } else {
      resolve(@(state));
    }
  }];
}

RCT_EXPORT_METHOD(proofVerifierGetState: (NSInteger) proofHandle
                               resolver: (RCTPromiseResolveBlock) resolve
                               rejecter: (RCTPromiseRejectBlock) reject)
{
  [[[ConnectMeVcx alloc] init] proofVerifierGetState:proofHandle
                                          completion:^(NSError *error, NSInteger state)
  {
    if (error != nil && error.code != 0) {
      NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
      reject(indyErrorCode, @"Error occurred while getting proof verifier state", error);
    } else {
      resolve(@(state));
    }
  }];
}

RCT_EXPORT_METHOD(proofVerifierSendRequest: (NSInteger) proofHandle
                          connectionHandle: (NSInteger) connectionHandle
                                  resolver: (RCTPromiseResolveBlock) resolve
                                  rejecter: (RCTPromiseRejectBlock) reject)
{
  [[[ConnectMeVcx alloc] init] proofVerifierSendRequest:proofHandle
                                       connectionHandle:connectionHandle
                                             completion:^(NSError *error) {
    if (error != nil && error.code != 0)
    {
      NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
      reject(indyErrorCode, @"Error occurred while sending proof request", error);
    }
    else {
      resolve(@{});
    }
  }];
}

RCT_EXPORT_METHOD(proofVerifierSerialize: (NSInteger)proofHandle
                                resolver: (RCTPromiseResolveBlock) resolve
                                rejecter: (RCTPromiseRejectBlock) reject)
{
  [[[ConnectMeVcx alloc] init] proofVerifierSerialize:proofHandle
                                           completion:^(NSError *error, NSString *serialized) {
    if (error != nil && error.code != 0)
    {
      NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
      reject(indyErrorCode, @"Error occurred while serializing proof verifier", error);
    }else{
      resolve(serialized);
    }
  }];
}

RCT_EXPORT_METHOD(proofVerifierDeserialize: (NSString *)serialized
                                  resolver: (RCTPromiseResolveBlock) resolve
                                  rejecter: (RCTPromiseRejectBlock) reject)
{
  [[[ConnectMeVcx alloc] init] proofVerifierDeserialize:serialized
                                             completion:^(NSError *error, NSInteger proofHandle) {
    if (error != nil && error.code != 0) {
      NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
      reject(indyErrorCode, @"Error occurred while deserializing proof verifier", error);
    }
    else {
      resolve(@(proofHandle));
    }
  }];
}

RCT_EXPORT_METHOD(proofVerifierGetProofMessage:(NSInteger) proofHandle
                                      resolver: (RCTPromiseResolveBlock) resolve
                                      rejecter: (RCTPromiseRejectBlock) reject)
{
  [[[ConnectMeVcx alloc] init] proofVerifierGetProofMessage:proofHandle
                                                 completion:^(NSError *error, NSInteger proofState, NSString *message)
  {
    if (error != nil && error.code != 0) {
      NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
      reject(indyErrorCode, @"Error occurred while getting proof", error);
    }
    else {
      resolve(@{
        @"proofState": @(proofState),
        @"message": message
      });
    }
  }];
}

RCT_EXPORT_METHOD(proofVerifierGetPresentationRequest:(NSInteger)proofHandle
                             resolver: (RCTPromiseResolveBlock) resolve
                             rejecter: (RCTPromiseRejectBlock) reject)
{
  [[[ConnectMeVcx alloc] init] proofVerifierGetProofRequestMessage:proofHandle
                                                        completion:^(NSError *error, NSString *message)
  {
    if (error != nil && error.code != 0)
    {
      NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
      reject(indyErrorCode, @"Error occurred while getting proof request message", error);
    } else {
      resolve(message);
    }
  }];
}

RCT_EXPORT_METHOD(createPairwiseAgent: (RCTPromiseResolveBlock) resolve
                             rejecter: (RCTPromiseRejectBlock) reject)
{
  [[[ConnectMeVcx alloc] init] createPairwiseAgent:^(NSError *error, NSString *agentInfo)
  {
    if (error != nil && error.code != 0)
    {
      NSString *indyErrorCode = [NSString stringWithFormat:@"%ld", (long)error.code];
      reject(indyErrorCode, @"Error occurred while creating pairwise agent", error);
    } else {
      resolve(agentInfo);
    }
  }];
}

typedef void (^FailureHandleErrorBlock)(NSError* error, NSString *errorType);

RCT_EXPORT_METHOD(getDeviceCheckToken: (RCTPromiseResolveBlock) resolve
                             rejecter: (RCTPromiseRejectBlock) reject)
{
  FailureHandleErrorBlock failureBlock = ^void(NSError* error, NSString *errorType) {
        NSString *errorDomain = [NSString stringWithFormat:@"com.apple.devicecheck.error.%@", errorType ?: @"ios-version-not-supported"];
        if (!error) {
            error = [[NSError alloc] initWithDomain:errorDomain
                                               code:400
                                           userInfo:@{
                                                      NSLocalizedDescriptionKey: @"This device does not support the apple devicecheck, due to below iOS 11 version or simulator."
                                                      }];
        }
        reject(errorDomain, error.localizedDescription, error);
    };

    if (@available(iOS 11.0, *)) {
        if (DCDevice.currentDevice.supported) {
            [DCDevice.currentDevice generateTokenWithCompletionHandler:^(NSData * _Nullable token, NSError * _Nullable error) {
                if (!error && token && token.length > 0) {
                    NSData *data64 = [token base64EncodedDataWithOptions:NSDataBase64Encoding64CharacterLineLength];
                    NSString *token64 = [[NSString alloc] initWithData:data64 encoding:NSUTF8StringEncoding];
                    resolve(token64);
                } else if (error) {
                    failureBlock(error, @"cannot-create");
                } else {
                    failureBlock(nil, @"unknown-trouble-to-create-token");
                }
            }];
        } else {
            failureBlock(nil, @"device-not-supported");
        }
    } else {
        failureBlock(nil, nil);
    }
}

@end
