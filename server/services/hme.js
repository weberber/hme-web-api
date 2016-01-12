let SerialPort = require("serialport").SerialPort;
let Encode = require("./encode");

export default class Hme {
  constructor (serialPortName) {
    this.serialPortName = serialPortName;
    this.serialPortIsOpen = false;
    this.serialPort = undefined;
    this.restComm = [128,1,0,0,0,0,0,50,1,0,0,0,0,0,1,0,0,53,1,0];
    this.encode = new Encode();
    this.RxBufArry = [999];
  }

  sleep = function(ms = 0){
    return new Promise(r => setTimeout(r, ms));
  }


  hello = (app) => {
    let hello = 'yes!';
    return {hello};
  }

  connectSerialPort = async () => {
    try {
      if(this.serialPortName != undefined){

        let serialPort = new SerialPort(this.serialPortName, {baudrate: 115200}, true);
        this.serialPort = serialPort

        this.serialPortIsOpen = await new Promise((resolve, reject) => {
          serialPort.on ('open', function () {
            resolve(true)
          });
        });

        console.log('=== openSerialPort ===', this.serialPortIsOpen);
        this._eventsSetup();
        return true;
      } else {
        return false;
        console.log('=== connectSerialPort without serialPortName ===');
      }
    } catch (e) {
      throw e;
    }
  }

  ping = async () => {
    try {
      let serialPort = this.serialPort;
      let restComm = this.restComm;

      let result = await new Promise((resolve, reject) => {
        serialPort.write(restComm, function(err, results) {
          if(err) return reject(err);

          resolve(results);
          console.log('TX1 Num =' + results);
        });
      });

      return result;
    } catch (e) {
      throw e;
    }
  }





  UartTxRx = async ({Comm,RxLen}) => {
    try {
      let serialPort = this.serialPort;
      let Rxarry = this.RxBufArry ;
      let DataBufArry =[];
      let T1num = 0;

      let result = await new Promise((resolve, reject) => {
        //Rxarry= [1];
        Rxarry.length = 0;
        serialPort.write(Comm, function(err, results) {
          if(err) return reject(err);

          var T2id = setTimeout(function(){
            console.log('drain eer' );
            return reject(results);
          },1000);

          serialPort.drain(function (error) {
            console.log('UART drain');
            var T1id = setInterval(function(){
              T1num++;
              if (Rxarry.length == RxLen) {
                results = Rxarry;
                clearInterval(T1id);
                clearTimeout(T2id);
                return resolve(results);
              } else if (T1num > 20) {
                console.log('TimeOut!');
                results = [];
                clearInterval(T1id);
                clearTimeout(T2id);
                return resolve(results);
              } else if (Rxarry.length > RxLen) {
                console.log('DataErr!');
                results = [];
                clearInterval(T1id);
                clearTimeout(T2id);
                return resolve(results);
              } else {

              }
            } ,4);
          });
        });
      });
      return result;
    } catch (e) {
      console.log('ERROR!!');
      throw e;
    }
  }



  SearchDevice = async () => {
    try {
      let ReDevArry = [];
      let ReDataArry = [];
      let params = {
        u8DevID:1,
        groupID:0,
        sFunc:'WordRd',
        u8DataNum:1,
        u8Addr_Arry:[1031],  //Device group
        u8DataIn_Arry:[],
        u8Mask_Arry:[],
        RepeatNum:1
      }
      let params2 = {
        Comm:[],
        RxLen:11
      }
      let DecodParams = {
        FuncCT:33,
        DevID:1,
        u8RxDataArry:[]
      }

      for (let i = 1; i < 300; i++) {
        params.u8DevID = i;
        console.log('Search DevID:',params.u8DevID);
        params2.Comm = this.encode.ClientOp(params);
        console.log('Sech Comm=',params2.Comm);

        DecodParams.u8RxDataArry =  await this.UartTxRx(params2);
        DecodParams.DevID = i;
        ReDataArry = this.encode.RxDecode(DecodParams);
        if (ReDataArry.length != 0) {
          console.log('out =', i);
          console.log('out =',ReDataArry);
          let DevData = {
            DevID:i,
            DevGroup:ReDataArry[0]
          }
          ReDevArry.push(DevData);
          console.log('out =',ReDevArry);
        }
      }
      return(ReDevArry);
    } catch (e) {
      throw e;
    }
  }

