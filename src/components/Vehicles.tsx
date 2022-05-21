import React, { useState } from "react";
import axios from "axios";
import Smartcar from "@smartcar/auth";
import { Button, Col, Container, ListGroup, Row, Tab } from "react-bootstrap";
import { useMoralis } from "react-moralis";
import { LocalListingManager, Vehicle } from "../listings";

const listingManager = new LocalListingManager();

function Vehicles() {
  const { isAuthenticated, user } = useMoralis();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  async function onComplete(err: any, code: any, status: any) {
    await axios.post(
      `${process.env.REACT_APP_LIGO_NODE_ENDPOINT}/api/v0/smartcar/users/${
        user!.id
      }`,
      { code: code }
    );
    await fetchVehicles();
  }

  async function createListing(vehicle: Vehicle) {
    setIsUploading(true);
    await listingManager.createListing(vehicle);
    setIsUploading(false);
  }

  const smartcar = new Smartcar({
    clientId: process.env.REACT_APP_CLIENT_ID,
    redirectUri: process.env.REACT_APP_REDIRECT_URI,
    scope: [
      "required:read_vehicle_info",
      "required:read_odometer",
      "required:read_location",
      "required:read_vin",
    ],
    testMode: true,
    onComplete: onComplete,
  });

  const fetchVehicles = React.useCallback(async () => {
    if (!user) {
      return;
    }

    const resp = await axios.get(
      `${process.env.REACT_APP_LIGO_NODE_ENDPOINT}/api/v0/smartcar/users/${
        user!.id
      }/vehicles`
    );

    setVehicles(resp.data.vehicles);
  }, [user]);

  React.useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const vehicleComponent = (vehicle: Vehicle) => (
    <Tab.Pane key={vehicle.id} eventKey={`#${vehicle.id}`}>
      <h2>
        {vehicle.year} {vehicle.make} {vehicle.model}
      </h2>
      <p>Make: {vehicle.make}</p>
      <p>Model: {vehicle.model}</p>
      <p>Year: {vehicle.year}</p>
      <p>ID: {vehicle.id}</p>
      <p>VIN: {vehicle.vin}</p>
      <Button disabled={isUploading} onClick={() => createListing(vehicle)}>
        Create Vehicle Listing
      </Button>
    </Tab.Pane>
  );

  return (
    <Container fluid>
      {isAuthenticated ? (
        vehicles.length === 0 ? (
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
          <Tab.Container>
            <Row className="mt-5">
              <Col sm={5}>
                <ListGroup>
                  {vehicles.map((vehicle) => (
                    <ListGroup.Item key={vehicle.id} href={`#${vehicle.id}`}>
                      {vehicle.id}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Col>
              <Col sm={7} className="p-2">
                <Tab.Content>{vehicles.map(vehicleComponent)}</Tab.Content>
              </Col>
            </Row>
          </Tab.Container>
        )
      ) : null}
    </Container>
  );
}

export default Vehicles;
