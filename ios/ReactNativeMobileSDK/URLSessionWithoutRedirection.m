#import <Foundation/Foundation.h>
#import "URLSessionWithoutRedirection.h"

@implementation URLSessionWithoutRedirection

- (void)URLSession:(NSURLSession *)session
              task:(NSURLSessionTask *)task
willPerformHTTPRedirection:(NSHTTPURLResponse *)response
        newRequest:(NSURLRequest *)request
 completionHandler:(void (^)(NSURLRequest *))completionHandler{
  completionHandler(nil);
}

@end
