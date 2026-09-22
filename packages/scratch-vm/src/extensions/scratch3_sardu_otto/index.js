const formatMessage = require('format-message');
const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');

class Scratch3SarduOtto {
    constructor (runtime) { this.runtime = runtime; }
    getInfo () {
        const hidden = this.runtime?.sarduEdu?.hardwareSelection?.robotId !== 'otto-diy';
        const command = (opcode, text, args = {}) => ({opcode, text, tooltip: text, blockType: BlockType.COMMAND, hideFromPalette: hidden, arguments: args});
        const message = (id, text) => formatMessage({id, default: text, description: `Otto DIY ${id} block`});
        return {id: 'sarduOtto', name: formatMessage({id: 'sarduOtto.name', default: 'Otto DIY', description: 'Otto DIY category'}), color1: '#63C83C', color2: '#439B27', color3: '#2C7018', blocks: [
            command('configure', message('sarduOtto.configure', 'set Otto left leg [YL] right leg [YR] left foot [RL] right foot [RR] buzzer [BUZZER]'), {YL:{type:ArgumentType.NUMBER,defaultValue:2},YR:{type:ArgumentType.NUMBER,defaultValue:3},RL:{type:ArgumentType.NUMBER,defaultValue:4},RR:{type:ArgumentType.NUMBER,defaultValue:5},BUZZER:{type:ArgumentType.NUMBER,defaultValue:13}}),
            command('home', message('sarduOtto.home', 'move Otto to home position')),
            command('move', message('sarduOtto.move', 'Otto [MOVE] [STEPS] steps in [TIME] ms'), {MOVE:{type:ArgumentType.STRING,menu:'MOVE'},STEPS:{type:ArgumentType.NUMBER,defaultValue:1},TIME:{type:ArgumentType.NUMBER,defaultValue:1000}}),
            command('dance', message('sarduOtto.dance', 'Otto dance [DANCE] [STEPS] steps in [TIME] ms amplitude [HEIGHT]'), {DANCE:{type:ArgumentType.STRING,menu:'DANCE'},STEPS:{type:ArgumentType.NUMBER,defaultValue:1},TIME:{type:ArgumentType.NUMBER,defaultValue:1000},HEIGHT:{type:ArgumentType.NUMBER,defaultValue:20}}),
            command('sing', message('sarduOtto.sing', 'Otto sound [SOUND]'), {SOUND:{type:ArgumentType.STRING,menu:'SOUND'}}),
            command('beep', message('sarduOtto.beep', 'Otto beep [FREQUENCY] Hz for [DURATION] ms silence [SILENCE] ms'), {FREQUENCY:{type:ArgumentType.NUMBER,defaultValue:440},DURATION:{type:ArgumentType.NUMBER,defaultValue:200},SILENCE:{type:ArgumentType.NUMBER,defaultValue:50}}),
            command('gesture', message('sarduOtto.gesture', 'Otto gesture [GESTURE]'), {GESTURE:{type:ArgumentType.STRING,menu:'GESTURE'}})
        ], menus: {
            MOVE:{acceptReporters:false,items:['walk-forward','walk-backward','turn-left','turn-right','bend-left','bend-right','shake-left','shake-right','jump']},
            DANCE:{acceptReporters:false,items:['moonwalker-left','moonwalker-right','crusaito-forward','crusaito-backward','flapping-forward','flapping-backward','swing','tiptoe-swing','jitter','updown','ascending-turn']},
            SOUND:{acceptReporters:false,items:['S_connection','S_disconnection','S_buttonPushed','S_mode1','S_mode2','S_mode3','S_surprise','S_OhOoh','S_OhOoh2','S_cuddly','S_sleeping','S_happy','S_superHappy','S_happy_short','S_sad','S_confused','S_fart1','S_fart2','S_fart3']},
            GESTURE:{acceptReporters:false,items:['OttoHappy','OttoSuperHappy','OttoSad','OttoSleeping','OttoFart','OttoConfused','OttoLove','OttoAngry','OttoFretful','OttoMagic','OttoWave','OttoVictory','OttoFail']}
        }};
    }
    _run (action, ...values) { if (this.runtime?.sarduEdu?.hardwareSelection?.mode !== 'realtime') return; const transport=this.runtime.sarduEduLiveTransport; if (!transport?.connected) return Promise.reject(new Error('SARDU-Block live transport is not connected for Otto')); return transport.runOtto(action,...values); }
    configure(a){return this._run('I',a.YL,a.YR,a.RL,a.RR,a.BUZZER);} home(){return this._run('H');}
    move(a){return this._run('M',a.MOVE,a.STEPS,a.TIME);} dance(a){return this._run('D',a.DANCE,a.STEPS,a.TIME,a.HEIGHT);}
    sing(a){return this._run('S',['S_connection','S_disconnection','S_buttonPushed','S_mode1','S_mode2','S_mode3','S_surprise','S_OhOoh','S_OhOoh2','S_cuddly','S_sleeping','S_happy','S_superHappy','S_happy_short','S_sad','S_confused','S_fart1','S_fart2','S_fart3'].indexOf(a.SOUND)+1);}
    beep(a){return this._run('B',a.FREQUENCY,a.DURATION,a.SILENCE);}
    gesture(a){return this._run('G',['OttoHappy','OttoSuperHappy','OttoSad','OttoSleeping','OttoFart','OttoConfused','OttoLove','OttoAngry','OttoFretful','OttoMagic','OttoWave','OttoVictory','OttoFail'].indexOf(a.GESTURE)+1);}
}
module.exports = Scratch3SarduOtto;
