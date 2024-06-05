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

import { createContext, useEffect, useState } from "react";
import { Connection, clusterApiUrl } from "@solana/web3.js";

let cluster = 'devnet';
let connection = new Connection(clusterApiUrl(cluster));

export const ConnectionContext = createContext({ cluster: cluster, connection: connection, onChange: {} });

const ConnectionContextProvider = (props) => {
    const [clusterName, setClusterName] = useState(cluster);

    useEffect(() => {
        const cluster = localStorage.getItem('cluster');
        if(cluster) onClusterChange(cluster);
    })

    const onClusterChange = (c) => {
        console.log(`onClusterChange: ${c}`);
        cluster = c;
        setClusterName(cluster);

        // Get the actual URL of the cluster
        let actualCluster = cluster;
        console.log(process.env.PRIVATE_MAINNET_RPC);
        if(actualCluster == 'mainnet-beta') actualCluster = process.env.PRIVATE_MAINNET_RPC || clusterApiUrl(actualCluster);
        else actualCluster = clusterApiUrl(actualCluster); // for devnet and testnet just get the default ones
        
        connection = new Connection(actualCluster, 'confirmed');
        localStorage.setItem('cluster', cluster);
    };

    return (
        <ConnectionContext.Provider value={{ cluster: clusterName, connection: connection, onChange: onClusterChange }}>
            {props.children}
        </ConnectionContext.Provider>
    );
};

export default ConnectionContextProvider;