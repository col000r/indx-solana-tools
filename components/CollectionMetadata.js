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

import React, { useState, useEffect, useContext } from "react";
import { Accordion, Button, Form, InputGroup, Image } from "react-bootstrap";
import { generateCollectionMetadata, loadCollectionMetadata, loadCollectionMetadataURI, saveCollectionMetadata, saveCollectionMetadataURI } from "../Data";
import { Keypair } from "@solana/web3.js";
import * as bs58 from 'bs58';
import { nftStorage } from "@metaplex-foundation/js-plugin-nft-storage";
import { keypairIdentity, Metaplex, toMetaplexFileFromBrowser, getBytesFromMetaplexFiles } from "@metaplex-foundation/js";
import { ConnectionContext } from "./ConnectionContextProvider";
import AdvButton from "./AdvButton";

const CollectionMetadata = ({ onChange, onUriChange: onUriChange, secretKey, creatorAddress }) => {
    const [collectionName, setCollectionName] = useState('');
    const [symbol, setSymbol] = useState('');
    const [description, setDescription] = useState('');
    const [collectionImage, setCollectionImage] = useState(undefined);
    const [imageUri, setImageUri] = useState('');
    const [imageType, setImageType] = useState(undefined);
    const [externalUri, setExternalUri] = useState('');
    const [collectionMetadata, setCollectionMetadata] = useState('');
    const [collectionMetadataURI, setCollectionMetadataURI] = useState('');

    const clusterConn = useContext(ConnectionContext);

    useEffect(() => {
        let metadata = loadCollectionMetadata();
        let metaUri = loadCollectionMetadataURI();
        if (metaUri !== '') {
            setCollectionMetadataURI(metaUri);
            onUriChange(metaUri);
        }
        if (!metadata) {
            metadata = generateCollectionMetadata();
            console.log('new collection metadata generated');
            saveCollectionMetadata();
        } else {
            console.log('got collection metadata from local storage:', metadata);
            updateMetadataFromJSON(metadata);
        }
    }, [])

    useEffect(() => {
        if (collectionName === '') return;
        console.log("secret Key or creator Address changed!");
        updateMetadata({ creatorAddr: creatorAddress });
    }, [creatorAddress]);

    const updateMetadata = ({ collName = undefined, collSymbol = undefined, collDescr = undefined, imgUri = undefined, imgType = undefined, creatorAddr = undefined, extUri = undefined }) => {
        if (!collName) collName = collectionName;
        else setCollectionName(collName);

        if (!collSymbol) collSymbol = symbol;
        else setSymbol(collSymbol);

        if (!collDescr) collDescr = description;
        else setDescription(collDescr);

        if (!imgUri) imgUri = imageUri;
        else setImageUri(imgUri);

        if (!imgType) imgType = imageType;
        else setImageType(imgType);

        if (!creatorAddr) creatorAddr = creatorAddress;

        if (extUri === undefined) extUri = externalUri;
        else setExternalUri(extUri);

        let metadata = generateCollectionMetadata(collName, collSymbol, collDescr, 0, creatorAddr, imgUri, imgType, extUri);
        console.log(metadata);
        setCollectionMetadata(JSON.stringify(metadata, null, 4));
        saveCollectionMetadata(metadata);
        onChange(metadata);
    };
    const updateMetadataFromJSON = (metadata) => {
        // Other way around. populate stuff from JSON
        try {
            if (typeof metadata === 'string' || metadata instanceof String) {
                metadata = JSON.parse(metadata);
            }
            setCollectionName(metadata.name);
            setSymbol(metadata.symbol);
            setDescription(metadata.description);
            setImageUri(metadata.image);
            console.log('EXTERNAL URI', metadata.external_url);
            setExternalUri(metadata.external_url);
            setCollectionMetadata(JSON.stringify(metadata, null, 4));
            onChange(metadata);
            saveCollectionMetadata(metadata);
        } catch (e) { console.log('not valid json'); }
    };

    const handleCollectionNameChange = e => { updateMetadata({ collName: e.target.value }); }
    const handleSymbolChange = e => { updateMetadata({ collSymbol: e.target.value }); }
    const handleDescriptionChange = e => { updateMetadata({ collDescr: e.target.value }); }
    const handleCollectionImageChange = (event) => {
        console.log(event.target.files);
        if (event.target.files && event.target.files.length > 0) {
            setCollectionImage(event.target.files[0]);
            let uri = URL.createObjectURL(event.target.files[0]);
            setImageUri(uri);
            console.log(event.target.files[0]);
        } else {
            setCollectionImage(undefined);
        }
    }
    const handleExternalUriChange = e => updateMetadata({ extUri: e.target.value });
    const handleCollectionMetadataChange = e => {
        //other way around
        //check if valid json
        updateMetadataFromJSON(e.target.value);
    }
    const handleCollectionMetadataURIChange = (event) => setCollectionMetadataURI(event.target.value);

    const onUploadCollectionMetadata = async () => {
        setCollectionMetadataURI('Processing...');
        onUriChange("Uploading...");
        try {
            const metaplex = new Metaplex(clusterConn.connection);
            const keyPair = Keypair.fromSecretKey(bs58.decode(secretKey));
            metaplex.use(keypairIdentity(keyPair));
            metaplex.use(nftStorage());

            return metaplex.nfts().uploadMetadata(JSON.parse(collectionMetadata)).then((res) => {
                console.log(res);
                setCollectionMetadataURI(res.uri);
                saveCollectionMetadataURI(res.uri);
                onUriChange(res.uri);
            })
        } catch (e) {
            console.error(e);
            setCollectionMetadataURI('Failed.');
            onUriChange('Failed.');
        }
    }

    const onLoadCollectionMetadataUri = () => {
        const metaplex = new Metaplex(clusterConn.connection);
        metaplex.use(nftStorage());
        try {
            metaplex.storage().downloadJson(collectionMetadataURI)
                .then(json => {
                    console.log(json);
                    updateMetadataFromJSON(json);
                    saveCollectionMetadataURI(collectionMetadataURI);
                });
        } catch (e) {
            console.log('Failed to download.', e);
        }
    }

    const uploadImage = async () => {
        console.log('upload image...');

        if (collectionImage) {
            console.log(imageUri, collectionImage);
            return toMetaplexFileFromBrowser(collectionImage).then(file => {
                const fileBytes = getBytesFromMetaplexFiles(file);
                //console.log(fileBytes);
                let bytesUploaded = 0;

                const metaplex = new Metaplex(clusterConn.connection);
                const keyPair = Keypair.fromSecretKey(bs58.decode(secretKey));
                metaplex.use(keypairIdentity(keyPair));
                metaplex.use(nftStorage());

                const driver = metaplex.storage().driver();
                driver.onProgress((size) => {
                    bytesUploaded += size;
                    console.log(`Uploaded ${bytesUploaded} bytes out of ${fileBytes} bytes`);
                });

                console.log('starting upload...');

                return metaplex.storage().upload(file).then((uri) => {
                    console.log(`Upload done! ${uri}`);
                    if (imageUri.startsWith("blob:")) URL.revokeObjectURL(imageUri);

                    updateMetadata({ imgUri: uri, imgType: collectionImage.type })
                });
            });
        } else {
            console.log(`Already in storage: ${imageUri}`);
        }
    }

    const onImageUriChange = (e) => { updateMetadata({ imgUri: e.target.value }); };

    const renderTooltip = (props) => (
        <div id='button-tooltip' {...props} ><Image src={imageUri} rounded width={256} height={256} className='px-1' /></div>
    );


    return (
        <>
            <InputGroup className='mb-1'>
                <InputGroup.Text style={{width:'160px'}}>Collection Name</InputGroup.Text>
                <Form.Control aria-label="Collection Name" onChange={handleCollectionNameChange} value={collectionName} />
                <InputGroup.Text>Symbol</InputGroup.Text>
                <Form.Control aria-label="Symbol" onChange={handleSymbolChange} value={symbol} />
            </InputGroup>
            <InputGroup className="mb-1">
                <InputGroup.Text style={{width:'160px'}}>Description</InputGroup.Text>
                <Form.Control aria-label="Description" onChange={handleDescriptionChange} value={description} />
            </InputGroup>
            <InputGroup className="mb-1">
                <InputGroup.Text style={{width:'160px'}}>Collection Image:</InputGroup.Text>
                <Form.Control type="file" onChange={handleCollectionImageChange} accept='image/*' />
                <AdvButton onClick={uploadImage} disabled={secretKey.length < 20 || !collectionImage}>Upload to nft.storage</AdvButton>
                { imageUri && <Image src={imageUri} thumbnail fluid rounded width={46} height={46} className='px-1' />}
                {/* {imageUri && <OverlayTrigger placement="bottom" delay={{ show: 250, hide: 400 }} overlay={renderTooltip}><Image src={imageUri} fluid rounded width={46} height={46} className='px-1' /></OverlayTrigger>} */}
                <InputGroup.Text>Uri</InputGroup.Text>
                <Form.Control onChange={onImageUriChange} value={imageUri} />
            </InputGroup>
            <InputGroup className="mb-1">
                <InputGroup.Text style={{width:'160px'}}>External URL</InputGroup.Text>
                <Form.Control onChange={handleExternalUriChange} value={externalUri} />
            </InputGroup>
            <Accordion>
                <Accordion.Item eventKey="collmetadata">
                    <Accordion.Header>View / Edit Collection Metadata JSON</Accordion.Header>
                    <Accordion.Body>
                        <Form.Control as="textarea" aria-label="Collection Metadata JSON" onChange={handleCollectionMetadataChange} rows={20} value={collectionMetadata.toString()} />
                    </Accordion.Body>
                </Accordion.Item>
            </Accordion>
            <InputGroup className='my-1'>
                <InputGroup.Text>Collection Metadata URI</InputGroup.Text>
                <AdvButton onClick={onUploadCollectionMetadata} disabled={secretKey.length < 20}>Upload to nft.storage</AdvButton>
                <Form.Control aria-label="Collection Metadata URI" onChange={handleCollectionMetadataURIChange} value={collectionMetadataURI} />
                <Button onClick={onLoadCollectionMetadataUri} disabled={collectionMetadataURI.length < 20}>Load</Button>
            </InputGroup>
        </>
    );
};

export default CollectionMetadata;