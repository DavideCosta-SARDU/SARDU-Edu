import { describe, expect, test } from 'vitest'
import {
  ARDUINO_BACKEND,
  ARDUINO_BOARDS,
  ARDUINO_HARDWARE_DEFINITIONS,
  compileArduinoProgram,
  generateArduinoSketch,
  generateSarduLiveFirmware,
} from '../src/arduino'

const block = (
  id: string,
  opcode: string,
  options: {
    next?: string | null
    topLevel?: boolean
    fields?: Record<string, { value: string }>
    inputs?: Record<string, { block: string | null }>
  } = {},
) => ({
  id,
  opcode,
  next: options.next ?? null,
  topLevel: options.topLevel ?? false,
  fields: options.fields ?? {},
  inputs: options.inputs ?? {},
})

describe('Arduino definitions', () => {
  test('declares the Arduino C++ backend and the initial boards', () => {
    expect(ARDUINO_BACKEND).toMatchObject({
      id: 'arduino-cpp',
      language: 'Arduino C/C++',
      modes: ['standalone', 'realtime'],
    })
    expect(ARDUINO_BOARDS.map((board) => board.id)).toEqual([
      'arduino-uno', 'arduino-nano', 'esp32-dev-module', 'esp32-s2-dev-module',
      'esp32-s3-dev-module', 'esp32-c3-dev-module', 'esp32-cam-ai-thinker',
    ])
    expect(ARDUINO_BOARDS.every((board) => board.backendIds.includes(ARDUINO_BACKEND.id))).toBe(true)
    expect(ARDUINO_HARDWARE_DEFINITIONS.backends.get(ARDUINO_BACKEND.id)).toBe(ARDUINO_BACKEND)
    expect(ARDUINO_HARDWARE_DEFINITIONS.components.get('dht11-dht22')).toMatchObject({
      boardIds: ['arduino-uno', 'arduino-nano'],
      modes: ['standalone', 'realtime'],
    })
    expect(ARDUINO_HARDWARE_DEFINITIONS.components.get('hc-sr04')?.modes).toEqual(['standalone', 'realtime'])
    expect(ARDUINO_HARDWARE_DEFINITIONS.components.get('servo')?.modes).toEqual(['standalone', 'realtime'])
  })

  test('declares Uno and Nano pins and communication buses', () => {
    const uno = ARDUINO_HARDWARE_DEFINITIONS.boards.get('arduino-uno')
    const nano = ARDUINO_HARDWARE_DEFINITIONS.boards.get('arduino-nano')

    expect(uno).toMatchObject({ processor: 'ATmega328P', operatingVoltage: 5 })
    expect(uno?.pins.find((pin) => pin.id === '3')?.capabilities).toContain('pwm')
    expect(uno?.buses.find((bus) => bus.type === 'i2c')?.signals).toEqual({ sda: 'A4', scl: 'A5' })
    expect(nano?.pins.find((pin) => pin.id === 'A7')?.capabilities).toEqual(['analog-input'])
  })
})

