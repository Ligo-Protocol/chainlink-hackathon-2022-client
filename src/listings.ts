import axios from "axios";
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
  getListings(): Promise<Vehicle[]>;
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
    const listings: Record<string, string> = listingsRaw
      ? JSON.parse(listingsRaw)
      : {};

    const cid = listings[vehicleId];
    return cid;
  }

  async getListings(): Promise<Vehicle[]> {
    const listingsRaw = localStorage.getItem("listings");
    const listings: Record<string, string> = listingsRaw
      ? JSON.parse(listingsRaw)
      : {};

    const vehicles = await Promise.all(
      Object.keys(listings).map(async (vehicleId: string) => {
        const cid = listings[vehicleId];
        const resp = await axios.get(`https://${cid}.ipfs.dweb.link`);
        let vehicle = resp.data as Vehicle;
        vehicle.cid = cid;
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
