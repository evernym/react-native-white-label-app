yarn --cwd ../../.. copyfiles -su 4 "node_modules/@evernym/react-native-white-label-app/src/evernym-sdk/*.js" ./app
yarn --cwd ../../.. copyfiles -su 4 "node_modules/@evernym/react-native-white-label-app/files/patches/*.patch" ./
yarn --cwd ../../.. copyfiles -su 4 "node_modules/@evernym/react-native-white-label-app/files/patches/*.m" ./
(cd ../../.. && npx npm-add-script -k postinstall -v "patch-package")
yarn --cwd ../../.. install
echo "Evernym React Native SDK configured successfully"