describe('generateArduinoSketch', () => {
  test('generates independent servo and HC-SR04 support', () => {
    const blocks = {
      program: block('program', 'sarduBoard_program', {
        topLevel: true,
        inputs: { SUBSTACK2: { block: 'servo' } },
      }),
      servo: block('servo', 'sarduActuators_setServoAngle', {
        next: 'servoWait',
        fields: { PIN: { value: '9' } },
        inputs: { ANGLE: { block: 'angle' } },
      }),
      angle: block('angle', 'math_number', { fields: { NUM: { value: '90' } } }),
      servoWait: block('servoWait', 'sarduActuators_setServoAngleAndWait', {
        next: 'printAngle',
        fields: { PIN: { value: '9' } },
        inputs: { ANGLE: { block: 'angleWait' }, MILLIS: { block: 'servoDelay' } },
      }),
      angleWait: block('angleWait', 'math_number', { fields: { NUM: { value: '45' } } }),
      servoDelay: block('servoDelay', 'math_number', { fields: { NUM: { value: '200' } } }),
      printAngle: block('printAngle', 'sarduBoard_serialPrintln', {
        next: 'printDistance',
        inputs: { VALUE: { block: 'servoAngle' } },
      }),
      servoAngle: block('servoAngle', 'sarduActuators_servoAngle', {
        fields: { PIN: { value: '9' } },
      }),
      printDistance: block('printDistance', 'sarduBoard_serialPrintln', {
        inputs: { VALUE: { block: 'distance' } },
      }),
      distance: block('distance', 'sarduSensors_ultrasonicDistance', {
        fields: { TRIGGER: { value: '7' }, ECHO: { value: '8' }, UNIT: { value: 'inch' } },
      }),
    }

    const source = generateArduinoSketch({ boardId: 'arduino-uno', targets: [{ blocks }] })

    expect(source).toContain('#include <Servo.h>')
    expect(source).toContain('Servo servo_9;')
    expect(source).toContain('servo_9.attach(9);')
    expect(source).toContain('servo_9.write(90);')
    expect(source).toContain('servo_9.write(45);\n  delay(200);')
    expect(source).toContain('Serial.println(servo_9.read());')
    expect(source).toContain('#include <Ultrasonic.h>')
    expect(source).toContain('Ultrasonic ultrasonic_7_8(7, 8);')
    expect(source).toContain('ultrasonic_7_8.read(INC)')
  })

  test('generates DHT11 temperature and humidity reads for serial debugging', () => {
    const blocks = {
      program: block('program', 'sarduBoard_program', {
        topLevel: true,
        inputs: { SUBSTACK2: { block: 'temperaturePrint' } },
      }),
      temperaturePrint: block('temperaturePrint', 'sarduBoard_serialPrintln', {
        next: 'humidityPrint',
        inputs: { VALUE: { block: 'temperatureJoin' } },
      }),
      temperatureJoin: block('temperatureJoin', 'operator_join', {
        inputs: { STRING1: { block: 'temperatureLabel' }, STRING2: { block: 'temperature' } },
      }),
      temperatureLabel: block('temperatureLabel', 'text', { fields: { TEXT: { value: 'temperatura ' } } }),
      temperature: block('temperature', 'sarduSensors_dhtTemperature', {
        fields: { MODEL: { value: 'DHT11' }, PIN: { value: '2' } },
      }),
      humidityPrint: block('humidityPrint', 'sarduBoard_serialPrintln', {
        inputs: { VALUE: { block: 'humidity' } },
      }),
      humidity: block('humidity', 'sarduSensors_dhtHumidity', {
        fields: { MODEL: { value: 'DHT11' }, PIN: { value: '2' } },
      }),
    }

    const source = generateArduinoSketch({ boardId: 'arduino-uno', targets: [{ blocks }] })

    expect(source).toContain('#include <DHT.h>')
    expect(source).toContain('DHT sardu_dht_dht11_2(2, DHT11);')
    expect(source).toContain('sardu_dht_dht11_2.begin();')
    expect(source).toContain('Serial.println((String("temperatura ") + String(((int)sardu_dht_dht11_2.readTemperature()))));')
    expect(source).toContain('Serial.println(((int)sardu_dht_dht11_2.readHumidity()));')
  })

  test('generates VL53L0X and NeoPixel code only when their blocks are used', () => {
    const blocks = {
      program: block('program', 'sarduBoard_program', {topLevel: true, inputs: {SUBSTACK: {block: 'neoConfig'}, SUBSTACK2: {block: 'printLaser'}}}),
      neoConfig: block('neoConfig', 'sarduActuators_configureNeoPixel', {next: 'neoColor', fields: {PIN: {value: '6'}}, inputs: {COUNT: {block: 'count'}}}),
      count: block('count', 'math_number', {fields: {NUM: {value: '8'}}}),
      neoColor: block('neoColor', 'sarduActuators_setNeoPixelRgb', {next: 'neoShow', fields: {PIN: {value: '6'}}, inputs: {PIXEL: {block: 'pixel'}, RED: {block: 'red'}, GREEN: {block: 'zero'}, BLUE: {block: 'zero'}}}),
      pixel: block('pixel', 'math_number', {fields: {NUM: {value: '0'}}}),
      red: block('red', 'math_number', {fields: {NUM: {value: '255'}}}),
      zero: block('zero', 'math_number', {fields: {NUM: {value: '0'}}}),
      neoShow: block('neoShow', 'sarduActuators_showNeoPixels', {fields: {PIN: {value: '6'}}}),
      printLaser: block('printLaser', 'sarduBoard_serialPrintln', {inputs: {VALUE: {block: 'laser'}}}),
      laser: block('laser', 'sarduSensors_laserDistance', {fields: {UNIT: {value: 'mm'}}})
    }

    const source = generateArduinoSketch({boardId: 'arduino-uno', targets: [{blocks}]})
    expect(source).toContain('#include <VL53L0X.h>')
    expect(source).toContain('#include <Adafruit_NeoPixel.h>')
    expect(source).toContain('Adafruit_NeoPixel neopixel_6;')
    expect(source).toContain('neopixel_6.updateLength(8);')
    expect(source).toContain('neopixel_6.setPixelColor(0, 255, 0, 0);')
    expect(source).toContain('Serial.println(vl53l0x.readRangeSingleMillimeters());')
  })

  test('generates a Blink sketch from Arduino blocks', () => {
    const blocks = {
      program: block('program', 'sarduBoard_program', {
        topLevel: true,
        inputs: {
          SUBSTACK: { block: 'setupWrite' },
          SUBSTACK2: { block: 'high' },
        },
      }),
      setupWrite: block('setupWrite', 'sarduBoard_setDigitalPin', {
        fields: { PIN: { value: '13' }, LEVEL: { value: 'LOW' } },
      }),
      high: block('high', 'sarduBoard_setDigitalPin', {
        next: 'waitHigh',
        fields: { PIN: { value: '13' }, LEVEL: { value: 'HIGH' } },
      }),
      waitHigh: block('waitHigh', 'sarduBoard_waitMilliseconds', {
        next: 'low',
        inputs: { MILLIS: { block: 'durationHigh' } },
      }),
      durationHigh: block('durationHigh', 'math_number', { fields: { NUM: { value: '1000' } } }),
      low: block('low', 'sarduBoard_setDigitalPin', {
        next: 'waitLow',
        fields: { PIN: { value: '13' }, LEVEL: { value: 'LOW' } },
      }),
      waitLow: block('waitLow', 'sarduBoard_waitMilliseconds', {
        inputs: { MILLIS: { block: 'durationLow' } },
      }),
      durationLow: block('durationLow', 'math_number', { fields: { NUM: { value: '1000' } } }),
    }

    const source = generateArduinoSketch({ boardId: 'arduino-uno', targets: [{ blocks }] })

    expect(source).toContain('// Generated by SARDU Edu - davide@sardu.pro')
    expect(source).toContain('// Board: Arduino Uno')
    expect(source).toContain('pinMode(13, OUTPUT);')
    expect(source).toContain('digitalWrite(13, LOW);')
    expect(source).toContain('digitalWrite(13, HIGH);\n  delay(1000);')
    expect(source).toContain('digitalWrite(13, LOW);\n  delay(1000);')
  })

  test('generates PWM, comments, typed variables, pin reads and an Uno interrupt', () => {
    const blocks = {
      program: block('program', 'sarduBoard_program', {
        topLevel: true,
        inputs: { SUBSTACK: { block: 'declaration' }, SUBSTACK2: { block: 'printAnalog' } },
      }),
      declaration: block('declaration', 'sarduBoard_declareArduinoVariable', {
        next: 'comment',
        fields: { TYPE: { value: 'int' } },
        inputs: { NAME: { block: 'variableName' }, VALUE: { block: 'initialValue' } },
      }),
      variableName: block('variableName', 'text', { fields: { TEXT: { value: 'luminosita' } } }),
      initialValue: block('initialValue', 'text', { fields: { TEXT: { value: '0' } } }),
      comment: block('comment', 'sarduBoard_shortComment', {
        next: 'pwm',
        inputs: { TEXT: { block: 'commentText' } },
      }),
      commentText: block('commentText', 'text', { fields: { TEXT: { value: 'uscita regolata' } } }),
      pwm: block('pwm', 'sarduBoard_setPwmPin', {
        fields: { PIN: { value: '3' } },
        inputs: { VALUE: { block: 'pwmValue' } },
      }),
      pwmValue: block('pwmValue', 'math_number', { fields: { NUM: { value: '128' } } }),
      printAnalog: block('printAnalog', 'sarduBoard_serialPrintln', {
        inputs: { VALUE: { block: 'analog' } },
      }),
      analog: block('analog', 'sarduBoard_readAnalogPin', { fields: { PIN: { value: 'A0' } } }),
      interrupt: block('interrupt', 'sarduBoard_interrupt', {
        topLevel: true,
        fields: { PIN: { value: '2' }, MODE: { value: 'CHANGE' } },
        inputs: { SUBSTACK: { block: 'interruptWrite' } },
      }),
      interruptWrite: block('interruptWrite', 'sarduBoard_setDigitalPin', {
        fields: { PIN: { value: '13' }, LEVEL: { value: 'HIGH' } },
      }),
    }

    const source = generateArduinoSketch({ boardId: 'arduino-uno', targets: [{ blocks }] })

    expect(source).toContain('int sardu_luminosita = 0;')
    expect(source).toContain('// uscita regolata')
    expect(source).toContain('analogWrite(3, constrain(128, 0, 255));')
    expect(source).toContain('Serial.println(analogRead(A0));')
    expect(source).toContain('attachInterrupt(digitalPinToInterrupt(2), sardu_interrupt_0, CHANGE);')
  })

  test('compiles the same blocks into operations for live mode', () => {
    const blocks = {
      program: block('program', 'sarduBoard_program', {
        topLevel: true,
        inputs: { SUBSTACK2: { block: 'write' } },
      }),
      write: block('write', 'sarduBoard_setDigitalPin', {
        next: 'wait',
        fields: { PIN: { value: '13' }, LEVEL: { value: 'HIGH' } },
      }),
      wait: block('wait', 'sarduBoard_waitMilliseconds', {
        inputs: { MILLIS: { block: 'duration' } },
      }),
      duration: block('duration', 'math_number', { fields: { NUM: { value: '250' } } }),
    }

    expect(compileArduinoProgram({ boardId: 'arduino-uno', targets: [{ blocks }] })).toMatchObject({
      outputPins: ['13'],
      setup: [],
      loop: [
        { type: 'digital-write', pin: '13', level: 'HIGH' },
        { type: 'delay', milliseconds: 250 },
      ],
    })
  })

  test('provides an original serial firmware for live mode', () => {
    const firmware = generateSarduLiveFirmware()
    expect(firmware).toContain('SARDU Edu Live firmware - davide@sardu.pro')
    expect(firmware).toContain("if (command == 'W')")
    expect(firmware).toContain("command == 'M'")
    expect(firmware).toContain("command == 'U'")
    expect(firmware).toContain("command == 'R'")
    expect(firmware).toContain('Serial.println(sardu_servos[pin].read());')
    expect(firmware).toContain('digitalWrite(pin, level ? HIGH : LOW);')
  })

  test('generates child-friendly Scratch control flow with board timers', () => {
    const blocks = {
      start: block('start', 'sarduBoard_program', {
        topLevel: true,
        inputs: { SUBSTACK: { block: 'setTimer' }, SUBSTACK2: { block: 'condition' } },
      }),
      setTimer: block('setTimer', 'data_setvariableto', {
        fields: { VARIABLE: { value: 'tempo avvio' } },
        inputs: { VALUE: { block: 'millis' } },
      }),
      millis: block('millis', 'sarduBoard_millis'),
      condition: block('condition', 'control_if', {
        inputs: { CONDITION: { block: 'greater' }, SUBSTACK: { block: 'wait' } },
      }),
      greater: block('greater', 'operator_gt', {
        inputs: { OPERAND1: { block: 'micros' }, OPERAND2: { block: 'limit' } },
      }),
      micros: block('micros', 'sarduBoard_micros'),
      limit: block('limit', 'math_number', { fields: { NUM: { value: '1000' } } }),
      wait: block('wait', 'control_wait', { inputs: { DURATION: { block: 'seconds' } } }),
      seconds: block('seconds', 'math_number', { fields: { NUM: { value: '1' } } }),
    }

    const source = generateArduinoSketch({ boardId: 'arduino-uno', targets: [{ blocks }] })
    expect(source).toContain('double sardu_tempo_avvio = 0;')
    expect(source).toContain('sardu_tempo_avvio = millis();')
    expect(source).toContain('if ((micros() > 1000)) {')
    expect(source).toContain('delay(1000);')
  })

  test('rejects a pin that is not digital on the selected board', () => {
    const blocks = {
      program: block('program', 'sarduBoard_program', {
        topLevel: true,
        inputs: { SUBSTACK2: { block: 'write' } },
      }),
      write: block('write', 'sarduBoard_setDigitalPin', {
        fields: { PIN: { value: 'A7' }, LEVEL: { value: 'HIGH' } },
      }),
    }

    expect(() => generateArduinoSketch({ boardId: 'arduino-nano', targets: [{ blocks }] })).toThrow(
      'Pin A7 does not support digital output on Arduino Nano',
    )
  })

  test('rejects an unknown board', () => {
    expect(() => generateArduinoSketch({ boardId: 'missing', targets: [] })).toThrow('Unknown Arduino board: missing')
  })

  test('ignores blocks detached from the board program', () => {
    const blocks = {
      program: block('program', 'sarduBoard_program', { topLevel: true }),
      detached: block('detached', 'sarduBoard_setDigitalPin', {
        topLevel: true,
        fields: { PIN: { value: '13' }, LEVEL: { value: 'HIGH' } },
      }),
    }

    const source = generateArduinoSketch({ boardId: 'arduino-uno', targets: [{ blocks }] })

    expect(source).not.toContain('pinMode(13, OUTPUT);')
    expect(source).not.toContain('digitalWrite(13, HIGH);')
  })

  test('ignores a board program nested inside another stack', () => {
    const blocks = {
      program: block('program', 'sarduBoard_program', {
        inputs: { SUBSTACK2: { block: 'write' } },
      }),
      write: block('write', 'sarduBoard_setDigitalPin', {
        fields: { PIN: { value: '13' }, LEVEL: { value: 'HIGH' } },
      }),
    }

    const source = generateArduinoSketch({ boardId: 'arduino-uno', targets: [{ blocks }] })

    expect(source).not.toContain('digitalWrite(13, HIGH);')
  })

  test('rejects more than one top-level board program', () => {
    const blocks = {
      first: block('first', 'sarduBoard_program', { topLevel: true }),
      second: block('second', 'sarduBoard_program', { topLevel: true }),
    }

    expect(() => generateArduinoSketch({ boardId: 'arduino-uno', targets: [{ blocks }] })).toThrow(
      'Only one Arduino program block is allowed',
    )
  })

  test('inserts multiline custom code at its exact position in the attached stack', () => {
    const blocks = {
      program: block('program', 'sarduBoard_program', {
        topLevel: true,
        inputs: { SUBSTACK2: { block: 'high' } },
      }),
      high: block('high', 'sarduBoard_setDigitalPin', {
        next: 'custom',
        fields: { PIN: { value: '13' }, LEVEL: { value: 'HIGH' } },
      }),
      custom: block('custom', 'sarduBoard_customCode', {
        next: 'low',
        inputs: { CODE: { block: 'customText' } },
      }),
      customText: block('customText', 'sarduBoard_multiline', {
        fields: { field_sarduBoard_multiline: { value: 'int value = 1;\nvalue++;' } },
      }),
      low: block('low', 'sarduBoard_setDigitalPin', {
        fields: { PIN: { value: '13' }, LEVEL: { value: 'LOW' } },
      }),
    }

    const source = generateArduinoSketch({ boardId: 'arduino-uno', targets: [{ blocks }] })

    expect(source).toContain(
      'digitalWrite(13, HIGH);\n  int value = 1;\n  value++;\n  digitalWrite(13, LOW);',
    )
  })

  test('generates Offline serial initialization, print and println operations', () => {
    const blocks = {
      program: block('program', 'sarduBoard_program', {
        topLevel: true,
        inputs: { SUBSTACK: { block: 'begin' }, SUBSTACK2: { block: 'print' } },
      }),
      begin: block('begin', 'sarduBoard_serialBegin', {
        inputs: { BAUD: { block: 'baud' } },
      }),
      baud: block('baud', 'math_number', { fields: { NUM: { value: '9600' } } }),
      print: block('print', 'sarduBoard_serialPrint', {
        next: 'println',
        inputs: { VALUE: { block: 'firstText' } },
      }),
      firstText: block('firstText', 'text', { fields: { TEXT: { value: 'value=' } } }),
      println: block('println', 'sarduBoard_serialPrintln', {
        inputs: { VALUE: { block: 'secondText' } },
      }),
      secondText: block('secondText', 'text', { fields: { TEXT: { value: 'ready' } } }),
    }

    const source = generateArduinoSketch({ boardId: 'arduino-uno', targets: [{ blocks }] })

    expect(source).toContain('Serial.begin(9600);')
    expect(source).toContain('Serial.print("value=");')
    expect(source).toContain('Serial.println("ready");')
  })

  test('generates ESP32 Wi-Fi setup, status and IP blocks', () => {
    const blocks = {
      program: block('program', 'sarduBoard_program', {
        topLevel: true,
        inputs: { SUBSTACK: { block: 'connect' }, SUBSTACK2: { block: 'printStatus' } },
      }),
      connect: block('connect', 'sarduWifi_connect', {
        inputs: {
          SSID: { block: 'ssid' },
          PASSWORD: { block: 'password' },
          SECONDS: { block: 'timeout' },
        },
      }),
      ssid: block('ssid', 'text', { fields: { TEXT: { value: 'SARDU Wi-Fi' } } }),
      password: block('password', 'text', { fields: { TEXT: { value: 'secret' } } }),
      timeout: block('timeout', 'math_number', { fields: { NUM: { value: '15' } } }),
      printStatus: block('printStatus', 'sarduBoard_serialPrintln', {
        next: 'printIp',
        inputs: { VALUE: { block: 'connected' } },
      }),
      connected: block('connected', 'sarduWifi_isConnected'),
      printIp: block('printIp', 'sarduBoard_serialPrintln', {
        inputs: { VALUE: { block: 'ip' } },
      }),
      ip: block('ip', 'sarduWifi_localIp'),
    }

    const source = generateArduinoSketch({ boardId: 'esp32-dev-module', targets: [{ blocks }] })

    expect(source).toContain('#include <WiFi.h>')
    expect(source).toContain('WiFi.begin("SARDU Wi-Fi", "secret");')
    expect(source).toContain('((unsigned long)(15) * 1000UL)')
    expect(source).toContain('Serial.println((WiFi.status() == WL_CONNECTED));')
    expect(source).toContain('Serial.println(WiFi.localIP().toString());')
    expect(() => generateArduinoSketch({ boardId: 'arduino-uno', targets: [{ blocks }] })).toThrow(
      'Wi-Fi blocks require an ESP32 board',
    )
  })

  test('generates PN532 read and write support', () => {
    const blocks = {
      program: block('program', 'sarduBoard_program', {topLevel: true, inputs: {SUBSTACK2: {block: 'configure'}}}),
      configure: block('configure', 'sarduSensors_rfidConfigurePn532I2c', {
        next: 'print', fields: {SDA: {value: 'A4'}, SCL: {value: 'A5'}},
      }),
      print: block('print', 'sarduBoard_serialPrintln', {next: 'write', inputs: {VALUE: {block: 'read'}}}),
      read: block('read', 'sarduSensors_rfidReadBlock', {inputs: {BLOCK: {block: 'readBlock'}}}),
      readBlock: block('readBlock', 'math_number', {fields: {NUM: {value: '4'}}}),
      write: block('write', 'sarduSensors_rfidWriteBlock', {inputs: {BLOCK: {block: 'writeBlock'}, DATA: {block: 'data'}}}),
      writeBlock: block('writeBlock', 'math_number', {fields: {NUM: {value: '4'}}}),
      data: block('data', 'text', {fields: {TEXT: {value: '00112233445566778899AABBCCDDEEFF'}}}),
    }
    const source = generateArduinoSketch({boardId: 'arduino-uno', targets: [{blocks}]})

    expect(source).toContain('#include <PN532_I2C.h>')
    expect(source).toContain('#include <PN532.h>')
    expect(source).toContain('#include <MFRC522.h>')
    expect(source).toContain('sarduRfidConfigure("PN532", "I2C", A4, A5, -1, -1, -1, -1, -1, -1);')
    expect(source).toContain('sarduRfidRead(sarduRfidReader, sarduRfidBus')
    expect(source).toContain('sarduRfidWrite(sarduRfidReader, sarduRfidBus')
  })

  test('keeps generating RFID operations saved with the previous inline connection fields', () => {
    const fields = {
      READER: {value: 'RC522'}, BUS: {value: 'SPI'}, SDA: {value: 'A4'}, SCL: {value: 'A5'},
      MOSI: {value: '11'}, MISO: {value: '12'}, SCK: {value: '13'}, SS: {value: '10'},
      IRQ: {value: '2'}, RESET: {value: '9'},
    }
    const blocks = {
      program: block('program', 'sarduBoard_program', {topLevel: true, inputs: {SUBSTACK2: {block: 'write'}}}),
      write: block('write', 'sarduSensors_rfidWriteBlock', {
        fields,
        inputs: {BLOCK: {block: 'writeBlock'}, DATA: {block: 'data'}},
      }),
      writeBlock: block('writeBlock', 'math_number', {fields: {NUM: {value: '4'}}}),
      data: block('data', 'text', {fields: {TEXT: {value: '00112233445566778899AABBCCDDEEFF'}}}),
    }

    const source = generateArduinoSketch({boardId: 'arduino-uno', targets: [{blocks}]})
    expect(source).toContain('sarduRfidWrite("RC522", "SPI", A4, A5, 11, 12, 13, 10, 2, 9, 4')
  })
})
