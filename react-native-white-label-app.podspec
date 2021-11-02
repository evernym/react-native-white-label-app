require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "react-native-white-label-app"
  s.version      = package["version"]
  s.summary      = "React Native version of Evernym's ConnectMe mobileSDK."
  s.description  = package["description"]
  s.homepage     = "https://gitlab.com/evernym/mobile/react-native-white-label-app.git"
  # brief license entry:
  s.license      =  { :type => 'MIT', :file => 'LICENSE' }
  s.authors      = { "Evernym Inc." => "info@evernym.com" }
  s.platforms    = { :ios => "11.0" }
  s.source       = { :git => "https://gitlab.com/evernym/mobile/react-native-white-label-app.git", :tag => "#{s.version}" }
  s.swift_version = '5.0'

  s.source_files = "ios/**/*.{h,c,m,swift,xib}"
  s.requires_arc = true

  s.vendored_frameworks = 'ios/Frameworks/MIDSAssistSDK.xcframework', 'ios/Frameworks/MIDSVerificationSDK.xcframework'

  s.dependency "React-Core"
  s.dependency "vcx"
  s.dependency "JumioMobileSDK", '~>3.9.0'
  s.dependency "JumioMobileSDK/Netverify", '~>3.9.0'
  s.dependency "JumioMobileSDK/NetverifyBase", '~>3.9.0'
  s.dependency "JumioMobileSDK/NetverifyNFC", '~>3.9.0'
  s.dependency "JumioMobileSDK/NetverifyBarcode", '~>3.9.0'
  s.dependency "JumioMobileSDK/NetverifyFace+iProov", '~>3.9.0'
  s.dependency "JumioMobileSDK/NetverifyFace+Zoom", '~>3.9.0'
  s.dependency "JumioMobileSDK/DocumentVerification", '~>3.9.0'
  s.dependency "JumioMobileSDK/BAMCheckout", '~>3.9.0'

end
