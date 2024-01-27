<script>
    import {images, music, sounds} from "src/assets";
import _ from "lodash";
import * as helpers from "src/helpers";
import {writable} from "svelte/store";
import {onMount} from "svelte";
import {units} from "src/helpers";
import {gsap} from "gsap";
let contentWidth;
console.log(contentWidth)
const {subscribe, set, update} = writable([]);

const playerProvocations = [];

const unitsStore = {
    update,
    subscribe,
    addUnit: (unit) => update(items => {
        const newItems = [...items, unit];

        return newItems;
    }),
    attack: (from, to, skillId = 0) => update(items => {
        const newItems = [...items];

        const fromObj = newItems.find(obj => obj.id === from);
        const toObj = newItems.find(obj => obj.id === to);

        if (skillId === 0) {
            toObj.hitPoints -= _.random(fromObj.attackMin, fromObj.attackMax);
        } else {
            if (fromObj.type === 'Tank') {
                playerProvocations.push({
                    id: fromObj.id,
                    uses: 2,
                });
                console.log('dodano prowokacje!')
            } else if (fromObj.type === 'Shooter'){
                const backLine = newItems.filter(obj => obj.team !== fromObj.team && obj.line === toObj.line);
                const att = _.random(fromObj.attackMin, fromObj.attackMax) * 0.5;
                backLine.forEach(obj => {
                    obj.hitPoints -= att;
                });
            } else if (fromObj.type === 'Melee'){
                const row = newItems.filter(obj => obj.team !== fromObj.team && obj.place === toObj.place);
                const att = _.random(fromObj.attackMin, fromObj.attackMax);
                row.forEach(obj => {
                    if (obj.line === 'front') {
                        obj.hitPoints -= att * 1.2;
                    } else {
                        obj.hitPoints -= att * 0.8;
                    }
                });
            } else if (fromObj.type === 'Enemy1'){
                const playerTeam = newItems.filter(obj => obj.team !== fromObj.team);
                playerTeam.forEach(obj => {
                    obj.speed = ~~(obj.speed * 0.7);
                });
            }

            fromObj.cooldown = fromObj.timeout;
        }

        if (toObj.hitPoints <= 0) {
            newItems.splice(newItems.indexOf(toObj), 1);
        }

        return newItems;
    }),
    reduceCooldown: () => update(items => {
        const newItems = [...items].map(obj => {
            obj.cooldown -= 1;
            if (obj.cooldown <= 0) {
                obj.cooldown = 0;
            }
            console.log('CD REDUCED', obj.id, obj.cooldown)
            return obj;
        });
        return newItems;
    })
};


unitsStore.addUnit({id: 'player1', line: 'front', width: 0.1, aspectRadio: 16/9, place: 1, team: 'player', ...units.Tank})
unitsStore.addUnit({id: 'player2', line: 'back', width: 0.1, aspectRadio: 16/9, place: 2, team: 'player', ...units.Shooter})
unitsStore.addUnit({id: 'player3', line: 'back', width: 0.1, aspectRadio: 16/9, place: 1, team: 'player', ...units.Melee})
unitsStore.addUnit({id: 'enemy1', line: 'front', width: 0.1, aspectRadio: 16/9, place: 1, team: 'enemy', ...units.Enemy1})
unitsStore.addUnit({id: 'enemy2', line: 'front', width: 0.1, aspectRadio: 16/9, place: 2, team: 'enemy', ...units.Enemy1})
// unitsStore.addUnit({id: 'enemy3', line: 'front', width: 0.1, aspectRadio: 16/9, place: 1, team: 'enemy', ...units.Melee})
// unitsStore.addUnit({id: 'enemy4',  line: 'front', width: 0.1, aspectRadio: 16/9, place: 2, team: 'enemy', ...units.Melee})

let currentUnitObj = null;
$: {
    currentUnitObj = $unitsStore.find(obj => obj.id === moves[currentMove]);
    console.log('currentUnitObj', currentMove, currentUnitObj)
}

$: {
    moves = _.orderBy($unitsStore, 'speed', 'desc').map(obj => obj.id)
    console.log('moves', moves)
}

let moves = _.orderBy($unitsStore, 'speed', 'desc').map(obj => obj.id)
let currentMove = 0;

