'use strict';
const distance = require('@turf/distance').default;
const point = require('@turf/helpers').point;

function dedupe(features) {
    // dedupe one: strictly by place name
    const a = [];
    const by_place_name = {};
    let feature;
    let previous;
    for (let i = 0; i < features.length; i++) {
        feature = features[i];
        previous = by_place_name[feature.place_name];
        if (previous) {
            if (a[previous.index].geometry.omitted && !feature.geometry.omitted) {
                a[previous.index] = feature;
            } else if (a[previous.index].geometry.interpolated && !feature.geometry.interpolated) {
                a[previous.index] = feature;
            } else {
                continue;
            }
        } else {
            by_place_name[feature.place_name] = {
                feature: feature,
                index: a.length
            };
            a.push(feature);
        }
    }

    // dedupe two: by address + distance threshold
    const b = [];
    const by_address = {};
    for (let k = 0; k < a.length; k++) {
        feature = a[k];

        // No address. Keep.
        if (!feature.address) {
            b.push(feature);
            continue;
        }

        // Has address, check for a previous dupe within distance threshold.
        const address = feature.address + ' ' + feature.text.toLowerCase();
        previous = by_address[address];
        if (previous && distance(previous.point, point(feature.center)) < 5) {
            if (b[previous.index].geometry.omitted && !feature.geometry.omitted) {
                b[previous.index] = feature;
            } else if (b[previous.index].geometry.interpolated && !feature.geometry.interpolated) {
                b[previous.index] = feature;
            } else {
                continue;
            }
        } else {
            by_address[address] = {
                point: point(feature.center),
                index: b.length
            };
            b.push(feature);
        }
    }

    b.sort((a, b) => {
        if (a.relevance > b.relevance) return -1;
        if (a.relevance < b.relevance) return 1;
        return 0;
    });

    return b;
}

module.exports = dedupe;
