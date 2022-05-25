import React, { useMemo, useState } from "react";
import axios from "axios";
import Smartcar from "@smartcar/auth";
import {
  Button,
  Col,
  Container,
  Form,
  ListGroup,
  Modal,
  Row,
  Tab,
} from "react-bootstrap";
import { useMoralis } from "react-moralis";
import { SmartContractListingManager, Vehicle } from "../listings";
import { BigNumber, ethers } from "ethers";

function VehicleComponent({
  vehicle,
  fetchVehicles,
}: {
  vehicle: Vehicle;
  fetchVehicles: () => Promise<void>;
}) {
  const { account, Moralis } = useMoralis();
  const listingManager = account
    ? new SmartContractListingManager(account, Moralis)
    : null;

  const [isUploading, setIsUploading] = useState(false);
  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const [bondRequired, setBondRequired] = useState<BigNumber | null>(null);
  const [hourFee, setHourFee] = useState<BigNumber | null>(null);

  async function createListing() {
    if (!bondRequired || !hourFee) return;

    setIsUploading(true);
    await listingManager?.createListing(vehicle, bondRequired, hourFee);
    await fetchVehicles();
    setIsUploading(false);
    handleClose();
  }

  return (
    <>
      <Tab.Pane key={vehicle.id} eventKey={`#${vehicle.id}`}>
        <h2>
          {vehicle.year} {vehicle.make} {vehicle.model}
        </h2>
        <p>Make: {vehicle.make}</p>
        <p>Model: {vehicle.model}</p>
        <p>Year: {vehicle.year}</p>
        <p>ID: {vehicle.id}</p>
        <p>VIN: {vehicle.vin}</p>
        {vehicle.baseHourFee ? (
          <p className="fw-bold">{`Base Hour Fee: ${ethers.utils.formatEther(
            vehicle.baseHourFee
          )} ETH`}</p>
        ) : null}
        {vehicle.bondRequired ? (
          <p className="fw-bold">{`Bond Required: ${ethers.utils.formatEther(
            vehicle.bondRequired
          )} ETH`}</p>
        ) : null}
        {vehicle.cid ? (
          <Button
            href={`https://${vehicle.cid}.ipfs.dweb.link`}
            variant="secondary"
            target="__blank"
          >
            View Raw Listing
          </Button>
        ) : (
          <Button onClick={handleShow}>Create Vehicle Listing</Button>
        )}
      </Tab.Pane>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Create Listing</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form>
            <Form.Group className="mb-3" controlId="formHourFee">
              <Form.Label>Base Hour Fee</Form.Label>
              <Form.Control
                type="text"
                placeholder="Base Hour Fee (ETH)"
                onChange={(event) => {
                  setHourFee(ethers.utils.parseEther(event.target.value));
                }}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formBond">
              <Form.Label>Bond Required</Form.Label>
              <Form.Control
                type="text"
                placeholder="Bond Required (ETH)"
                onChange={(event) => {
                  setBondRequired(ethers.utils.parseEther(event.target.value));
                }}
              />
            </Form.Group>
            <Button
              variant="primary"
              disabled={isUploading || !bondRequired || !hourFee}
              onClick={createListing}
            >
              Submit
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
}

function Vehicles() {
  const { isAuthenticated, user, account, Moralis } = useMoralis();
  const listingManager = useMemo(() => {
    return account ? new SmartContractListingManager(account, Moralis) : null;
  }, [account, Moralis]);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  async function onComplete(err: any, code: any, status: any) {
    await axios.post(
      `${process.env.REACT_APP_LIGO_NODE_ENDPOINT}/api/v0/smartcar/users/${
        user!.id
      }`,
      { code: code }
    );
    await fetchVehicles();
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

    const vehicles: Vehicle[] = await Promise.all(
      resp.data.vehicles.map(async (v: Vehicle) => {
        const listing = await listingManager?.getListing(v.id);
        if (listing) {
          v.cid = listing.cid;
          v.bondRequired = listing.bondRequired;
          v.baseHourFee = listing.baseHourFee;
        }
        return v;
      })
    );

    setVehicles(vehicles);
  }, [user, listingManager]);

  React.useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

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
                <Tab.Content>
                  {vehicles.map((vehicle: Vehicle) => (
                    <VehicleComponent
                      key={vehicle.id}
                      vehicle={vehicle}
                      fetchVehicles={fetchVehicles}
                    />
                  ))}
                </Tab.Content>
              </Col>
            </Row>
          </Tab.Container>
        )
      ) : null}
    </Container>
  );
}

export default Vehicles;
