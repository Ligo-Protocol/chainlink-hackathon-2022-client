import { useWeb3React } from "@web3-react/core";
import React from "react";
import { Button, Col, Container, Nav, Navbar, Row } from "react-bootstrap";
import { InjectedConnector } from "@web3-react/injected-connector";

const injected = new InjectedConnector({
  supportedChainIds: [42],
});

function LigoHeader() {
  const { active, activate, deactivate, account } = useWeb3React();

  const [activating, setActivating] = React.useState(false);

  async function connectInjected() {
    setActivating(true);
    try {
      await activate(injected);
    } catch (error) {
      console.log(error);
    }
    setActivating(false);
  }

  const disconnectWallet = async () => {
    // await disconnect();
    await deactivate();
  };

  return (
    <Navbar bg="light" expand="lg">
      <Container>
        <Navbar.Brand href="#">Ligo Demo</Navbar.Brand>
        <Navbar.Toggle />
        <Navbar.Collapse>
          <Nav>
            <Nav.Link href="#vehicles">My Vehicles</Nav.Link>
            <Nav.Link href="#browse">Browse</Nav.Link>
          </Nav>
        </Navbar.Collapse>
        <Navbar.Collapse className="justify-content-end">
          <Navbar.Text>
            {active ? (
              <Button
                variant="danger"
                disabled={activating}
                onClick={disconnectWallet}
              >
                Disconnect {account?.slice(0, 10)}
              </Button>
            ) : (
              <Button disabled={activating} onClick={connectInjected}>
                Connect Wallet
              </Button>
            )}
          </Navbar.Text>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default LigoHeader;
