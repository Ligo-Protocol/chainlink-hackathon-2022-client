import { useWeb3React } from "@web3-react/core";
import React from "react";
import { Button, Col, Container, Nav, Navbar, Row } from "react-bootstrap";
import { InjectedConnector } from "@web3-react/injected-connector";

const injected = new InjectedConnector({
  supportedChainIds: [42],
});

function LigoHeader() {
  const { active, activate, deactivate, account } = useWeb3React();

  const [firstActivation, setFirstActivation] = React.useState(false);
  const [activating, setActivating] = React.useState(false);

  const connectInjected = React.useCallback(async () => {
    setActivating(true);
    try {
      await activate(injected);
    } catch (error) {
      console.log(error);
    }
    setActivating(false);
  }, [activate]);

  // Connect eagerly
  React.useEffect(() => {
    if (!active && !firstActivation) {
      connectInjected();
      setFirstActivation(true);
    }
  }, [active, connectInjected, firstActivation]);

  const disconnectWallet = async () => {
    await deactivate();
  };

  return (
    <Navbar bg="light" expand="lg">
      <Container>
        <Navbar.Brand href="/">Ligo Demo</Navbar.Brand>
        <Navbar.Toggle />
        <Navbar.Collapse>
          <Nav>
            <Nav.Link href="/">My Vehicles</Nav.Link>
            <Nav.Link href="/browse">Browse</Nav.Link>
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
