'use strict';
const ops = require('../../../lib/geocoder/ops');
const test = require('tape');

test('ops#toFeature', (t) => {
    let feat = [{
        properties: {
            'carmen:center': [-99.392855, 63.004759],
            'carmen:text': 'Canada, CA',
            'carmen:types': ['country'],
            'carmen:extid': 'country.1833980151',
            'short_code': 'ca'
        }
    }];
    feat._relevance = 1;
    t.deepEqual(ops.toFeature(feat), {
        id: 'country.1833980151',
        type: 'Feature',
        text: 'Canada',
        place_name: 'Canada',
        place_type: ['country'],
        relevance: 1,
        center: [-99.392855, 63.004759],
        properties: { short_code: 'ca' },
        geometry: { type: 'Point', coordinates: [-99.392855, 63.004759] },
    });

    // Test Address formatting
    feat = [{
        properties: {
            'carmen:center': [-99.392855,63.004759],
            'carmen:address': 9,
            'carmen:text': 'Fake Street',
            'carmen:types': ['address'],
            'carmen:extid': 'address.1833980151'
        }
    }];
    feat._relevance = 1;
    t.deepEqual(ops.toFeature(feat, '{address._name} {address._number}'), { address: '9', center: [-99.392855, 63.004759], geometry: { coordinates: [-99.392855, 63.004759], type: 'Point' }, id: 'address.1833980151', place_name: 'Fake Street 9', place_type: ['address'], properties: {}, relevance: 1, text: 'Fake Street', type: 'Feature' });

    t.deepEqual(ops.toFeature([{
        properties: {
            'carmen:center': [-99.392855,63.004759],
            'carmen:address': 9,
            'carmen:text': 'Fake Street',
            'carmen:extid': 'address.1833980151'
        }
    }], '{address._number} {address._name}').place_name, '9 Fake Street', 'Address number & name exist');

    t.deepEqual(ops.toFeature([{
        properties: {
            'carmen:center': [-99.392855,63.004759],
            'carmen:text': 'Fake Street',
            'carmen:extid': 'address.1833980151'
        }
    }], '{address._number} {address._name}').place_name, 'Fake Street', 'Address number missing');

    t.deepEqual(ops.toFeature([{
        properties: {
            'carmen:center': [-99.392855,63.004759],
            'carmen:address': 9,
            'carmen:text': 'Fake Street',
            'carmen:extid': 'address.1833980151'
        }
    }], '{address._number} {address.name}').place_name, '9', 'Address name missing');

    t.deepEqual(ops.toFeature([{
        properties: {
            'carmen:center': [-99.392855,63.004759],
            'carmen:address': 9,
            'carmen:text': 'Fake Street',
            'carmen:extid': 'address.1833980151'
        }
    },{
        properties: {
            'carmen:center': [0,0],
            'carmen:text': 'Andor',
            'carmen:extid': 'place.1'
        }
    }], '{address._number} {address._name}, {place._name}').place_name, '9 Fake Street, Andor', 'Address & Place');

    t.deepEqual(ops.toFeature([{
        properties: {
            'carmen:center': [-99.392855,63.004759],
            'carmen:address': 9,
            'carmen:text': 'Fake Street',
            'carmen:extid': 'address.1833980151'
        }
    },{
        properties: {
            'carmen:center': [0,0],
            'carmen:text': 'Andor',
            'carmen:extid': 'place.1'
        }
    }], '{address._number} {address._name}, {place.name}').place_name, '9 Fake Street', 'Address & no Place');


    t.deepEqual(ops.toFeature([{
        properties: {
            'carmen:center': [-99.392855,63.004759],
            'carmen:address': 9,
            'carmen:text': 'Fake Street',
            'carmen:extid': 'address.1833980151'
        }
    },{
        properties: {
            'carmen:center': [0,0],
            'carmen:text': 'Andor',
            'carmen:extid': 'place.1'
        }
    }], '{address._number} {address.name}, {place._name}').place_name, '9, Andor', 'No Address street & Place');


    t.deepEqual(ops.toFeature([{
        properties: {
            'carmen:center': [-99.392855,63.004759],
            'carmen:text': 'Fake Street',
            'carmen:extid': 'address.1833980151'
        }
    },{
        properties: {
            'carmen:center': [0,0],
            'carmen:text': 'Andor',
            'carmen:extid': 'place.1'
        }
    }], '{address._number} {address.name}, {place._name}').place_name, 'Andor', 'Just place');

    // This stack used for the next series of tests
    const fullStack = [{
        properties: {
            'carmen:center': [-99.392855,63.004759],
            'carmen:text': 'Fake Street',
            'carmen:extid': 'address.1833980151',
            'carmen:relevance': 1
        }
    },{
        properties: {
            'carmen:center': [0,0],
            'carmen:text': 'Caemlyn',
            'carmen:extid': 'place.1'
        }
    },{
        properties: {
            'carmen:center': [0,0],
            'carmen:text': 'Andor',
            'carmen:extid': 'region.1'
        }
    },{
        properties: {
            'carmen:center': [0,0],
            'carmen:text': '1234',
            'carmen:extid': 'postcode.1'
        }
    },{
        properties: {
            'carmen:center': [-99.392855, 63.004759],
            'carmen:text': 'Canada',
            'carmen:extid': 'country.1',
            'short_code': 'ca'
        }
    }];

    t.deepEqual(ops.toFeature(fullStack, '{address._number} {address._name}, {place._name}, {region._name} {postcode._name}').place_name, 'Fake Street, Caemlyn, Andor 1234', 'Full stack');
    t.deepEqual(ops.toFeature(fullStack, '{address._number} {address._name}, {place.name}, {region._name} {postcode._name}').place_name, 'Fake Street, Andor 1234', 'Full stack');
    t.equals(ops.toFeature(fullStack).context.pop().short_code, 'ca', 'short_code property made it into context array');

    // Test language option
    feat = [{
        properties: {
            // Public properties
            'wikidata': 'Q172',
            // Internal text properties
            'carmen:text':'Toronto',
            'carmen:text_ru':'Торонто',
            'carmen:text_zh':'多伦多',
            // Internal score property
            'carmen:score': 1,
            // Public carmen properties
            'carmen:types': ['place'],
            'carmen:center': [0, 0],
            'carmen:extid': 'place.1'
        }
    }];
    feat._relevance = 1;
    t.deepEqual(ops.toFeature(feat, {}, ['ru']), {
        id: 'place.1',
        type: 'Feature',
        text: 'Торонто',
        text_ru: 'Торонто',
        place_name: 'Торонто',
        place_name_ru: 'Торонто',
        place_type: ['place'],
        relevance: 1,
        language: 'ru',
        language_ru: 'ru',
        center: [0, 0],
        properties: {
            wikidata: 'Q172'
        },
        geometry: {
            type: 'Point',
            coordinates: [0, 0]
        },
    });

    // Test dev option
    feat = [{
        properties: {
            // Public properties
            wikidata: 'Q172',
            // Internal text properties
            'carmen:text':'Toronto',
            'carmen:text_ru':'Торонто',
            'carmen:text_zh':'多伦多',
            // Internal score property
            'carmen:score': 1,
            // Public carmen properties
            'carmen:types': ['place'],
            'carmen:center': [0, 0],
            'carmen:extid': 'place.1'
        }
    }];
    feat._relevance = 0.5;
    t.deepEqual(ops.toFeature(feat, {}, ['ru'], null, true), {
        id: 'place.1',
        type: 'Feature',
        text: 'Торонто',
        text_ru: 'Торонто',
        place_name: 'Торонто',
        place_name_ru: 'Торонто',
        place_type: ['place'],
        relevance: 0.5,
        language: 'ru',
        language_ru: 'ru',
        center: [0, 0],
        properties: feat[0].properties,
        geometry: {
            type: 'Point',
            coordinates: [0, 0]
        },
    });

    t.end();
});

