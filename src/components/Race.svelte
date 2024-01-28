<script lang="ts">
    import {onMount} from "svelte";
    import {gsap} from "gsap";
    import _ from "lodash";
    import {writable} from "svelte/store";
    import {v4 as UUIDv4} from 'uuid';
    import * as helpers from "src/helpers/index";
    import AnimationFrameByFrameV2 from "src/components/common/AnimationFrameByFrameV2.svelte";

    const movement = {
        up: false,
        down: false,
        left: false,
        right: false,
    };

    const speed = 10;
    let roadHeight = 0;
    let killed = 0;

    onMount(() => {
        helpers.loadAudio(music['wyscig'], true).then((obj) => {
            obj.play();
            obj.setVolume(1.6);
        });
        helpers.loadAudio(sounds['chlopi'], true).then((obj) => {
            obj.play();
            obj.setVolume(0.45);
        });
        helpers.loadAudio(sounds['woz'], true).then((obj) => {
            obj.play();
            obj.setVolume(1.25);
        });

        roadHeight = parseInt(gsap.getProperty('.road', 'height', 'px').replace('px', ''), 10);
        document.addEventListener('keydown', event => {
            if (event.code === 'ArrowUp') {
                movement.up = true;
            } else if (event.code === 'ArrowDown') {
                movement.down = true;
            }
            if (event.code === 'ArrowRight') {
                movement.right = true;
            } else if (event.code === 'ArrowLeft') {
                movement.left = true;
            }
        })
        document.addEventListener('keyup', event => {
            if (event.code === 'ArrowUp') {
                movement.up = false;
            }
            if (event.code === 'ArrowDown') {
                movement.down = false;
            }
            if (event.code === 'ArrowRight') {
                movement.right = false;
            }
            if (event.code === 'ArrowLeft') {
                movement.left = false;
            }
        })

        gsap.to([1], {
            duration: 1,
            repeat: -1,
            ease:'linear',
            endArray: [2],
            onUpdate: () => {
                const carX = parseInt(gsap.getProperty('.car', 'x'), 10);
                const carWidth = parseInt(gsap.getProperty('.car', 'width'), 10);
                const carY = parseInt(gsap.getProperty('.car', 'y'), 10);
                const carHeight = parseInt(gsap.getProperty('.car', 'height'), 10);

                if (movement.up) {
                    if (0 < carY) {
                        gsap.to('.car', {y: `-=${speed}`, duration: 0.1, ease: 'power3.out'});
                    }
                } else if (movement.down) {
                    if (roadHeight - carHeight > carY) {
                        gsap.to('.car', {y: `+=${speed}`, duration: 0.1, ease: 'power3.out'});
                    }
                }
                if (movement.left) {
                    if (0 < carX) {
                        gsap.to('.car', {x: `-=${speed}`, duration: 0.1, ease: 'power3.out'});
                    }
                } else if (movement.right) {
                    if (contentWidth - carWidth > carX) {
                        gsap.to('.car', {x: `+=${speed}`, duration: 0.1, ease: 'power3.out'});
                    }
                }
            }
        })

        addEnemy();
    })

    function addEnemy() {
        helpers.delayCall(() => {
            enemiesStore.addEnemy({id: UUIDv4(), status: 'walk', type: [_.sample(['EnemyBunny', 'EnemyDiabolo', 'EnemyDragon', 'EnemyWTF'])]})
            enemiesStore.addEnemy({id: UUIDv4(), status: 'walk', type: [_.sample(['EnemyBunny', 'EnemyDiabolo', 'EnemyDragon', 'EnemyWTF'])]})
            // enemiesStore.addEnemy({id: UUIDv4(), status: 'walk', type: [_.sample(['EnemyBunny', 'EnemyDiabolo', 'EnemyDragon', 'EnemyWTF'])]})
            addEnemy();
        }, _.random(0.15, 0.35))
    }

    const {subscribe, set, update} = writable([]);
    const enemiesStore = {
        update,
        subscribe,
        addEnemy: (enemy) => update(items => {
            const newItems = [...items, enemy];

            return newItems;
        }),
        removeEnemy: (id) => update(items => {
            const newItems = [...items].filter(item => item.id !== id);

            return newItems;
        }),
        changeStatus: (id, status) => update(items => {
            const newItems = [...items];

            const obj = newItems.find(obj => obj.id === id);
            obj.status = status;

            return newItems;
        }),
    };


    function initEnemy(note, props) {
        const enemyWidth = ~~gsap.getProperty(note, "width");
        const enemyHeight = ~~gsap.getProperty(note, "height");
        const enemyY = _.random(0, ~~(gsap.getProperty('.road', "height", 'px').replace('px', '')) - enemyHeight);
        gsap.set(note, {
            y: enemyY,
            x: ~~(gsap.getProperty('.road', "width", "px").replace('px', '')),
        });
        const tween = gsap.to(note, {
            x: -enemyWidth,
            duration: _.random(2,4, true),
            ease:'linear',
            onComplete: () => {
                enemiesStore.removeEnemy(props.enemy.id);
            },
            onUpdate: () => {

                const carX = parseInt(gsap.getProperty('.car', 'x'), 10);
                const carWidth = parseInt(gsap.getProperty('.car', 'width'), 10);
                const carY = parseInt(gsap.getProperty('.car', 'y'), 10);
                const carHeight = parseInt(gsap.getProperty('.car', 'height'), 10);
                const enemyX = parseInt(gsap.getProperty(note, 'x'), 10);
                if (props.enemy.status === 'walk') {
                    if (carY + carHeight >= enemyY && carY <= enemyY + enemyHeight &&
                        carX + carWidth >= enemyX && carX <= enemyX + enemyWidth) {
                        helpers.loadAudio(sounds[_.sample(["hit1", "hit2", "hit3"])]).then((obj) => {
                            obj.play();
                            obj.setVolume(0.1);
                        });
                        killed += 1;

                        enemiesStore.changeStatus(props.enemy.id, 'dead');
                        helpers.delayCall(() => {
                            tween.kill();
                            enemiesStore.removeEnemy(props.enemy.id);
                        }, 1)
                    }
                }

                if (carY > enemyY) {
                    gsap.set(note, {zIndex: 3})
                } else {
                    gsap.set(note, {zIndex: 10})
                }
            }
        })
    }
    let contentWidth;
    import {images, music, sounds} from '/src/assets';
    import {units} from "src/helpers/index";
    import settingsStore from "src/stores/settings";

    $: {
        if (killed === 150 && !$settingsStore.runCompleted) {
            settingsStore.set('runCompleted', true);
            helpers.delayCall(() => {
                settingsStore.set('actualView', null);
            }, 2)
        }
    }
