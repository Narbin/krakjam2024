<script lang="ts">
    import settingsStore from "src/stores/settings";
    import InteractiveButton from "src/components/common/InteractiveButton.svelte";
    function toggleModal(modalName) {
        if ($settingsStore.actualModal === modalName) {
            settingsStore.set('actualModal', null);
        } else {
            settingsStore.set('actualModal', modalName);
        }
    }
</script>

<div class="menu">
    <div class="menuButton">
        <InteractiveButton src="{''}" onClick={() => {toggleModal('overview')}}/>
    </div>
</div>


<style lang="scss">
    .menu {
      display: flex;
      justify-content: center;

      .menuButton {
        margin-top: -1.5rem;
        margin-left: 0.5rem;
        margin-right: 0.5rem;
        flex: 0 0 7rem;
        display: flex;
      }
    }
</style>
