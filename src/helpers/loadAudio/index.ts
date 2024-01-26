import {get} from 'svelte/store';
import settingsStore from "src/stores/settings";

export const cache = {};

export async function loadAudio(srcFile: string = '', loop: boolean = false) {
    const _srcFile = srcFile;

    if (!cache[srcFile]) {
        // @ts-ignore
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContext();

        const response = await fetch(srcFile);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        const trackSource = audioCtx.createBufferSource();

        const gainNode = audioCtx.createGain();
        gainNode.connect(audioCtx.destination);
        cache[srcFile] = {gainNode, audioCtx, audioBuffer, trackSource};
    }

    function tryPlay() {

            if (cache[_srcFile].audioCtx.state === 'suspended') {
                cache[_srcFile].audioCtx.resume();
            }

        window.removeEventListener('click', tryPlay);
    }

    function play() {
        window.addEventListener('click', tryPlay);

        try {

                let offset = 0;

                if (cache[_srcFile].trackSource.buffer) {
                    cache[_srcFile].trackSource = cache[_srcFile].audioCtx.createBufferSource();
                }
                cache[_srcFile].trackSource.buffer = cache[_srcFile].audioBuffer;
                cache[_srcFile].trackSource.connect(cache[_srcFile].gainNode)
                cache[_srcFile].trackSource.loop = loop;
                if (offset === 0) {
                    cache[_srcFile].trackSource.start();
                    offset = cache[_srcFile].audioCtx.currentTime;
                } else {
                    cache[_srcFile].trackSource.start(0, cache[_srcFile].audioCtx.currentTime - offset);
                }

        } catch (e) {
            console.error(e)
        }
    }

    function resume() {

            cache[_srcFile].audioCtx.resume();

    }

    function pause() {

            cache[_srcFile].audioCtx.suspend();

    }

    function setVolume(vol) {
        cache[_srcFile].gainNode.gain.value = vol;
    }

    function toggle() {
        if (cache[_srcFile].audioCtx.state === 'running') {
            pause();
        } else if (cache[_srcFile].audioCtx.state === 'suspended') {
            resume();
        }
    }

    return {
        play,
        resume,
        pause,
        setVolume,
        toggle
    }
}
