<script lang="ts">
    import Game from './Game.svelte'
</script>
<style lang="scss">
  main {
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    overflow: hidden;
  }

</style>

<svelte:head>
    <style>

        html, body {
            margin: 0;
        }
    </style>
    <title>Game</title>
</svelte:head>

<main>
    <Game/>
</main>