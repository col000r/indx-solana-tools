// Copyright (c) 2023 Markus Hofer
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import { matchSorter } from "match-sorter";

if (typeof window !== 'undefined') {}

export const generateCollectionMetadata = (projectName = 'NFT Collection', symbol = "NFCOLL", description = "Description of NFT Collection", sellerFeeBasisPoints = 0, creatorAddress, imageUri = undefined, imageType, externalUri = undefined) => {
    let metadata = {
        name: projectName,
        symbol: symbol,
        description: description,
        seller_fee_basis_points: sellerFeeBasisPoints
    }

    metadata.properties = {};

    if (imageUri) {
        metadata.image = imageUri;
        metadata.properties.files = [
            {
                uri: imageUri,
                type: imageType
            }
        ];
    };

    if(externalUri) {
        metadata.external_url = externalUri;
    }

    metadata.properties.creators = [
        {
            address: creatorAddress,
            share: 100
        }
    ];

    return metadata;
}

export const loadCollectionMetadata = () => {
    let storedText = localStorage.getItem("collectionMetadata");
    if (storedText == "undefined") storedText = "{}";
    let collectionMetadata = JSON.parse(storedText);
    return collectionMetadata;
};

export const saveCollectionMetadata = (value) => {
    return localStorage.setItem("collectionMetadata", JSON.stringify(value, null, 4));
};

export const generateTemplate = ({
    name = 'NFT',
    description = 'Description of an NFT',
    sellerFeeBasisPoints = 1000,
    symbol = "NFT",
    externalUrl = "https://url.com",
    creatorAddress = '',
    traits = []
}) => {
    let template = {
        name: `${name}`,
        description: `${description}`,
        seller_fee_basis_points: sellerFeeBasisPoints,
        symbol: symbol,
        image: '$ID$.png',
        external_url: externalUrl,
        properties: {
            category: 'image',
            files: [
                {
                    uri: '$ID$.png',
                    type: 'image/png'
                }
            ],
            creators: [
                {
                    address: creatorAddress,
                    share: 100
                }
            ]
        }

    }

    template.attributes = [];
    traits.forEach(trait => {
        template.attributes.push({
            trait_type: trait.name,
            value: trait.templateValue
        });
    });

    return template;
}

export const loadTemplate = () => {
    let template = JSON.parse(localStorage.getItem("template"));
    return template;
};

export const saveTemplate = (value) => {
    console.log('saveTemplate', value)
    return localStorage.setItem("template", JSON.stringify(value));
};

export const saveCollectionMetadataURI = (value) => {
    return localStorage.setItem("collectionMetadataURI", value);
};

export const loadCollectionMetadataURI = () => {
    let mUri = localStorage.getItem("collectionMetadataURI");
    if (!mUri) mUri = '';
    return mUri;
};

export const saveCollectionNftAddress = (value) => {
    return localStorage.setItem("collectionNftAddress", value);
};

export const loadCollectionNftAddress = () => {
    return localStorage.getItem("collectionNftAddress");
};

export const saveCandyMachineAddress = (value) => {
    return localStorage.setItem("candyMachineAddress", value);
};

export const loadCandyMachineAddress = () => {
    return localStorage.getItem("candyMachineAddress");
};

export function loadEntries(query) {
    let savedData = localStorage.getItem("entries");
    if (savedData == "undefined" || savedData == "{}") savedData = '[]';
    let entries = JSON.parse(savedData);
    if (!entries) entries = [];
    if (query) {
        entries = matchSorter(entries, query);
    }
    return entries; 
};

export async function loadEntry(id) {
    let entries = await loadEntries();
    let entry = entries[id]; 
    return entry ?? null;
};

export async function updateEntry(id, updates) {
    let entries = loadEntries();
    let entry = entries[id]; 
    if (!entry) throw new Error(`No entry found for ${id}`);
    Object.assign(entry, updates);
    saveEntries(entries);
    return entry;
};

export async function deleteEntry(id) {
    let entries = loadEntries();
    if (id > -1) {
        entries.splice(index, 1);
        saveEntries(entries);
        return true;
    }
    return false;
};

export function saveEntries(entries) {
    console.log(`save: `, entries);
    return localStorage.setItem("entries", JSON.stringify(entries));
}

export async function getMetaDataFiles(query) {
    console.log('getMetadata');
    let entries = await loadEntries();
    console.log(entries);
    let files = [];
    for (const e of entries) {
        console.log(e.metadata);
        files.push(e.metadata);
    }
    return files;
}

// fake a cache so we don't slow down stuff we've already seen
let fakeCache = {};

async function fakeNetwork(key) {
    if (!key) {
        fakeCache = {};
    }

    if (fakeCache[key]) {
        return;
    }

    fakeCache[key] = true;
    return new Promise(res => {
        setTimeout(res, Math.random() * 800);
    });
}