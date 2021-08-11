import React, { useState, useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Table from 'react-bootstrap/Table';

import { Fee } from '../../../server/lib/fee';

const parseFees = (list: Array<{ [key: string]: string }>): Array<Fee> => {
  return list.map((item) => {
    return {
      id: parseInt(item.id, 10),
      serviceProvider: item.serviceProvider,
      service: item.service,
      fixed: parseFloat(item.fixed),
      rate: parseFloat(item.rate),
    };
  });
};

function formatPercent(val: number): string {
  return `${(val * 100).toFixed(3)}%`
}

const defaultInput = { fixed: '', rate: '' };

export default function Fees() {
  const [list, setList] = useState<Array<Fee>>([]);
  const [selected, setSelected] = useState<Fee | undefined>(undefined);
  const [input, setInput] = useState<{ fixed: string, rate: string }>(defaultInput);

  const getFeeById = (id: number): Fee | undefined => {
    return list.find((fee) => fee.id === id);
  }

  const fetchFees = () => {
    fetch('/api/fees')
      .then((payload) => payload.json())
      .then((list) => list.rows)
      .then(parseFees)
      .then(setList);
  };

  useEffect(fetchFees, []);

  const click = (id: number, evt: any) => {
    const item = getFeeById(id);
    if (!item) {
      return;
    }

    setSelected(item);
    setInput({ fixed: item.fixed.toString(), rate: item.rate.toString() });
  }

  const submit = (evt: React.FormEvent) => {
    evt.preventDefault();

    if (!selected) {
      return;
    }

    fetch(`/api/fees/${selected.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    }).then(fetchFees);
  }

  const changeRateInput = (evt: React.ChangeEvent<HTMLInputElement>) => {
    setInput({ ...input, rate: evt.target.value });
  }

  const changeFixedInput = (evt: React.ChangeEvent<HTMLInputElement>) => {
    setInput({ ...input, fixed: evt.target.value });
  }

  return (
    <>
      <style type="text/css">
        {`
        #fees tr.selected {
          font-weight: bold;
        }
      `}
      </style>

      <Container className="my-4">
        <h1>Fees</h1>
        <Table id="fees" striped hover className="my-4">
          <thead>
            <tr>
              <th>Service Provider</th>
              <th>Service</th>
              <th>Fixed</th>
              <th>Rate</th>
            </tr>
          </thead>
          <tbody>
            {
              list.map((item) => (
                <tr onClick={click.bind({}, item.id)} key={item.id} className={item.id === selected?.id ? 'selected' : ''}>
                  <td>{item.serviceProvider}</td>
                  <td>{item.service}</td>
                  <td>{formatPercent(item.fixed)}</td>
                  <td>{formatPercent(item.rate)}</td>
                </tr>
              ))
            }
          </tbody>
        </Table>
        <h2>Edit</h2>
        {
          selected ?
            (<Form onSubmit={submit}>
              <Form.Row className="align-items-end">
                <Col>
                  <Form.Group controlId="formServiceProvider">
                    <Form.Label>Service Provider</Form.Label>
                    <Form.Control plaintext readOnly defaultValue={selected?.serviceProvider} />
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group controlId="formService">
                    <Form.Label>Service</Form.Label>
                    <Form.Control plaintext readOnly defaultValue={selected?.service} />
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group controlId="formFixed">
                    <Form.Label>Fixed</Form.Label>
                    <Form.Control
                      name="fixed"
                      type="number"
                      step="0.0001"
                      min="0.0000"
                      value={input.fixed}
                      onChange={changeFixedInput}
                    />
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group controlId="formRate">
                    <Form.Label>Rate</Form.Label>
                    <Form.Control
                      name="rate"
                      type="number"
                      step="0.0001"
                      min="0.0000"
                      value={input.rate}
                      onChange={changeRateInput}
                    />
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group controlId="formSubmit">
                    <Button type="submit" disabled={!selected}>Save</Button>
                  </Form.Group>
                </Col>
              </Form.Row>
            </Form>)
            : <p>Select a row to edit its fees.</p>
        }
      </Container>
    </>
  );
}
