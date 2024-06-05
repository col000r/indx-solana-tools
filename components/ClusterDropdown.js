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

import React, { useContext, useState } from "react";
import { InputGroup, Dropdown, DropdownButton } from "react-bootstrap";
import { ConnectionContext } from "./ConnectionContextProvider";

const ClusterDropdown = ({label = "Cluster", onChange, className}) => {
    const [cluster, setCluster] = useState('devnet');
    const clusterConn = useContext(ConnectionContext);

    const setClusterAndUpdate = (name) => {
        setCluster(name);
        clusterConn.onChange( name );
    };

    return (
        <>
            <InputGroup className={className} style={{ width: 'fit-content' }}>
                <InputGroup.Text>{label}</InputGroup.Text>
                <DropdownButton id="dropdown-basic-button" title={clusterConn.cluster} variant='primary'>
                    <Dropdown.Item onClick={() => setClusterAndUpdate('devnet')}>devnet</Dropdown.Item>
                    <Dropdown.Item onClick={() => setClusterAndUpdate('testnet')}>testnet</Dropdown.Item>
                    <Dropdown.Item onClick={() => setClusterAndUpdate('mainnet-beta')}>mainnet-beta</Dropdown.Item>
                </DropdownButton>
            </InputGroup>
        </>
    );
};

export default ClusterDropdown;