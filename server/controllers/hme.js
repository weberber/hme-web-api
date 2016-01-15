exports.hello = function *() {
  console.log('=== services ===', services);
  let result = yield services.hme.hello()

  this.body = {result}
};


exports.ping = function *() {
  let result = yield services.hme.ping();
  this.body = {result}
};


exports.searchDevice = function *() {
  let result = yield services.hme.SearchDevice();
  yield services.deviceControl.saveDevice(result);
  console.log('controller',result);

  this.body = result
};

exports.findAllDeviceGroups = function *() {
  // let result = await models.groups.findAll();
  let result = [
    {
      id: 1
    },
    {
      id: 2
    },
    {
      id: 3
    }
  ];
  this.body = result
}

exports.setLedDisplay = function *() {
  let data = this.request.body;
  console.log('setLedDisplay',data);
  let result = yield services.hme.setLedDisplay(data);
  this.body = result
};

exports.testAllDevices = function *() {
  let result = yield services.hme.testAll();
  this.body = result
}

exports.testDeviceByID = function *() {
  let devID = this.params.id;
  let result = yield services.hme.testDevID(devID);
  this.body = result
}

exports.testGruopByID = function *() {
  let groupID = this.params.id;
  let result = yield services.hme.testGroup(groupID);
  this.body = result
}

exports.getCachedDeviceList = function *() {
  try {
    let result = yield services.hme.getCachedDeviceList();
    this.body = result;
  } catch (e) {
    throw e;
  }
}
