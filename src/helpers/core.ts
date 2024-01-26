import {gsap} from "gsap";
import * as helpers from "src/helpers/index";
import timeStore from "src/stores/time";
import {get} from "svelte/store";
import {ExpoScaleEase} from "gsap/EasePack";
import settingsStore from "src/stores/settings";
import {v4 as UUIDv4} from "uuid";
import adventuresEventsStore from "src/stores/adventuresEvents";

export function initThirdParty() {
    gsap.config({
        force3D: true,
    });
}


export function addTestingContent() {
    // @ts-ignore
    window._helpers = helpers;
    // @ts-ignore
    window._gsap = gsap;
}

export function init() {
    addTestingContent();
}