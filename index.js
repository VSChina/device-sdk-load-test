var Registry = require('azure-iothub').Registry.fromConnectionString("HostName=zhqqi-iot3.azure-devices.net;SharedAccessKeyName=iothubowner;SharedAccessKey=dN8WuSEfFvwdcoAFRR/T+iFEzPMI3lWChIHSty6JDGs=");
var exec = require('child_process').exec;
var util = require('util');
var cmd = 'docker run -i --rm -v C:/Users/v-zhq/IoT/javatest4/test2:/usr/src/mj -w /usr/src/mj maven mvn compile exec:java -Dexec.args="%s %d"';

var NUM = 100;
var NUM_MESSAGE_PER_DEVICE = 100;
var stat = {
    numExec:0,
    numDone:0,
};
main();
function main() {
    var deviceCS = [];
    Registry.list((err, deviceList) => {
        if (err) {
            console.log('mjerror')
        } else {
            console.log(`${deviceList.length} device(s) found.`);
            var reg = new RegExp("d(\\d+)");
            deviceList.forEach((device) => {
                var matches = reg.exec(device.deviceId);
                if (matches) {
                    if (parseInt(matches[1]) >= 0 && parseInt(matches[1]) < NUM) {
                        deviceCS.push({
                            id:device.deviceId,
                            cs:"HostName=zhqqi-iot3.azure-devices.net;DeviceId=" + device.deviceId + ";SharedAccessKey=" + device.authentication.symmetricKey.primaryKey
                        });
                    }
                }
            });
            console.log(util.format("Devices retrieved. (%d/%d)",deviceCS.length,NUM));
            for (var i = 0; i < NUM; i++) {
                exec(util.format(cmd,deviceCS[i].cs,NUM_MESSAGE_PER_DEVICE), { maxBuffer: 1024 * 500 }, (function (id, error, stdout, stderr) {
                    if (error) {
                        console.log(error.message);
                    } else {
                        console.log(util.format("Device %s complete. (%d/%d)",id,++stat.numDone,NUM));
                        console.log(stdout);
                    }
                }).bind(deviceCS[i].id));
                console.log(util.format("Device %s started. (%d/%d)",deviceCS[i].id,++stat.numExec,NUM));
            }
        }
    });
}




function addDevice(num) {
    var devices = [];
    for (var i = 0; i < num; i++) {
        devices.push({ deviceId: "d" + i });
        if (devices.length == 100) {
            Registry.addDevices(devices, ((i, err, b, c) => {
                if (err) {
                    console.log("error" + err.message);
                }
                console.log("finished with " + i);
            }).bind(this, i + 1));
            devices = [];
        }
    }

}

function removeDevice(num) {
    var devices = [];
    for (var i = 0; i < num; i++) {
        devices.push({ deviceId: "d" + i });
        if (devices.length == 100) {
            Registry.removeDevices(devices, false, ((i, err, b, c) => {
                if (err) {
                    console.log("error" + err.message);
                }
                console.log("finished with " + i);
            }).bind(this, i + 1));
            devices = [];
        }
    }
}

// addDevice(500);
// removeDevice(500);