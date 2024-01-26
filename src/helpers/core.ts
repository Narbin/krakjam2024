import {gsap} from "gsap";
import * as helpers from "src/helpers/index";

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
