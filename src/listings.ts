import axios from "axios";
import { BigNumber } from "ethers";
import { Web3Storage } from "web3.storage";

import agreementsFactoryAbi from "./contracts-abi/LigoAgreementsFactory.json";
import rentalAgreementAbi from "./contracts-abi/LigoRentalAgreement.json";

export type Vehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  cid?: string;
  meta?: any;
  vehicleOwner?: string;
  vehicleOwnerId?: string;
  baseHourFee?: BigNumber;
  bondRequired?: BigNumber;
};

export enum RentalAgreementStatus {
  PROPOSED,
  APPROVED,
  REJECTED,
  ACTIVE,
  COMPLETED,
}

export const RentalAgreementStatusDisplay = {
  0: "PROPOSED",
  1: "APPROVED",
  2: "REJECTED",
  3: "ACTIVE",
  4: "COMPLETED",
};

type Listing = {
  vehicleId: string;
  vehicleOwner: string;
  cid: string;
  baseHourFee: BigNumber;
  bondRequired: BigNumber;
};

export type Rental = {
  contractAddress: string;
  vehicleOwner: string;
  renter: string;
  startDateTime: Date;
  endDateTime: Date;
  totalRentCost: BigNumber;
  totalBond: BigNumber;
  agreementStatus: RentalAgreementStatus;
};

export interface ListingManager {
  createListing(
    vehicle: Vehicle,
    baseHourFee: BigNumber,
    bondRequired: BigNumber
  ): Promise<void>;
  getListing(vehicleId: string): Promise<Listing | null>;
  getListings(): Promise<Vehicle[]>;
  getRentals(isOwner: boolean, user: string): Promise<Rental[]>;
  requestNewRental(
    vehicle: Vehicle,
    renter: string,
    startDate: Date,
    endDate: Date
  ): Promise<void>;
  approveRental(rental: Rental): Promise<void>;
  rejectRental(rental: Rental): Promise<void>;
  activateRental(rental: Rental): Promise<void>;
}

export class SmartContractListingManager implements ListingManager {
  web3Storage = new Web3Storage({
    token: process.env.REACT_APP_WEB3STORAGE_TOKEN!,
  });
  moralis: any;
  userAddress: string;
  factoryAddress: string;

  constructor(userAddress: string, moralis: any) {
    this.userAddress = userAddress;
    this.moralis = moralis;
    this.factoryAddress =
      process.env.REACT_APP_LIGO_AGREEMENTS_FACTORY_ADDRESS!;
  }

  async createListing(
    vehicle: Vehicle,
    baseHourFee: BigNumber,
    bondRequired: BigNumber
  ) {
    // Save to Filecoin
    const cid = await saveListingToFilecoin(this.web3Storage, vehicle);

    // Create listing on factory
    const sendOptions = {
      contractAddress: this.factoryAddress,
      functionName: "newVehicle",
      abi: agreementsFactoryAbi.abi,
      params: {
        _vehicleId: vehicle.id,
        _filecoinCid: cid,
        _vehicleOwner: this.userAddress,
        _baseHourFee: baseHourFee,
        _bondRequired: bondRequired,
      },
    };

    const transaction = await this.moralis.executeFunction(sendOptions);
    await transaction.wait();
  }

  async getListing(vehicleId: string): Promise<Listing | null> {
    const readOptions = {
      contractAddress: this.factoryAddress,
      functionName: "getVehicle",
      abi: agreementsFactoryAbi.abi,
      params: {
        _vehicleId: vehicleId,
      },
    };
    const [_vehicleId, cid, vehicleOwner, baseHourFee, bondRequired] =
      await this.moralis.executeFunction(readOptions);

    return {
      vehicleId: _vehicleId,
      vehicleOwner: vehicleOwner,
      cid: cid,
      baseHourFee: baseHourFee,
      bondRequired: bondRequired,
    };
  }

  async getListings(): Promise<Vehicle[]> {
    const readOptions = {
      contractAddress: this.factoryAddress,
      functionName: "getVehicleIds",
      abi: agreementsFactoryAbi.abi,
    };
    const vehicleIds = await this.moralis.executeFunction(readOptions);

    const vehicles = await Promise.all(
      vehicleIds.map(async (vehicleId: string) => {
        const listing = await this.getListing(vehicleId);
        try {
          const resp = await axios.get(
            `https://${listing!.cid}.ipfs.dweb.link`
          );
          let vehicle = { ...(resp.data as Vehicle), ...listing };
          return vehicle;
        } catch (err) {
          console.error(err);
          return null;
        }
      })
    );

    return vehicles.filter((v) => v != null);
  }

  async requestNewRental(
    vehicle: Vehicle,
    renter: string,
    startDate: Date,
    endDate: Date
  ): Promise<void> {
    const sendOptions = {
      contractAddress: this.factoryAddress,
      functionName: "newRentalAgreement",
      abi: agreementsFactoryAbi.abi,
      msgValue: vehicle.bondRequired!.add(vehicle.baseHourFee!),
      params: {
        _vehicleId: vehicle.id,
        _vehicleOwner: vehicle.vehicleOwner,
        _renter: renter,
        _startDateTime: Math.floor(startDate.getTime() / 1000),
        _endDateTime: Math.floor(endDate.getTime() / 1000),
      },
    };

    const transaction = await this.moralis.executeFunction(sendOptions);
    await transaction.wait();
  }

