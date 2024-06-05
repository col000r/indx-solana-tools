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

import React, { useEffect, useState } from "react";
import { Accordion, Button, Form, InputGroup } from "react-bootstrap";

const Trait = ({ name, templateValue, onChange }) => {

    const handleNameChange = e => onChange(e.target.value, templateValue);
    const handleTemplateValueChange = e => onChange(name, e.target.value);
    const getThisRemoved = e => onChange(undefined, undefined);

    return (
        <InputGroup className="mb-1">
            <InputGroup.Text>Name</InputGroup.Text>
            <Form.Control onChange={handleNameChange} value={name} />
            <InputGroup.Text>Template Value</InputGroup.Text>
            <Form.Control onChange={handleTemplateValueChange} value={templateValue} />
            <Button onClick={getThisRemoved} variant="danger">Remove</Button>
        </InputGroup>
    );
}

const TraitsConfig = ({traits = [], onChange = () => {}}) => {
    const [localTraits, setLocalTraits] = useState([]);

    useEffect(() => {
        setLocalTraits(traits);
    });

    const handleTraitChange = (id, name, templateValue) => {
        console.log(`${id}: ${name} ${templateValue}`);
        let ts = structuredClone(localTraits);
        if (name == undefined && templateValue == undefined) {
            ts.splice(id, 1);
        } else {
            ts[id].name = name;
            ts[id].templateValue = templateValue;
        }
        setLocalTraits(ts);
        onChange(ts);
    }

    const addTrait = () => {
        let ts = structuredClone(localTraits);
        ts.push({ name: 'NAME', templateValue: '$VALUE$' });
        console.log(ts);
        setLocalTraits(ts);
        onChange(ts);
    }

    return (
        <Accordion className="my-1">
            <Accordion.Item>
                <Accordion.Header>Traits</Accordion.Header>
                <Accordion.Body>
                    {Array.isArray(localTraits) == true && localTraits.map((t, id) => (
                        <Trait key={`trait${id}`} name={t.name} templateValue={t.templateValue} onChange={(name, templateValue) => handleTraitChange(id, name, templateValue)} />
                    ))}
                    <Button onClick={addTrait}>Add Trait</Button>
                </Accordion.Body>
            </Accordion.Item>
        </Accordion>
    );
};

export default TraitsConfig;