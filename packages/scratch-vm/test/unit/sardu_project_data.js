const test = require('tap').test;
const VirtualMachine = require('../../src/virtual-machine');
const sb3 = require('../../src/serialization/sb3');

test('SARDU-Block hardware selection is serialized with new and compatibility keys', t => {
    const vm = new VirtualMachine();
    vm.setSarduBlockHardwareSelection({
        boardId: 'arduino-uno',
        boardVersion: '1',
        backendId: 'arduino-cpp',
        backendVersion: '1',
        componentIds: ['dht11-dht22']
    });

    const serialized = sb3.serialize(vm.runtime);

    t.same(serialized.sarduBlock.hardwareSelection, {
        boardId: 'arduino-uno',
        boardVersion: '1',
        backendId: 'arduino-cpp',
        backendVersion: '1',
        componentIds: ['dht11-dht22'],
        hardwareKind: 'board',
        mode: 'standalone'
    });
    t.same(serialized.sarduEdu, serialized.sarduBlock);
    t.end();
});

test('historical SARDU Edu hardware selection is deserialized with the project', async t => {
    const vm = new VirtualMachine();
    await sb3.deserialize({
        targets: [],
        monitors: [],
        sarduEdu: {
            hardwareSelection: {
                boardId: 'arduino-nano',
                boardVersion: '1',
                backendId: 'arduino-cpp',
                backendVersion: '1',
                mode: 'realtime'
            }
        }
    }, vm.runtime, null, false);

    t.same(vm.getSarduBlockProjectData().hardwareSelection, {
        boardId: 'arduino-nano',
        boardVersion: '1',
        backendId: 'arduino-cpp',
        backendVersion: '1',
        mode: 'realtime'
    });
});

test('SARDU-Block hardware selection is deserialized with the project', async t => {
    const vm = new VirtualMachine();
    await sb3.deserialize({
        targets: [],
        monitors: [],
        sarduBlock: {
            hardwareSelection: {
                boardId: 'arduino-uno',
                backendId: 'arduino-cpp',
                mode: 'standalone'
            }
        }
    }, vm.runtime, null, false);

    t.equal(vm.getSarduBlockProjectData().hardwareSelection.boardId, 'arduino-uno');
});

test('SARDU project data getter does not expose mutable runtime state', t => {
    const vm = new VirtualMachine();
    vm.setSarduEduHardwareSelection({boardId: 'arduino-nano', backendId: 'arduino-cpp'});

    const copy = vm.getSarduEduProjectData();
    copy.hardwareSelection.boardId = 'changed';

    t.equal(vm.getSarduEduProjectData().hardwareSelection.boardId, 'arduino-nano');
    t.end();
});

test('SARDU hardware selection can be removed without keeping the live transport', t => {
    const vm = new VirtualMachine();
    vm.setSarduEduHardwareSelection({boardId: 'arduino-uno', backendId: 'arduino-cpp'});
    vm.setSarduEduLiveTransport({
        writeDigital: () => Promise.resolve(),
        readMillis: () => Promise.resolve(0),
        readMicros: () => Promise.resolve(0)
    });

    vm.clearSarduEduHardwareSelection();

    t.equal(vm.getSarduEduProjectData(), null);
    t.equal(vm.runtime.sarduEduLiveTransport, null);
    t.end();
});

test('removing SARDU hardware also removes an empty board program block', t => {
    const vm = new VirtualMachine();
    vm.setSarduEduHardwareSelection({boardId: 'arduino-uno', backendId: 'arduino-cpp'});
    const deletedBlocks = [];
    vm.runtime.targets.push({
        blocks: {
            _blocks: {
                program: {id: 'program', opcode: 'sarduBoard_program', topLevel: true, inputs: {}}
            },
            deleteBlock: blockId => deletedBlocks.push(blockId)
        }
    });

    t.equal(vm.clearSarduEduHardwareSelection(), true);
    t.same(deletedBlocks, ['program']);
    t.equal(vm.getSarduEduProjectData(), null);
    t.end();
});

test('removing SARDU hardware requires force when the board program contains code', t => {
    const vm = new VirtualMachine();
    vm.setSarduEduHardwareSelection({boardId: 'arduino-uno', backendId: 'arduino-cpp'});
    const deletedBlocks = [];
    vm.runtime.targets.push({
        blocks: {
            _blocks: {
                program: {
                    id: 'program',
                    opcode: 'sarduBoard_program',
                    topLevel: true,
                    inputs: {SUBSTACK: {block: 'instruction', shadow: null}}
                },
                instruction: {id: 'instruction', opcode: 'sarduBoard_setDigitalPin', inputs: {}}
            },
            deleteBlock: blockId => deletedBlocks.push(blockId)
        }
    });

    t.equal(vm.clearSarduEduHardwareSelection(), false);
    t.same(deletedBlocks, []);
    t.equal(vm.getSarduEduProjectData().hardwareSelection.boardId, 'arduino-uno');

    t.equal(vm.clearSarduEduHardwareSelection(true), true);
    t.same(deletedBlocks, ['program']);
    t.equal(vm.getSarduEduProjectData(), null);
    t.end();
});

test('SARDU hardware selection rejects incomplete data', t => {
    const vm = new VirtualMachine();
    t.throws(() => vm.setSarduEduHardwareSelection({boardId: 'arduino-uno'}),
        /requires boardId and backendId/);
    t.end();
});

test('SARDU live transport is runtime-only and is not serialized', t => {
    const vm = new VirtualMachine();
    const transport = {
        connected: true,
        writeDigital: () => Promise.resolve(),
        readMillis: () => Promise.resolve(0),
        readMicros: () => Promise.resolve(0)
    };
    vm.setSarduEduHardwareSelection({boardId: 'arduino-uno', backendId: 'arduino-cpp', mode: 'realtime'});

    vm.setSarduEduLiveTransport(transport);

    t.equal(vm.runtime.sarduEduLiveTransport, transport);
    t.notOk(sb3.serialize(vm.runtime).sarduEdu.liveTransport);
    t.end();
});

test('SARDU hardware port is runtime-only and cleared by a new selection', t => {
    const vm = new VirtualMachine();
    vm.setSarduEduHardwareSelection({boardId: 'arduino-uno', backendId: 'arduino-cpp'});
    vm.setSarduEduHardwarePort('COM4');

    t.equal(vm.runtime.sarduEduHardwarePort, 'COM4');
    t.notOk(sb3.serialize(vm.runtime).sarduEdu.hardwarePort);

    vm.setSarduEduHardwareSelection({boardId: 'arduino-nano', backendId: 'arduino-cpp'});
    t.equal(vm.runtime.sarduEduHardwarePort, null);
    t.end();
});
