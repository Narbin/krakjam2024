<script lang="ts">
    import timeStore from "src/stores/time";
    import {get} from "svelte/store";
    import {createEventDispatcher, onMount} from 'svelte';
    import settingsStore from "src/stores/settings";
    import {loadImage, loadImageWithWorker} from "src/helpers";
    import _, {create} from "lodash";
    import {gsap} from "gsap";
    import * as helpers from "/src/helpers";

    export let imagesKeys = {};
    export let introImagesKeys = {};
    export let width = null;
    export let aspectRatio = null;
    export let isRotated = false;
    export let id = '';
    export let delay = 0;
    export let once = false;
    export let isPlaying = true;
    export let debug = false;

    const dispatch = createEventDispatcher();
    let canvas;
    const cache = [];
    let frame = null;
    let ctx;
    let frameIndex = 0;
    let finished = false;
    let introFinished = false;
    let outOfView = false;
    let cachedImagesKeys = {};
    let cachedIntroImagesKeys = {};

    let _delay = 0;
    let imagesArray = [];
    let introImagesArray = [];

    let shouldUpdate = true;

    $: {
        const newImagesKeys = {...imagesKeys};
        if (!_.isEqual(cachedImagesKeys, newImagesKeys)) {
            resetImagesArray(newImagesKeys);
        }
    }

    function resetImagesArray(newImagesKeys) {
        cachedImagesKeys = newImagesKeys;
        imagesArray = Object.keys(newImagesKeys);
        frameIndex = 0;
        finished = false;
        // if (_delay === 0) {
            shouldUpdate = true;
        // }
    }
    $: {
        const newIntroImagesArray = {...introImagesKeys};
        if (!_.isEqual(cachedIntroImagesKeys, newIntroImagesArray)) {
            resetIntroImagesArray(newIntroImagesArray);
        }
    }
    function resetIntroImagesArray(newIntroImagesArray) {
        cachedIntroImagesKeys = newIntroImagesArray;
        introImagesArray = Object.keys(newIntroImagesArray);
        frameIndex = 0;
        introFinished = false;
        // if (_delay === 0) {
            shouldUpdate = true;
        // }
    }

    $: {
        if (!_.isEqual(_delay, delay)) {
            resetDelay(delay);
        }
    }

    function resetDelay(__delay) {
        _delay = __delay;
    }
    // Very fast rounding in JavaScript
    const round = x => x + 0.5 << 0

    function initCanvas() {
        // do weryfuikacji
        ctx = canvas.getContext('2d', {desynchronized: false});
        // const scale = window.devicePixelRatio;
        const scale = 1;
        canvas.width = Math.floor(ctx.canvas.width * scale);
        canvas.height = Math.floor(ctx.canvas.height * scale);

        frameIndex = 0;
        finished = false;

        const throttleAnimation = (animation) => {
            let frame = 0

            const ticker = gsap.ticker,
                time = ticker.time,
                frameLength = 1 / $settingsStore.frameByFrameFPS,
                update = function () {
                    const newTime = ticker.time - time,
                        newFrame = round(newTime / frameLength)
                    if (frame !== newFrame) {
                        frame = newFrame
                        animation.time(newTime)
                        loop();

                    }
                }

            animation.pause()
            ticker.add(update)
        }

        throttleAnimation(gsap.to([1], {
            duration: 1,
            repeat: -1,
            ease:'linear',
            endArray: [2],
        }))

        let options = {
            root: document.body,
            rootMargin: '0px',
            threshold: 0
        }


        // let observer = new IntersectionObserver((entries) => {
        //     entries.forEach((entry) => {
        //         outOfView = !entry.isIntersecting;
        //     });
        // }, options);
        //
        // observer.observe(canvas);
    }

    $: {
        if (!outOfView) {
            // shouldUpdate = true;
        }
    }

    async function loop() {
        if ($timeStore.isRunning && isPlaying && !finished && shouldUpdate) {
            let actualFrame = null;

            if (introImagesArray.length > 0 && !introFinished) {
                actualFrame = await getFrame(cachedIntroImagesKeys[introImagesArray[frameIndex]]);
            } else {
                actualFrame = await getFrame(cachedImagesKeys[imagesArray[frameIndex]]);
            }

            if (debug) {
                // console.log(introFinished, frameIndex);
            }

            if ((introImagesArray.length > 0 && !introFinished && introImagesArray.length <= frameIndex)
                || ((introImagesArray.length === 0 || (introImagesArray.length > 0 && introFinished)) && imagesArray.length <= frameIndex)) {

                if (introImagesArray.length > 0 && !introFinished && introImagesArray.length <= frameIndex) {
                    introFinished = true;
                }

                frameIndex = 0;
                if (once) {
                    finished = true;
                    dispatch('end', true);
                }

                if (_delay > 0) {
                    shouldUpdate = false;
                    helpers.delayCall(() => {
                        shouldUpdate = true;
                    }, delay / 1000)
                    dispatch('end', true);
                }
            }

            actualFrame && drawFrame(actualFrame);
            frameIndex += 1;
        }
    }

    async function getFrame(imageSrc) {
        if (!window.animationCache[imageSrc] && imageSrc) {
            window.animationCache[imageSrc] = await loadImg(imageSrc).catch(() => {
                console.log('missing frame');
            });
        }
        return window.animationCache[imageSrc];
    }

    function loadImg(src) {
        return new Promise((resolve, reject) => {
            if (src) {
                loadImageWithWorker(src).then(img => {
                    resolve(img);
                });
            } else {
                reject();
            }
        })
    }

    function drawFrame(img) {
        if (!outOfView && !$settingsStore.actualModal) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.drawImage(img, 0, 0, ctx.canvas.width, ctx.canvas.height);
        }
    }

    onMount(() => {
        if (!window.animationCache) {
            window.animationCache = {};
        }

        if (!frame) {
            initCanvas();
        }
    });
</script>

<div class="wrapper" class:isRotated={isRotated} class:hide={!isPlaying}>
    <canvas bind:this={canvas} width="{width}" height="{width * aspectRatio}"></canvas>
</div>

<style lang="scss">
  .wrapper {
    position: absolute;
    bottom: 0;
    display: flex;
    opacity: 1;
    max-width: 100%;

    canvas {
      max-width: 100%;
    }

    &.isRotated {
      transform-origin: 50% 100%;
      transform: rotateY(180deg);

      canvas {
        backface-visibility: visible;
      }
    }

    &.hide {
      opacity: 0;
    }
  }
</style>