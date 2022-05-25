import { ethers } from "ethers";
import React, { useMemo, useState } from "react";
import { Button, Col, Container, ListGroup, Row, Tab } from "react-bootstrap";
import { useMoralis } from "react-moralis";
import { SmartContractListingManager, Vehicle } from "../listings";

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

  const [isLoading, setIsLoading] = useState(false);

  async function requestRental() {
    setIsLoading(true);
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 1);
    await listingManager?.requestNewRental(
      vehicle.id,
      vehicle.vehicleOwner!,
      account!,
      startDate,
      endDate
    );
    await fetchVehicles();
    setIsLoading(false);
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
        {vehicle.vehicleOwner ? (
          <p className="fw-bold">{`Vehicle Owner: ${vehicle.vehicleOwner}`}</p>
        ) : null}
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
        <br />
        <Button
          className="my-2"
          variant="primary"
          onClick={requestRental}
          disabled={isLoading}
        >
          Request Rental
        </Button>
      </Tab.Pane>
    </>
  );
}

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
    </Container>
  );
}

export default Browse;
