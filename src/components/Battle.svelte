<script>
import {images} from "src/assets";
import _ from "lodash";
import * as helpers from "src/helpers";
import {writable} from "svelte/store";
import {onMount} from "svelte";
let contentWidth;
console.log(contentWidth)
const {subscribe, set, update} = writable([]);

const unitsStore = {
    update,
    subscribe,
    addUnit: (unit) => update(items => {
        const newItems = [...items, unit];

        return newItems;
    }),
    attack: (from, to) => update(items => {
        const newItems = [...items];

        const fromObj = newItems.find(obj => obj.id === from);
        const toObj = newItems.find(obj => obj.id === to);

        toObj.hitPoints -= fromObj.attack;

        if (toObj.hitPoints <= 0) {
            newItems.splice(newItems.indexOf(toObj), 1);
        }

        return newItems;
    }),
};


unitsStore.addUnit({id: 'player1', width: 0.1, aspectRadio: 16/9, place: 1, team: 'player', hitPoints: 5, maxHitPoints: 5, speed: 100, attack: 1})
unitsStore.addUnit({id: 'player2', width: 0.1, aspectRadio: 16/9, place: 2, team: 'player', hitPoints: 5, maxHitPoints: 5, speed: 100, attack: 1})
unitsStore.addUnit({id: 'enemy1', width: 0.1, aspectRadio: 16/9, place: 1, team: 'enemy', hitPoints: 4, maxHitPoints: 4, speed: 90, attack: 1})
unitsStore.addUnit({id: 'enemy2', width: 0.1, aspectRadio: 16/9, place: 2, team: 'enemy', hitPoints: 4, maxHitPoints: 4, speed: 110, attack: 1})

let currentUnitObj = null;
$: {
    currentUnitObj = $unitsStore.find(obj => obj.id === moves[currentMove]);
}

$: {
    moves = _.orderBy($unitsStore, 'speed', 'desc').map(obj => obj.id)
}

let moves = _.orderBy($unitsStore, 'speed', 'desc').map(obj => obj.id)
let currentMove = 0;

$: {
    if (currentUnitObj && currentUnitObj.team === 'enemy') {
        helpers.delayCall(() => {
            const lowestHpPlayerObj = $unitsStore.filter(obj => obj.team === 'player').sort((a, b) => a.hitPoints - b.hitPoints)
            unitsStore.attack(currentUnitObj.id, lowestHpPlayerObj[0].id);
            nextMove();
        }, 0.1)
    }
}
function nextMove() {
    if ($unitsStore.length - 1 === currentMove) {
        currentMove = 0;
    } else  {
        currentMove += 1;
    }
}


let spaceBetweenUnits = 0;
let startingPointOfPlayer = 0;
let startingPointOfEnemy = 0;
$: {
    spaceBetweenUnits = contentWidth * 0.1;
    startingPointOfPlayer = 0;
    startingPointOfEnemy = contentWidth * 1;
}

onMount(() => {
    console.log(contentWidth)
})
</script>

<div style="
      height: 100%;
      aspect-ratio: 16/9;
position: relative;
margin: 0 auto;">
    <div style="
width: 100%;
height: 100%;
      perspective: 100px;
   transform-style: preserve-3d;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      position: absolute;" bind:clientWidth={contentWidth}>
        {#if contentWidth > 0}
            {#each $unitsStore as unit (unit.id)}
                {@const unitWidth = unit.width * contentWidth}
                <div on:keydown={() => {}} class="{unit.id}"
                       style="position:absolute;
                       left:0; bottom:0;
                       border:1px solid {currentUnitObj && currentUnitObj.id === unit.id ? 'red' : 'black'};
                       height: {unitWidth * 16/9}px;
                       width: {unitWidth}px;
                       transform: translate3d({unit.team === 'player' ? (startingPointOfPlayer + (spaceBetweenUnits * unit.place) - (unitWidth * 0.5)) : (startingPointOfEnemy + (spaceBetweenUnits * unit.place) - (unitWidth * 0.5))}px, 0px, -{unit.place * 100}px)"
                        on:click={() => {
                       if(currentUnitObj && currentUnitObj.team === 'player') {
                          unitsStore.attack(currentUnitObj.id, unit.id);
                          nextMove()
                       }}}>
                    <img src="{images.unit}" style="width: 100%; height: auto;">
                    <div style="width: {(unit.hitPoints / unit.maxHitPoints * 100)}%; height: 25px; background: green; position: absolute; bottom: 0;">
                    </div>
                </div>

            {/each}
        {/if}
    </div>
</div>