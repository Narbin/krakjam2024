<script>
    export let selectedBack;
    export let selectedFront;
    export let fightIndex;
    import {images, music, sounds} from "src/assets";
import _ from "lodash";
    import settingsStore from "src/stores/settings";
import * as helpers from "src/helpers";
import {writable} from "svelte/store";
    import {onDestroy, onMount} from "svelte";
import {units} from "src/helpers";
import {gsap} from "gsap";
    import AnimationFrameByFrameV2 from "src/components/common/AnimationFrameByFrameV2.svelte";
    let contentWidth;
    console.log(contentWidth)
    const {subscribe, set, update} = writable([]);
    import {v4 as UUIDv4} from 'uuid';

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
                } else if (fromObj.type === 'Shooter') {
                    const backLine = newItems.filter(obj => obj.team !== fromObj.team && obj.line === toObj.line);
                    const att = _.random(fromObj.attackMin, fromObj.attackMax) * 0.5;
                    backLine.forEach(obj => {
                        obj.hitPoints -= att;
                    });
                } else if (fromObj.type === 'Melee') {
                    const row = newItems.filter(obj => obj.team !== fromObj.team && obj.place === toObj.place);
                    const att = _.random(fromObj.attackMin, fromObj.attackMax);
                    row.forEach(obj => {
                        if (obj.line === 'front') {
                            obj.hitPoints -= att * 1.2;
                        } else {
                            obj.hitPoints -= att * 0.8;
                        }
                    });
                }

                fromObj.cooldown = fromObj.timeout;
            }

            if (toObj.hitPoints <= 0) {
                toObj.hitPoints = 0;

                const playerUnits = newItems.filter(obj => obj.team === 'player');
                if (playerUnits.length === 1 && toObj.id === playerUnits[0].id) {
                    toObj.hitPoints = to.maxHitPoints;
                }
            }

            return newItems;
        }),
        reduceCooldown: () => update(items => {
            const newItems = [...items].map(obj => {
                obj.cooldown -= 1;
                if (obj.cooldown <= 0) {
                    obj.cooldown = 0;
                }
                // console.log('CD REDUCED', obj.id, obj.cooldown)
                return obj;
            });
            return newItems;
        }),
        changeStatus: (id, status) => update(items => {
            const newItems = [...items];

            const obj = newItems.find(obj => obj.id === id);
            obj.status = status;

            return newItems;
        }),
        cleanUp: () => update(items => {
            const lastUnits = [...items.filter(obj => obj.hitPoints > 0)];
            const enemy = lastUnits.find(obj => obj.team === 'enemy');
            // console.log(enemy)
            if (!enemy) {
                if (fightIndex === 1) {
                    settingsStore.set('fightCompleted1', true);
                } else {
                    settingsStore.set('fightCompleted2', true);
                }

                helpers.delayCall(() => {
                    settingsStore.set('actualView', null);
                }, 2)
            }
            return lastUnits;
        })
    }

    let currentUnitObj = null;

    $: {
        moves = _.orderBy($unitsStore, 'speed', 'desc').map(obj => obj.id)
        // console.log('moves', moves)
    }

    let fightCompleted = false;
    let moves = _.orderBy($unitsStore, 'speed', 'desc').map(obj => obj.id)
    let currentMove = 0;
    function currentUnitChanged() {
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
                // console.log(newestProvocation, provUnit, availableUnitsToAttack)
                if (provUnit) {
                    lowestHpPlayerObj = provUnit;
                    newestProvocation.uses -= 1;
                    if (newestProvocation.uses === 0) {
                        playerProvocations.splice(playerProvocations.indexOf(newestProvocation), 1);
                    }
                }
            }

            if (!lowestHpPlayerObj) {
                lowestHpPlayerObj = availableUnitsToAttack.sort((a, b) => a.hitPoints - b.hitPoints)[0] || null;
            }

            if (lowestHpPlayerObj) {
                attackAnimation(currentUnitObj.id, lowestHpPlayerObj.id, 0, () => {

                }, () => {

                })
            }
        }
    }
    $: {
        const nextUnit = $unitsStore.find(obj => obj.id === moves[currentMove]);
        if (nextUnit && currentUnitObj && nextUnit.id !== currentUnitObj.id || !currentUnitObj) {
            currentUnitObj = $unitsStore.find(obj => obj.id === moves[currentMove]);
            currentUnitChanged();
            console.log('currentUnitObj', currentMove, currentUnitObj)
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

        // console.log(currentMove)
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
        spaceBetweenUnits = contentWidth * 0.12;
        startingPointOfPlayer = contentWidth * 0.125;
        startingPointOfEnemy = contentWidth * 0.5;
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
    let audioWalka = null;

    onMount(async () => {
        audioWalka = await helpers.loadAudio(music['walka'], true);
        audioWalka.play();

        if (fightIndex === 1) {
            unitsStore.addUnit({status: 'idle', id: UUIDv4(), line: 'front', place: 2, team: 'enemy', ...units.EnemyBunny})
        } else {
            unitsStore.addUnit({status: 'idle', id: UUIDv4(), line: 'front', place: 2, team: 'enemy', ...units.EnemyDiabolo})
        }
        // unitsStore.addUnit({status: 'idle', id: UUIDv4(), line: 'back', place: 2, team: 'enemy', ...units.EnemyDiabolo})

        if (selectedFront[1]) {
            unitsStore.addUnit({status: 'idle', id: UUIDv4(), line: 'front', place: 2, team: 'player', ...units[selectedFront[1]]})
        }
        if (fightIndex === 1) {
            unitsStore.addUnit({status: 'idle', id: UUIDv4(), line: 'back', place: 2, team: 'enemy', ...units.EnemyWTF})
        } else {
            unitsStore.addUnit({status: 'idle', id: UUIDv4(), line: 'back', place: 2, team: 'enemy', ...units.EnemyDragon})
        }
        if (selectedBack[1]) {
            unitsStore.addUnit({status: 'idle', id: UUIDv4(), line: 'back', place: 2, team: 'player', ...units[selectedBack[1]]})
        }

        // unitsStore.addUnit({status: 'idle', id: UUIDv4(), line: 'front', place: 1, team: 'enemy', ...units.EnemyDragon})
        // unitsStore.addUnit({status: 'idle', id: UUIDv4(), line: 'back', place: 1, team: 'enemy', ...units.EnemyWTF})
        if (fightIndex === 1) {
            unitsStore.addUnit({status: 'idle', id: UUIDv4(), line: 'front', place: 1, team: 'enemy', ...units.EnemyWTF})
        } else {
            unitsStore.addUnit({status: 'idle', id: UUIDv4(), line: 'front', place: 1, team: 'enemy', ...units.EnemyWTF})
        }
        if (selectedFront[0]) {
            unitsStore.addUnit({status: 'idle', id: UUIDv4(), line: 'front', place: 1, team: 'player', ...units[selectedFront[0]]})
        }
        if (fightIndex === 2) {
            unitsStore.addUnit({status: 'idle', id: UUIDv4(), line: 'back', place: 1, team: 'enemy', ...units.EnemyBunny})
        }
        if (selectedBack[0]) {
            unitsStore.addUnit({status: 'idle', id: UUIDv4(), line: 'back', place: 1, team: 'player', ...units[selectedBack[0]]})
        }
    })
    let hoveredUnits = [];

    function attackAnimation(from, to, selectedSkillId, onAttack, onComplete) {
        const tl = gsap.timeline({paused: true, onComplete: () => {
            onComplete();
            unitsStore.changeStatus(from, 'idle');
            nextMove();
        }});
        const toX = gsap.getProperty(`.id-${to}`, "x");
        const fromX = gsap.getProperty(`.id-${from}`, "x");
        const toObj = $unitsStore.find(obj => obj.id === to);
        const fromObj = $unitsStore.find(obj => obj.id === from);
        unitsStore.changeStatus(from, 'walk');

        tl.to(`.id-${from}`, {
            ease: "power1.in",
            translateX: toX + (fromX > toX ? gsap.getProperty(`.id-${to}`, "width") * 0.5 : -gsap.getProperty(`.id-${from}`, "width") * 0.5),
            translateY: gsap.getProperty(`.id-${to}`, "y"),
            translateZ: gsap.getProperty(`.id-${to}`, "z"),
            duration: Object.keys(getImagesKeys(currentUnitObj)).length / 24,
            onComplete: () => {
                const att = selectedSkillId === 0 ? 'attack' : 'special';
                unitsStore.changeStatus(from, att);
                if (fromObj.type === 'EnemyWTF') {
                    helpers.loadAudio(sounds['reka_attack']).then((obj) => {
                        obj.play();
                    });
                } else if (fromObj.type === 'EnemyDiabolo') {
                    helpers.loadAudio(sounds['demon_attack']).then((obj) => {
                        obj.play();
                    });
                }  else if (fromObj.type === 'EnemyBunny') {
                    helpers.loadAudio(sounds['rabbit_attack']).then((obj) => {
                        obj.play();
                    });
                } else if (fromObj.type === 'Shooter' && att === 'special') {
                    helpers.loadAudio(sounds['shooter_attack']).then((obj) => {
                        obj.play();
                    });
                } else if (fromObj.type === 'Melee' && att === 'special') {
                    helpers.loadAudio(sounds['melee_specj_um']).then((obj) => {
                        obj.play();
                    });
                } else {
                    helpers.loadAudio(sounds['whip01-6952']).then((obj) => {
                        obj.play();
                    });
                }

                if (Math.random() * 100 >= toObj.evasion) {
                    unitsStore.attack(from, to, selectedSkillId);
                    if (toObj.hitPoints > 0) {
                        helpers.delayCall(() => {
                            unitsStore.changeStatus(to, 'hurt');
                            window.setTimeout(() => {
                                unitsStore.changeStatus(to, 'idle');
                            }, (Object.keys(_.get(images, `units[${toObj.type}].hurt`, {a: ''})).length / 24) * 1000);
                        }, (Object.keys(_.get(images, `units[${currentUnitObj.type}].${att}`, {a:''})).length / 24) * 0.25)
                    } else {
                        if (toObj.hitPoints <= 0) {
                            helpers.delayCall(() => {
                                unitsStore.changeStatus(to, 'dead');

                                helpers.delayCall(() => {
                                    unitsStore.cleanUp();
                                }, 1)
                            }, (Object.keys(_.get(images, `units[${currentUnitObj.type}].${att}`, {a:''})).length / 24) * 0.25)
                        }
                    }
                }
            },
            onStart: () => {
                onAttack();
            },
        }).to(`.id-${from}`, {
            ease: "power1.in",
            translateX: fromX,
            translateY: gsap.getProperty(`.id-${from}`, "y"),
            translateZ: gsap.getProperty(`.id-${from}`, "z"),
            duration: Object.keys(getImagesKeys(currentUnitObj)).length / 24,
            delay: Object.keys(_.get(images, `units[${currentUnitObj.type}].attack`, {a:''})).length / 24,
            onStart: () => {
                unitsStore.changeStatus(from, 'comingBackWalk');
            },
        })
        tl.play();
    }

    function getImagesKeys(unit) {
        if (['walk', 'comingBackWalk'].includes(unit.status)) {
            return images.units[unit.type].walk;
        } else if (unit.status === 'dead') {
            return images.vfx.explosion;
        }

        return images.units[unit.type][unit.status];
    }

    function getIsRotated(unit) {
        if (unit.team === 'player') {
            if (['idle', 'walk', 'attack', 'hurt', 'dead', 'special'].includes(unit.status)) {
                return true;
            } else {
                return false;
            }
        } else {
            if (['idle', 'walk', 'attack', 'hurt', 'dead', 'special'].includes(unit.status)) {
                return false;
            } else {
                return true;
            }
        }
    }

    function initUnit(node, props) {
        const unit = props.unit;
        const unitWidth = unit.width * contentWidth;

        gsap.set(node, {
            x: unit.team === 'player'
                ? ((unit.line === 'front' ? startingPointOfPlayer : + startingPointOfPlayer - spaceBetweenUnits * (unit.type === 'Tank' ? 1.5 : 1)) - (spaceBetweenUnits * unit.place) + (unitWidth * (unit.type === 'Melee' ? 1.2 : unit.type === 'Shooter' ? 0.8 : 0.5)))
                : ((unit.line === 'front' ? startingPointOfEnemy : startingPointOfEnemy + spaceBetweenUnits * (unit.type === 'Tank' ? 1.5 : 1) )  + (spaceBetweenUnits * unit.place) - (unitWidth * (unit.type === 'Melee' ? 1.2 : unit.type === 'Shooter' ? 0.8 : 0.5))),
            y: -unit.place * spaceBetweenUnits,
            // z: -unit.place * 100,
        })
    }

    onDestroy(() => {
        audioWalka.pause();
    })
</script>
<img src="{images.ui['BATTLE_BG']}" style="position: absolute; width: 100%; height: 100%; object-fit: cover;" alt/>
<div class="test" style="
        aspect-ratio: 16/9;
        position: relative;
        margin: 0 auto;">
    <div style="
    /*border: 1px solid black;*/
    width: 100%;
    height: 100%;
      /*perspective: 100px;*/
    /*transform-style: preserve-3d;*/
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      position: absolute;" bind:clientWidth={contentWidth}>
        {#if contentWidth > 0}
            {#each $unitsStore as unit (unit.id)}
                {@const unitWidth = unit.width * contentWidth}
                <div use:initUnit={{unit}}
                        on:keydown={() => {}} class="id-{unit.id}" class:isActive={hoveredUnits.includes(unit.id)}
                       style="position:absolute;
                       left:0; bottom:0; pointer-events: none;
                       height: {unitWidth * unit.aspectRatio}px;
                       width: {unitWidth}px;"
                        on:click={() => {
                       if(currentUnitObj && currentUnitObj.team === 'player' && selectedSkillId !== null && unit.team === 'enemy') {
                           attackAnimation(currentUnitObj.id, unit.id, selectedSkillId, () => {
                               // on attack
                            }, () => {
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
                >
                    <!--{unit.type} - {unit.line} - {unit.place} - {unit.status}-->
                    <div style="pointer-events: none;">
                        <AnimationFrameByFrameV2 width="{contentWidth * unit.width}" aspectRatio="{unit.aspectRatio}"
                                                 introImagesKeys={[]}
                                                 imagesKeys="{getImagesKeys(unit)}"
                                                 isRotated="{getIsRotated(unit)}"
                                                 isPlaying="{true}"
                                                 delay="{0}"
                                                 isDimmed="{false}"
                        />
                    </div>
                    <div class="rectangle" style="pointer-events: all;position: absolute; bottom: 0; left: 50%; background: black; opacity: 0; transform: translate(-50%, 50%) skew(-39deg, 0deg); width: 100px; height: 50px; z-index: -1;">
                        <div style="width: 100%; height: 200px; transform: skew(39deg, 0deg) translate(90%, -100%);"></div>
                    </div>
                    <div style="pointer-events:none; z-index: 5; bottom: -25px; position: absolute; left: 57%; transform:translateX(-90%); width: {(unit.hitPoints / unit.maxHitPoints * 100)}px; max-width: 100px; height: 10px; background: green; position: absolute; ">
                    </div>
                </div>
            {/each}

            <div style="opacity: 0.5; background: black; width: {contentWidth * 0.25}px; height: 2px; position: absolute; left: {startingPointOfPlayer}px; bottom: {spaceBetweenUnits * 1.5}px; z-index: -1;"></div>
            <div style="opacity: 0.5; background: black; width: {contentWidth * 0.25}px; height: 2px; position: absolute; left: {startingPointOfEnemy + spaceBetweenUnits * 1.25}px; bottom: {spaceBetweenUnits * 1.5}px; z-index: -1;"></div>
            <div style="opacity: 0.5; background: black; width: {contentWidth * 0.1}px; height: 2px; position: absolute; left: {startingPointOfPlayer + (spaceBetweenUnits * 0.5)}px; bottom: {spaceBetweenUnits * 1.5}px; z-index: -1; transform: skewY(50deg)"></div>
            <div style="opacity: 0.5; background: black; width: {contentWidth * 0.1}px; height: 2px; position: absolute; left: {startingPointOfEnemy + (spaceBetweenUnits * 1.75)}px; bottom: {spaceBetweenUnits * 1.5}px; z-index: -1; transform: skewY(-50deg)"></div>
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

<div style="position: absolute; bottom: 0; left: 0%; ">
    {#each $unitsStore.filter(obj => obj.team === 'player') as unit, index (unit.id)}
        <img src="{images.ui.avatars[unit.type]}" style="width: 140px; margin: 5px; {unit.id === currentUnitObj.id ? 'filter: brightness(1.5);' : ''} "/>
    {/each}
</div>

<div style="position: absolute; bottom: 0; left: 50%; display: flex; transform: translateX(-50%)">
    <div style="{selectedSkillId === 0 ? 'filter: brightness(1.5);' : ''} margin: 5px; width: 300px; position: relative; cursor: pointer;" on:click={() => {selectedSkillId = 0}}>
        <img src="{images.ui['Asset 23']}" alt/>
        <span style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -60%)">ATTACK</span>
    </div>
    <div style="{selectedSkillId === 1 ? 'filter: brightness(1.5);' : ''} margin: 5px;width: 300px; position: relative; cursor: pointer;" on:click={() => {selectedSkillId = 1}}>
        <img src="{images.ui['Asset 23']}" alt/>
        <span style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -60%)">SKILL SHOT</span>
    </div>
</div>

<div style="position: absolute; bottom: 0; right: 0%; ">
    {#each $unitsStore.filter(obj => obj.team === 'enemy') as unit, index (unit.id)}
        <img src="{images.ui.avatars[unit.type]}" style="width: 140px; margin: 5px; {unit.id === currentUnitObj.id ? 'filter: brightness(1.5);' : ''} "/>
    {/each}
</div>


{#if ($settingsStore.fightCompleted1 && fightIndex === 1) || ($settingsStore.fightCompleted2 && fightIndex === 2)}
    <div style="width: 1300px; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%)">
        <AnimationFrameByFrameV2 width="1300" aspectRatio="{9/16}"
                                 introImagesKeys={[]}
                                 imagesKeys="{images.static.success}"
                                 isRotated="{false}"
                                 isPlaying="{true}"
                                 delay="{0}"
                                 isDimmed="{false}"
        />
    </div>
{/if}

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
            .rectangle {
                opacity: 0.5!important;
            }
        }


    </style>
</svelte:head>