test('ops#toFeature + no formatter + languageMode=strict', (t) => {

    const context = [{
        properties: {
            'carmen:text': 'Chicago',
            'carmen:text_en': 'Chicago',
            'carmen:text_zh': '芝加哥',
            'carmen:types': ['place'],
            'carmen:center': [0, 0],
            'carmen:extid': 'place.1'
        }
    }, {
        properties: {
            'carmen:text': 'Illinois',
            'carmen:text_en': 'Illinois',
            'carmen:types': ['region'],
            'carmen:center': [0, 0],
            'carmen:extid': 'region.1'
        }
    }, {
        properties: {
            'carmen:text': 'United States',
            'carmen:text_en': 'United States',
            'carmen:text_zh': '美国',
            'carmen:types': ['country'],
            'carmen:center': [0, 0],
            'carmen:extid': 'country.1'
        }
    }];

    let feature;

    feature = ops.toFeature(context, {}, ['en'], 'strict', true);
    t.deepEqual(feature.place_name, 'Chicago, Illinois, United States');
    t.deepEqual(feature.context, [
        { id: 'region.1', language: 'en', language_en: 'en', text: 'Illinois', text_en: 'Illinois' },
        { id: 'country.1', language: 'en', language_en: 'en', text: 'United States', text_en: 'United States' }
    ]);

    feature = ops.toFeature(context, {}, ['zh'], 'strict', true);
    t.deepEqual(feature.place_name, '芝加哥, 美国');
    t.deepEqual(feature.context, [
        { id: 'country.1', language: 'zh', language_zh: 'zh', text: '美国', text_zh: '美国' }
    ]);

    t.end();
});

test('ops#toFeature + formatter + languageMode=strict', (t) => {

    const context = [{
        properties: {
            'carmen:text': 'Chicago',
            'carmen:text_en': 'Chicago',
            'carmen:text_zh': '芝加哥',
            'carmen:types': ['place'],
            'carmen:center': [0, 0],
            'carmen:extid': 'place.1'
        }
    }, {
        properties: {
            'carmen:text': 'Illinois',
            'carmen:text_en': 'Illinois',
            'carmen:types': ['region'],
            'carmen:center': [0, 0],
            'carmen:extid': 'region.1'
        }
    }, {
        properties: {
            'carmen:text': 'United States',
            'carmen:text_en': 'United States',
            'carmen:text_zh': '美国',
            'carmen:types': ['country'],
            'carmen:center': [0, 0],
            'carmen:extid': 'country.1'
        }
    }];

    let feature;

    feature = ops.toFeature(context, {
        en: '{place._name}, {country._name}',
        zh: '{country._name}{place._name}'
    }, ['en'], 'strict', true);
    t.deepEqual(feature.place_name, 'Chicago, United States');
    t.deepEqual(feature.context, [
        { id: 'region.1', language: 'en', language_en: 'en', text: 'Illinois', text_en: 'Illinois' },
        { id: 'country.1', language: 'en', language_en: 'en', text: 'United States', text_en: 'United States' }
    ]);

    feature = ops.toFeature(context, {
        en: '{place._name}, {country._name}',
        zh: '{country._name}{place._name}'
    }, ['zh'], 'strict', true);
    t.deepEqual(feature.place_name, '美国芝加哥');
    t.deepEqual(feature.context, [
        { id: 'country.1', language: 'zh', language_zh: 'zh', text: '美国', text_zh: '美国' }
    ]);

    t.end();
});

