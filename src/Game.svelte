<script lang="ts">
import Header from "src/components/gui/Header.svelte";
import MainMenu from "src/components/gui/MainMenu.svelte";
import UpgradesPanel from "src/components/subview/UpgradesPanel.svelte";
import AdventuresLogic from "src/components/logic/AdventuresLogic.svelte";

import {images} from '/src/assets';
import {onMount} from "svelte";
import {gsap} from "gsap";
import * as helpers from "/src/helpers";

import settingsStore from "src/stores/settings";
import _ from "lodash";
import {ISettings} from "src/types";
import {writable} from "svelte/store";
import Battle from "src/components/Battle.svelte";
import Race from "src/components/Race.svelte";

let totalLoaded = 0;
let totalItems = 0;

const loadedKeys = {}
const arr = [];

const loadImage = path => {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.src = path
        img.onload = () => {
            helpers.onNextFrame(() => {
                document.querySelector('.hidden').appendChild(img);
            });
            if (path.includes('.png')) {
                fetch(path, {mode: 'cors'})
                    .then(response => response.blob())
                    .then(blob => createImageBitmap(blob))
                    .then(bitmap => {
                        totalLoaded += 1;
                        window.animationCache[path] = bitmap;
                    });
            } else {
                totalLoaded += 1;
            }
        }
        resolve(img)
        img.onerror = e => {
            reject(e)
        }
    })
}

function executeSequentially(promiseFactories) {
    var result = Promise.resolve();
    promiseFactories.forEach(function (url) {
        result = result.then(() => {
            return loadImage(url);
        });
    });
    return result;
}

function executeAtOnce(promiseFactories) {
    promiseFactories.forEach(function (url) {
        return loadImage(url);
    });
}

function preloadImages(obj) {
    for (const property in obj) {
        if (typeof obj[property] === 'object') {
            preloadImages(obj[property])
        } else if (typeof obj[property] === 'string') {
            if (!loadedKeys[obj[property]]) {
                loadedKeys[obj[property]] = true;
                totalItems += 1;
                arr.push(obj[property]);
            }
        }
    }
}

onMount(() => {
    window.animationCache = {};
    preloadImages(images);

    window.gsap = gsap;
    totalLoaded = totalItems;
    // wywala sie aktualnie
    helpers.delayCall(() => {
        executeSequentially(arr);
    }, 1)

    // executeAtOnce(arr);

})


</script>

<svelte:window/>


{#if $settingsStore.actualView == 'FOREST'}
  <Battle/>
 {:else if $settingsStore.actualView == 'FIELD'}
  <Race/>
 {:else}

 <div style="position: relative; width: 100%; height: 100%;">
  <div style="position: absolute; top: 25%; left: 25%;" on:click={() => {settingsStore.set('actualView', 'FOREST')}}>LAS</div>
  <div style="position: absolute; right: 25%; top:25%;">RZEKA</div>
  <div style="position: absolute; bottom: 33%; right: 33%;" on:click={() => {settingsStore.set('actualView', 'FIELD')}}>POLE</div>
 </div>
{/if}


<!--<AdventuresLogic/>-->

<!--<Header/>-->

<!--<MainMenu/>-->

<!--<UpgradesPanel/>-->

<style lang="scss">
</style>
