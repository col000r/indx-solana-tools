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

import React, { useState } from "react";
import { Button, Spinner } from "react-bootstrap";

const AdvButton = ({onClick, disabled, variant, children, className, style}) => {
    const [showSpinner, setShowSpinner] = useState(false);
    const [showResult, setShowResult] = useState([false, '']);

    const hideResult = () => {
        setShowResult([false, '']);
    };

    const buttonClick = (args) => {
        setShowSpinner(true);

        onClick(args)
        .then(() => {
            console.log('DONE');
            setShowSpinner(false);
            setShowResult([true, '✅']);
            setTimeout(hideResult, 5000);
        })
        .catch(e => {
            console.log('something went wrong!', e);
            setShowSpinner(false);
            setShowResult([true, '❎']);
            setTimeout(hideResult, 5000);
        });
    };

    return (
        <Button className={className} onClick={buttonClick} disabled={disabled} variant={variant} style={style}>
            {showResult[0] && <span>{showResult[1]} </span>}
            {showSpinner && (<><Spinner size="sm" animation="border" role='status'><span className="visually-hidden">Loading...</span></Spinner>{' '}</>)}
            {children}
        </Button>
    );
};

export default AdvButton;