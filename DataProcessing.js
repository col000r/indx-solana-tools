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

import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { getMetaDataFiles, loadEntries, saveEntries, loadTemplate } from "./Data";

/**
 * Same as Promise.all(items.map(item => task(item))), but it waits for
 * the first {batchSize} promises to finish before starting the next batch.
 *
 * @template A
 * @template B
 * @param {function(A): B} task The task to run for each item.
 * @param {A[]} items Arguments to pass to the task for each call.
 * @param {int} batchSize
 * @returns {Promise<B[]>}
 */
 export const promiseAllInBatches = async (task, items, batchSize) => {
    let position = 0;
    let results = [];
    while (position < items.length) {
        const itemsForBatch = items.slice(position, position + batchSize);
        results = [...results, ...await Promise.all(itemsForBatch.map(item => task(item)))];
        position += batchSize;
    }
    return results;
};

export const handleCSVLoaded = (csv, fileInfo) => {
    console.log('handleCSVLoaded', csv, fileInfo);

    determineRarity(csv);
    let entries = process(csv);
    saveEntries(entries);
};

export const determineRarity = (entries) => {
    let countVals = {};
    let count = 0;
    for (const e of entries) {
        for (const key in e) {
            if (!(key in countVals)) {
                countVals[key] = {};
            }
            if (!(e[key] in countVals[key])) {
                countVals[key][e[key]] = 0;
            }
            countVals[key][e[key]]++;
        }
        count++;
    }

    console.log(`Rarity:`, countVals);
    localStorage.setItem("rarities", countVals);
}

const getData = (variable, id, entries) => {
    variable = variable.toLowerCase();

    if (variable === "year") {
        let year = entries[id][variable];
        if (year < 0) year = `${Math.abs(year)} BCE`;
        else year = `${year} CE`;
        return year;
    }

    return entries[id][variable] ? entries[id][variable] : '';
};

const processField = (d, id, total, entries) => {

    if (!d) console.log(`ERROR: no d! ${id}: ${d}`);

    let startD = 0;
    let endD = 0;

    let count = 0;

    do {
        startD = d.indexOf('$', endD);
        if (startD >= 0) {
            endD = d.indexOf('$', startD + 1);
            let variable = d.substr(startD + 1, endD - startD - 1);

            var replacement = variable;
            switch (variable) {
                case 'ID':
                    replacement = `${id}`;
                    break;
                case 'IDPLUSONE':
                    replacement = `${(id + 1)}`;
                    break;
                case 'NUM':
                    replacement = `${total}`;
                    break;
                default:
                    replacement = getData(variable.toLowerCase(), id, entries);
                    break;
            }

            if (replacement != variable) { //replacement != null && 
                // REPLACE
                d = d.substr(0, startD) + replacement + d.substr(endD + 1, d.length - endD - 1);
                endD -= variable.length + 2 - replacement.length;
            }
        }

        endD++;
        count++;
    } while (startD >= 0 && count < 1000);

    return d;
};

export function process(entries) {
    let template = loadTemplate();

    let files = [];
    if (!entries || !Array.isArray(entries)) {
        console.log('no entries given, getting saved entries...');
        entries = loadEntries();
    }

    if (entries.length == 0) {
        console.log('NO ENTRIES TO PROCESS...');
        return [];
    }

    console.log(`Process:`, entries);

    let total = entries.length;
    console.log('typeof entries', typeof entries);
    entries.map((e, id) => {

        let nData = structuredClone(template); // deep clone, yeah!

        // NAME, DESCRIPTION
        nData.name = processField(nData.name, id, total, entries);
        nData.description = processField(nData.description, id, total, entries);

        if(nData.properties?.files?.length > 0) {
            nData.properties.files[0].uri = processField(nData.properties.files[0].uri, id, total, entries);
        }

        // FILE
        let fileUri = undefined;
        if (e.filePreviewUrl && !e.filePreviewUrl.startsWith('blob:')) fileUri = e.filePreviewUrl;

        if (fileUri) nData.image = fileUri;
        else nData.image = processField(nData.image, id, total, entries);

        if (nData.properties?.files?.length > 0) {
            for (let i = 0; i < nData.properties.files.length; i++) {
                const file = nData.properties.files[i];
                file.uri = fileUri ? fileUri : processField(file.uri, id, total, entries);
            }
        }

        for (let i = nData.attributes.length - 1; i >= 0; i--) {
            const att = nData.attributes[i];
            att.value = processField(att.value, id, total, entries);
            if (!att.value) nData.attributes.splice(i, 1); // remove if empty 
        }

        // SAVE METADATA INTO ENTRY
        e.metadata = nData;

        //console.log(nData)
        files.push(nData);

    });

    console.log('files: ', files);
    return entries;
}

export const zipAndSave = async () => {

    const files = await getMetaDataFiles();

    const zip = new JSZip();
    for (let i = 0; i < files.length; i++) {
        const file = JSON.stringify(files[i], null, 4);
        //console.log(file);
        zip.file(`${i}.json`, file);
    }
    zip.generateAsync({ type: "blob" }).then((content) => saveAs(content, "json.zip"));
};