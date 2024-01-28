<script lang="ts">
import Header from "src/components/gui/Header.svelte";
import MainMenu from "src/components/gui/MainMenu.svelte";
import UpgradesPanel from "src/components/subview/UpgradesPanel.svelte";
import AdventuresLogic from "src/components/logic/AdventuresLogic.svelte";

import {images, music, sounds, videos} from '/src/assets';
import {onMount} from "svelte";
import {gsap} from "gsap";
import * as helpers from "/src/helpers";

import settingsStore from "src/stores/settings";
import _ from "lodash";
import {ISettings} from "src/types";
import {writable} from "svelte/store";
import Battle from "src/components/Battle.svelte";
import Race from "src/components/Race.svelte";
import AnimationFrameByFrameV2 from "src/components/common/AnimationFrameByFrameV2.svelte";

let totalLoaded = 0;
let totalItems = 0;
let openTeamSelect = false;

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

async function oneByOne(arr, callback) {
 return await arr.reduce((promise, spec) => promise.then(async () => await callback(spec)), Promise.resolve())
}

function executeSequentially(promiseFactories) {
    oneByOne(promiseFactories, (url) => {
       return loadImage(url);
    })
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

let introEnded = false;

$: {
    if (introEnded === true) {
        mainMenuAudio.play();
    }
}
function start() {
    clicked = true;
    document.removeEventListener('click', start);
    document.removeEventListener('keydown', start);
}

let play = false;
let flyingAudio = null;
let mainMenuAudio = null;

onMount(async () => {
    console.log(videos)
    flyingAudio = await helpers.loadAudio(sounds['latajacy obiekt'], true);
    mainMenuAudio = await helpers.loadAudio(music['main_menu']);

    window.animationCache = {};
    preloadImages(images);
    easterEgg = true;

    window.gsap = gsap;
    // totalLoaded = totalItems;
    // wywala sie aktualnie
    helpers.delayCall(() => {
        executeSequentially(arr);
    }, 0.3)

    // executeAtOnce(arr);

    document.addEventListener('keydown', start);
    document.addEventListener('click', start);

    flyingAudio.play();
    flyingAudio.pause();
})

$ : {
    if (!$settingsStore.actualView) {
        mainMenuAudio && mainMenuAudio.resume();
    } else {
        mainMenuAudio && mainMenuAudio.pause();
    }
}

function initWoman(node) {
 gsap.to(node, {
  x: '100vw',
 yoyo: true,
 repeat: 1,
  duration: 7,
 repeatDelay: 1,
  ease:'power1.inOut',
     onStart: () => {
         flyingAudio.resume();
     },
     onRepeat: () => {
         easterEggRotated = true;
     },
     onComplete: () => {
         flyingAudio.pause();
         easterEggRotated = false;
        helpers.delayCall(() => {
            easterEgg = true;
        }, 30);
         easterEgg = false;
     }
 })
}

let clicked = false;
let easterEgg = false;
let easterEggRotated = false;
let contentWidth = 0;
let availableUnits = ['Tank', 'Melee', 'Shooter'];
let selectedUnitIndex = 0;
let selectedFront = {
    0: null,
    1: null,
}
let fightIndex = null;
let selectedBack = {
    0: null,
    1: null,
}
let selectedLine = 'front';
let selectedPosition = 0;


function prevUnit(){
    if (selectedUnitIndex === 0) {
        selectedUnitIndex = availableUnits.length - 1;
    } else {
        selectedUnitIndex -= 1;
    }
}

function nextUnit(){
    if (availableUnits.length - 1 === selectedUnitIndex) {
        selectedUnitIndex = 0
    } else {
        selectedUnitIndex += 1;
    }
}

$: {
    if (selectedLine === 'front') {
        selectedFront[selectedPosition] = availableUnits[selectedUnitIndex];
    } else {
        selectedBack[selectedPosition] = availableUnits[selectedUnitIndex];
    }
}

$: {
    if ($settingsStore.runCompleted && $settingsStore.fightCompleted1 && $settingsStore.fightCompleted2) {
        showCredits = true;
        mainMenuAudio.pause()
        flyingAudio.pause();
    }
}

let showCredits = false;

</script>

<svelte:window bind:innerWidth={contentWidth}/>

{#if totalLoaded === totalItems}
 {#if !clicked}
     <div style="width: 100%; position: absolute; left: 0; top:0; aspect-ratio: 16/9;">
         <AnimationFrameByFrameV2 width="{contentWidth}" aspectRatio="{9/16}"
                                  introImagesKeys={[]}
                                  imagesKeys="{images.static.splash}"
                                  isRotated="{false}"
                                  isPlaying="{true}"
                                  delay="{0}"
                                  isDimmed="{false}"/>
     </div>

   <div style="position:absolute; left: 25vw; top: 68vh; font-size: 40px; color: white;">
     PRESS ANY KEY TO START
   </div>
  {:else}
     {#if showCredits}
         <video autoplay="true" controls="" preload="auto" style="width: 100vh;">
             <source id="mysource" src="{videos['OUTRO_01_hq_sound_1']}" type='video/mp4' controls='false' />
         </video>
     {:else}
         {#if !introEnded}
             <video autoplay="true" controls="" preload="auto" style="width: 100vh;" on:ended={()=> {introEnded = true;}}>
                 <source id="mysource" src="{videos['2f1b1dca-764e-4cb3-968b-a57d7dc3de5d']}" type='video/mp4' controls='false' />
             </video>
         {:else}
             {#if easterEgg}
                 <div style="z-index: 100;position: absolute; left: 0; top: 10vh; transform: translateX(-100%); width: 700px; height: {700 * 720 /1280}px;" use:initWoman>
                     <AnimationFrameByFrameV2 width="700" aspectRatio="{720 / 1280}"
                                              introImagesKeys={[]}
                                              imagesKeys="{images.static.woman}"
                                              isRotated="{easterEggRotated}"
                                              isPlaying="{true}"
                                              delay="{0}"
                                              isDimmed="{false}"/>
                 </div>
             {/if}

             {#if $settingsStore.actualView == 'BATTLE'}
                 <Battle selectedBack="{selectedBack}" selectedFront="{selectedFront}" fightIndex="{fightIndex}"/>
             {:else if $settingsStore.actualView == 'RACE'}
                 <Race/>
             {:else}
                 <div style="width: 100vw; height: 100vh; position: absolute; left: 0; top: 0;">
                     <img src="{images.ui['MAP_BG']}" style="width: 100%; height: 100%; object-fit: cover;" alt/>

                     <div style="z-index:20; position: absolute; left: 10%; top: 55%; width: 200px; display: flex; cursor: pointer;"
                          on:click={() => { if (!$settingsStore.fightCompleted1) {openTeamSelect = true; fightIndex = 1;}}}
                     >
                         <img src="{images.ui['Asset 6']}" alt style="width: 100%;">
                         <span style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);">
                    Miechocin
                </span>
                         {#if !$settingsStore.fightCompleted1}
                             <div style="width: 300px; height: 300px; position: absolute; left: 33%; top: 0; transform: translate(-50%, -90%)">
                                 <AnimationFrameByFrameV2 width="300" aspectRatio="{1}"
                                                          introImagesKeys={[]}
                                                          imagesKeys="{images.vfx.flame}"
                                                          isRotated="{false}"
                                                          isPlaying="{true}"
                                                          delay="{0}"
                                                          isDimmed="{false}"/>
                             </div>
                         {/if}
                     </div>


                     <div style="z-index:20;position: absolute; left: 40%; top: 55%; width: 200px; display: flex; cursor: pointer;"
                          on:click={() => { if (!$settingsStore.fightCompleted2) {openTeamSelect = true; fightIndex = 2;}}}>
                         <img src="{images.ui['Asset 6']}" alt style="width: 100%;">
                         <span style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);">
                    Roztargnica
                </span>
                         {#if !$settingsStore.fightCompleted2}
                             <div style="width: 300px; height: 300px; position: absolute; left: 33%; top: 0; transform: translate(-50%, -90%)">
                                 <AnimationFrameByFrameV2 width="300" aspectRatio="{1}"
                                                          introImagesKeys={[]}
                                                          imagesKeys="{images.vfx.flame}"
                                                          isRotated="{false}"
                                                          isPlaying="{true}"
                                                          delay="{0}"
                                                          isDimmed="{false}"/>
                             </div>
                         {/if}
                     </div>
                     <div style="z-index:20;position: absolute; left: 70%; top: 60%; width: 200px; display: flex; cursor: pointer; white-space: nowrap;"
                          on:click={() => {
                          if (!$settingsStore.runCompleted) {settingsStore.set('actualView', 'RACE')}}}>
                         <img src="{images.ui['Asset 6']}" alt style="width: 100%;">
                         <span style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);">
                    Wierzbowy Zad
                </span>
                         {#if !$settingsStore.runCompleted}
                             <div style="width: 300px; height: 300px; position: absolute; left: 33%; top: 0; transform: translate(-50%, -90%)">
                                 <AnimationFrameByFrameV2 width="300" aspectRatio="{1}"
                                                          introImagesKeys={[]}
                                                          imagesKeys="{images.vfx.flame}"
                                                          isRotated="{false}"
                                                          isPlaying="{true}"
                                                          delay="{0}"
                                                          isDimmed="{false}"/>
                             </div>
                         {/if}
                     </div>
                 </div>

                 {#if openTeamSelect}
                     <div style="z-index: 100;position: absolute;left: 50%; top:50%; transform: translate(-50%, -50%);">
                         <img alt src="{images.ui.select['CHARACTER BOARD BG']}" style="width: 100%;">
                         <div style="display:flex;width: 50%; position: absolute; top: 0; left: 50%; transform: translate(-50%)">
                             <img alt src="{images.ui.select['CHOOSE']}" style="width: 100%;">
                             <span style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%)"></span>
                         </div>
                         <div style="width: 300px; position: absolute; left: 0; top: 50%; transform: translate(-40%, -50%)">
                             <img alt src="{images.ui.select['Asset 14']}" style="width: 100%;">
                             <span style="position: absolute; left: 50%; top: 7px; transform: translateX(-80%)">STATS</span>

                             <span style="position: absolute; left: 44%; top: 50px; transform: translateX(-50%); font-size: 1.2rem;">ATTACK</span>
                             <div style="position: absolute; left: 44%; top: 75px; transform: translateX(-50%); width: 110px; height: 15px; background: #F3E8D3; border: solid 3px #442015; "></div>
                             <div style="position: absolute; left: 77px; top: 78px; width: {110 * (helpers.units[availableUnits[selectedUnitIndex]].attackMax / 130)}px; height: 15px; background: #B05032 "></div>

                             <span style="position: absolute; left: 44%; top: 100px; transform: translateX(-50%); font-size: 1.2rem;">DODGE</span>
                             <div style="position: absolute; left: 44%; top: 125px; transform: translateX(-50%); width: 110px; height: 15px; background: #F3E8D3; border: solid 3px #442015; "></div>
                             <div style="position: absolute; left: 77px; top: 128px; width: {110 * (helpers.units[availableUnits[selectedUnitIndex]].evasion / 100)}px; height: 15px; background: #B5ACA0 "></div>

                             <span style="position: absolute; left: 44%; top: 150px; transform: translateX(-50%); font-size: 1.2rem;">SPEED</span>
                             <div style="position: absolute; left: 44%; top: 175px; transform: translateX(-50%); width: 110px; height: 15px; background: #F3E8D3; border: solid 3px #442015; "></div>
                             <div style="position: absolute; left: 77px; top: 178px; width: {110 * (helpers.units[availableUnits[selectedUnitIndex]].speed / 120)}px; height: 15px; background: #6C868E "></div>

                             <span style="position: absolute; left: 44%; top: 200px; transform: translateX(-50%); font-size: 1.2rem;">HP</span>
                             <div style="position: absolute; left: 44%; top: 225px; transform: translateX(-50%); width: 110px; height: 15px; background: #F3E8D3; border: solid 3px #442015; "></div>
                             <div style="position: absolute; left: 77px; top: 228px; width: {110 * (helpers.units[availableUnits[selectedUnitIndex]].maxHitPoints / 800)}px; height: 15px; background: #8B906C "></div>

                             <span style="position: absolute; left: 44%; top: 250px; transform: translateX(-50%); font-size: 1.2rem;">SPECIAL SKILL</span>
                             <span style="position: absolute; left: 40%; top: 275px; transform: translateX(-50%); font-size: 0.88rem;">{helpers.units[availableUnits[selectedUnitIndex]].skillDesc}</span>
                         </div>

                         <div style="position: absolute; left: 50%; top: 85%; transform: translate(-50%, -50%); width: 500px;">
                             <AnimationFrameByFrameV2 width="{500}" aspectRatio="{helpers.units[availableUnits[selectedUnitIndex]].aspectRatio}"
                                                      introImagesKeys={[]}
                                                      imagesKeys="{{...images.units[availableUnits[selectedUnitIndex]].idle, ...images.units[availableUnits[selectedUnitIndex]].walk, ...images.units[availableUnits[selectedUnitIndex]].attack, ...images.units[availableUnits[selectedUnitIndex]].hurt}}"
                                                      isRotated="{true}"
                                                      isPlaying="{true}"
                                                      delay="{0}"
                                                      isDimmed="{false}"/>
                         </div>

                         <div style="position: absolute; left: 18%; top: 50%; transform: translate(-50%, -50%); width: 20px;cursor:pointer;"  on:click={() => {prevUnit()}}>
                             <img alt src="{images.ui.select['Asset 13']}" style="width: 100%;">
                         </div>
                         <div style="position: absolute; right: 18%; top: 50%; transform: translate(-50%, -50%); width: 20px; cursor:pointer;" on:click={() => {nextUnit()}}>
                             <img alt src="{images.ui.select['Asset 13']}" style="width: 100%; transform: rotate(180deg)">
                         </div>

                         <div style="width: 400px;position: absolute; right: 50%;  top: 50%; transform: translate(calc(50vw - 0%), -50%);">
                             <img alt src="{images.ui.select['BOARD']}" style="width: 100%;">
                             <span style="position: absolute; left: 54%; top: 8%; transform: translate(-50%, -50%)">FRONT LINE</span>

                             <div style="
                         cursor: pointer;
            width: 33%;
            position: absolute;
            left: 33%;
            top: 28%;
            transform: translate(-50%, -50%);" on:click={()=> {selectedLine = 'front'; selectedPosition = 0;}}>
                                 {#if selectedFront[0]}
                                     <img alt src="{images.ui.avatars[selectedFront[0]]}">
                                 {:else}
                                     <img alt src="{images.ui.select['+']}">
                                 {/if}
                             </div>
                             <div style="
                         cursor: pointer;
             width: 33%;
            position: absolute;
            left: 77%;
            top: 28%;
            transform: translate(-50%, -50%);" on:click={()=> {selectedLine = 'front'; selectedPosition = 1;}}>
                                 {#if selectedFront[1]}
                                     <img alt src="{images.ui.avatars[selectedFront[1]]}">
                                 {:else}
                                     <img alt src="{images.ui.select['+']}">
                                 {/if}
                             </div>
                             <span style="position: absolute; left: 54%; top: 53%; transform: translate(-50%, -50%)">BACK LINE</span>
                             <div on:click={()=> {selectedLine = 'back'; selectedPosition = 0;}} style="
        width: 33%;   cursor: pointer;
        position: absolute;
        left: 33%;
        top: 73%;
        transform: translate(-50%, -50%);">
                                 {#if selectedBack[0]}
                                     <img alt src="{images.ui.avatars[selectedBack[0]]}">
                                 {:else}
                                     <img alt src="{images.ui.select['+']}">
                                 {/if}
                             </div>
                             <div on:click={()=> {selectedLine = 'back'; selectedPosition = 1;}} style="
        width: 33%;   cursor: pointer;
        position: absolute;
        left: 77%;
        top: 73%;
        transform: translate(-50%, -50%);">
                                 {#if selectedBack[1]}
                                     <img alt src="{images.ui.avatars[selectedBack[1]]}">
                                 {:else}
                                     <img alt src="{images.ui.select['+']}">
                                 {/if}
                             </div>

                             <div style="width: 50%;
        position: absolute;
        left: 55%;
        bottom: -30px;
        transform: translate(-50%, -50%); cursor: pointer;" on:click={() => {
                                settingsStore.set('actualView', 'BATTLE');
                                openTeamSelect = false;
                            }}>
                                 <img src="{images.ui.select['NAPIERA']}" alt />
                                 <span style=" position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -60%);">FIGHT!</span>
                             </div>

                         </div>
                         <img alt src="{images.ui.select['X']}" style="width: 40px; position: absolute; top: 10px; right: 10px; cursor: pointer;" on:click={() => {openTeamSelect = false;}}>
                     </div>
                 {/if}
             {/if}

         {/if}
     {/if}
  {/if}
{:else}
 <div class="loading">
  Loading.. {totalLoaded} from {totalItems}
 </div>
{/if}

<div class="hidden"></div>
<style lang="scss">
 .hidden {
  position: fixed;
  top: 100vh;
  width: 100vw;
 }
</style>
