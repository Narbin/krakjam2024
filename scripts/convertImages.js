const fs = require('fs');
const sharp = require('sharp');
const glob = require( 'glob' );
const svgo = require('svgo');
const cliProgress = require('cli-progress');
const {readFileSync, writeFileSync} = require("fs");
const _ = require('lodash')

const bestQ = {
    compressionLevel: 9,
    lossless: true,
    effort: 10
}

const goodQ = {
    quality: 75,
    compressionLevel: 9,
    lossless:true,
    alphaQuality: 75,
    effort: 10
}

const quality = bestQ;

const b1 = new cliProgress.SingleBar({
    format: '{bar}' + '| {percentage}% || {value}/{total} Converted images',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true,
    fps: 60,
    stopOnComplete: true,
});

const b2 = new cliProgress.SingleBar({
    format: '{bar}' + '| {percentage}% || {value}/{total} Calculating crop of images',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true,
    fps: 60,
    stopOnComplete: true,
});

// todo: zamiana na camelCase!
const dist = `src/assets/images/compressed_${quality.quality || 100}_${quality.compressionLevel}_${quality.effort}`;
glob( 'notCompressedImages/**/*.+(png|PNG|svg)', {nocase: false}, async function( err, files ) {
    fs.rmSync(dist, { recursive: true, force: true });
    console.log('Removed old files')
    const forCrop = {};

    b2.start(files.length, 0);
    for (const file of files) {
        if (!file.includes('notUsed')) {
            if (file.match(/\.png/gi) && (file.includes('characters') || file.includes('animations')) && !file.includes('avatar')) {
                const test = await sharp(file).raw()
                    .toBuffer({resolveWithObject: true})
                const test1 = await sharp(file).rotate(90).raw()
                    .toBuffer({resolveWithObject: true})

                let left = 0;
                let top = 0;
                let bottom = 0;
                let right = 0;

                await sharp(file)
                    .metadata()
                    .then(async function (metadata) {
                        top = getX(test.data, metadata.width, metadata.height);
                        // _height = getX_2(test.data, metadata.width, metadata.height) - top + 1;
                        bottom = getX_2(test.data, metadata.width, metadata.height);

                        left = getX(test1.data, metadata.height, metadata.width);
                        // _width = getX_2(test1.data,metadata.height,  metadata.width) - left + 1;
                        right = getX_2(test1.data,metadata.height,  metadata.width);
                    })
                const arr = file.split('/')
                arr.pop();
                arr.pop();
                if (forCrop[arr.join('/')]) {
                    _.isNumber(left) && forCrop[arr.join('/')].left.push(left)
                    _.isNumber(top) && forCrop[arr.join('/')].top.push(top)
                    _.isNumber(bottom) && forCrop[arr.join('/')].bottom.push(bottom)
                    _.isNumber(right) && forCrop[arr.join('/')].right.push(right)
                } else {
                    forCrop[arr.join('/')] = {
                        left: [left],
                        top: [top],
                        bottom: [bottom],
                        right: [right],
                    }
                }
            }
        }

        b2.increment(1);
    }

    // console.log(forCrop)

    b1.start(files.length, 0);
    files.forEach(async (file, i) => {
        if (!file.includes('notUsed')) {
            const additionalFactor = file.match(/\{(.*?)}/);
            const additionalFactorToDelete = additionalFactor && additionalFactor[0] ? additionalFactor[0] : '';
            const additionalFactorNumber = additionalFactor && additionalFactor[0] ? Number(additionalFactor[1]) / 100 : 1;
            const compressedFolder = file.replace('notCompressedImages', dist).replace('PNG', 'png').replace(additionalFactorToDelete, '');

            if (!fs.existsSync(compressedFolder)) {
                const temp = compressedFolder.split('/');
                temp.length = temp.length - 1;
                fs.mkdirSync(temp.join('/'), {recursive: true});
            }

            if (file.match(/\.png/gi)) {
                const shouldExtract = (file.includes('characters') || file.includes('animations')) && !file.includes('avatar');

                const arr = file.split('/')
                arr.pop();
                arr.pop();

                let left = _.min(_.get(forCrop[arr.join('/')], 'left', 0));
                let top =   _.min(_.get(forCrop[arr.join('/')], 'top', 0));
                let bottom = _.max(_.get(forCrop[arr.join('/')], 'bottom', 0));
                let right = _.max(_.get(forCrop[arr.join('/')], 'right', 0));

                const width = await sharp(file)
                    .metadata()
                    .then(async function (metadata) {
                        if (!shouldExtract) {
                            left = 0;
                            top = 0;
                            bottom = metadata.height;
                            right = metadata.width;
                        }


                        // const decreased = ~~((shouldExtract ? right - left : metadata.width) * 0.5 * additionalFactorNumber);
                        const decreased = ~~((shouldExtract ? right - left : metadata.width) * 1 * additionalFactorNumber);

                        // if (1024 < decreased) {
                        //     return 1024;
                        // }
                        if (1024 < decreased) {
                            return 1280;
                        }
                        return decreased;
                    })

                const extractProps = { left: left, top: top, width: right - left, height: bottom - top };
                await sharp(file.replace('PNG', 'png'))
                    .extract(extractProps)
                    .resize(width)
                    .png(quality)
                    .toFile(compressedFolder)
                    .then(function (newFileInfo) {
                        // console.log(`${i} - ${file}`)
                        b1.increment();
                    })
                    .catch(function (err) {
                        console.log(file, err);
                    });

                // sharp(`${folder}${file}`)
                //     .resize({width})
                //     .avif({quality: 50})
                //     .toFile(`${folder}${file}`.replace('png', 'avif'))
                //     .then(function (newFileInfo) {
                //         console.log("Success avif")
                //     })
                //     .catch(function (err) {
                //         console.log(err);
                //     });
                // sharp(`${folder}${file}`)
                //     .resize({width})
                //     .webp({quality: 80})
                //     .toFile(`${folder}${file}`.replace('png', 'webp'))
                //     .then(function (newFileInfo) {
                //         console.log("Success webp")
                //     })
                //     .catch(function (err) {
                //         console.log(err);
                //     });
            } else if (file.match(/\.svg/gi)) {
                try {
                    const data = readFileSync(file);
                    const svgOutput = new svgo({})
                    const result = await svgOutput.optimize(data, {
                        path: file
                    }).catch((e) => {
                        console.error(e)
                    })
                    if (result) {
                        writeFileSync(compressedFolder, result.data)
                        // console.log(`${i} - ${file}`)
                        b1.increment();
                    } else {
                        console.log(` - bad compress, only copy - ${file}`)
                        writeFileSync(compressedFolder, data);
                    }
                }catch (e) {
                    console.error(e)
                }
            }
        }
    })

});
//
// fs.readdirSync(folder).forEach(async file =>{
//     if (file.includes('png')) {
//         const width = await sharp(`${folder}${file}`)
//             .metadata()
//             .then(function (metadata) {
//             // return Math.round(metadata.width / 2)
//             return metadata.width;
//         })
//         sharp(`${folder}${file}`)
//             .png({quality: 60, compressionLevel: 9})
//             .toFile(`${folder.replace()}${file}`)
//             .then(function (newFileInfo) {
//                 console.log("Success png")
//             })
//             .catch(function (err) {
//                 console.log(err);
//             });
//         // sharp(`${folder}${file}`)
//         //     .resize({width})
//         //     .avif({quality: 50})
//         //     .toFile(`${folder}${file}`.replace('png', 'avif'))
//         //     .then(function (newFileInfo) {
//         //         console.log("Success avif")
//         //     })
//         //     .catch(function (err) {
//         //         console.log(err);
//         //     });
//         // sharp(`${folder}${file}`)
//         //     .resize({width})
//         //     .webp({quality: 80})
//         //     .toFile(`${folder}${file}`.replace('png', 'webp'))
//         //     .then(function (newFileInfo) {
//         //         console.log("Success webp")
//         //     })
//         //     .catch(function (err) {
//         //         console.log(err);
//         //     });
//     }
// });

function getX(data, width, height) {
    let offset = 0;
    let output = [];
    let _y = null;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (data[offset+3] !== 0) {
                _y = y;
                y = height;
                x = width;
            }

            offset += 4;
        }
    }

    return _y;
}

function getX_2(data, width, height) {
    let offset = data.length;
    let output = [];
    let _y = null;

    for (let y = height - 1; 0 < y; y--) {
        for (let x = width - 1; 0 < x; x--) {
            if (data[offset-3] !== 0) {
                _y = y;
                y = 0;
                x = 0;
            }

            offset -= 4;
        }
    }

    return _y;
}

function getY(data, width, height) {
    let offset = 0;
    let output = [];
    let _y = null;


    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (data[offset+3] !== 0) {
                _y = y;
                y = height;
                x = width;
            }

            offset += 4;
        }
    }

    return _y;
}



function getY_2(data, width, height) {
    let offset = data.length;
    let output = [];
    let _y = null;

    for (let y = height - 1; 0 < y; y--) {
        for (let x = width - 1; 0 < x; x--) {
            if (data[offset-3] !== 0) {
                _y = y;
                y = 0;
                x = 0;
            }

            offset -= 4;
        }
    }

    return _y;
}
