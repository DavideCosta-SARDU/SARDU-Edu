/* eslint-env jest */
import modalReducer, {
    closeBoardLibrary,
    closeComponentLibrary,
    closeRobotLibrary,
    openBoardLibrary,
    openComponentLibrary,
    openRobotLibrary
} from '../../../src/reducers/modals';

test('opens and closes the sensors and actuators library independently', () => {
    const opened = modalReducer(undefined, openComponentLibrary());
    expect(opened.componentLibrary).toBe(true);
    expect(opened.boardLibrary).toBe(false);
    expect(modalReducer(opened, closeComponentLibrary()).componentLibrary).toBe(false);
});

test('opens and closes the board library independently', () => {
    const opened = modalReducer(undefined, openBoardLibrary());
    expect(opened.boardLibrary).toBe(true);
    expect(opened.extensionLibrary).toBe(false);
    expect(modalReducer(opened, closeBoardLibrary()).boardLibrary).toBe(false);
});

test('opens and closes the robot library independently', () => {
    const opened = modalReducer(undefined, openRobotLibrary());
    expect(opened.robotLibrary).toBe(true);
    expect(opened.extensionLibrary).toBe(false);
    expect(modalReducer(opened, closeRobotLibrary()).robotLibrary).toBe(false);
});
