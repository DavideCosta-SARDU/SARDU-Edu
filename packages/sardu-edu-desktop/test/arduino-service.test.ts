import { describe, expect, test } from 'vitest'
import { describeArduinoPorts, parseArduinoPorts } from '../src/arduino-ports'
import { createBoardListArguments } from '../src/arduino-service'

describe('Arduino CLI output', () => {
  test('requests JSON using the Arduino CLI 1.x flag', () => {
    expect(createBoardListArguments('arduino-cli.yaml')).toEqual([
      '--config-file',
      'arduino-cli.yaml',
      'board',
      'list',
      '--json',
    ])
  })

  test('maps detected ports without coupling the GUI to Arduino CLI JSON', () => {
    expect(
      parseArduinoPorts(
        JSON.stringify({
          detected_ports: [
            {
              port: {
                address: 'COM4',
                label: 'Arduino Uno',
                protocol: 'serial',
              },
            },
          ],
        }),
      ),
    ).toEqual([{ address: 'COM4', label: 'Arduino Uno', protocol: 'serial', matchingBoardFqbns: [] }])
  })

  test('describes detected COM ports without logging USB serial numbers', () => {
    expect(
      describeArduinoPorts(
        JSON.stringify({
          detected_ports: [
            {
              port: {
                address: 'COM4',
                protocol: 'serial',
                protocol_label: 'Serial Port (USB)',
                properties: { vid: '2341', pid: '0043', serialNumber: 'private-value' },
              },
              matching_boards: [{ name: 'Arduino Uno', fqbn: 'arduino:avr:uno' }],
            },
          ],
        }),
      ),
    ).toEqual([
      'COM4: protocol=serial, protocolLabel=Serial Port (USB), VID=2341, PID=0043, ' +
        'matches=Arduino Uno [arduino:avr:uno]',
    ])
  })

  test('exposes the recognized board targets for physical board validation', () => {
    expect(
      parseArduinoPorts(
        JSON.stringify({
          detected_ports: [
            {
              port: { address: 'COM4', protocol: 'serial' },
              matching_boards: [{ name: 'Arduino Uno', fqbn: 'arduino:avr:uno' }],
            },
          ],
        }),
      ),
    ).toEqual([
      {
        address: 'COM4',
        label: 'COM4',
        protocol: 'serial',
        matchingBoardFqbns: ['arduino:avr:uno'],
      },
    ])
  })

  test('ignores malformed entries at the external tool boundary', () => {
    expect(parseArduinoPorts(JSON.stringify({ detected_ports: [{ port: { label: 'missing address' } }] }))).toEqual(
      [],
    )
  })

  test('accepts the flat detected port representation', () => {
    expect(
      parseArduinoPorts(
        JSON.stringify({
          detected_ports: [{ address: '/dev/ttyACM0', protocol: 'serial' }],
        }),
      ),
    ).toEqual([
      { address: '/dev/ttyACM0', label: '/dev/ttyACM0', protocol: 'serial', matchingBoardFqbns: [] },
    ])
  })
})
