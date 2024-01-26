<script>
    import { createEventDispatcher } from "svelte";
    const dispatch = createEventDispatcher();
    import {fade} from "svelte/transition";
    import * as helpers from "src/helpers";

    export let visible = false;
    export let rootMargin = "0%";
    export let root = null;

    function observe(node) {
        const rootElement = document.querySelector(root);
        let options = {
            rootMargin
        }
        rootElement ? options.root = rootElement : null;

        let observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                visible = entry.isIntersecting;
                if (visible) {
                    observer.unobserve(node);
                }
            });
        }, options);

        observer.observe(node);

        return {
            destroy() {
                if (observer) {
                    observer.unobserve(node);
                }
            }
        }
    }
</script>

<div use:observe>
    {#if visible}
        <div in:fade>
            <slot />
        </div>
    {/if}
</div>