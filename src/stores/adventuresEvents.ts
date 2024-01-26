import {get, writable} from 'svelte/store';

const {subscribe, set, update} = writable([]);

const adventuresEventsStore = {
    subscribe,
    set,
    addOnTimeline: (obj) => update(items => {
        const updatedItems = [...items];

        updatedItems.push(obj);

        updatedItems.sort((a, b) => {
            return a.startAt - b.startAt;
        })

        return updatedItems;
    }),
    removeFirst: () => update(items => {
        const updatedItems = [...items];
        updatedItems.splice(0, 1);
        return updatedItems;
    }),
};

export default adventuresEventsStore;