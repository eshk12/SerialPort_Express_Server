const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors());
const SerialPort = require('serialport');
const Readline = SerialPort.parsers.Readline;
var comPort = 'COM7',
    wasalive,
    lastDataTime,
    lastresult,
    count = 0,
    lastDataTime,
    comStatus,
    error;
var port = new SerialPort(comPort, {autoOpen: false, baudRate: 9600});

function open() {
    console.log('~ Trying to connect.');
    port.open(function (err) {
        if (!err){
            wasalive = true;
            comStatus = true;
            console.log('~ ' + comPort + ' Has been open.');
            return;
        }
        console.log('Error: ' + err.message + ', Trying again in 5s.');
        error = 'Cable is unplugged.';
        setTimeout(open, 5000);
    });
}
open();
const parser = port.pipe(new Readline());
port.on('open', function () {
    if (!port.isOpen)
        return console.log('Error: Port closed. Data Cannot recived..');

    console.log('~ Entering Data flow mode..');
    parser.on('data', function (data) {
        lastDataTime = Date.now();
        wasalive = true;
        comStatus = true;
        lastDataTime = Date.now();
        if (++count == 10) {
            count = 0;
            lastresult = data;
        }
    });
});

setInterval(function () {
    if ((Date.now() - lastDataTime > 2500 || !comStatus) && wasalive) {
        comStatus = false;
        if (port.isOpen) {
            error = 'Device is off.';
        }
    } else {
        comStatus = false;
        error = 'Cable is unplugged.';
    }
}, 1500);


port.on('close', function () {
    console.log('Error: Close event has fired.');
    error = 'Cable is unplugged.';
    console.log(error);
    open();
});

setTimeout(function(){
    app.listen(3000, function () {
        console.log('~ Express Service has been started.')
    })
},5000);

app.get('/', function (req, res) {
    res.send((comStatus) ? lastresult : 'Error: ' + error);
    console.log(lastresult ? lastresult : 'N/A');
});
app.get('/getPorts', function (req, res) {
    var Devices = [];
    SerialPort.list(function (err, ports) {
        ports.forEach(function (port) {
            Devices.push(port.comName + '---' + port.pnpId);
        });
        res.send(JSON.stringify(Devices));
    });
});

