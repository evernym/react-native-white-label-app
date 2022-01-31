yarn --cwd ../../.. copyfiles -su 4 "node_modules/@evernym/react-native-white-label-app/src/evernym-sdk/*.js" ./app
(cd ../../.. && npx npm-add-script -k postinstall -v "patch-package --patch-dir ./node_modules/@evernym/react-native-white-label-app/files/patches")
yarn --cwd ../../.. install
echo "Evernym React Native SDK configured successfully"
