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

    onMount(() => {
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
                if (movement.up) {
                    gsap.to('.car', {y: `-=${speed}`, duration: 0.1, ease: 'power3.out'});
                } else if (movement.down) {
                    gsap.to('.car', {y: `+=${speed}`, duration: 0.1, ease: 'power3.out'});
                }
                if (movement.left) {
                    gsap.to('.car', {x: `-=${speed}`, duration: 0.1, ease: 'power3.out'});
                } else if (movement.right) {
                    gsap.to('.car', {x: `+=${speed}`, duration: 0.1, ease: 'power3.out'});
                }



            }
        })

        addEnemy();
    })

    function addEnemy() {
        helpers.delayCall(() => {
            enemiesStore.addEnemy({id: UUIDv4()})
            addEnemy();
        }, _.random(0.25, 0.5))
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
            duration: _.random(1.5,2.5),
            ease:'linear',
            onComplete: () => {
                enemiesStore.removeEnemy(props.enemy.id);
            },
            onUpdate: () => {
                const carX = gsap.getProperty('.car', 'x');
                const carWidth = ~~gsap.getProperty('.car', 'width');
                const carY = gsap.getProperty('.car', 'y');
                const carHeight = ~~gsap.getProperty('.car', 'height');
                const enemyX = gsap.getProperty(note, 'x');

                if (carY + carHeight >= enemyY && carY <= enemyY + enemyHeight &&
                    carX + carWidth >= enemyX && carX <= enemyX + enemyWidth) {
                    tween.kill();
                    enemiesStore.removeEnemy(props.enemy.id);
                }
            }
        })
    }

    import {images} from '/src/assets';
</script>


<div class="road" style="width: 100%; height: 500px; position: absolute; bottom: 0; background: rgba(0, 250, 0, 0.2);">
    <div class="car" style="position: absolute; left: 0; top: 0; border: 2px solid black; width: 300px; height: 200px;">
        <AnimationFrameByFrameV2 width="300px" aspectRatio="{16/9}"
                                 introImagesKeys={[]}
                                 imagesKeys="{images.static.car}"
                                 isRotated="{false}"
                                 isPlaying="{true}"
                                 delay="{0}"
                                 isDimmed="{false}"
        />
    </div>

    {#each $enemiesStore as enemy (enemy.id)}
        <div use:initEnemy={{enemy}} id="id-{enemy.id}" style="position:absolute; left:0; top:0 ;height: 70px; width: 70px; background: red;"></div>
    {/each}
</div>

<style lang="scss">
</style>