  testAll = async () => {
    try {
      await this.testGroup(0, 0)
      return (true);
    } catch (e) {
      throw e;
    }
  }

  testDevID = async (DevID) => {
    try {
      console.log('DevID:',DevID);
      return (await this.testDevice(DevID,0));
    } catch (e) {
      throw e;
    }
  }

  testGroup = async (groupID) => {
    try {
      let BrightArry = [5000, 10, 5000, 10, 5000, 10];
      let serialPort = this.serialPort;
      let triggerTimeMs = 500;
      let DevID = 0;

      let LedBghParams = {
        DevID:DevID,
        groupID:groupID,
        Led1Bgt:0,
        Led2Bgt:0,
        Led3Bgt:0,
        Led4Bgt:0,
        Led5Bgt:0
      }
      console.log('DevID:',DevID);
      console.log('groupID:',groupID);
      console.log('LedBghParams:',LedBghParams);
      await this.setLedBrighter(LedBghParams);
      await this.setLedCtrlMode(DevID, groupID, 'Interact');
      for (var i in BrightArry) {
        LedBghParams.Led1Bgt = BrightArry[i];
        LedBghParams.Led2Bgt = BrightArry[i];
        LedBghParams.Led3Bgt = BrightArry[i];
        LedBghParams.Led4Bgt = BrightArry[i];
        LedBghParams.Led5Bgt = BrightArry[i];
        await this.setLedBrighter(LedBghParams);
        await this.sleep(triggerTimeMs);
      }
      await this.setLedBrighter(LedBghParams);
      await this.sleep(triggerTimeMs);
      await this.setLedCtrlMode(DevID, groupID, 'Normal');
      return (true);
    } catch (e) {
      throw e;
    }
  }

  testDevice = async (DevID, groupID) => {
    try {
      let BrightArry = [5000, 10, 5000, 10, 5000, 10];
      let serialPort = this.serialPort;
      let triggerTimeMs = 500;

      let LedBghParams = {
        DevID:DevID,
        groupID:groupID,
        Led1Bgt:0,
        Led2Bgt:0,
        Led3Bgt:0,
        Led4Bgt:0,
        Led5Bgt:0
      }
      console.log('testDevice,DevID:',DevID,'groupID:',groupID);
      if (await this.setLedBrighter(LedBghParams) == false){
        return (false);
      }
      if ( await this.setLedCtrlMode(DevID, groupID, 'Interact') == false){
        return (false);
      }

      for (var i in BrightArry) {
        LedBghParams.Led1Bgt = BrightArry[i];
        LedBghParams.Led2Bgt = BrightArry[i];
        LedBghParams.Led3Bgt = BrightArry[i];
        LedBghParams.Led4Bgt = BrightArry[i];
        LedBghParams.Led5Bgt = BrightArry[i];
        if ( await this.setLedBrighter(LedBghParams) == false){
          return (false);
        }
        await this.sleep(triggerTimeMs);
      }

      if ( await this.setLedCtrlMode(DevID, groupID, 'Normal') == false){
        return (false);
      }
      return (true);

    } catch (e) {
      throw e;
    }
  }


  setLedCtrlMode = async (DevID, groupID, CtrlMode) => {
    try {
      let CtrlModeTable = {'Normal':0, 'Fast':1, 'Interact':2};
      let COpParams = {
        u8DevID:DevID,
        groupID:groupID,
        sFunc:'WordWt',
        u8DataNum:1,
        u8Addr_Arry:[100],  //Device group
        u8DataIn_Arry:[CtrlModeTable[CtrlMode]],
        u8Mask_Arry:[],
        RepeatNum:5
      }
      let TxParams = {
        Comm:[],
        RxLen:8
      }
      let DecodParams = {
        FuncCT:49,
        DevID:DevID,
        u8RxDataArry:[]
      }
      console.log('setLedCtrlMode,DevID:',DevID,'groupID:',groupID);
      TxParams.Comm = this.encode.ClientOp(COpParams);
      DecodParams.u8RxDataArry =  await this.UartTxRx(TxParams);
      if(this.encode.u3ByteToWord(DecodParams.u8RxDataArry.slice(1,4)) == DevID || DevID == 0){
        return (true);
      } else {
        return (false);
      };


    } catch (e) {
      throw e;
    }
  }

