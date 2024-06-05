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

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Container, Stack, Navbar, Nav } from "react-bootstrap";
import ClusterDropdown from "./ClusterDropdown";

const nav = [
    { name: 'Tools', href: '/', current: false },
    { name: 'Keygen', href: '/keygen', current: false },
    { name: 'Tokens', href: '/tokens', current: false },
    { name: 'NFTs', href: '/nfts', current: false },
];

const classNames = (...classes) => {
    return classes.filter(Boolean).join(' ')
};

const TopNavBar = ({ currentPage = 0 }) => {
    const [navigation, setNavigation] = useState(nav);

    useEffect(() => {
        let n = structuredClone(navigation);
        n[currentPage].current = true;
        setNavigation(n);
    }, [nav]);

    return (
        <>
        	<style jsx global>{`
            body {
                background: #e5e5e5;
            }
            `}</style>
            <span className='position-absolute trigger'>{ /* <!-- hidden trigger to apply 'stuck' styles --> */}</span>
            <Navbar className="tools-navbar py-2" variant='dark' sticky="top" expand="md">
                <Container>
                    <Navbar.Brand>
                        <Link href='/'><Nav className="navbar-title">INDX</Nav></Link>
                    </Navbar.Brand>
                    <Navbar>
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                passHref><Nav
                                    className={classNames(
                                        item.current
                                            ? 'selected'
                                            : '',
                                        'px-3 py-2 mx-2 navbar-item'
                                    )}
                                    aria-current={item.current ? 'page' : undefined}
                                >
                                    {item.name}
                                </Nav>
                            </Link>
                        ))}
                    </Navbar>
                </Container>
            </Navbar>
            <span className="me-1">
                <Container fluid className="tools-sub-bar pt-4 pb-3">
                    <Container>
                        <Stack direction="horizontal">
                            <div><h2>{navigation.find(n => n.current)?.name}</h2></div>
                            <div className='ms-auto'><ClusterDropdown label='Cluster' /></div>
                        </Stack>
                    </Container>
                </Container>
            </span>
        </>
    );
}

export default TopNavBar;