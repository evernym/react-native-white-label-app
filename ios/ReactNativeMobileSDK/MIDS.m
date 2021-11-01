//
//  MIDS.m
//  ConnectMe
//
//  Created by evernym on 29/07/21.
//  Copyright © 2021 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#if __has_include(<React/RCTBridgeModule.h>)
#import <React/RCTBridgeModule.h>
#elif __has_include(“RCTBridgeModule.h”)
#import “RCTBridgeModule.h”
#else
#import “React/RCTBridgeModule.h” // Required when used as a Pod in a Swift project
#endif


@interface RCT_EXTERN_MODULE(MIDSDocumentVerification, NSObject)

RCT_EXTERN_METHOD(initMIDSSDK: (NSString *) token
                  withDataCenter: (NSString *) dataCenter
                  resolver: (RCTResponseSenderBlock *)resolve
                  rejecter: (RCTResponseSenderBlock *)reject)

RCT_EXTERN_METHOD(getCountryList: (RCTResponseSenderBlock *)resolve
                  rejecter: (RCTResponseSenderBlock *)reject)

RCT_EXTERN_METHOD(getDocumentTypes: (NSString *)countryCode
                  resolver: (RCTResponseSenderBlock *)resolve
                  rejecter: (RCTResponseSenderBlock *)reject)

RCT_EXTERN_METHOD(startMIDSSDKScan: (NSString *)documentType
                  policyVersion: (NSString *)version
                  resolver: (RCTResponseSenderBlock *)resolve
                  rejecter: (RCTResponseSenderBlock *)reject)

RCT_EXTERN_METHOD(terminateSDK: (RCTResponseSenderBlock *)resolve
                  rejecter: (RCTResponseSenderBlock *)reject)

@end
