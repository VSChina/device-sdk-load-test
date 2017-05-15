var Registry = require('azure-iothub').Registry.fromConnectionString("HostName=iot-mj95.azure-devices.net;SharedAccessKeyName=iothubowner;SharedAccessKey=mLXcv0xMUk04VUuLIjbr2tYJLDXGjPOE7js4uItENZo=");
var exec = require('child_process').exec;
var util = require('util');
var fs = require('fs');
var cmd = 'docker run -i --rm -v C:/Users/v-zhq/.m2:/root/.m2 -v C:/Users/v-zhq/IoT/javatest4/test2:/usr/src/mj -w /usr/src/mj maven:3.5.0-jdk-8 mvn exec:java -Dexec.args="%s %d"'; // remove compile cmd to avoid conflict volume

var cmd2 = 'mvn exec:java -Dexec.args="%s %d"';

var NUM_OF_DEVICES = 100;
var NUM_MESSAGE_PER_DEVICE = 10;
var stat = {
    numExec: 0,
    numDone: 0,
    numFail: 0,
    changedTimes:{},
    msgSent:{},
    msgRespond:{},
    devices: {}, // changed_times,msg_sent,msg_respond
};

main();
function main() {
    var deviceCS = [];
    Registry.list((err, deviceList) => {
        if (err) {
            console.log('mjerror')
        } else {
            console.log(`${deviceList.length} device(s) found.`);
            var reg = new RegExp("device(\\d+)");
            deviceList.forEach((device) => {
                var matches = reg.exec(device.deviceId);
                if (matches) {
                    if (parseInt(matches[1]) >= 0 && parseInt(matches[1]) < NUM_OF_DEVICES) {
                        deviceCS.push({
                            id: device.deviceId,
                            cs: "HostName=iot-mj95.azure-devices.net;DeviceId=" + device.deviceId + ";SharedAccessKey=" + device.authentication.symmetricKey.primaryKey
                        });
                    }
                }
            });
            console.log(util.format("Devices retrieved. (%d/%d)", deviceCS.length, NUM_OF_DEVICES));
            for (var i = 0; i < NUM_OF_DEVICES; i++) {
                exec(util.format(cmd2, deviceCS[i].cs, NUM_MESSAGE_PER_DEVICE), { maxBuffer: 1024 * 500, cwd:"C:/Users/v-zhq/IoT/javatest4/test2" }, (function (id, error, stdout, stderr) {
                    if (error) {
                        console.log("Error with "+ id + "\n" + error);
                        stat.numDone++;
                        stat.numFail++;
                    } else {
                        console.log(util.format("Device %s complete. (%d/%d)", id, ++stat.numDone, NUM_OF_DEVICES));
                        stdout = stdout.substring(stdout.indexOf('Starting...'));

                    }
                    var m1 = stdout.match(/Sampling rate changed to/g);
                    var m2 = stdout.match(/Sending Message zhqqi/g);
                    var m3 = stdout.match(/IoT Hub responded to message \d+/g);
                    if (!stat.devices[id]) {
                        stat.devices[id] = {};
                    }
                    stat.devices[id].changed_times = (m1 == null ? 0 : m1.length);
                    stat.devices[id].msg_sent = (m2 == null ? 0 : m2.length);
                    stat.devices[id].msg_respond = (m3 == null ? 0 : m3.length);
                    fs.writeFile("log/" + id + ".log", stdout, () => { });
                    if (stat.numDone == NUM_OF_DEVICES) {
                        //finished
                        for(var d in stat.devices) {
                            if(! stat.changedTimes[stat.devices[d].changed_times]) {
                                stat.changedTimes[stat.devices[d].changed_times] = 1;
                            }else {
                                stat.changedTimes[stat.devices[d].changed_times]++; 
                            }
                            if(! stat.msgSent[stat.devices[d].msg_sent]) {
                                stat.msgSent[stat.devices[d].msg_sent] = 1;
                            }else {
                                stat.msgSent[stat.devices[d].msg_sent]++; 
                            }
                            if(! stat.msgRespond[stat.devices[d].msg_respond]) {
                                stat.msgRespond[stat.devices[d].msg_respond] = 1;
                            }else {
                                stat.msgRespond[stat.devices[d].msg_respond]++; 
                            }
                        }
                        console.log(stat);
                        fs.writeFile("log/main.log", util.inspect(stat), () => { });
                    }
                }).bind(this, deviceCS[i].id));
                console.log(util.format("Device %s started. (%d/%d)", deviceCS[i].id, ++stat.numExec, NUM_OF_DEVICES));
            }
        }
    });
}




function addDevice(num) {
    var devices = [];
    for (var i = 0; i < num; i++) {
        devices.push({ deviceId: "device" + i });
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
    if (devices.length != 0) {
            Registry.addDevices(devices, ((i, err, b, c) => {
                if (err) {
                    console.log("error" + err.message);
                }
                console.log("finished with " + i);
            }).bind(this, i + 1));
            devices = [];
        }
}

function removeDevice(num) {
    var devices = [];
    for (var i = 0; i < num; i++) {
        devices.push({ deviceId: "device" + i });
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