<script lang="ts">
    import {ITimeStore} from "src/types";
    import * as helpers from "src/helpers";
    import timeStore from "src/stores/time";
    import adventuresEventsStore from "src/stores/adventuresEvents";

    let actualTime;
    $: ({actualTime} = $timeStore as ITimeStore);

    $: handleAdventures($actualTime)

    function handleAdventures(_actualTime) {
        if ($adventuresEventsStore.length > 0) {
            const firstEvent = $adventuresEventsStore[0];

            if (0 >= firstEvent.startAt) {
                if (firstEvent.type === '') {

                } else {
                    console.warn('type not handled', firstEvent.type)
                }

                adventuresEventsStore.removeFirst();
            }
        }
    }

</script>
