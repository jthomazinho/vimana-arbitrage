import React from 'react';
import Container from 'react-bootstrap/Container';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';

import Fees from './components/fees';
import BtcUsdArbitrage from './components/btc-usd-arbitrage';

function App() {
  return (
    <Container>
      <Tabs defaultActiveKey="bot" id="navigation" className="pt-3">
        <Tab eventKey="bot" title="BTC-USD">
          <Container className="py-4">
            <BtcUsdArbitrage />
          </Container>
        </Tab>
        <Tab eventKey="fees" title="Fees">
          <Fees />
        </Tab>
      </Tabs>
    </Container>
  );
}

export default App;
