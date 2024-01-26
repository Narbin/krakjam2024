import _ from 'lodash';

function importAllFilesFromFolder(fnc, filter) {
    const mappedImages = {} as any;
    fnc.keys().forEach((i) => {
        const key = i.replace('./', '').replace(filter, '').replaceAll('/', '.');
        const src = require(`src/assets/${i.replace('./', '')}`).default;
        _.set(mappedImages, key, src);
    });
    return mappedImages;
}

// @ts-ignore
const images = importAllFilesFromFolder(require.context('/src/assets/', true, /^(?!.*(?:fonts|music|sounds|videos)).*\.(webp|png|jpe?g|svg)$/) , /.(webp|png|jpe?g|svg)$/).images['compressed_100_9_10'];
// @ts-ignore

const {sounds, music} = importAllFilesFromFolder(require.context('/src/assets/', true, /^(?!.*(?:images|fonts|videos)).*\.(mp3|wav|ogg)$/) , /.(mp3|wav|ogg)$/);
const {videos} = importAllFilesFromFolder(require.context('/src/assets/', true, /^(?!.*(fonts|music|sounds|images)).*\.(mp4)$/) , /.(mp4)$/);

export {
    music,
    images,
    sounds,
    videos
}