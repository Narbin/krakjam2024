<script lang="ts">

</script>

<div class="overviewModule">

</div>


<style lang="scss">
  .overviewModule {
    position: absolute;
    width: 0;
    height: 0;
    transform-style: preserve-3d;
    backface-visibility: hidden;
    visibility: hidden;
    overflow: hidden;

    &.active {
      position: relative;
      height: 100%;
      width: 100%;
      visibility: visible;
      overflow: visible;
    }
  }

</style>
