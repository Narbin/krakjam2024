<script lang="ts">
    import * as helpers from "src/helpers";
    import {sounds} from "src/assets";

    export let onClick = () => {
    };

    let hovering;

    function enter(e) {
        hovering = true;
    }

    function leave() {
        // opozniamy zeby dokonczyc transition inaczej konczy sie za szybko i miga
        helpers.delayCall(() => {
            hovering = false;
        }, 0.04);
    }

    export let src = '';

    function openSound() {
        // helpers.loadAudio(sounds['button click']).then((obj) => {
        //     obj.play();
        // });

        return {
            destroy() {

            }
        }
    }
</script>

<div on:touchstart|passive={enter} on:click={(e) => {onClick(e); openSound();}}
     on:touchend={leave} on:mousedown={enter} on:mouseup={leave} on:mouseleave={leave} class:hovering={hovering}>
    <img src="{src}" alt decoding="async" loading="lazy"/>
</div>

<style lang="scss">
  div {
    cursor: pointer;
    opacity: 1;
    transition: all 0.08s cubic-bezier(0.58, -0.91, 0.51, 2.17);
    transform: scale(1);

    img {
      pointer-events: none;
      transform: scale(1);
      width: 100%;
      height: auto;
      transition: all 0.08s cubic-bezier(0.58, -0.91, 0.51, 2.17);
    }

    &.hovering {
      opacity: 0.5;
      // musimy powiekszyć parenta żeby się nie zmniejszał, inaczej nie działa click bo wychodzi poza parent
      transform: scale(1);
      img {
        transform: scale(0.8);
      }
    }
  }
</style>