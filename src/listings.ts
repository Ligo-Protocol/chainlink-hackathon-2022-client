import { Web3Storage } from "web3.storage";

export type Vehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  cid?: string;
  meta?: any;
};

export interface ListingManager {
  createListing(vehicle: Vehicle): Promise<void>;
  getListingCid(vehicleId: string): Promise<string>;
}

export class LocalListingManager implements ListingManager {
  web3Storage = new Web3Storage({
    token: process.env.REACT_APP_WEB3STORAGE_TOKEN!,
  });

  async createListing(vehicle: Vehicle) {
    // Save to Filecoin
    const cid = await saveListingToFilecoin(this.web3Storage, vehicle);

    // Save cid to localStorage
    const listingsRaw = localStorage.getItem("listings");
    let listings: Record<string, string> = listingsRaw
      ? JSON.parse(listingsRaw)
      : {};

    listings = {
      ...listings,
      [vehicle.id]: cid,
    };
    localStorage.setItem("listings", JSON.stringify(listings));
  }

  async getListingCid(vehicleId: string): Promise<string> {
    const listingsRaw = localStorage.getItem("listings");
    let listings: Record<string, string> = listingsRaw
      ? JSON.parse(listingsRaw)
      : {};

    const cid = listings[vehicleId];
    return cid;
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
