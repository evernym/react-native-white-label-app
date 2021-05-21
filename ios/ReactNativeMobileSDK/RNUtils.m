//  Created by react-native-create-bridge

#import "RNUtils.h"
#import <LocalAuthentication/LocalAuthentication.h>
#import <React/RCTUtils.h>
#import "React/RCTConvert.h"
#include <pthread/pthread.h>

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

#import <CommonCrypto/CommonHMAC.h>
#import "URLSessionWithoutRedirection.h"

@implementation RNUtils

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

NSString* makeUrlSafe(NSString* base64Encoded) {
  return [[base64Encoded stringByReplacingOccurrencesOfString:@"/" withString:@"_"] stringByReplacingOccurrencesOfString:@"+" withString:@"-"];
}

NSString* makeUrlSafeToNoWrap(NSString* base64Encoded) {
  return [[base64Encoded stringByReplacingOccurrencesOfString:@"_" withString:@"/"] stringByReplacingOccurrencesOfString:@"-" withString:@"+"];
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

@end
