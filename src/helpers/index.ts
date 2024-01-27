import {cache, loadAudio} from './loadAudio';

import timeStore from "src/stores/time";
import settingsStore from "src/stores/settings";

import _ from "lodash";
import * as helpers from "./../helpers";

import {gsap} from "gsap";
import {CustomEase} from "gsap/CustomEase";

import adventuresEventsStore from "src/stores/adventuresEvents";
import {images} from "src/assets";



let currentInstance = 0;
let globalInstances = [];

export function createWorker(f) {
    return new Worker(URL.createObjectURL(new Blob([`(${f})()`])));
}

function _createWorkerImageLoader() {
    let maxWorkers = Math.floor(navigator.hardwareConcurrency / 2);
    let _currentInstance = currentInstance;
    if (!globalInstances[currentInstance + 1] && (currentInstance + 1) < maxWorkers) {
        globalInstances.push(createWorker(() => {
            self.addEventListener('message', e => {
                const src = e.data;
                fetch(src, {mode: 'cors'})
                    .then(response => response.blob())
                    .then(blob => createImageBitmap(blob))
                    .then(bitmap => {
                        // @ts-ignore
                        self.postMessage({src, bitmap}, [bitmap]);
                    });
            });
        }))

        _currentInstance = globalInstances.length - 1;
    } else {
        if ((currentInstance + 1) < maxWorkers) {
            currentInstance += 1;
            _currentInstance += 1;
        } else {
            currentInstance = 0;
            _currentInstance = 0;
        }
    }

    return globalInstances[_currentInstance];
}

export async function loadImageWithWorker(sourceSrc) {
    const worker = _createWorkerImageLoader();

    let port = ':8080';
    let nativeSrc = '';
    // @ts-ignore
    if (window.platform === 'nativeMobile') {
        port = '';
        // @ts-ignore
    } else if (window.platform === 'nativeDesktop') {
        nativeSrc = 'app://-/';
    }

    let src = nativeSrc ? `${nativeSrc}/${sourceSrc}` : `http://localhost${port}/${sourceSrc}`;

    return new Promise((resolve, reject) => {
        function handler(e) {
            if (e.data.src === src) {
                worker.removeEventListener('message', handler);
                if (e.data.error) {
                    reject(e.data.error);
                }
                resolve(e.data.bitmap);
            }
        }

        worker.addEventListener('message', handler);
        worker.postMessage(src);
    });
}

export function delayCall(fnc: any, delay: number) {
    return gsap.to(fnc, {
        delay, onComplete: () => {
            fnc();
        }
    });
}

export function onNextFrame(fnc: any, once: boolean = true, prioritize: boolean = false) {
    gsap.ticker.add(fnc, once, prioritize);
}

export function throttleTicker(fnc, callsPerSecond) {
    // Very fast rounding in JavaScript
    const round = x => x + 0.5 << 0
    const throttleAnimation = (animation) => {
        let frame = 0

        const ticker = gsap.ticker,
            time = ticker.time,
            frameLength = 1 / callsPerSecond,
            update = function () {
                const newTime = ticker.time - time,
                    newFrame = round(newTime / frameLength)
                if (frame !== newFrame) {
                    frame = newFrame
                    animation.time(newTime)
                    fnc();
                    // todo: usuniecie update z ticker'a
                }
            }

        animation.pause()
        ticker.add(update)
    }

    return throttleAnimation(gsap.to([1], {
        duration: 1,
        repeat: -1,
        ease: 'linear',
        endArray: [2],
    }));
}

const units = {
    Tank: {
        type: 'Tank',
        hitPoints: 800,
        maxHitPoints: 800,
        speed: 60,
        attackMin: 20,
        attackMax: 50,
        evasion: 0,
        cooldown: 0,
        timeout: 2
    },
    Shooter: {
        type: 'Shooter',
        hitPoints: 400,
        maxHitPoints: 400,
        speed: 120,
        attackMin: 80,
        attackMax: 100,
        evasion: 15,
        cooldown: 0,
        timeout: 3
    },
    Melee: {
        type: 'Melee',
        hitPoints: 500,
        maxHitPoints: 500,
        speed: 90,
        attackMin: 110,
        attackMax: 130,
        evasion: 10,
        cooldown: 0,
        timeout: 3
    },
    Enemy1: {
        type: 'Enemy1',
        hitPoints: 400,
        maxHitPoints: 400,
        speed: 100,
        attackMin: 60,
        attackMax: 80,
        evasion: 40,
        cooldown: 0,
        timeout: 4
    },
    EnemyBunny: {
        type: 'EnemyBunny',
        hitPoints: 400,
        maxHitPoints: 400,
        speed: 100,
        attackMin: 60,
        attackMax: 80,
        evasion: 40,
        cooldown: 0,
        timeout: 4
    }
}

export {
    loadAudio,
    cache,
    units
}