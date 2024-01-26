<script lang="ts">
    import ButtonV2 from "src/components/common/ButtonV2.svelte";
    import settingsStore from "src/stores/settings";
    import {fade} from "svelte/transition";
    import {createEventDispatcher, onDestroy} from "svelte";

    export let type = 'default';

    const dispatch = createEventDispatcher();

    onDestroy(() => {
        dispatch('onDestroy');
    })
</script>

<div class="modal {type}" in:fade={{duration: 200}} out:fade={{duration: 100}}>
    <div style="position: absolute;
    left: 0px;
    top: 0px;
    width: 115px;
    height: 80px;
    background: rgb(199, 149, 92);
    padding: 10px;">
        <ButtonV2 mode="back" on:click={() => {settingsStore.set('actualModal', null);}}></ButtonV2>
    </div>


    {#if $$slots.menu}
        <div style="position: absolute;left: 0px;
        top: 80px;
        width: 115px;
        height: calc(100% - 50px);
        overflow: hidden;
        background: rgb(199, 149, 92);
        padding: 10px;">
            <slot name="menu"/>
        </div>
    {/if}

    {#if $$slots.topMenu}
        <div style="position: absolute;    left: 115px;
        top: 0px;
        width: calc(100% - 115px);
        height: 80px;
        overflow: hidden;
        background: rgb(199, 149, 92);
        padding: 10px;">
            <slot name="topMenu"/>
        </div>
    {/if}

    <div style="position: absolute;left: {$$slots.menu ? '115px' : '0px'};top: {$$slots.topMenu ? '80px' : '0px'};width: calc(100vw - {$$slots.menu ? '115px' : '0px'}); height: calc(100vh - {$$slots.topMenu ? '80px' : '0px'}); display: flex;">
        <slot/>
    </div>
</div>



<style lang="scss">
  .modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 101;
    backface-visibility: hidden;
    background: #c7955c;

    &.withoutBackground {
      background: none;
    }
  }
</style>