  async getRentals(isOwner: boolean, user: string): Promise<Rental[]> {
    const readOptions = {
      contractAddress: this.factoryAddress,
      functionName: "getRentalContractsByUser",
      abi: agreementsFactoryAbi.abi,
      params: {
        _isOwner: isOwner,
        _address: user,
      },
    };
    const rentalAddrs = await this.moralis.executeFunction(readOptions);

    const rentals = await Promise.all(
      rentalAddrs.map(async (rentalAddr: string) => {
        const readOptions = {
          contractAddress: rentalAddr,
          functionName: "getAgreementDetails",
          abi: rentalAgreementAbi.abi,
          params: {
            _isOwner: isOwner,
            _address: user,
          },
        };
        const [
          vehicleOwner,
          renter,
          startDateTime,
          endDateTime,
          totalRentCost,
          totalBond,
          agreementStatus,
        ] = await this.moralis.executeFunction(readOptions);

        return {
          contractAddress: rentalAddr,
          vehicleOwner,
          renter,
          startDateTime: new Date(startDateTime.toNumber() * 1000),
          endDateTime: new Date(endDateTime.toNumber() * 1000),
          totalRentCost,
          totalBond,
          agreementStatus,
        };
      })
    );

    return rentals;
  }

  async approveRental(rental: Rental): Promise<void> {
    const sendOptions = {
      contractAddress: rental.contractAddress,
      functionName: "approveContract",
      abi: rentalAgreementAbi.abi,
    };

    const transaction = await this.moralis.executeFunction(sendOptions);
    await transaction.wait();
  }

  async rejectRental(rental: Rental): Promise<void> {
    const sendOptions = {
      contractAddress: rental.contractAddress,
      functionName: "rejectContract",
      abi: rentalAgreementAbi.abi,
    };

    const transaction = await this.moralis.executeFunction(sendOptions);
    await transaction.wait();
  }

  async activateRental(rental: Rental): Promise<void> {
    // const encToken = await generateToken()
    const sendOptions = {
      contractAddress: rental.contractAddress,
      functionName: "activateRentalContract",
      abi: rentalAgreementAbi.abi,
    };

    const transaction = await this.moralis.executeFunction(sendOptions);
    await transaction.wait();
  }
}

// export class LocalListingManager implements ListingManager {
//   web3Storage = new Web3Storage({
//     token: process.env.REACT_APP_WEB3STORAGE_TOKEN!,
//   });

//   async createListing(
//     vehicle: Vehicle,
//     baseHourFee: BigNumber,
//     bondRequired: BigNumber
//   ) {
//     // Save to Filecoin
//     const cid = await saveListingToFilecoin(this.web3Storage, vehicle);

//     const listing: Listing = {
//       vehicleId: vehicle.id,
//       vehicleOwner: "0x0",
//       baseHourFee: baseHourFee,
//       bondRequired: bondRequired,
//       cid: cid,
//     };
//     // Save cid to localStorage
//     const listingsRaw = localStorage.getItem("listings");
//     let listings: Record<string, Listing> = listingsRaw
//       ? JSON.parse(listingsRaw)
//       : {};

//     listings = {
//       ...listings,
//       [vehicle.id]: listing,
//     };
//     localStorage.setItem("listings", JSON.stringify(listings));
//   }

//   async getListing(vehicleId: string): Promise<Listing | null> {
//     const listingsRaw = localStorage.getItem("listings");
//     const listings: Record<string, Listing> = listingsRaw
//       ? JSON.parse(listingsRaw)
//       : {};

//     return listings[vehicleId];
//   }

//   async getListings(): Promise<Vehicle[]> {
//     const listingsRaw = localStorage.getItem("listings");
//     const listings: Record<string, Listing> = listingsRaw
//       ? JSON.parse(listingsRaw)
//       : {};

//     const vehicles = await Promise.all(
//       Object.keys(listings).map(async (vehicleId: string) => {
//         const cid = listings[vehicleId].cid;
//         const resp = await axios.get(`https://${cid}.ipfs.dweb.link`);
//         let vehicle = { ...(resp.data as Vehicle), ...listings[vehicleId] };
//         return vehicle;
//       })
//     );

//     return vehicles;
//   }

//   async requestNewRental(
//     vehicle: Vehicle,
//     renter: string,
//     startDate: Date,
//     endDate: Date
//   ): Promise<void> {
//     return;
//   }

//   async getRentals(isOwner: boolean, user: string): Promise<Rental[]> {
//     return [];
//   }
// }

async function saveListingToFilecoin(
  web3Storage: Web3Storage,
  vehicle: Vehicle
): Promise<string> {
  vehicle.meta = null;

  // Save to Filecoin
  const blob = new Blob([JSON.stringify(vehicle)], {
    type: "application/json",
  });

  const files = [new File([blob], "listing.json")];
  const cid = await web3Storage.put(files, { wrapWithDirectory: false });
  return cid;
}

async function generateToken(userId: string) {
  const resp = await axios.get(
    `${process.env.REACT_APP_LIGO_NODE_ENDPOINT}/api/v0/smartcar/users/${userId}/token`
  );
  return resp.data.encryptedToken;
}