  setLedBrighter = async ({DevID, groupID, Led1Bgt, Led2Bgt, Led3Bgt, Led4Bgt, Led5Bgt}) => {
    try {
      let COpParams = {
        u8DevID:DevID,
        groupID:groupID,
        sFunc:'WordWt',
        u8DataNum:5,
        u8Addr_Arry:[90],
        u8DataIn_Arry:[Led1Bgt,Led2Bgt,Led3Bgt,Led4Bgt,Led5Bgt],
        u8Mask_Arry:[],
        RepeatNum:1
      }
      let TxParams = {
        Comm:[],
        RxLen:8
      }
      let DecodParams = {
        FuncCT:49,
        DevID:DevID,
        u8RxDataArry:[]
      }
      console.log('setLedBrighter,COpParams:',COpParams);
      console.log('setLedBrighter,DevID:',DevID,'groupID:',groupID);
      TxParams.Comm = this.encode.ClientOp(COpParams);
      DecodParams.u8RxDataArry =  await this.UartTxRx(TxParams);
      if(this.encode.u3ByteToWord(DecodParams.u8RxDataArry.slice(1,4)) == DevID || DevID == 0){
        //await this.setLedCtrlMode(DevID, groupID,'Interact');
        return (true);
      } else {
        return (false);
      };

    } catch (e) {
      throw e;
    }
  }

  setLedBrigh = async ({DevID, groupID, LedCH, BrighNum}) => {
    try {
      let COpParams = {
        u8DevID:DevID,
        groupID:groupID,
        sFunc:'WordWt',
        u8DataNum:1,
        u8Addr_Arry:[],
        u8DataIn_Arry:[BrighNum],
        u8Mask_Arry:[],
        RepeatNum:1
      }

      switch (LedCH) {
        case 'All':
          COpParams.u8DataNum = 5;
          COpParams.u8Addr_Arry = [90];
          COpParams.u8DataIn_Arry = [BrighNum, BrighNum, BrighNum, BrighNum, BrighNum];
          break;
        case 'LedCH1':
          COpParams.u8Addr_Arry = [90];
          break;
        case 'LedCH2':
          COpParams.u8Addr_Arry = [91];
          break;
        case 'LedCH3':
          COpParams.u8Addr_Arry = [92];
          break;
        case 'LedCH4':
          COpParams.u8Addr_Arry = [93];
          break;
        case 'LedCH5':
          COpParams.u8Addr_Arry = [94];
          break;
        default:
          console.log('setLedBrigh_LedCH_ERROR');
      }
      let TxParams = {
        Comm:[],
        RxLen:8
      }
      let DecodParams = {
        FuncCT:49,
        DevID:DevID,
        u8RxDataArry:[]
      }
      console.log('setLedBrighter,COpParams:',COpParams);
      console.log('setLedBrighter,DevID:',DevID,'groupID:',groupID);
      TxParams.Comm = this.encode.ClientOp(COpParams);
      DecodParams.u8RxDataArry =  await this.UartTxRx(TxParams);
      if(this.encode.u3ByteToWord(DecodParams.u8RxDataArry.slice(1,4)) == DevID || DevID == 0){
        //await this.setLedCtrlMode(DevID, groupID,'Interact');
        if ( await this.setLedCtrlMode(DevID, groupID, 'Interact') == false){
          return (false);
        }
        return (true);
      } else {
        return (false);
      };

    } catch (e) {
      throw e;
    }
  }

