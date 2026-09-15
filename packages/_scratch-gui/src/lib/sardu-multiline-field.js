import styles from './sardu-multiline-field.css';

const registeredFields = new WeakMap();

const makeElement = (tagName, className, text) => {
    const element = document.createElement(tagName);
    element.className = className;
    if (text) element.textContent = text;
    return element;
};

const registerSarduMultilineField = (ScratchBlocks, fieldName) => {
    let names = registeredFields.get(ScratchBlocks);
    if (!names) {
        names = new Set();
        registeredFields.set(ScratchBlocks, names);
    }
    if (names.has(fieldName)) return;

    const registry = ScratchBlocks.fieldRegistry || ScratchBlocks.Field;
    if (!registry || typeof registry.register !== 'function' || !ScratchBlocks.FieldTextInput) {
        throw new Error(`registerSarduMultilineField cannot register ${fieldName}`);
    }

    class SarduMultilineField extends ScratchBlocks.FieldTextInput {
        static fromJson (options) {
            return new SarduMultilineField(options.text || '');
        }

        showEditor_ () {
            if (this.sarduEditorRoot) return;
            const translate = (id, fallback) => ScratchBlocks.ScratchMsgs.translate(id, fallback);
            const backdrop = makeElement('div', styles.backdrop);
            const dialog = makeElement('div', styles.dialog);
            const title = makeElement('div', styles.title,
                translate('SARDU_CUSTOM_CODE_TITLE', 'Custom Arduino code'));
            const textarea = makeElement('textarea', styles.code);
            const actions = makeElement('div', styles.actions);
            const cancel = makeElement('button', styles.button,
                translate('SARDU_CUSTOM_CODE_CANCEL', 'Cancel'));
            const save = makeElement('button', `${styles.button} ${styles.primary}`,
                translate('SARDU_CUSTOM_CODE_SAVE', 'Save'));

            textarea.value = this.getValue();
            textarea.spellcheck = false;
            textarea.dataset.sarduMultilineCode = '';
            cancel.type = 'button';
            save.type = 'button';
            save.dataset.sarduMultilineSave = '';
            this.sarduEditorRoot = backdrop;

            const close = () => {
                backdrop.remove();
                this.sarduEditorRoot = null;
            };
            const commit = () => {
                this.setValue(textarea.value);
                close();
            };
            cancel.addEventListener('click', close);
            save.addEventListener('click', commit);
            backdrop.addEventListener('click', event => {
                if (event.target === backdrop) close();
            });
            textarea.addEventListener('keydown', event => {
                if (event.key === 'Escape') close();
                if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') commit();
            });

            actions.append(cancel, save);
            dialog.append(title, textarea, actions);
            backdrop.append(dialog);
            document.body.append(backdrop);
            textarea.focus();
        }

        getDisplayText_ () {
            const firstLine = String(this.getValue()).split(/\r?\n/, 1)[0];
            return firstLine.length > 28 ? `${firstLine.slice(0, 27)}…` : firstLine;
        }

        dispose () {
            if (this.sarduEditorRoot) this.sarduEditorRoot.remove();
            this.sarduEditorRoot = null;
            super.dispose();
        }
    }

    registry.register(fieldName, SarduMultilineField);
    names.add(fieldName);
};

export default registerSarduMultilineField;
