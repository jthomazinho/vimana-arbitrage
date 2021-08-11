import React, { useState, useEffect } from 'react';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Table from 'react-bootstrap/Table';

import { AlgoInstance, AlgoDetails } from '../../../server/lib/algos';

const endpoint = '/api/algos/btc-usd-arbitrage';

const working = <Badge variant="warning" pill>Working</Badge>
const done = <Badge variant="success" pill>Ok ✓</Badge>

const renderAlgoDetails = (item: AlgoDetails) => {
  const attrs = Object.keys(item.output);
  return (
    <>
    <p>Instance: <b>{item.instance.id}</b></p>
    <Table striped hover size="sm">
      <thead>
        <tr>
          <th className="w-50">Key</th>
          <th className="w-50">Value</th>
        </tr>
      </thead>
      <tbody>
        {
          attrs.map((attr) => (
            <tr key={attr}>
              <td>{attr}</td>
              <td>{item.output[attr]}</td>
            </tr>
          ))
        }
      </tbody>
    </Table>
    </>
  )
}

export default function BtcUsdArbitrage() {
  const [list, setList] = useState<Array<AlgoInstance>>([]);
  const [selected, setSelected] = useState<AlgoInstance | undefined>(undefined);
  const [detailed, setDetailed] = useState<AlgoDetails | undefined>(undefined);
  const [input, setInput] = useState<{ [k: string]: string | undefined }>({});
  const [errAlert, setErrAlert] = useState<{show: boolean; msg?: string}>({ show: false });

  const fetchAlgoInstances = () => {
    const params = new URLSearchParams();
    params.append('pageSize', '5');
    fetch(`${endpoint}?${params.toString()}`)
      .then((payload) => payload.json())
      .then((list) => list.rows)
      .then(setList);
  };
  useEffect(fetchAlgoInstances, []);

  const getAlgoById = (id: number): AlgoInstance | undefined => {
    return list.find((algo) => algo.id === id);
  };

  const fetchAlgoDetails = (id: number) => {
    fetch(`${endpoint}/${id}`)
      .then((payload) => payload.json())
      .then((details: AlgoDetails) => {
        setDetailed(details);
        setInput(details.input);
      });
  };

  const onSelectAlgo = (id: number) => {
    setErrAlert({ show: false });

    const item = getAlgoById(id);
    if (!item) {
      return;
    }

    fetchAlgoDetails(item.id);
    setSelected(item);
  };

  const handleCreate = () => {
    fetch(endpoint, { method: 'POST', })
      .then(fetchAlgoInstances);
  };

  const handleGetActive = () => {
    fetch(`${endpoint}/active`)
      .then((payload) => payload.json())
      .then((details: AlgoDetails) => {
        setSelected(details.instance);
        setDetailed(details);
        setInput(details.input);
      })
      .catch(fetchAlgoInstances);
  }

  const handlePause = (id: number) => {
    fetch(`${endpoint}/${id}/toggle-pause`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(fetchAlgoInstances);
  };

  const handleCancel = (id: number) => {
    fetch(`${endpoint}/${id}/finalize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(fetchAlgoInstances);
  };

  const handleUpdate = (evt: React.FormEvent) => {
    evt.preventDefault();
    setErrAlert({ show: false });

    if (!selected) {
      return;
    }

    fetch(`${endpoint}/${selected.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input }),
    })
      .then(async (res) => {
        const payload = await res.json();

        if (res.status === 400) {
          setErrAlert({ show: true, msg: payload.message });
          return;
        }

        setDetailed(payload);
        setInput(payload.input);
      });
  }

  const handleInputChange = (key: string, evt: React.ChangeEvent<HTMLInputElement>) => {
    setInput({ ...input, [key]: evt.target.value })
  }

  return (
    <>
    <style type="text/css">
      {`
      #algos tr.selected {
        background-color: #007bff;
        color: white;
      }
      `}
    </style>

      <Container>
        <Row>
          <Col>
            <h2>Instances</h2>
            <Button onClick={handleCreate} className="mr-1">Create</Button>
            <Button onClick={handleGetActive} className="mr-1" variant="success">Get Active</Button>
            <Table id="algos" striped hover className="my-4" size="sm">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Done?</th>
                  <th></th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {
                  list.map((item) => (
                    <tr onClick={onSelectAlgo.bind({}, item.id)} key={item.id} className={item.id === selected?.id ? 'selected' : ''}>
                      <td>{item.id}</td>
                      <td>{item.active ? working : done}</td>
                      <td>
                        <Button
                          onClick={handlePause.bind({}, item.id)}
                          variant="warning"
                          size="sm"
                          disabled={!item.active}
                        >
                          Pause
                        </Button>
                      </td>
                      <td>
                        <Button
                          onClick={handleCancel.bind({}, item.id)}
                          variant="danger"
                          size="sm"
                          disabled={!item.active}
                        >
                          Cancel
                        </Button>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </Table>
          </Col>
          <Col>
            <h2>Inputs</h2>
            <Alert
              show={errAlert.show}
              variant="danger"
              dismissible
              onClose={() => setErrAlert({ show: false })}
            >
              {errAlert.msg}
            </Alert>
            {
              input && Object.keys(input).length > 0 ?
                <>
                  <Form onSubmit={handleUpdate}>
                    <Form.Group as={Form.Row} controlId="formTotalQuantity">
                      <Form.Label column className="w-50">Total quantity</Form.Label>
                      <Form.Control
                        name="totalQuantity"
                        type="number"
                        step="0.01"
                        min="0.00"
                        value={input.totalQuantity}
                        onChange={handleInputChange.bind({}, 'totalQuantity')}
                        className="w-50"
                      />
                    </Form.Group>
                    <Form.Group as={Form.Row} controlId="formMaxOrderQuantity">
                      <Form.Label column className="w-50">Max order quantity</Form.Label>
                      <Form.Control
                        name="maxOrderQuantity"
                        type="number"
                        step="0.01"
                        min="0.00"
                        value={input.maxOrderQuantity}
                        onChange={handleInputChange.bind({}, 'maxOrderQuantity')}
                        className="w-50"
                      />
                    </Form.Group>
                    <Form.Group as={Form.Row} controlId="formTargetSpread">
                      <Form.Label column className="w-50">Target spread</Form.Label>
                      <Form.Control
                        name="targetSpread"
                        type="number"
                        step="0.01"
                        min="0.00"
                        max="1.00"
                        value={input.targetSpread}
                        onChange={handleInputChange.bind({}, 'targetSpread')}
                        className="w-50"
                      />
                    </Form.Group>
                    <Form.Group as={Form.Row} controlId="formCrowdFactor">
                      <Form.Label column className="w-50">Crowd factor</Form.Label>
                      <Form.Control
                        name="crowdFactor"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={input.crowdFactor}
                        onChange={handleInputChange.bind({}, 'crowdFactor')}
                        className="w-50"
                      />
                    </Form.Group>
                    <Form.Group as={Form.Row} controlId="formManualPegQuote">
                      <Form.Label column className="w-50">Manual PegQuote</Form.Label>
                      <Form.Control
                        name="manualPegQuote"
                        type="number"
                        step="0.01"
                        min="4.50"
                        value={input.manualPegQuote}
                        onChange={handleInputChange.bind({}, 'manualPegQuote')}
                        className="w-50"
                      />
                    </Form.Group>
                    <Form.Group controlId="formSubmit">
                      <Button type="submit">Save</Button>
                    </Form.Group>
                  </Form>
                </>
                : <p>Select a running instance</p>
            }
          </Col>
        </Row>
      </Container>

    <h2>Details</h2>
    {
      detailed
      ? <>{renderAlgoDetails(detailed)}</>
      : <p>Select an instance to see its details</p>
    }
    </>
  );
}
