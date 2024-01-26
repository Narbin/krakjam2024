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


unitsStore.addUnit({id: 'player1', line: 'front', width: 0.1, aspectRadio: 16/9, place: 1, team: 'player', hitPoints: 5, maxHitPoints: 5, speed: 100, attack: 1})
unitsStore.addUnit({id: 'player2', line: 'front', width: 0.1, aspectRadio: 16/9, place: 2, team: 'player', hitPoints: 5, maxHitPoints: 5, speed: 100, attack: 1})
unitsStore.addUnit({id: 'player3', line: 'back', width: 0.1, aspectRadio: 16/9, place: 1, team: 'player', hitPoints: 5, maxHitPoints: 5, speed: 100, attack: 1})
unitsStore.addUnit({id: 'player4', line: 'back', width: 0.1, aspectRadio: 16/9, place: 2, team: 'player', hitPoints: 5, maxHitPoints: 5, speed: 100, attack: 1})
unitsStore.addUnit({id: 'enemy1', line: 'back', width: 0.1, aspectRadio: 16/9, place: 1, team: 'enemy', hitPoints: 4, maxHitPoints: 4, speed: 90, attack: 1})
unitsStore.addUnit({id: 'enemy2', line: 'back', width: 0.1, aspectRadio: 16/9, place: 2, team: 'enemy', hitPoints: 4, maxHitPoints: 4, speed: 110, attack: 1})
unitsStore.addUnit({id: 'enemy3', line: 'front', width: 0.1, aspectRadio: 16/9, place: 1, team: 'enemy', hitPoints: 4, maxHitPoints: 4, speed: 110, attack: 1})
unitsStore.addUnit({id: 'enemy4', line: 'front', width: 0.1, aspectRadio: 16/9, place: 2, team: 'enemy', hitPoints: 4, maxHitPoints: 4, speed: 110, attack: 1})

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
            // pobieramy wszystkie postacie playera
            let availableUnitsToAttack = $unitsStore.filter(obj => obj.team === 'player');
            if (currentUnitObj.line === 'front') {
                // jezeli jestesmy na froncie to tylko frontowe mozemy zaatakowac
                const playersFront = availableUnitsToAttack.filter(obj => obj.line === 'front');

                // chyba ze nie froncie nie ma juz nikogo to bierzemy back
                if(playersFront.length === 0) {
                    availableUnitsToAttack = availableUnitsToAttack.filter(obj => obj.line === 'back');
                } else {
                    availableUnitsToAttack = playersFront;
                }
            } else {// todo: dorobic prowokacje

            }
            const lowestHpPlayerObj = availableUnitsToAttack.sort((a, b) => a.hitPoints - b.hitPoints)

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

function checkIfCanPlayerAttackUnit(unit) {
    if (currentUnitObj && currentUnitObj.team === 'player' && unit.team === 'enemy') {
        if (currentUnitObj.line === 'front') {
            const frontEnemies = $unitsStore.filter(obj => obj.line === 'front');
            if (frontEnemies.length === 0) {
                return true;
            } else {
                if (unit.line === 'front') {
                    return true;
                }
            }
        } else {
            return true;
        }
    }

    return false;
}


let spaceBetweenUnits = 0;
let startingPointOfPlayer = 0;
let startingPointOfEnemy = 0;
$: {
    spaceBetweenUnits = contentWidth * 0.1;
    startingPointOfPlayer = contentWidth * 0.2;
    startingPointOfEnemy = contentWidth * 0.8;
}

onMount(() => {
})
let hoveredUnitId = null;
</script>

<div class="test" style="
        aspect-ratio: 16/9;
        position: relative;
        margin: 0 auto;">
    <div style="
    border: 1px solid black;
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
                       {hoveredUnitId === unit.id ? 'filter:drop-shadow(2px 4px 6px black);' : ''}
                       border:1px solid {currentUnitObj && currentUnitObj.id === unit.id ? 'red' : 'black'};
                       height: {unitWidth * 16/9}px;
                       width: {unitWidth}px;
                       transform: translate3d({unit.team === 'player' ? ((unit.line === 'front' ? startingPointOfPlayer : startingPointOfPlayer - spaceBetweenUnits * 1.5 ) + (spaceBetweenUnits * unit.place) - (unitWidth * 0.5)) : ((unit.line === 'front' ? startingPointOfEnemy : startingPointOfEnemy + spaceBetweenUnits * 1.5 )  + (spaceBetweenUnits * unit.place) - (unitWidth * 0.5))}px, 0px, -{unit.place * 100}px)"
                        on:click={() => {
                       if(currentUnitObj && currentUnitObj.team === 'player') {
                          unitsStore.attack(currentUnitObj.id, unit.id);
                          nextMove()
                       }}}
                     on:mouseover={() => {
                         if (checkIfCanPlayerAttackUnit(unit)) {
                             hoveredUnitId = unit.id;
                         }
                     }}
                     on:mouseleave={() => { hoveredUnitId = null; }}
                >
                    <img src="{images.unit}" style="width: 100%; height: auto;">
                    <div style="width: {(unit.hitPoints / unit.maxHitPoints * 100)}%; height: 25px; background: green; position: absolute; bottom: 0;">
                    </div>
                </div>

            {/each}
        {/if}
    </div>
</div>

<style lang="scss">
  @media (min-aspect-ratio: 16/9) {
    .test {
      width: auto;
      height: 100%;
    }
  }

  @media (max-aspect-ratio: 16/9) {
    .test {
      width: 100%;
      height: auto;
    }
  }
</style>