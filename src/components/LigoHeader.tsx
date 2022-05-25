import axios from "axios";
import React from "react";
import {
  Button,
  Col,
  Container,
  Modal,
  Nav,
  Navbar,
  Row,
} from "react-bootstrap";
import { useMoralis } from "react-moralis";

function LigoHeader() {
  const {
    authenticate,
    isAuthenticated,
    isAuthenticating,
    account,
    user,
    logout,
  } = useMoralis();

  const [firstActivation, setFirstActivation] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [encryptedToken, setEncryptedToken] = React.useState<string | null>(
    null
  );
  const [show, setShow] = React.useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

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

  const generateToken = async () => {
    setIsGenerating(true);
    const resp = await axios.get(
      `${process.env.REACT_APP_LIGO_NODE_ENDPOINT}/api/v0/smartcar/users/${
        user!.id
      }/token`
    );
    setEncryptedToken(resp.data.encryptedToken);
    handleShow();
    setIsGenerating(false);
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
            <Nav.Link href="/rentals">Rentals</Nav.Link>
          </Nav>
        </Navbar.Collapse>
        <Navbar.Collapse className="justify-content-end">
          <Navbar.Text>
            {isAuthenticated ? (
              <>
                <Button
                  variant="info"
                  className="text-white mx-2"
                  onClick={generateToken}
                  disabled={isGenerating}
                >
                  Generate Token
                </Button>
                <Button
                  variant="danger"
                  disabled={isAuthenticating}
                  onClick={disconnectWallet}
                >
                  Disconnect {account?.slice(0, 10)}
                </Button>
              </>
            ) : (
              <Button disabled={isAuthenticating} onClick={connect}>
                Connect Wallet
              </Button>
            )}
          </Navbar.Text>
        </Navbar.Collapse>
      </Container>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Encrypted Access Token</Modal.Title>
        </Modal.Header>

        <Modal.Body className="text-wrap text-break">
          <p>{encryptedToken}</p>
        </Modal.Body>
      </Modal>
    </Navbar>
  );
}

export default LigoHeader;
