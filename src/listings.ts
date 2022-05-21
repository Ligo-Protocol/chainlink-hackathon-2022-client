import axios from "axios";
import { BigNumber } from "ethers";
import { Web3Storage } from "web3.storage";

export type Vehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  cid?: string;
  meta?: any;
  baseHourFee?: BigNumber;
  bondRequired?: BigNumber;
};

type Listing = {
  cid: string;
  baseHourFee: BigNumber;
  bondRequired: BigNumber;
};

export interface ListingManager {
  createListing(
    vehicle: Vehicle,
    baseHourFee: BigNumber,
    bondRequired: BigNumber
  ): Promise<void>;
  getListing(vehicleId: string): Promise<Listing | null>;
  getListings(): Promise<Vehicle[]>;
}

export class LocalListingManager implements ListingManager {
  web3Storage = new Web3Storage({
    token: process.env.REACT_APP_WEB3STORAGE_TOKEN!,
  });

  async createListing(
    vehicle: Vehicle,
    baseHourFee: BigNumber,
    bondRequired: BigNumber
  ) {
    // Save to Filecoin
    const cid = await saveListingToFilecoin(this.web3Storage, vehicle);

    const listing: Listing = {
      baseHourFee: baseHourFee,
      bondRequired: bondRequired,
      cid: cid,
    };
    // Save cid to localStorage
    const listingsRaw = localStorage.getItem("listings");
    let listings: Record<string, Listing> = listingsRaw
      ? JSON.parse(listingsRaw)
      : {};

    listings = {
      ...listings,
      [vehicle.id]: listing,
    };
    localStorage.setItem("listings", JSON.stringify(listings));
  }

  async getListing(vehicleId: string): Promise<Listing | null> {
    const listingsRaw = localStorage.getItem("listings");
    const listings: Record<string, Listing> = listingsRaw
      ? JSON.parse(listingsRaw)
      : {};

    return listings[vehicleId];
  }

  async getListings(): Promise<Vehicle[]> {
    const listingsRaw = localStorage.getItem("listings");
    const listings: Record<string, Listing> = listingsRaw
      ? JSON.parse(listingsRaw)
      : {};

    const vehicles = await Promise.all(
      Object.keys(listings).map(async (vehicleId: string) => {
        const cid = listings[vehicleId].cid;
        const resp = await axios.get(`https://${cid}.ipfs.dweb.link`);
        let vehicle = { ...(resp.data as Vehicle), ...listings[vehicleId] };
        return vehicle;
      })
    );

    return vehicles;
  }
}

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