$: {
    if (currentUnitObj && currentUnitObj.team === 'enemy') {
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
        }
        let lowestHpPlayerObj = null;
        if (playerProvocations.length > 0) {
            const newestProvocation = playerProvocations[playerProvocations.length - 1];
            const provUnit = availableUnitsToAttack.find(obj => obj.id === newestProvocation.id);
            console.log(newestProvocation, provUnit, availableUnitsToAttack)
            if (provUnit) {
                lowestHpPlayerObj = provUnit;
                newestProvocation.uses -= 1;
                if (newestProvocation.uses === 0) {
                    playerProvocations.splice(playerProvocations.indexOf(newestProvocation), 1);
                }
            }
        }

        console.log(lowestHpPlayerObj)
        if (!lowestHpPlayerObj) {
            lowestHpPlayerObj = availableUnitsToAttack.sort((a, b) => a.hitPoints - b.hitPoints)[0] || null;
        }

        if (lowestHpPlayerObj) {
            attackAnimation(currentUnitObj.id, lowestHpPlayerObj.id, 0, () => {
                unitsStore.attack(currentUnitObj.id, lowestHpPlayerObj.id);
            }, () => {
                nextMove();
            })
        }
        nextMove();
    }
}
function nextMove() {
    if ($unitsStore.length - 1 === currentMove) {
        currentMove = 0;
        unitsStore.reduceCooldown();
    } else  {
        currentMove += 1;
    }

    if (!moves[currentMove]) {
        currentMove = 0;
    }

    console.log(currentMove)
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

let selectedSkillId = null;

function selectPossibleUnitsToAttack(unit){
    if (currentUnitObj && currentUnitObj.team === 'player' && unit.team === 'enemy') {
        if (selectedSkillId === 1) {
            if (currentUnitObj.type === 'Shooter') {
                const backLine = $unitsStore.filter(obj => obj.team === unit.team && obj.line === unit.line);
                backLine.forEach(obj => {
                    hoveredUnits = [...hoveredUnits, obj.id]
                });
            } else if (currentUnitObj.type === 'Melee') {
                const row = $unitsStore.filter(obj => obj.team === unit.team && obj.place === unit.place);
                row.forEach(obj => {
                    hoveredUnits = [...hoveredUnits, obj.id]
                });
            } else if (currentUnitObj.type === 'Tank') {
                $unitsStore.filter(obj => obj.team === unit.team).forEach(obj => {
                    hoveredUnits = [...hoveredUnits, obj.id]
                });
            }
        } else {
            if (checkIfCanPlayerAttackUnit(unit)) {
                hoveredUnits = [...hoveredUnits, unit.id]
            }
        }
    }
}

onMount(() => {
    helpers.loadAudio(music['Boss_-_Baroness_Battle']).then((obj) => {
        obj.play();
    });
})
let hoveredUnits = [];

function attackAnimation(from, to, selectedSkillId, onAttack, onComplete) {
    const tl = gsap.timeline({paused: true});
    const toX = gsap.getProperty(`.${to}`, "x");
    const fromX = gsap.getProperty(`.${from}`, "x");
    const toWidth = gsap.getProperty(`.${to}`, "width");
    tl.to(`.${from}`, {
        ease: "power1.in",
        yoyo: true,
        translateX: toX + (fromX > toX ? toWidth : -toWidth),
        translateY: gsap.getProperty(`.${to}`, "y"),
        translateZ: gsap.getProperty(`.${to}`, "z"),
        duration: 0.7,
        repeat: 1,
        repeatDelay: 0.3,
        onComplete: onComplete,
        onRepeat: () => {
            onAttack();
        }
    })
    tl.play();
}
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
                <div on:keydown={() => {}} class="{unit.id}" class:isActive={hoveredUnits.includes(unit.id)}
                       style="position:absolute;
                       left:0; bottom:0;
                       border:1px solid {currentUnitObj && currentUnitObj.id === unit.id ? 'red' : 'black'};
                       height: {unitWidth * 16/9}px;
                       width: {unitWidth}px;
                       transform: translate3d({unit.team === 'player' ? ((unit.line === 'front' ? startingPointOfPlayer : startingPointOfPlayer - spaceBetweenUnits * 1.5 ) + (spaceBetweenUnits * unit.place) - (unitWidth * 0.5)) : ((unit.line === 'front' ? startingPointOfEnemy : startingPointOfEnemy + spaceBetweenUnits * 1.5 )  + (spaceBetweenUnits * unit.place) - (unitWidth * 0.5))}px, 0px, -{unit.place * 100}px)"
                        on:click={() => {
                       if(currentUnitObj && currentUnitObj.team === 'player' && selectedSkillId !== null) {
                           attackAnimation(currentUnitObj.id, unit.id, selectedSkillId, () => {
                               if (Math.random() * 100 >= unit.evasion) {
                                    unitsStore.attack(currentUnitObj.id, unit.id);
                                    helpers.loadAudio(sounds['whip01-6952']).then((obj) => {
                                        obj.play();
                                    });
                                    unitsStore.attack(currentUnitObj.id, unit.id, selectedSkillId);
                               } else {
                                   // todo: evadeAnimation
                                   console.log('MISS')
                               }
                           }, () => {
                              nextMove();
                               selectedSkillId = null;
                              hoveredUnits = [];
                           })
                       }}}
                     on:mouseenter={() => {
                         if (selectedSkillId !== null) {
                            selectPossibleUnitsToAttack(unit)
                         }
                     }}
                    on:mouseleave={() => {hoveredUnits = [];}}
                >  {unit.type} - {unit.line} - {unit.place}
                    <img src="{images.unit}" style="width: 100%; height: auto;">

                    <div style="width: {(unit.hitPoints / unit.maxHitPoints * 100)}%; height: 25px; background: green; position: absolute; bottom: 0;">
                    </div>
                </div>

            {/each}
        {/if}
    </div>
</div>

<div style="position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); display: flex;justify-content: center;align-items: center;
{currentUnitObj && currentUnitObj.team !== 'player' ? 'filter: blur(3px);' : ''}
">
<div style="margin:0 10px;width: 100px; height: 100px; border: 1px solid {selectedSkillId === 0 ? 'red' : 'black'};" on:click={() => {selectedSkillId = 0}}>
    ZWYKŁY ATAK
</div>
<div style=" position: relative;margin:0 10px;width: 100px; height: 100px; border: 1px solid {selectedSkillId === 1 ? 'red' : 'black'};" on:click={() => {
    if (currentUnitObj && currentUnitObj.team === 'player' && currentUnitObj.cooldown === 0) {
        selectedSkillId = 1
    }
}}>
    SKILL

    {#if currentUnitObj && currentUnitObj.team === 'player' && currentUnitObj.cooldown > 0}
        <div style="
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    backdrop-filter: blur(3px);">
            {currentUnitObj.cooldown}
        </div>
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

  .test {
    &.isActive {
      filter: drop-shadow(2px 4px 6px black);
    }
  }
</style>

<svelte:head>
    <style>
        .isActive {
            filter: drop-shadow(2px 4px 6px black);
        }
    </style>
</svelte:head>