  setLedDisplay = async ({devID, groupID, WW, DB, BL, GR, RE, Bright}) => {
    try {

        let setParams = {
          DevID:DevID,
          groupID:groupID,
          Led1Bgt:DBBright * Bright,
          Led2Bgt:BLBright * Bright,
          Led3Bgt:GRBright * Bright,
          Led4Bgt:REBright * Bright,
          Led5Bgt:WWBright * Bright
        }

        let result = await this.setLedCtrlMode(DevID, groupID, 'Interact');
        if (result == false) {
            return (result);
        }

        result = await this.setLedBrighter(setParams);
        return (result);
    } catch (e) {
      throw e;
    }
  }

  setGroupID = async (DevID, groupID) => {
    try {
        let COpParams = {
        u8DevID:DevID,
        groupID:0,
        sFunc:'WordWt',
        u8DataNum:1,
        u8Addr_Arry:[1031], //Device group
        u8DataIn_Arry:[groupID],
        u8Mask_Arry:[],
        RepeatNum:5
      }
      let TxParams = {
        Comm:[],
        RxLen:8
      }
      let DecodParams = {
        FuncCT:49,
        DevID:DevID,
        u8RxDataArry:[]
      }

      TxParams.Comm = this.encode.ClientOp(COpParams);
      DecodParams.u8RxDataArry =  await this.UartTxRx(TxParams);
      if(this.encode.u3ByteToWord(DecodParams.u8RxDataArry.slice(1,4)) == DevID){
        if (this.writeFlashMemory(DevID,0)){
          return (true);
        }else {
          return (false);
        }
      } else {
        return (false);
      };


    } catch (e) {
      throw e;
    }
  }

  writeFlashMemory = async (DevID, groupID) => {
    try {
        let COpParams = {
        u8DevID:DevID,
        groupID:groupID,
        sFunc:'WordWt',
        u8DataNum:1,
        u8Addr_Arry:[1021],  //Addr 1021 = FMC Wr
        u8DataIn_Arry:[1],
        u8Mask_Arry:[],
        RepeatNum:5
      }
      let TxParams = {
        Comm:[],
        RxLen:8
      }
      let DecodParams = {
        FuncCT:49,
        DevID:DevID,
        u8RxDataArry:[]
      }

      TxParams.Comm = this.encode.ClientOp(COpParams);
      DecodParams.u8RxDataArry =  await this.UartTxRx(TxParams);
      if(this.encode.u3ByteToWord(DecodParams.u8RxDataArry.slice(1,4)) == DevID){
        return (true);
      } else {
        return (false);
      };


    } catch (e) {
      throw e;
    }
  }

  setDayTab = async (devID, groupID, dayTab) => {
    try {
        let COpParams = {
        u8DevID:devID,
        groupID:groupID,
        sFunc:'WordWt',
        u8DataNum:18,
        u8Addr_Arry:[1100],  //Addr 1100 = day table
        u8DataIn_Arry:dayTab,
        u8Mask_Arry:[],
        RepeatNum:5
      }
      let TxParams = {
        Comm:[],
        RxLen:8
      }
      let DecodParams = {
        FuncCT:49,
        DevID:devID,
        u8RxDataArry:[]
      }

      TxParams.Comm = this.encode.ClientOp(COpParams);
      console.log('setDayTab.COpParams =', COpParams);
      DecodParams.u8RxDataArry =  await this.UartTxRx(TxParams);
      if(this.encode.u3ByteToWord(DecodParams.u8RxDataArry.slice(1,4)) == devID){
        return (true);
      } else {
        return (false);
      };


    } catch (e) {
      throw e;
    }
  }

