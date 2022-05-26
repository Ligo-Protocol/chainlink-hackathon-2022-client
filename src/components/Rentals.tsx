import { ethers } from "ethers";
import React, { useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Container,
  ListGroup,
  Row,
  Tab,
} from "react-bootstrap";
import { useMoralis } from "react-moralis";
import {
  Rental,
  RentalAgreementStatus,
  RentalAgreementStatusDisplay,
  SmartContractListingManager,
} from "../listings";

function RentalComponent({
  rental,
  fetchRentals,
}: {
  rental: Rental;
  fetchRentals: () => Promise<void>;
}) {
  const { account, Moralis } = useMoralis();
  const listingManager = account
    ? new SmartContractListingManager(account, Moralis)
    : null;

  const [isLoading, setIsLoading] = useState(false);
  const isHost = rental.vehicleOwner.toLowerCase() === account!.toLowerCase();

  async function approveRental() {
    setIsLoading(true);
    await listingManager?.approveRental(rental);
    await fetchRentals();
    setIsLoading(false);
  }

  async function rejectRental() {
    setIsLoading(true);
    await listingManager?.rejectRental(rental);
    await fetchRentals();
    setIsLoading(false);
  }

  async function activateRental() {
    setIsLoading(true);
    await listingManager?.activateRental(rental);
    await fetchRentals();
    setIsLoading(false);
  }

  async function endRental() {
    setIsLoading(true);
    await listingManager?.endRental(rental);
    await fetchRentals();
    setIsLoading(false);
  }

  return (
    <>
      <Tab.Pane
        key={rental.contractAddress}
        eventKey={`#${rental.contractAddress}`}
      >
        <h2>
          {rental.vehicle.year} {rental.vehicle.make} {rental.vehicle.model}
        </h2>
        <p>Make: {rental.vehicle.make}</p>
        <p>Model: {rental.vehicle.model}</p>
        <p>Year: {rental.vehicle.year}</p>
        <p>ID: {rental.vehicle.id}</p>
        <p>VIN: {rental.vehicle.vin}</p>
        <h3>{rental.contractAddress}</h3>
        <p>Vehicle Owner: {rental.vehicleOwner}</p>
        <p>Start Date: {rental.startDateTime.toISOString()}</p>
        <p>End Date: {rental.endDateTime.toISOString()}</p>
        <p>Renter: {rental.renter}</p>
        <p>{`Total Rent Cost: ${ethers.utils.formatEther(
          rental.totalRentCost
        )} ETH`}</p>
        <p>{`Total Bond: ${ethers.utils.formatEther(rental.totalBond)} ETH`}</p>
        <p className="fw-bold">
          Agreement Status:{" "}
          {RentalAgreementStatusDisplay[rental.agreementStatus]}
        </p>
        {rental.agreementStatus === RentalAgreementStatus.ACTIVE ||
        rental.agreementStatus === RentalAgreementStatus.COMPLETED ? (
          <Card className="mb-3">
            <Card.Header>Oracle Data</Card.Header>
            <Card.Body>
              {rental.startOdometer?.gt(0) ? (
                <p>Start Odometer: {rental.startOdometer.toString()}</p>
              ) : null}
              {!rental.startVehicleLatitude?.eq(0) &&
              !rental.startVehicleLongitude?.eq(0) ? (
                <p>
                  Start Vehicle Coordinates:{" "}
                  {rental.startVehicleLatitude!.toNumber() / 100000},{" "}
                  {rental.startVehicleLongitude!.toNumber() / 100000}
                </p>
              ) : null}
              {rental.endOdometer?.gt(0) ? (
                <p>End Odometer: {rental.endOdometer.toString()}</p>
              ) : null}
              {!rental.endVehicleLatitude?.eq(0) &&
              !rental.endVehicleLongitude?.eq(0) ? (
                <p>
                  End Vehicle Coordinates:{" "}
                  {rental.endVehicleLatitude!.toNumber() / 100000},{" "}
                  {rental.endVehicleLongitude!.toNumber() / 100000}
                </p>
              ) : null}
            </Card.Body>
          </Card>
        ) : null}

        {rental.agreementStatus === RentalAgreementStatus.COMPLETED ? (
          <Card className="mb-3">
            <Card.Header>Payment Details</Card.Header>
            <Card.Body>
              <p>
                Total Location Penalty:{" "}
                {ethers.utils.formatEther(rental.totalLocationPenalty)} ETH
              </p>
              <p>
                Total Odometer Penalty:{" "}
                {ethers.utils.formatEther(rental.totalOdometerPenalty)} ETH
              </p>
              <p>
                Total Platform Fee:{" "}
                {ethers.utils.formatEther(rental.totalPlatformFee)} ETH
              </p>
              <p>
                Total Time Penalty:{" "}
                {ethers.utils.formatEther(rental.totalTimePenalty)} ETH
              </p>
              <p>
                Total Rent Payable:{" "}
                {ethers.utils.formatEther(rental.totalRentPayable)} ETH
              </p>
              <p>
                Total Bond Returned:{" "}
                {ethers.utils.formatEther(rental.totalBondReturned)} ETH
              </p>
            </Card.Body>
          </Card>
        ) : null}

        {rental.agreementStatus === RentalAgreementStatus.PROPOSED && isHost ? (
          <>
            <Button
              variant="primary"
              onClick={approveRental}
              disabled={isLoading}
            >
              Accept Booking
            </Button>
            <Button
              variant="primary"
              className="mx-3"
              onClick={rejectRental}
              disabled={isLoading}
            >
              Reject Booking
            </Button>
          </>
        ) : null}
        {rental.agreementStatus === RentalAgreementStatus.APPROVED &&
        !isHost ? (
          rental.startDateTime > new Date() ? (
            <p>Waiting for rental to start...</p>
          ) : (
            <Button
              variant="primary"
              onClick={activateRental}
              disabled={isLoading}
            >
              Activate Rental
            </Button>
          )
        ) : null}

        {rental.agreementStatus === RentalAgreementStatus.ACTIVE && !isHost ? (
          <>
            <Button variant="danger" onClick={endRental} disabled={isLoading}>
              End Rental
            </Button>
          </>
        ) : null}
      </Tab.Pane>
    </>
  );
}

