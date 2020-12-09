//
//  ReactNativeMobileSDK.m
//  ReactNativeMobileSDK
//
//  Created by Predrag Jevtic on 10/15/20.
//

#import "ReactNativeMobileSDK.h"

@implementation ReactNativeMobileSDK

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(getModuleList: (RCTResponseSenderBlock)callback)
{
   NSArray *nativeModuleList = @[@"react-native-fbsdk", @"react-native-camera", @"react-native-maps"];
   callback(@[[NSNull null], nativeModuleList]);
}

@end
