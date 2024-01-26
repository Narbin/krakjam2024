import {Tweened} from "svelte/types/runtime/motion/tweened";

declare global {
    export interface Window {
        animationCache: any;
    }
}

export interface ISettings {
    timeTweenDuration: number,
    timeIntervalLength: number,
    frameByFrameFPS: number,
    transitionsFPS: number,
    actualModal: string | null,
    actualView: string
    language: string,
}

export interface ITimeStore {
    actualTime: Tweened<any>,
    tweenDuration: number,
    isRunning: boolean,
    intervalLength: number,
    totalIntervals: number
}
