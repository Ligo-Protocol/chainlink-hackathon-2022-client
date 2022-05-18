import React from "react";
import { Button, Col, Container, Nav, Navbar, Row } from "react-bootstrap";
import { useMoralis } from "react-moralis";

function LigoHeader() {
  const { authenticate, isAuthenticated, isAuthenticating, account, logout } =
    useMoralis();

  const [firstActivation, setFirstActivation] = React.useState(false);

  const connect = React.useCallback(async () => {
    try {
      await authenticate({ signingMessage: "Log in using Moralis" });
    } catch (error) {
      console.log(error);
    }
  }, [authenticate]);

  // Connect eagerly
  React.useEffect(() => {
    if (!isAuthenticated && !firstActivation) {
      connect();
      setFirstActivation(true);
    }
  }, [isAuthenticated, connect, firstActivation]);

  const disconnectWallet = async () => {
    await logout();
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
            {isAuthenticated ? (
              <Button
                variant="danger"
                disabled={isAuthenticating}
                onClick={disconnectWallet}
              >
                Disconnect {account?.slice(0, 10)}
              </Button>
            ) : (
              <Button disabled={isAuthenticating} onClick={connect}>
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
