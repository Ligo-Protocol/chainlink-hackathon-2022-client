import React from "react";
import axios from "axios";
import Smartcar from "@smartcar/auth";
import { Button, Col, Container, Row } from "react-bootstrap";

async function onComplete(err: any, code: any, status: any) {
  console.log(process.env.REACT_APP_LIGO_NODE_ENDPOINT);
  const resp = await axios.post(
    `${process.env.REACT_APP_LIGO_NODE_ENDPOINT}/api/v0/smartcar/authorize`,
    { code: code }
  );
  console.log(resp);
}

function Vehicles() {
  const smartcar = new Smartcar({
    clientId: process.env.REACT_APP_CLIENT_ID,
    redirectUri: process.env.REACT_APP_REDIRECT_URI,
    scope: [
      "required:read_vehicle_info",
      "required:read_odometer",
      "required:read_location",
    ],
    testMode: true,
    onComplete: onComplete,
  });

  return (
    <Container fluid>
      <Row className="mt-5 p-5">
        <Col className="text-center">
          <h2>No Connected Vehicles Found</h2>
        </Col>
      </Row>
      <Row>
        <Col className="text-center">
          <Button
            onClick={() => {
              smartcar.openDialog({ forcePrompt: true });
            }}
          >
            Connect Vehicles
          </Button>
        </Col>
      </Row>
    </Container>
  );
}

export default Vehicles;