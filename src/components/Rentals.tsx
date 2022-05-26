import { ethers } from "ethers";
import React, { useMemo, useState } from "react";
import { Button, Col, Container, ListGroup, Row, Tab } from "react-bootstrap";
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

  return (
    <>
      <Tab.Pane
        key={rental.contractAddress}
        eventKey={`#${rental.contractAddress}`}
      >
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
              onClick={rejectRental}
              disabled={isLoading}
            >
              Reject Booking
            </Button>
          </>
        ) : null}
        {rental.agreementStatus === RentalAgreementStatus.APPROVED &&
        !isHost ? (
          <Button
            variant="primary"
            onClick={activateRental}
            disabled={isLoading}
          >
            Activate Rental
          </Button>
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
