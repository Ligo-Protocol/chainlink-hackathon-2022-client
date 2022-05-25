import { ethers } from "ethers";
import React, { useMemo, useState } from "react";
import { Button, Col, Container, ListGroup, Row, Tab } from "react-bootstrap";
import { useMoralis } from "react-moralis";
import { Rental, SmartContractListingManager, Vehicle } from "../listings";

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

  //   async function requestRental() {
  //     setIsLoading(true);
  //     const startDate = new Date();
  //     startDate.setMinutes(startDate.getMinutes() + 10);
  //     const endDate = new Date(startDate);
  //     endDate.setHours(endDate.getHours() + 1);
  //     await listingManager?.requestNewRental(
  //       vehicle,
  //       account!,
  //       startDate,
  //       endDate
  //     );
  //     await fetchVehicles();
  //     setIsLoading(false);
  //   }

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
        <p className="fw-bold">{`Total Rent Cost: ${ethers.utils.formatEther(
          rental.totalRentCost
        )} ETH`}</p>
        <p className="fw-bold">{`Total Bond: ${ethers.utils.formatEther(
          rental.totalBond
        )} ETH`}</p>
        <p>Agreement Status: {rental.agreementStatus}</p>
      </Tab.Pane>
    </>
  );
}

function Rentals() {
  const { user, account, Moralis } = useMoralis();
  const listingManager = useMemo(() => {
    return account ? new SmartContractListingManager(account, Moralis) : null;
  }, [account, Moralis]);
  const [rentals, setRentals] = useState<Rental[]>([]);

  const fetchRentals = React.useCallback(async () => {
    if (!user || !listingManager || !account) {
      return;
    }

    const _rentals: Rental[] = await listingManager!.getRentals(false, account);

    setRentals(_rentals);
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
