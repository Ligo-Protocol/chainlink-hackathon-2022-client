import { ethers } from "ethers";
import React, { useMemo, useState } from "react";
import { Button, Col, Container, ListGroup, Row, Tab } from "react-bootstrap";
import { useMoralis } from "react-moralis";
import { SmartContractListingManager, Vehicle } from "../listings";

function Browse() {
  const { user, account, Moralis } = useMoralis();
  const listingManager = useMemo(() => {
    return account ? new SmartContractListingManager(account, Moralis) : null;
  }, [account, Moralis]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const fetchVehicles = React.useCallback(async () => {
    if (!user || !listingManager) {
      return;
    }

    const vehicles: Vehicle[] = await listingManager!.getListings();

    setVehicles(vehicles);
  }, [user, listingManager]);

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
      ) : null}
    </Tab.Pane>
  );

  return (
    <Container fluid>
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
    </Container>
  );
}

export default Browse;
