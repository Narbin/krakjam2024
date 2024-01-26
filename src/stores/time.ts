import {get, writable} from 'svelte/store';
import * as easing from "svelte/easing";
import {Tweened, tweened} from 'svelte/motion';
import settingsStore from "src/stores/settings";
import {ITimeStore} from "src/types";

const defaultSettings = {
    duration: get(settingsStore).timeTweenDuration,
    easing: easing.linear,
    delay: 0,
}

const actualTimeStore: Tweened<any> = tweened(0, defaultSettings);

const time: ITimeStore = {
    actualTime: actualTimeStore,
    tweenDuration: defaultSettings.duration,
    isRunning: false,
    intervalLength: get(settingsStore).timeIntervalLength,
    totalIntervals: 0
}

const {subscribe, set, update} = writable(time);

const timeStore = {
    subscribe,
    reset: () => update(_time => {
        const newTime = {..._time};
        const value = get(newTime.actualTime);
        if (value === newTime.intervalLength) {
            newTime.totalIntervals += 1;
            newTime.actualTime.set(0, {duration: 0});
            timeStore.resume();
            return newTime;
        } else {
            return _time;
        }
    }),
    pause: () => update(_time => {
        const newTime = {..._time};
        const value = get(newTime.actualTime);
        newTime.actualTime.set(value, {duration: 0});
        newTime.isRunning = false;

        return newTime;
    }),
    resume: () => update(_time => {
        const newTime = {..._time};
        let value = get(newTime.actualTime) as number;
        const percentageCompleted = value / newTime.intervalLength;
        const remaining = (newTime.tweenDuration * newTime.intervalLength) - ((newTime.tweenDuration * newTime.intervalLength) * percentageCompleted)

        newTime.actualTime.set(newTime.intervalLength, {duration: remaining});
        newTime.isRunning = true;

        return newTime;
    }),
    changeSpeedTo: (_value: number = 1) => update(_time => {
        const newTime = {..._time};
        newTime.tweenDuration = defaultSettings.duration / _value;

        if (newTime.isRunning) {
            let value = get(newTime.actualTime) as number;
            const percentageCompleted = value / newTime.intervalLength;
            const remaining = (newTime.tweenDuration * newTime.intervalLength) - ((newTime.tweenDuration * newTime.intervalLength) * percentageCompleted)

            newTime.actualTime.set(newTime.intervalLength, {duration: remaining});
        }
        return newTime;
    })
};

export default timeStore;