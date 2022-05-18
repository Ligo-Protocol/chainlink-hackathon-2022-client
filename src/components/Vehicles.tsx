import React, { useState } from "react";
import axios from "axios";
import Smartcar from "@smartcar/auth";
import { Button, Col, Container, Row } from "react-bootstrap";
import { useMoralis } from "react-moralis";

function Vehicles() {
  const { isAuthenticated, user, Moralis } = useMoralis();
  const [vehicles, setVehicles] = useState<string[]>([]);

  async function onComplete(err: any, code: any, status: any) {
    await axios.post(
      `${process.env.REACT_APP_LIGO_NODE_ENDPOINT}/api/v0/smartcar/users/${
        user!.id
      }`,
      { code: code }
    );
  }

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

  React.useEffect(() => {
    async function fetchVehicles() {
      if (!user) {
        return;
      }

      const resp = await axios.get(
        `${process.env.REACT_APP_LIGO_NODE_ENDPOINT}/api/v0/smartcar/users/${
          user!.id
        }/vehicles`
      );

      setVehicles(resp.data.vehicles);
    }

    fetchVehicles();
  }, [Moralis, user]);

  return (
    <Container fluid>
      {isAuthenticated && vehicles.length === 0 ? (
        <>
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
        </>
      ) : (
        <Row className="mt-5 p-5">
          <Col className="text-center">
            <h2>{JSON.stringify(vehicles)}</h2>
          </Col>
        </Row>
      )}
    </Container>
  );
}

export default Vehicles;
