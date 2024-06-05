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
import { keypairIdentity, Metaplex, toBigNumber, sol } from "@metaplex-foundation/js";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { InputGroup, Button, Form, Card, Modal } from "react-bootstrap";
import * as bs58 from 'bs58';
import { nftStorage } from "@metaplex-foundation/js-plugin-nft-storage";
import { loadTemplate, saveCandyMachineAddress, loadCandyMachineAddress, loadCollectionNftAddress, saveCollectionNftAddress } from "../Data";
import CollectionMetadata from "./CollectionMetadata";
import ItemData from "./ItemData";
import VerifyNFTs from "./VerifyNFTs";
import AdvButton from "./AdvButton";
import ToolsCard from "./ToolsCard";


const createCollectionNFT = async (metaplex, projectName, metadataUri) => {
	console.log('creating collection nft...');
	const { nft: collectionNft } = await metaplex.nfts().create({
		name: projectName,
		uri: metadataUri,
		sellerFeeBasisPoints: 0,
		isCollection: true,
	});
	console.log(collectionNft.address, collectionNft);
	return collectionNft;
};


const CandyMachines = ({ secretKey, creatorPKey, accountBalance = 0 }) => {
	const [collectionMetadata, setCollectionMetadata] = useState('');
	const [collectionMetadataURI, setCollectionMetadataURI] = useState('');
	const [collectionNFTAddress, setCollectionNFTAddress] = useState('');
	const [candyMachineAddress, setCandyMachineAddress] = useState('');
	const [localTemplate, setLocalTemplate] = useState();
	const [localEntries, setLocalEntries] = useState([]);
	const [mintPrice, setMintPrice] = useState(1);
	const [candyMachineInfoLabel, setCandyMachineInfoLabel] = useState(['', 0, 0, 0, false]); // Text, loaded, available, minted, fully loaded?
	const [showDeleteModal, setShowDeleteModal] = useState(false);

	const clusterConn = useContext(ConnectionContext);

	useEffect(() => {
		let collAddr = loadCollectionNftAddress();
		if (collAddr) setCollectionNFTAddress(collAddr);

		let addr = loadCandyMachineAddress();
		if (addr) setCandyMachineAddress(addr);
	}, []);

	useEffect(() => {
		if (!localTemplate) return;
		if (candyMachineAddress !== '') updateCandyMachineInfo();
	}, [candyMachineAddress])

	const onCreateCollectionNFTClicked = async () => {
		setCollectionNFTAddress('Processing...');
		try {
			const metaplex = new Metaplex(clusterConn.connection);
			const keyPair = Keypair.fromSecretKey(bs58.decode(secretKey));
			metaplex.use(keypairIdentity(keyPair));
			metaplex.use(nftStorage());

			return createCollectionNFT(metaplex, collectionMetadata.name, collectionMetadataURI)
				.then((collectionNFT) => {
					setCollectionNFTAddress(collectionNFT.address);
					saveCollectionNftAddress(collectionNFT.address);
				});
		} catch (e) {
			console.error(e);
			setCollectionNFTAddress('Failed.');
		}
	};

	const onCreateCandyMachineClicked = async () => {
		setCandyMachineAddress("Processing...");

		const keyPair = Keypair.fromSecretKey(bs58.decode(secretKey));

		const metaplex = Metaplex.make(clusterConn.connection)
			.use(keypairIdentity(keyPair))
			.use(nftStorage());
		const numNFTs = localEntries.length;

		let sellerFee = localTemplate.seller_fee_basis_points;

		console.log(`Creating Candy Machine with ${numNFTs} NFTs...`);

		return metaplex.candyMachines().create({
			itemsAvailable: toBigNumber(numNFTs),
			sellerFeeBasisPoints: sellerFee,
			symbol: localTemplate.symbol,
			collection: {
				address: new PublicKey(collectionNFTAddress),
				updateAuthority: metaplex.identity(), // the current identity set on the metaplex object
			},
			guards: {
				botTax: { lamports: sol(0.01), lastInstruction: false },
				solPayment: { amount: sol(mintPrice), destination: metaplex.identity().publicKey },
			},
		})
		.then(({ candyMachine }) => {
			console.log('DONE!', candyMachine);
			saveCandyMachineAddress(candyMachine.address);
			setCandyMachineAddress(candyMachine.address);
		}).catch((e) => {
			console.log("Failed!", e);
			setCandyMachineAddress('');
			throw e;
		});
	};

	const updateCandyMachineInfo = () => {
		if (!setCandyMachineInfoLabel) {
			setCandyMachineInfoLabel(['Unknown', 0, 0, 0, false]);
			return; //******* */
		}
		const metaplex = new Metaplex(clusterConn.connection);

		let candyMachinePKey = ''
		try {
			candyMachinePKey = new PublicKey(candyMachineAddress);
		} catch (e) {
			console.log('candy machine address not valid!');
			setCandyMachineInfoLabel([`INVALID CANDY MACHINE ADDRESS`, 0, 0, 0, false]);
			return;
		};

		metaplex.candyMachines().findByAddress({
			address: new PublicKey(candyMachineAddress),
		}).then((candyMachine) => {
			console.log(candyMachine);

			try {
				let amount = candyMachine.candyGuard.guards.solPayment.amount.basisPoints.toNumber() / LAMPORTS_PER_SOL;
				//console.log(amount);
				setMintPrice(amount);
			} catch (e) {
				console.log(e);
			}

			if (!candyMachine.isFullyLoaded) {
				setCandyMachineInfoLabel([`${candyMachine.itemsLoaded} of ${candyMachine.itemsAvailable} items loaded!`, candyMachine.itemsLoaded, candyMachine.itemsAvailable.toNumber(), candyMachine.itemsMinted.toNumber(), false]);
			} else {
				setCandyMachineInfoLabel([`Fully Loaded - ${candyMachine.itemsMinted.toNumber()} of ${candyMachine.itemsAvailable.toNumber()} minted!`, candyMachine.itemsLoaded, candyMachine.itemsAvailable.toNumber(), candyMachine.itemsMinted.toNumber(), true]);
			}
		});
	};


	const handleCandyMachineAddressChange = (event) => {
		setCandyMachineAddress(event.target.value);
		saveCandyMachineAddress(event.target.value);
	};
	const handleCollectionNFTAddressChange = (event) => {
		setCollectionNFTAddress(event.target.value);
		saveCollectionNftAddress(event.target.value);
	};
	const handleCollectionMetadataChange = (metadata) => setCollectionMetadata(metadata);
	const handleCollectionMetadataUriChange = (uri) => setCollectionMetadataURI(uri);
	const handleItemDataChange = (entries) => {
		setLocalEntries(entries);
		setLocalTemplate(loadTemplate());
	};
	const handleMintPriceChange = (e) => setMintPrice(e.target.value);

	const getCreatorAddress = () => {
		if (creatorPKey) return creatorPKey;
		else if (secretKey) {
			const keyPair = Keypair.fromSecretKey(bs58.decode(secretKey));
			return keyPair.publicKey.toBase58();
		} else return undefined;
	};

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
	const promiseAllBatchesInBatches = async (task, metaplex, candyMachine, items, batchSize) => {
		let position = 0;
		let results = [];
		while (position < items.length) {
			const itemsForBatch = items.slice(position, position + batchSize);
			results = [...results, await task(metaplex, candyMachine, itemsForBatch, position)];
			position += batchSize;
		}
		return results;
	};

	const insertItemsIntoCandyMachine = async (metaplex, candyMachine, insertItems, insertAt = 0) => {
		console.log('insert items', insertItems);
		return metaplex.candyMachines().insertItems({
			candyMachine: candyMachine,
			index: insertAt,
			items: insertItems
		}).then((res) => {
			updateCandyMachineInfo();
			return res;
		});
	}

	const onInsertItemsIntoCandyMachine = async () => {
		console.log("Load items into candy machine...");

		const keyPair = Keypair.fromSecretKey(bs58.decode(secretKey));
		const metaplex = Metaplex.make(clusterConn.connection)
			.use(keypairIdentity(keyPair))
			.use(nftStorage());

		return metaplex.candyMachines().findByAddress({
			address: new PublicKey(candyMachineAddress),
		}).then((candyMachine) => {
			console.log('candy machine found', candyMachine);
			console.log('localEntries', localEntries);

			let insertItems = [];
			localEntries.forEach((entry, id) => {
				let item = {
					name: entry.metadata.name,
					uri: entry.metadataUri
				};
				//console.log(id, item);
				insertItems.push(item);
			});

			console.log('pushing items to candy machine', insertItems);

			return promiseAllBatchesInBatches(insertItemsIntoCandyMachine, metaplex, candyMachine, insertItems, 7);
		}).then((result) => {
			console.log('ALL DONE', result);
		}).catch(e => console.error('something went wrong', e));
	};

	const areItemsLeftToLoad = () => {
		return candyMachineInfoLabel[1] !== candyMachineInfoLabel[2] && candyMachineInfoLabel[2] > 0;
	}

	const deleteCandyMachine = async () => {
		const keyPair = Keypair.fromSecretKey(bs58.decode(secretKey));
		const metaplex = Metaplex.make(clusterConn.connection)
			.use(keypairIdentity(keyPair))
			.use(nftStorage());

		console.log("delete candy machine...");

		return metaplex.candyMachines().findByAddress({
			address: new PublicKey(candyMachineAddress),
		}).then((candyMachine) => {
			return metaplex.candyMachines().delete({
				candyMachine: candyMachine.address,
				candyGuard: candyMachine.candyGuard.address,
			});
		}).then((result) => {
			console.log("DONE!");
			setCandyMachineAddress(`${candyMachineAddress}-DELETED`);
		}).catch(e => console.error('something went wrong', e));
	}

	const updateGuards = async () => {
		console.log('Update Guards...');

		const keyPair = Keypair.fromSecretKey(bs58.decode(secretKey));
		const metaplex = Metaplex.make(clusterConn.connection)
			.use(keypairIdentity(keyPair))
			.use(nftStorage());

		await metaplex.candyMachines().findByAddress({
			address: new PublicKey(candyMachineAddress),
		}).then((candyMachine) => {
			return metaplex.candyMachines().update({
				candyMachine,
				guards: {
					botTax: { lamports: sol(0.01), lastInstruction: false },
					solPayment: { amount: sol(mintPrice), destination: metaplex.identity().publicKey },
				},
			});
		}).then((result) => {
			console.log("DONE!", result);
		}); //.catch(e => console.error('something went wrong', e));
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

	const canCandyMachineBeDeleted = () => {
		if (candyMachineAddress.length < 20 || secretKey?.length < 20) return false;
		if (candyMachineInfoLabel[3] !== candyMachineInfoLabel[2] && candyMachineInfoLabel[2] > 0) return false;
		return true;
	}

	const handleModalClose = () => setShowDeleteModal(false);
	const handleModalDelete = () => {
		setShowDeleteModal(false);
		deleteCandyMachine();
	};
	const handleShowDeleteModal = () => setShowDeleteModal(true);

	// TODO: Add UI to set up guards - especially SOL price!
	// TODO: Guard: Start Date

	return (
		<>
			<ToolsCard title='' description={<>First we need Metadata for the entire NFT Collection.<br />Once done we&apos;ll upload it to decentralized storage.</>}>
				<Card.Header>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={18} height={18} fill="currentColor" className="me-2 mb-1">
						<path fillRule="evenodd" d="M2.625 6.75a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875 0A.75.75 0 018.25 6h12a.75.75 0 010 1.5h-12a.75.75 0 01-.75-.75zM2.625 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zM7.5 12a.75.75 0 01.75-.75h12a.75.75 0 010 1.5h-12A.75.75 0 017.5 12zm-4.875 5.25a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875 0a.75.75 0 01.75-.75h12a.75.75 0 010 1.5h-12a.75.75 0 01-.75-.75z" clipRule="evenodd" />
					</svg>
					Collection Metadata
					{collectionMetadataURI && <span style={{float:'right'}}>✅</span>}
				</Card.Header>
				<Card.Body>
					<CollectionMetadata onChange={handleCollectionMetadataChange} onUriChange={handleCollectionMetadataUriChange} secretKey={secretKey} creatorAddress={getCreatorAddress()} />
				</Card.Body>
			</ToolsCard>
			
			<ToolsCard title='' description={<>Next we&apos;ll create a Collection NFT with the Metadata we defined above. This NFT will represent the entire Collection and all individual NFTs will refer to it.</>}>
				<Card.Header>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={18} height={18} fill="currentColor" className="me-2 mb-1">
						<path fillRule="evenodd" d="M5.625 1.5H9a3.75 3.75 0 013.75 3.75v1.875c0 1.036.84 1.875 1.875 1.875H16.5a3.75 3.75 0 013.75 3.75v7.875c0 1.035-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 01-1.875-1.875V3.375c0-1.036.84-1.875 1.875-1.875zM12.75 12a.75.75 0 00-1.5 0v2.25H9a.75.75 0 000 1.5h2.25V18a.75.75 0 001.5 0v-2.25H15a.75.75 0 000-1.5h-2.25V12z" clipRule="evenodd" />
						<path d="M14.25 5.25a5.23 5.23 0 00-1.279-3.434 9.768 9.768 0 016.963 6.963A5.23 5.23 0 0016.5 7.5h-1.875a.375.375 0 01-.375-.375V5.25z" />
					</svg>
					Collection NFT
					{collectionNFTAddress != '' && <span style={{float:'right'}}>✅</span>}
				</Card.Header>
				<Card.Body>
					<InputGroup className='mb-1'>
						<InputGroup.Text style={{ width: '160px' }}>Collection NFT</InputGroup.Text>
						<AdvButton onClick={onCreateCollectionNFTClicked} disabled={accountBalance == 0 || collectionMetadataURI.length < 20} variant={accountBalance == 0 ? 'warning' : 'primary'}>Create{accountBalance == 0 && ` (Fund account!)`}</AdvButton>
						<Form.Control aria-label="Collection NFT Address" onChange={handleCollectionNFTAddressChange} value={collectionNFTAddress} />
					</InputGroup>
				</Card.Body>
			</ToolsCard>

			<ItemData onChange={handleItemDataChange} secretKey={secretKey} collectionMetadata={collectionMetadata} creatorAddress={getCreatorAddress()} />
			
			<ToolsCard title='' description={<>Set up a Candy Machine where users can mint your NFTs for a given amount of SOL</>}>
				<Card.Header>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={18} height={18} fill="currentColor" className="me-2 mb-1">
						<path fillRule="evenodd" d="M19.5 21a3 3 0 003-3V9a3 3 0 00-3-3h-5.379a.75.75 0 01-.53-.22L11.47 3.66A2.25 2.25 0 009.879 3H4.5a3 3 0 00-3 3v12a3 3 0 003 3h15zm-6.75-10.5a.75.75 0 00-1.5 0v2.25H9a.75.75 0 000 1.5h2.25v2.25a.75.75 0 001.5 0v-2.25H15a.75.75 0 000-1.5h-2.25V10.5z" clipRule="evenodd" />
					</svg>
					Candy Machine
					{candyMachineAddress !== '' && <span style={{float:'right'}}>✅</span>}
				</Card.Header>
				<Card.Body>
					<InputGroup className="mb-1">
						<InputGroup.Text style={{ width: '210px' }}>Mint Price (SOL)</InputGroup.Text>
						<Form.Control type='number' min={0} aria-label="Mint Price" onChange={handleMintPriceChange} value={mintPrice} />
						{candyMachineAddress !== '' && <AdvButton onClick={updateGuards}>Update</AdvButton>}
					</InputGroup>
					<InputGroup className='mb-1'>
						<InputGroup.Text style={{ width: '210px' }}>Candy Machine Address</InputGroup.Text>
						<AdvButton onClick={onCreateCandyMachineClicked} disabled={accountBalance == 0 || collectionNFTAddress.length < 20} variant={accountBalance == 0 ? 'warning' : 'primary'}>Create{accountBalance == 0 && ` (Fund account!)`}</AdvButton>
						<Form.Control aria-label="Candy Machine Address" onChange={handleCandyMachineAddressChange} value={candyMachineAddress} />
						<Button onClick={updateCandyMachineInfo} disabled={!candyMachineAddress || candyMachineAddress.length < 20}>Log Info</Button>
					</InputGroup>
				</Card.Body>
			</ToolsCard>

			<ToolsCard title='' description={<>Now all that&apos;s left to do now is to fill the Candy Machine with all the links to the Metadata you have uploaded for your NFTs</>}>
				<Card.Header>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={18} height={18} fill="currentColor" className="me-2 mb-1">
						<path fillRule="evenodd" d="M19.5 21a3 3 0 003-3V9a3 3 0 00-3-3h-5.379a.75.75 0 01-.53-.22L11.47 3.66A2.25 2.25 0 009.879 3H4.5a3 3 0 00-3 3v12a3 3 0 003 3h15zm-6.75-10.5a.75.75 0 00-1.5 0v4.19l-1.72-1.72a.75.75 0 00-1.06 1.06l3 3a.75.75 0 001.06 0l3-3a.75.75 0 10-1.06-1.06l-1.72 1.72V10.5z" clipRule="evenodd" />
					</svg>
					Fill Candy Machine
					{candyMachineInfoLabel[4] && <span style={{float:'right'}}>✅</span>}
				</Card.Header>
				<Card.Body>
					<InputGroup className='mb-1'>
						<InputGroup.Text>Load uploaded Metadata into Candy Machine</InputGroup.Text>
						<Form.Control style={{ textAlign: 'right' }} disabled value={candyMachineInfoLabel[0]} />
						<AdvButton onClick={onInsertItemsIntoCandyMachine} disabled={accountBalance == 0 || !candyMachineAddress || candyMachineAddress.length < 20 || !areItemsLeftToLoad()}>{(!candyMachineAddress || candyMachineAddress.length < 20) ? "Can't load - add or create a Candy Machine" : (!candyMachineInfoLabel[4] ? 'Load Items' : 'Fully Loaded ✅')}</AdvButton>
					</InputGroup>
				</Card.Body>
			</ToolsCard>

			<ToolsCard title='' description={<>Once you&apos;re at this point you can make a website and let users mint your NFTs!</>}>
				<Card.Header>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={18} height={18} fill="currentColor" className="me-2 mb-1">
						<path d="M21.721 12.752a9.711 9.711 0 00-.945-5.003 12.754 12.754 0 01-4.339 2.708 18.991 18.991 0 01-.214 4.772 17.165 17.165 0 005.498-2.477zM14.634 15.55a17.324 17.324 0 00.332-4.647c-.952.227-1.945.347-2.966.347-1.021 0-2.014-.12-2.966-.347a17.515 17.515 0 00.332 4.647 17.385 17.385 0 005.268 0zM9.772 17.119a18.963 18.963 0 004.456 0A17.182 17.182 0 0112 21.724a17.18 17.18 0 01-2.228-4.605zM7.777 15.23a18.87 18.87 0 01-.214-4.774 12.753 12.753 0 01-4.34-2.708 9.711 9.711 0 00-.944 5.004 17.165 17.165 0 005.498 2.477zM21.356 14.752a9.765 9.765 0 01-7.478 6.817 18.64 18.64 0 001.988-4.718 18.627 18.627 0 005.49-2.098zM2.644 14.752c1.682.971 3.53 1.688 5.49 2.099a18.64 18.64 0 001.988 4.718 9.765 9.765 0 01-7.478-6.816zM13.878 2.43a9.755 9.755 0 016.116 3.986 11.267 11.267 0 01-3.746 2.504 18.63 18.63 0 00-2.37-6.49zM12 2.276a17.152 17.152 0 012.805 7.121c-.897.23-1.837.353-2.805.353-.968 0-1.908-.122-2.805-.353A17.151 17.151 0 0112 2.276zM10.122 2.43a18.629 18.629 0 00-2.37 6.49 11.266 11.266 0 01-3.746-2.504 9.754 9.754 0 016.116-3.985z" />
					</svg>
					Minting Website
				</Card.Header>
				<Card.Body>
					At this point everything should be ready to go! - grab <a href="https://github.com/Solana-Studio/Candy-Machine-V3-UI">a template like this one</a> and build a website!
				</Card.Body>
			</ToolsCard>

			<ToolsCard title='' description={<>After users have minted NFTs through your Candy Machine, you have the option to verify your Account as the Creator of those NFTs (Your account signs a transaction and this flips a switch on the NFT metadata).</>}>
				<Card.Header>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={18} height={18} fill="currentColor" className="me-2 mb-1">
						<path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
					</svg>
					Verify Creator
				</Card.Header>
				<Card.Body>
					<VerifyNFTs collectionNFT={collectionNFTAddress} candyMachineAddress={candyMachineAddress} />
				</Card.Body>
			</ToolsCard>

			<ToolsCard title='' description={<>Once your Candy Machine has minted all NFTs you can delete it and thus reclaim storage costs.</>}>
				<Card.Header>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={18} height={18} fill="currentColor" className="me-2 mb-1">
						<path fillRule="evenodd" d="M19.5 21a3 3 0 003-3V9a3 3 0 00-3-3h-5.379a.75.75 0 01-.53-.22L11.47 3.66A2.25 2.25 0 009.879 3H4.5a3 3 0 00-3 3v12a3 3 0 003 3h15zM9 12.75a.75.75 0 000 1.5h6a.75.75 0 000-1.5H9z" clipRule="evenodd" />					</svg>
					Delete Candy Machine
				</Card.Header>
				<Card.Body>
					<InputGroup>
						<InputGroup.Text>Delete Candy Machine</InputGroup.Text>
						<Button onClick={handleShowDeleteModal} disabled={!canCandyMachineBeDeleted()} variant='danger'>{candyMachineAddress?.endsWith('DELETED') === true && '✅ '}Delete</Button>
					</InputGroup>
				</Card.Body>
			</ToolsCard>

			<p style={{ marginBottom: '5rem' }}></p>

			<Modal show={showDeleteModal} onHide={handleModalClose}>
				<Modal.Header closeButton>
					<Modal.Title>Are you sure?</Modal.Title>
				</Modal.Header>
				<Modal.Body>Delete the Candy Machine?</Modal.Body>
				<Modal.Footer>
					<Button variant="danger" onClick={handleModalDelete}>
						DELETE
					</Button>
					<Button variant="secondary" onClick={handleModalClose}>
						CANCEL
					</Button>
				</Modal.Footer>
			</Modal>

		</>
	);
};

export default CandyMachines;