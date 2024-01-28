import {writable} from 'svelte/store';
import {ISettings} from "src/types";

const settings = {
    timeTweenDuration: 7500,
    timeIntervalLength: 24,
    frameByFrameFPS: 24,
    transitionsFPS: 24,
    actualModal: null,
    actualView: null,
    language: 'pl',
    fightCompleted1: false,
    fightCompleted2: false,
    runCompleted: false
}

const {subscribe, set, update} = writable(settings);

const settingsStore = {
    update,
    subscribe,
    set: (key: string, value: string | number | null | boolean | any) => update(items => {
        const newSettings = {...items};

        if (newSettings.hasOwnProperty(key)) {
            newSettings[key] = value;
        } else {
            console.error(`No '${key}' in settings store`);
        }

        return newSettings;
    })
};

export default settingsStore;