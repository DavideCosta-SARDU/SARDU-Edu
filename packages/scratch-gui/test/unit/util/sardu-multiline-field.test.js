/* eslint-env jest */
import registerSarduMultilineField from '../../../src/lib/sardu-multiline-field';

class FieldTextInput {
    constructor (value) {
        this.value = value;
    }

    dispose () {}

    getValue () {
        return this.value;
    }

    setValue (value) {
        this.value = value;
    }
}

test('edits and preserves multiple custom Arduino code lines', () => {
    let FieldClass;
    const ScratchBlocks = {
        FieldTextInput,
        ScratchMsgs: {translate: (id, fallback) => fallback},
        fieldRegistry: {register: (name, implementation) => {
            expect(name).toBe('field_sarduBoard_multiline');
            FieldClass = implementation;
        }}
    };
    registerSarduMultilineField(ScratchBlocks, 'field_sarduBoard_multiline');
    const field = FieldClass.fromJson({text: '// C/C++'});

    field.showEditor_();
    const textarea = document.querySelector('[data-sardu-multiline-code]');
    textarea.value = 'int value = 1;\nvalue++;';
    document.querySelector('[data-sardu-multiline-save]').click();

    expect(field.getValue()).toBe('int value = 1;\nvalue++;');
    expect(document.querySelector('[data-sardu-multiline-code]')).toBeNull();
});