  setTimeTab = async (devID, groupID, timeTab) => {
    try {
        let COpParams = {
        u8DevID:devID,
        groupID:groupID,
        sFunc:'WordWt',
        u8DataNum:0,
        u8Addr_Arry:[1200],  //Addr 1200 = time table
        u8DataIn_Arry:[],
        u8Mask_Arry:[],
        RepeatNum:5
      }
      let TxParams = {
        Comm:[],
        RxLen:8
      }
      let DecodParams = {
        FuncCT:49,
        DevID:devID,
        u8RxDataArry:[]
      }

      let index = 0;
      while (timeTab.length >  index) {
        if ((timeTab.length - index) > 50) {
          COpParams.u8DataNum = 50;
          COpParams.u8Addr_Arry = [(1200 + index)];
          COpParams.u8DataIn_Arry = timeTab.slice(index, index + COpParams.u8DataNum);
          index += COpParams.u8DataNum;
        } else {
          COpParams.u8DataNum = timeTab.length - index;
          COpParams.u8Addr_Arry = [(1200 + index)];
          COpParams.u8DataIn_Arry = timeTab.slice(index, index + COpParams.u8DataNum);
          index += COpParams.u8DataNum;
        }
        console.log('COpParams', COpParams);
        TxParams.Comm = this.encode.ClientOp(COpParams);
        DecodParams.u8RxDataArry =  await this.UartTxRx(TxParams);
        if(this.encode.u3ByteToWord(DecodParams.u8RxDataArry.slice(1,4)) != devID){
          return (false);
        }
      }
      return (true);

    } catch (e) {
      throw e;
    }
  }


  writeTimeTabToDevice= async (config) => {
    try {
          let devID = config.Device;
          let groupID = config.Group;

          let timeTabArry = this.encode.configToTimeTabArry(config);
          // console.log(timeTabArry.dayTab);
          // console.log(devID);
          console.log(timeTabArry.dayTab);
          let result = await this.setDayTab(devID, groupID, timeTabArry.dayTab);
          if(result == false){
            return (false);
          }
          result = await this.setTimeTab(devID, groupID, timeTabArry.timePwmTab);
          if(result == false){
            return (false);
          }
          result = await this.writeFlashMemory(devID, groupID)
          if(result == false){
            return (false);
          }

          return (true);

    } catch (e) {
      throw e;
    }
  }



  // accessDevice = async ({DevID, groupID, sFunc, dataNum, addrArry, dataInArry, maskArry, repeatNum}) => {
  //   try {
  //       let COpParams = {
  //       u8DevID:DevID,
  //       groupID:groupID,
  //       sFunc:sFunc,
  //       u8DataNum:dataNum,
  //       u8Addr_Arry:addrArry,
  //       u8DataIn_Arry:dataInArry,
  //       u8Mask_Arry:maskArry,
  //       RepeatNum:repeatNum
  //     }
  //
  //     let TxParams = {
  //       Comm:[],
  //       RxLen:undefined
  //     }
  //
  //     let FuncCommTable = {'Inital':0, 'Close':0, 'BitModify':17, 'BitInv':18, 'WordRd':33, 'DiscWordRd':34,
  //   					'WordWt':49, 'DiscWordWt':50};
  //
  //     if (sFunc == 'WordRd' || sFunc == 'DiscWordRd') {
  //       TxParams.RxLen = 8 + (dataNum * 3);
  //     } else {
  //       TxParams.RxLen = 8;
  //     }
  //
  //     TxParams.Comm = this.encode.ClientOp(COpParams);
  //
  //     let DecodParams = {
  //       FuncCT:(FuncCommTable[sFunc] & 0x7f),
  //       DevID:DevID,
  //       u8RxDataArry:[]
  //     }
  //
  //     TxParams.Comm = this.encode.ClientOp(COpParams);
  //     DecodParams.u8RxDataArry =  await this.UartTxRx(TxParams);
  //     if(this.encode.u3ByteToWord(DecodParams.u8RxDataArry.slice(1,4)) == DevID){
  //       return (true);
  //     } else {
  //       return (false);
  //     };
  //
  //
  //   } catch (e) {
  //     throw e;
  //   }
  // }





  _eventsSetup = () => {
    let serialPort = this.serialPort;
    let RxBufArry = this.RxBufArry

    console.log('=== start eventsSetup ===');

    serialPort.on('data', function(data) {
      //var buff = new Buffer(data)
      //console.log(this);
      console.log('RXdata len: ' + data.length);
      for (let i = 0; i < data.length; i++) {
        RxBufArry.push(data[i]);
        // console.log(data[i]);
      }
    });

  }
}
