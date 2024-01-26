<script lang="ts">
    import GlobalMenu from "src/components/common/GlobalMenu.svelte";
    import settingsStore from "src/stores/settings";
</script>

{#if !$settingsStore.actualModal}
    <div class="menu--component">
        <GlobalMenu/>
    </div>
{/if}

<style lang="scss">
  .menu--component {
    height: 100px;
    flex-wrap: wrap;
    display: flex;
    max-width: 70vw;
    position: absolute;
    z-index: 1;
    bottom: 0;
  }
</style>