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

import React, { useContext, useState, useEffect } from "react";
import { ConnectionContext } from "./ConnectionContextProvider";
import { keypairIdentity, Metaplex, toBigNumber, sol, toMetaplexFileFromBrowser, getBytesFromMetaplexFiles } from "@metaplex-foundation/js";
import { Keypair, PublicKey } from "@solana/web3.js";
import { InputGroup, Button, Form, Image, Stack, Accordion, CardImg, Card, CardGroup, Row, Col, useAccordionButton, Modal, Badge, Table, Container } from "react-bootstrap";
import * as bs58 from 'bs58';
import { nftStorage, NftStorageDriver } from "@metaplex-foundation/js-plugin-nft-storage";
import CSVReader from "react-csv-reader";
import { determineRarity, handleCSVLoaded, process, zipAndSave } from "../DataProcessing";
import { loadEntries, saveEntries, saveTemplate, loadTemplate, generateTemplate, generateCollectionMetadata, saveCollectionMetadata } from "../Data";

import TraitsConfig from "./TraitsConfig";
import AdvButton from "./AdvButton";
import ToolsCard from "./ToolsCard";

const papaparseOptions = {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    transformHeader: header => header.toLowerCase().replace(/\W/g, "_")
};


const ItemData = ({ onChange, secretKey, collectionMetadata, creatorAddress }) => {
    const [localTemplate, setLocalTemplate] = useState('');
    const [localEntries, setLocalEntries] = useState([]);
    const [accordionKey, setAccordionKey] = useState('');
    const [itemNameOverride, setItemNameOverride] = useState('');
    const [itemDescriptionOverride, setItemDescriptionOverride] = useState('');
    const [imageInfo, setImageInfo] = useState('');
    const [show, setShow] = useState(false);
    const [localTraits, setLocalTraits] = useState([]);
    const [sellerFeeBasisPoints, setSellerFeeBasisPoints] = useState(500);
    const [externalUrl, setExternalUrl] = useState('');

    const clusterConn = useContext(ConnectionContext);

    useEffect(() => {
        if (localEntries.length == 0) fetchEntriesAndSet();

        const t = loadTemplate();
        //console.log("loadTemplate", t);
        extractTraitsAndOtherData(t);
        setLocalTemplate(JSON.stringify(t, null, 4));
    }, []);

    useEffect(() => {
        if (localTemplate == '') return; //****** */
        updateTemplate({ creatorAddr: creatorAddress });
    }, [creatorAddress]);

    useEffect(() => {
        if (localTemplate == '') return; //******* */
        updateTemplate({});
    }, [collectionMetadata])

    useEffect(() => {
        if (localTemplate == '') return;
        let entries = process(localEntries);
        setLocalEntries(entries);
    }, [localTraits]);

    const handleClose = () => setShow(false);
    const handleClear = () => {
        setShow(false);
        clearAllData();
    };
    const handleShow = () => setShow(true);

    const fetchEntriesAndSet = () => {
        const es = loadEntries();

        if (es.length > 0) {
            // invalidate all urls, create new urls
            console.log('fetchEntries - deal with URLs');
            for (const e of es) {
                //console.log(`file:`, e.file);
                if (e.filePreviewUrl && e.filePreviewUrl.startsWith('blob:')) {
                    console.log(`revoking ${e.filePreviewUrl}`);
                    URL.revokeObjectURL(e.filePreviewUrl);
                    delete e.filePreviewUrl;
                }
                if (e.file && Object.keys(e.file).length == 0) {
                    delete e.file;
                }
            }
        }

        setLocalEntries(es);
        onChange(es);
        setImageInfo(getImageOnlineLocalInfo(es));
        console.log("data entries: ", es);
    };

    // TEMPLATE

    const handleTemplateChange = event => {
        let templ = event.target.value;
        extractTraitsAndOtherData(templ);
        setLocalTemplate(templ);
        saveTemplate(templ);
    };

    const handleTemplateFileChange = (event) => {
        console.log(event.target.files);
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];
            if (file.type == "application/json") {
                const fileReader = new FileReader();
                fileReader.readAsText(file, "UTF-8");
                fileReader.onload = e => {
                    let fileStr = e.target.result;
                    console.log("e.target.result", JSON.parse(fileStr));
                    let templ = JSON.parse(fileStr);
                    extractTraitsAndOtherData(templ);
                    setLocalTemplate(templ);
                    saveTemplate(templ);
                };
                fileReader.onerror = e => {
                    console.log("error", e.target.error);
                }
            } else {
                console.log('Wrong file type! Needs to be a JSON!');
            }
        }
    };

    const onGenerateTemplateClicked = () => {
        const templ = generateTemplate({
            name: collectionMetadata.name,
            description: collectionMetadata.description,
            sellerFeeBasisPoints: sellerFeeBasisPoints,
            symbol: collectionMetadata.symbol,
            creatorAddress: creatorAddress,
            traits: localTraits
        });
        saveTemplate(templ);
        setLocalTemplate(JSON.stringify(templ, null, 4));
    };

    const updateTemplate = ({ name = undefined, description = undefined, sellerFee = undefined, traits = undefined, extUrl = undefined, creatorAddr = undefined }) => {
        // Re-create template based on given changes
        console.log('UPDATE TEMPLATE');

        if (!name) name = itemNameOverride;
        else setItemNameOverride(name);

        if (name == '') name = collectionMetadata.name;

        if (!description) description = itemDescriptionOverride;
        else setItemDescriptionOverride(description);

        if (description == '') description = collectionMetadata.description;

        if (!sellerFee) sellerFee = sellerFeeBasisPoints;
        else setSellerFeeBasisPoints(sellerFee);

        if (!traits) traits = localTraits;
        else setLocalTraits(traits);

        if (!extUrl) extUrl = externalUrl;
        else setExternalUrl(extUrl);

        if (!creatorAddr) creatorAddr = creatorAddress;

        const templ = generateTemplate({
            name: name,
            description: description,
            sellerFeeBasisPoints: sellerFee,
            symbol: collectionMetadata.symbol,
            creatorAddress: creatorAddr,
            traits: traits,
            externalUrl: extUrl
        });

        saveTemplate(templ);
        setLocalTemplate(JSON.stringify(templ, null, 4));

        // also re-process entries! (to update their metadata)
        let entries = process(loadEntries);
        setLocalEntries(entries);
        saveEntries(entries);
    }

    const handleSellerFeeChange = e => { setSellerFeeBasisPoints(e.target.value); updateTemplate({ sellerFee: e.target.value }); }
    const handleExternalUrlChange = e => { setExternalUrl(e.target.value); updateTemplate({ extUrl: e.target.value }); };

    const handleActiveKeyChange = key => {
        if (accordionKey === key) {
            //allows us to close expanded item by clicking its toggle while open
            key = -1
        }
        setAccordionKey(key);
    };

    // DATA

    const handleItemNameOverrideChange = e => {
        setItemNameOverride(e.target.value);
        updateTemplate({ name: e.target.value });
    };

    const handleItemDescriptionOverrideChange = e => {
        setItemDescriptionOverride(e.target.value);
        updateTemplate({ description: e.target.value });
    }

    const handleCSVFileLoaded = (data, fileInfo) => {
        console.log('handle csv file loaded');
        handleCSVLoaded(data, fileInfo);
        fetchEntriesAndSet();
    };

    const clearAllData = () => {
        let entries = [];
        setLocalEntries(entries);
        onChange(entries);
        saveEntries(entries);
    };

    const flattenAttributes = (attr) => {
        let str = '';
        return attr.map((e, id) => (
            <><Badge key={`tag${id}`} bg='tag' className='mr-2'>{e.trait_type}: {e.value}</Badge>{'  '}</>
        ));

        // attr.forEach((e, id) => {
        //     str += (id > 0 ? ', ' : '') + `${e.trait_type}: ${e.value}`;
        // });
        // return str;
    };

    // IMAGES

    const onItemInfoClicked = () => {
        console.log(localEntries);
    };

    const handleImageAdd = (event) => {
        console.log(event.target.files);

        let tempEntries = structuredClone(localEntries);

        for (const file of event.target.files) {
            console.log(file);
            const extractedNumbers = file.name.match(/\d+/);
            if (extractedNumbers && extractedNumbers.length > 0) {
                const extractedNumber = extractedNumbers[0];
                console.log(extractedNumber);
                if (tempEntries.length > extractedNumber) {
                    if (tempEntries[extractedNumber].file) console.log(`entry ${extractedNumber} already has a file assigned - replacing it...`);
                    if (tempEntries[extractedNumber].filePreviewUrl) URL.revokeObjectURL(tempEntries[extractedNumber].filePreviewUrl); //release memory
                    tempEntries[extractedNumber].file = file;
                    tempEntries[extractedNumber].filePreviewUrl = URL.createObjectURL(file);
                    console.log(`${file.name} assigned to metadata ${extractedNumber} (${tempEntries[extractedNumber].name})`);
                } else {
                    console.log(`No metadata found for ${extractedNumber}, ignoring...`);
                }
            } else {
                console.log(`No number found in ${file.name}, ignoring...`);
            }
        }

        tempEntries = process(tempEntries);
        setLocalEntries(tempEntries);
        saveEntries(tempEntries);
        onChange(tempEntries);
        setImageInfo(getImageOnlineLocalInfo(tempEntries));
    };

    const isEmptyObj = (obj) => {
        for (var i in obj) return false;
        return true;
    }

    const onUploadImagesClicked = async () => {
        // Upload all images that don't have online URLs yet.
        await Promise.all(uploadImages(localEntries)).
            then(() => {
                console.log('ALL DONE')
            });
    };

    const uploadImages = async () => {
        let entries = structuredClone(localEntries);

        console.log('upload images...');
        const metaplex = new Metaplex(clusterConn.connection);
        const keyPair = Keypair.fromSecretKey(bs58.decode(secretKey));
        metaplex.use(keypairIdentity(keyPair));
        metaplex.use(nftStorage());

        let count = 0;

        await Promise.all(
            entries.map(async e => {
                if (e.file && (!e.filePreviewUrl || e.filePreviewUrl.startsWith('blob:') || e.filePreviewUrl.startsWith('/failed'))) {
                    console.log("UPLOADING: ", e.filePreviewUrl, e.file);

                    if (isEmptyObj(e.file)) {

                        e.filePreviewUrl = '/uploadFailed.jpg';

                    } else {

                        const file = await toMetaplexFileFromBrowser(e.file);
                        const fileBytes = getBytesFromMetaplexFiles(file);
                        //console.log(fileBytes);
                        let bytesUploaded = 0;

                        const driver = metaplex.storage().driver();
                        driver.onProgress((size) => {
                            bytesUploaded += size;
                            console.log(`Uploaded ${bytesUploaded} bytes out of ${fileBytes} bytes`);
                        });

                        console.log('starting upload...');
                        const uri = await metaplex.storage().upload(file);
                        count++;
                        console.log(`${count} file${count > 1 ? 's' : ''} done! newest uri: ${uri}`);
                        e.filePreviewUrl = uri;
                    }

                    // NO NEED TO WORRY ABOUT METADATA -->> Process() will handle that

                    delete e.file;

                    // Process everything so stuff updates
                    entries = process(entries);
                    saveEntries(entries);
                    setLocalEntries(entries);
                    setImageInfo(getImageOnlineLocalInfo(entries));
                    onChange(entries);

                } else {
                    // console.log(`Already in storage: ${e.filePreviewUrl}`);
                }
            }))
            .catch(e => {
                console.error('something went wrong? ', e)
            })
            .finally(() => {
                console.log(`ALL ${count} UPLOADS DONE!`);
            });
    };

    const areImagesDone = () => {
        let numOnline = 0;
        let numLocal = 0;
        let numMissing = 0;
        let numTotal = 0;

        if(localEntries?.length > 0) {
            localEntries.forEach(e => {
                numTotal++;
                if (!e.filePreviewUrl) numMissing++;
                else if (e.filePreviewUrl.startsWith('blob:') || e.filePreviewUrl.startsWith('/failed')) numLocal++;
                else numOnline++;
            });
        }

        return (numOnline == numTotal && numTotal > 0);
    }

    const getImageOnlineLocalInfo = (entries) => {
        let numOnline = 0;
        let numLocal = 0;
        let numMissing = 0;
        let numTotal = 0;

        if (entries.length > 0) {
            entries.forEach(e => {
                numTotal++;
                if (!e.filePreviewUrl) numMissing++;
                else if (e.filePreviewUrl.startsWith('blob:') || e.filePreviewUrl.startsWith('/failed')) numLocal++;
                else numOnline++;
            });
        }

        return `✅ ${numOnline} ⬆️ ${numLocal} ❎ ${numMissing} (Total: ${numTotal})`;
    };

    const getNumEntries = () => {
        if (!localEntries || localEntries.length == 0 || localEntries.length == undefined) return 'No Items Loaded';
        return localEntries.length + ' Items Loaded';
    };

    // TRAITS

    const handleTraitsChange = (traits) => {
        processTraits(traits);
    };

    const processTraits = (traits) => {
        // Process traits and put them into the template
        setLocalTraits(traits);
        updateTemplate({ traits: traits });
    };

    const extractTraitsAndOtherData = (template) => {
        console.log('extractTraits');
        // Extract traits from template
        try {
            // if template is a string, parse it to an object!
            if (typeof template === 'string' || template instanceof String) template = JSON.parse(template);

            console.log('template?', template);

            console.log(template.seller_fee_basis_points);
            console.log(template.external_url);

            if (template.name !== collectionMetadata.name) setItemNameOverride(template.name);
            if (template.description !== collectionMetadata.description) setItemDescriptionOverride(template.description);

            setSellerFeeBasisPoints(template.seller_fee_basis_points);
            setExternalUrl(template.external_url);

            let traits = [];
            template.attributes.forEach(attr => {
                traits.push({
                    name: attr.trait_type,
                    templateValue: attr.value
                });
            });

            console.log(traits);
            setLocalTraits(traits);
        } catch (e) { console.log("template didn't parse", e); }
    }

    /**
     * Split {items} into {batchSize}, then call {task(batch)} and wait for Promise.all
     * to finish before starting the next batch.
     *
     * @template A
     * @template B
     * @param {function(A): B} task The task to run for each batch.
     * @param {A[]} items Arguments to pass to the task for each call.
     * @param {int} batchSize
     * @returns {Promise<B[]>}
     */
    const promiseAllBatchesInBatches = async (task, metaplex, entries, items, batchSize) => {
        let position = 0;
        let results = [];
        while (position < items.length) {
            const itemsForBatch = items.slice(position, position + batchSize);
            results = [...results, await task(metaplex, entries, itemsForBatch, position)];
            position += batchSize;
        }
        return results;
    };

    const uploadItemsMetadataBatch = async (metaplex, entries, insertItems, insertAt = 0) => {
        return Promise.all(
            insertItems.map(async e => {
                if (e.metadata && !e.metadataUri) {
                    const eId = entries.findIndex((le) => le.metadata.name === e.metadata.name);
                    await metaplex.nfts().uploadMetadata(e.metadata)
                        .then(({ uri }) => {
                            console.log(uri);
                            entries[eId].metadataUri = uri;
                            setLocalEntries(entries);
                            saveEntries(entries);
                            onChange(entries);
                        });
                }
            }))
            .catch(e => console.error('something went wrong', e))
            .finally(() => {
                console.log("DONE", entries);
            });
    };

    const uploadItemMetadata = async () => {
        console.log('upload item metadata...');
        const keyPair = Keypair.fromSecretKey(bs58.decode(secretKey));
        const metaplex = new Metaplex(clusterConn.connection);
        metaplex.use(keypairIdentity(keyPair));
        metaplex.use(nftStorage());

        let count = 0;

        let entries = structuredClone(localEntries);

        return promiseAllBatchesInBatches(uploadItemsMetadataBatch, metaplex, entries, entries, 7);
    };

    const onUploadItemMetadataClicked = async () => {
        return uploadItemMetadata();
    }

    const getMetadataFileInfo = () => {
        let numUploaded = 0;
        let numLocal = 0;
        localEntries.forEach(e => {
            if (e.metadataUri) numUploaded++;
            else numLocal++;
        });

        return { label: `✅ ${numUploaded} ⬆️ ${numLocal}`, numUploaded: numUploaded, numLocal: numLocal };
    };

    const getMetadataFileInfoLabel = () => {
        const { label } = getMetadataFileInfo();
        return label;
    }

    const isMetadataFileUploadRequired = () => {
        const { numLocal, numUploaded } = getMetadataFileInfo();
        return numLocal > 0; // || numUploaded > 0;
    }

    const isMetadataFileUploadDone = () => {
        const { numLocal, numUploaded } = getMetadataFileInfo();
        return numLocal == 0 && numUploaded > 0;
    }

    const nothing = () => { };

    const test = (entry) => {
        console.log(entry);
        Object.entries(entry).map(([key, value]) => (
            console.log(key, value)
        ));
    }

    const onLogRarityClicked = () => {
        determineRarity(localEntries);
    }

    const areItemMetadataAndImagesDone = () => {
        if (!localEntries || localEntries.length == 0) return false;
        for (const e of localEntries) {
            if (e.filePreviewUrl && e.filePreviewUrl.startsWith('https://') && e.metadataUri && e.metadataUri.startsWith('https://')) {
                //nothing
            } else {
                console.log('RETURN FALSE');
                return false;
            }
        }
        return true;
    }

    const onClearMetadataUris = () => {
        console.log('clearing metadataUris');
        let entries = structuredClone(localEntries);
        entries.forEach(e => e.metadataUri = null);
        setLocalEntries(entries);
        saveEntries(entries);
        onChange(entries);
    };

    return (
        <>
            <ToolsCard title='' description={<>We need to generate Metadata for each NFT. We&apos;ll start with a template and set up all the basic fields that all NFTs will share<br /><br />And we need to set <em>Traits</em> - The values that make each NFT unique and define the rarity of each NFT. The <em>Template Value</em> of each <em>Trait</em> has to correspond with the header of the data we&apos;ll load in the next step below.<br /><br /> (Header POINTS → Template Value $POINTS$)</>}>
                <Card.Header>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={18} height={18} fill="currentColor" className="me-2 mb-1">
                        <path fillRule="evenodd" d="M2.625 6.75a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875 0A.75.75 0 018.25 6h12a.75.75 0 010 1.5h-12a.75.75 0 01-.75-.75zM2.625 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zM7.5 12a.75.75 0 01.75-.75h12a.75.75 0 010 1.5h-12A.75.75 0 017.5 12zm-4.875 5.25a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875 0a.75.75 0 01.75-.75h12a.75.75 0 010 1.5h-12a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                    </svg>
                    Item Metadata Template + Traits
                    {areItemMetadataAndImagesDone() === true  && <span style={{float:'right'}}>✅</span>}
                </Card.Header>
                <Card.Body>
                    <InputGroup className="mb-1">
                        <InputGroup.Text style={{ width: '160px' }}>Template JSON:</InputGroup.Text>
                        <Button onClick={onGenerateTemplateClicked}>Generate</Button>
                        <Form.Control type="file" onChange={handleTemplateFileChange} accept='application/json' />
                    </InputGroup>

                    <InputGroup className="mb-1">
                        <InputGroup.Text style={{ width: '160px' }}>Item Name</InputGroup.Text>
                        <Form.Control value={itemNameOverride} onChange={handleItemNameOverrideChange} />
                    </InputGroup>

                    <InputGroup className="mb-1">
                        <InputGroup.Text style={{ width: '160px' }}>Item Description</InputGroup.Text>
                        <Form.Control value={itemDescriptionOverride} onChange={handleItemDescriptionOverrideChange} />
                    </InputGroup>

                    <InputGroup className="mb-1">
                        <InputGroup.Text style={{ width: '160px' }}>External URL</InputGroup.Text>
                        <Form.Control value={externalUrl} onChange={handleExternalUrlChange} />
                        <InputGroup.Text>Seller Fee Basis Points</InputGroup.Text>
                        <Form.Control type="number" min={0} max={10000} step="1" value={sellerFeeBasisPoints} onChange={handleSellerFeeChange} />
                    </InputGroup>

                    <Accordion>
                        <Accordion.Item eventKey="1">
                            <Accordion.Header>
                                View / Edit Item Metadata Template
                            </Accordion.Header>
                            <Accordion.Body>
                                <Form.Control as="textarea" aria-label="Template" onChange={handleTemplateChange} rows={20} value={localTemplate} />
                            </Accordion.Body>
                        </Accordion.Item>
                    </Accordion>

                    <TraitsConfig traits={localTraits} onChange={handleTraitsChange} />

                </Card.Body>
            </ToolsCard>

            <ToolsCard title='' description={<>Now we need the actual <em>Data</em> for each item. Set this up in a spreadsheet, save as <em>CSV</em> and import it here!<br />If the headers of the columns match the Traits you set up above, then they will show up as tags in the preview section further down!</>}>
                <Card.Header>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={18} height={18} fill="currentColor" className="me-2 mb-1">
                        <path fillRule="evenodd" d="M1.5 5.625c0-1.036.84-1.875 1.875-1.875h17.25c1.035 0 1.875.84 1.875 1.875v12.75c0 1.035-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 011.5 18.375V5.625zM21 9.375A.375.375 0 0020.625 9h-7.5a.375.375 0 00-.375.375v1.5c0 .207.168.375.375.375h7.5a.375.375 0 00.375-.375v-1.5zm0 3.75a.375.375 0 00-.375-.375h-7.5a.375.375 0 00-.375.375v1.5c0 .207.168.375.375.375h7.5a.375.375 0 00.375-.375v-1.5zm0 3.75a.375.375 0 00-.375-.375h-7.5a.375.375 0 00-.375.375v1.5c0 .207.168.375.375.375h7.5a.375.375 0 00.375-.375v-1.5zM10.875 18.75a.375.375 0 00.375-.375v-1.5a.375.375 0 00-.375-.375h-7.5a.375.375 0 00-.375.375v1.5c0 .207.168.375.375.375h7.5zM3.375 15h7.5a.375.375 0 00.375-.375v-1.5a.375.375 0 00-.375-.375h-7.5a.375.375 0 00-.375.375v1.5c0 .207.168.375.375.375zm0-3.75h7.5a.375.375 0 00.375-.375v-1.5A.375.375 0 0010.875 9h-7.5A.375.375 0 003 9.375v1.5c0 .207.168.375.375.375z" clipRule="evenodd" />
                    </svg>
                    Item Data
                    {localEntries?.length > 0 === true && <span style={{float:'right'}}>✅</span>}
                </Card.Header>
                <Card.Body>

                    <Stack direction="horizontal" gap={1} style={{ width: '100%' }} className='my-1'>
                        <CSVReader
                            cssClass="input-group"
                            cssInputClass="form-control"
                            cssLabelClass="input-group-text"
                            label="Item Data CSV:"
                            accept=""
                            onFileLoaded={handleCSVFileLoaded}
                            parserOptions={papaparseOptions}
                        />
                        <InputGroup className="ms-auto">
                            {/* <InputGroup.Text>{localEntries.length} Items Loaded</InputGroup.Text> */}
                            <Form.Control disabled value={getNumEntries()} />
                            <Button onClick={onItemInfoClicked}>Log Info</Button>
                            <Button onClick={onLogRarityClicked} variant='secondary'>Log Rarity</Button>
                            <Button onClick={handleShow} variant='danger'>Clear All</Button>
                        </InputGroup>
                    </Stack>

                    {localEntries.length > 0 &&
                        <Accordion defaultActiveKey={2}>
                            <Accordion.Item eventKey="2">
                                <Accordion.Header>Item Data</Accordion.Header>
                                <Accordion.Body>
                                    <Table striped bordered hover responsive size="sm">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                {Object.entries(localEntries[0]).map(([key, value]) => (
                                                    (key !== 'metadata' && key !== 'filePreviewUrl' && key != 'metadataUri') && <th key={`head${key}`}>{key.toUpperCase()}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {localEntries.map((entry, id) => (
                                                <tr key={`row-${id}`}>
                                                    <td key={`r${id}-td`}>{id}</td>
                                                    {/* {test(entry)} */}
                                                    {Object.entries(entry).map(([key, value], tid) => (
                                                        key !== 'metadata' && key !== 'filePreviewUrl' && key != 'metadataUri') && <td key={`r${id}-c${key}`}>{value?.toString()}</td>
                                                        // (typeof value == 'object' || typeof key == 'object' ? <td key={`r${id}-c${tid}`}></td> : key !== 'metadata' && key !== 'filePreviewUrl' && key != 'metadataUri') && <td key={`r${id}-c${key}`}>{value}</td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </Accordion.Body>
                            </Accordion.Item>
                        </Accordion>
                    }
                </Card.Body>
            </ToolsCard>

            <ToolsCard title='' description={<>Upload an image each for every NFT. Name them after numbers - image 0.png will belong to NFT #1, etc.</>}>
                <Card.Header>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={18} height={18} fill="currentColor" className="me-2 mb-1">
                        <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" />
                    </svg>
                    Images
                    {areImagesDone() === true && <span style={{float:'right'}}>✅</span>}
                </Card.Header>
                <Card.Body>

                    <InputGroup className='my-1'>
                        <InputGroup.Text style={{ width: '160px' }}>Add images: </InputGroup.Text>
                        <Form.Control type="file" multiple onChange={handleImageAdd} accept='image/*' />
                        <InputGroup.Text>{imageInfo}</InputGroup.Text>
                        {/* <Button onClick={onUploadImagesClicked} disabled={!secretKey}>Upload to nft.storage</Button> */}
                        <AdvButton onClick={uploadImages} disabled={!secretKey}>Upload to nft.storage</AdvButton>
                    </InputGroup>

                </Card.Body>
            </ToolsCard>

            <ToolsCard title='' description={<>Review everything and check that all the required pieces are in place!</>}>
                <Card.Header>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={18} height={18} fill="currentColor" className="me-2 mb-1">
                        <path fillRule="evenodd" d="M3 6a3 3 0 013-3h2.25a3 3 0 013 3v2.25a3 3 0 01-3 3H6a3 3 0 01-3-3V6zm9.75 0a3 3 0 013-3H18a3 3 0 013 3v2.25a3 3 0 01-3 3h-2.25a3 3 0 01-3-3V6zM3 15.75a3 3 0 013-3h2.25a3 3 0 013 3V18a3 3 0 01-3 3H6a3 3 0 01-3-3v-2.25zm9.75 0a3 3 0 013-3H18a3 3 0 013 3V18a3 3 0 01-3 3h-2.25a3 3 0 01-3-3v-2.25z" clipRule="evenodd" />
                    </svg>
                    Preview NFTs
                </Card.Header>
                <Card.Body>
                    {localEntries.length > 0 ?
                        <Accordion defaultActiveKey={0}>
                            <Accordion.Item eventKey="0">
                                <Accordion.Header>Preview</Accordion.Header>
                                <Accordion.Body>
                                    <Row sm={1} md={2} lg={3} xl={4} className='g-3'>
                                        {localEntries.map((entry, id) => (
                                            <Col key={`card col ${id}`}>
                                                <Card key={`card ${id}`} style={{ width: '13.5rem' }}>
                                                    <Card.Img key={`cardimg ${id}`} variant="top" src={entry.filePreviewUrl ? entry.filePreviewUrl : "/holder.jpg"} />
                                                    {entry.filePreviewUrl && entry.filePreviewUrl.startsWith('blob:') &&
                                                        <Card.ImgOverlay key={`cio${id}`} className='local'></Card.ImgOverlay>
                                                    }
                                                    <Card.Body key={`cbody ${id}`}>
                                                        <Card.Title key={`ct${id}`}>{entry.metadata !== undefined && entry.metadata.name}</Card.Title>
                                                        <Card.Text key={`ctx${id}`} style={{ fontSize: '1.2em' }}>{entry.metadata !== undefined &&
                                                            (entry.metadata.attributes.map((e, id) => (<><Badge key={`tag${id}`} bg='tag'>{e.trait_type}: {e.value}</Badge>{' '}</>)))
                                                        }</Card.Text>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                        ))}
                                    </Row>
                                </Accordion.Body>
                            </Accordion.Item>
                        </Accordion>
                        :
                        <div className="text-muted" style={{ textAlign: 'center' }}>Nothing to preview yet</div>
                    }
                </Card.Body>
            </ToolsCard>

            <ToolsCard title='' description={<>Once all data is done and all images are uploaded, the final metadata for all NFTs can be uploaded to decentralized storage.</>}>
                <Card.Header>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={18} height={18} fill="currentColor" className="me-2 mb-1">
                        <path fillRule="evenodd" d="M5.625 1.5H9a3.75 3.75 0 013.75 3.75v1.875c0 1.036.84 1.875 1.875 1.875H16.5a3.75 3.75 0 013.75 3.75v7.875c0 1.035-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 01-1.875-1.875V3.375c0-1.036.84-1.875 1.875-1.875zm6.905 9.97a.75.75 0 00-1.06 0l-3 3a.75.75 0 101.06 1.06l1.72-1.72V18a.75.75 0 001.5 0v-4.19l1.72 1.72a.75.75 0 101.06-1.06l-3-3z" clipRule="evenodd" />
                        <path d="M14.25 5.25a5.23 5.23 0 00-1.279-3.434 9.768 9.768 0 016.963 6.963A5.23 5.23 0 0016.5 7.5h-1.875a.375.375 0 01-.375-.375V5.25z" />                    </svg>
                    Upload Item Metadata
                    {isMetadataFileUploadDone() === true && <span style={{float:'right'}}>✅</span>}
                </Card.Header>
                <Card.Body>
                    <InputGroup className="mt-1 mb-1">
                        <InputGroup.Text style={{ width: '160px' }}>Item Metadata</InputGroup.Text>
                        <Form.Control key='fileinfo' style={{ textAlign: 'right' }} disabled onChange={nothing} value={getMetadataFileInfoLabel()} />
                        <AdvButton onClick={onUploadItemMetadataClicked} variant='primary' disabled={!isMetadataFileUploadRequired()}>Upload to nft.storage</AdvButton>
                        <Button onClick={onClearMetadataUris} variant='secondary'>Clear URIs</Button>
                        {/* <InputGroup.Text>or</InputGroup.Text>
                        <Button onClick={zipAndSave} variant='info' disabled={localEntries.length == 0}>Save as ZIP</Button> */}
                    </InputGroup>
                </Card.Body>
            </ToolsCard>

            <Modal show={show} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Are you sure?</Modal.Title>
                </Modal.Header>
                <Modal.Body>Clear all Metadata entries?</Modal.Body>
                <Modal.Footer>
                    <Button variant="danger" onClick={handleClear}>
                        Yes, Delete it all!
                    </Button>
                    <Button variant="secondary" onClick={handleClose}>
                        No, Keep them
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default ItemData;