</script>
<div style="height: 100vh; width: 100vw; background: #e6d8b7;">
    <div style="width: 100vw; height: auto; position: absolute; aspect-ratio: 16/9; top:0; z-index: 0;" bind:clientWidth={contentWidth}>
        <AnimationFrameByFrameV2 width="{contentWidth}" aspectRatio="{9/16}"
                                 introImagesKeys={[]}
                                 imagesKeys="{images.static.paralax}"
                                 isRotated="{false}"
                                 isPlaying="{true}"
                                 delay="{0}"
                                 isDimmed="{false}"
        />
    </div>
    <div style="position: relative; height: 100vh; width: 100vw; top:0; ">
        <div class="road" style="bottom: 0; position: absolute; left: 0; width: 100vw; height: 50vh;">
            <div class="car" style="z-index: 5;position: absolute; left: 0; top: 0; width: 700px; height: {700 * (583 / 1280) * 0.25}px">
                <AnimationFrameByFrameV2 width="700" aspectRatio="{583 / 1280}"
                                         introImagesKeys={[]}
                                         imagesKeys="{images.static.car}"
                                         isRotated="{false}"
                                         isPlaying="{true}"
                                         delay="{0}"
                                         isDimmed="{false}"
                />
            </div>

            {#each $enemiesStore as enemy (enemy.id)}
                <div use:initEnemy={{enemy}} id="id-{enemy.id}" style="position:absolute; left:0; top:0; width: 250px; height: {250 * units[enemy.type].aspectRatio * 0.5}px">
                    <AnimationFrameByFrameV2 width="250" aspectRatio="{units[enemy.type].aspectRatio}"
                                             introImagesKeys={[]}
                                             imagesKeys="{enemy.status === 'dead' ? images.vfx.explosion : images.units[enemy.type][enemy.status]}"
                                             isRotated="{false}"
                                             isPlaying="{true}"
                                             delay="{0}"
                                             isDimmed="{false}"
                    />
                </div>
            {/each}
        </div>
    </div>

    {#if $settingsStore.runCompleted}
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
    <div>

    </div>
</div>
<div style="position: absolute; left: 0; top: 30px; width: 1088px; height: auto;">
    <img src="{images.ui['FURMANKA_LICZNIK']}" alt="background"/>
    <span style=" position: absolute; left: 175px;transform: translateX(-100%); top: 28px;
    font-size: 20px;">{killed}/150</span>
</div>
<style lang="scss">
</style>