check_if_emulator_is_running(){
    emus=$(adb devices)
    if [[ ${emus} = *"emulator"* ]]; then
        echo "emulator is running"
        until adb -e shell "ls /storage/emulated/0/"
        do
            echo "waiting emulator FS"
            sleep 30
        done
    else
        echo "emulator is not running"
        exit 1
    fi
}

sleep 10
check_if_emulator_is_running