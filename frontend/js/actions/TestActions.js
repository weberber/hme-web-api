import request from 'axios'

export const REQUEST_SCAN = 'REQUEST_SCAN'
export const RECEIVED_SCAN = 'RECEIVED_SCAN'
export const REQUEST_DEVICEGROUP = 'REQUEST_DEVICEGROUP'
export const RECEIVED_DEVICEGROUP = 'RECEIVED_DEVICEGROUP'
export const RECEIVED_SLAVE_LIST = 'RECEIVED_SLAVE_LIST'

export const RECEIVED_TEST_SET_LED_DISPLAY = 'RECEIVED_TEST_SET_LED_DISPLAY'
export const SCANNING = 'SCANNING'


//test
export function requestTestSetLedDisplay(data) {
  return (dispatch) => {
    return request
      .post(`/rest/slave/${data.groupID}/device/${data.devID}/setLedDisplay`,data)
      .then(response => dispatch(receivedTestSetLedDisplay(response.data)));
  };
}

export function receivedTestSetLedDisplay(data) {
  return {
    type: RECEIVED_TEST_SET_LED_DISPLAY,
    data
  }
}

export function requestTestOneDevice(deviceID) {
  return (dispatch) => {
    return request
      .get(`/rest/slave/0/device/${deviceID}/test`)
  };
}

export function requestTestAllDevices(slaveID) {
  return (dispatch) => {
    return request
      .get(`/rest/slave/${slaveID}/test/all`)
  };
}

// device list
export function requestGetCachedDeviceList() {
  return (dispatch) => {
    return request
      .get(`/rest/slave/0/getCachedDeviceList`)
      .then(response => dispatch(receivedScan(response.data)));
  }
}

export function requestScan() {
  // dispatch(function() {return {type: REQUEST_LOGIN});
  return (dispatch) => {
    return request
      .get('/rest/slave/0/searchDevice')
      .then(response => dispatch(requestGetCachedDeviceList()));
  };
}

export function receivedScan(data) {
  return {
    type: RECEIVED_SCAN,
    data
  }
}



// slave list
export function requestGetCachedSlaveList() {
  return (dispatch) => {
    return request
    .get(`/rest/hme/getCachedSlaveList`)
    .then(response => dispatch(receivedSlaveList(response.data)));
  }
}

export function receivedSlaveList(data) {
  return {
    type: RECEIVED_SLAVE_LIST,
    data
  }
}

export function requestSearchSlave() {
  return (dispatch) => {
    return request
      .get(`/rest/hme/searchSlave`)
      .then(response => {
        dispatch(requestGetCachedSlaveList());
      });
  }
}


export function requestSearchSlaveAndDevice() {
  return (dispatch) => {
    dispatch(scanStatus('loading'));
    return request
      .get(`/rest/master/syncAllSlaveAndDevice`)
      .then(response => {
        dispatch(requestGetSlaveAndDeviceList());
      });
  }
}

// export function requestSearchSlaveAndDeviceSetp2() {
//   // dispatch(function() {return {type: REQUEST_LOGIN});
//   return request
//     .get('/rest/slave/0/searchDevice')
//     .then(response => {
//       requestGetCachedDeviceList();
//       requestGetCachedSlaveList();
//       // dispatch(scanStatus('hide'));
//     });
// }


export function requestGetSlaveAndDeviceList () {
  return (dispatch) => {
    dispatch(scanStatus('loading'));
    return request
      .get('/rest/hme/getCachedSlaveAndDeviceList')
      .then((response) => {
        dispatch(receivedSlaveList(response.data.slaveList));
        dispatch(receivedScan(response.data.deviceList));
        dispatch(scanStatus('hide'));
      });
  }
  // let [slaveList, deviceList] = await Promise.all([request.get(`/rest/hme/getCachedSlaveList`), request.get(`/rest/slave/0/getCachedDeviceList`)]);
  // return (dispatch) => {
  //   dispatch(receivedSlaveList(slaveList));
    // dispatch(receivedScan(deviceList));
  // }
}

export function scanStatus(data) {
  return {
    type: SCANNING,
    data
  }
}

// tmp
export function receivedDeviceGroup(data) {
  return {
    type: RECEIVED_DEVICEGROUP,
    data
  }
}

export function requestTestGroupDevices(groupID) {
  return (dispatch) => {
    return request
      .get(`/rest/slave/${groupID}/test`)
  };
}

export function requestDeviceGroup(slaveID) {
  // dispatch(function() {return {type: REQUEST_LOGIN});
  return (dispatch) => {
    return request
      .get(`/rest/slave/${slaveID}/findAllDeviceGroups`)
      .then(response => dispatch(receivedDeviceGroup(response.data)));
  };
}