function Rentals() {
  const { user, account, Moralis } = useMoralis();
  const listingManager = useMemo(() => {
    return account ? new SmartContractListingManager(account, Moralis) : null;
  }, [account, Moralis]);
  const [guestRentals, setGuestRentals] = useState<Rental[]>([]);
  const [hostRentals, setHostRentals] = useState<Rental[]>([]);

  const rentals = guestRentals.concat(hostRentals);

  const fetchRentals = React.useCallback(async () => {
    if (!user || !listingManager || !account) {
      return;
    }

    const _guestRentals: Rental[] = await listingManager!.getRentals(
      false,
      account
    );
    const _hostRentals: Rental[] = await listingManager!.getRentals(
      true,
      account
    );

    setGuestRentals(_guestRentals);
    setHostRentals(_hostRentals);
  }, [user, listingManager, account]);

  React.useEffect(() => {
    fetchRentals();
  }, [fetchRentals]);

  return (
    <Container fluid>
      <Tab.Container>
        <Row className="mt-5">
          <Col sm={5}>
            <ListGroup>
              {rentals.map((rental: Rental) => (
                <ListGroup.Item
                  key={rental.contractAddress}
                  href={`#${rental.contractAddress}`}
                >
                  {rental.contractAddress}
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Col>
          <Col sm={7} className="p-2">
            <Tab.Content>
              {rentals.map((rental: Rental) => (
                <RentalComponent
                  key={rental.contractAddress}
                  rental={rental}
                  fetchRentals={fetchRentals}
                />
              ))}
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>
    </Container>
  );
}

export default Rentals;
