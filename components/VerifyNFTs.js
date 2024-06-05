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

import React, { useState, useContext } from "react";
import { Form, InputGroup } from "react-bootstrap";
import { keypairIdentity, Metaplex } from "@metaplex-foundation/js";
import { ConnectionContext } from "./ConnectionContextProvider";
import AdvButton from "./AdvButton";
import Account, { PublicKeyField } from "./Account";

const VerifyNFTs = () => {
    const [creatorPosition, setCreatorPosition] = useState(2);
    const [creator, setCreator] = useState(null);
    const [balance, setBalance] = useState(0);
    const clusterConn = useContext(ConnectionContext);

    const verifyNfts = async () => {
        const metaplex = Metaplex.make(clusterConn.connection)
            .use(keypairIdentity(creator));
        // .use(nftStorage());

        console.log("verify nfts... ", creator);

        if (!creator || !creator.publicKey) throw 'Creator not valid!';

        await metaplex.nfts().findAllByCreator({
            creator: creator.publicKey,
            position: 2 // THE POSITION OF THE CREATOR
        }).then(nfts => {
            console.log(nfts)

            var promises = [];

            nfts.forEach(n => {
                n.creators.forEach(c => {
                    if (!c.verified && c.address.toBase58() == creator.publicKey.toBase58()) {
                        console.log(`Creator not verified: ${c.address.toBase58()}`);

                        promises.push(
                            metaplex.nfts().verifyCreator({
                                mintAddress: n.mintAddress, // NOTE: NOT .address!
                                creator: creator
                            })
                                .then(result => console.log(result))
                                .catch(e => console.log('something went wrong', e))
                        );
                    }
                });
            });

            return Promise.all(promises).then(() => {
                console.log('ALL DONE!');
            });

        }).catch(e => console.error('something went wrong', e));


    };

    const handleCreatorChange = c => {
        // console.log(c, c?.PublicKey);
        setCreator(c);
    }

    const handleBalanceChange = b => setBalance(b);

    const handleCreatorPositionChange = e => setCreatorPosition(e.target.value);

    return (
        <>
            <Account onKeyPairChange={handleCreatorChange} onBalanceChange={handleBalanceChange} label='Creator Account' />
            <InputGroup>
                <InputGroup.Text>Find all NFTs with this creator listed at pos</InputGroup.Text>
                <Form.Control onChange={handleCreatorPositionChange} value={creatorPosition} />
                <InputGroup.Text>and</InputGroup.Text>
                <AdvButton onClick={verifyNfts} disabled={!creator || balance < 0.001} variant={balance == 0 ? 'warning' : 'primary'} >Verify all unverified{!creator ? ' (No Creator!)' : balance == 0 && '( Fund account!)'}</AdvButton>
            </InputGroup>
        </>
    );
}

export default VerifyNFTs;