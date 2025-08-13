import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Leezenbox } from "@/types"; // adjust to your project
import Link from "next/link";
import { Search } from "lucide-react";

// Fix Leaflet's default icon issues in Next.js
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

type Props = {
  data: Leezenbox[];
};

export default function LeezenboxMap({ data }: Props) {
  return (
    <>
      <MapContainer
        center={[51.9625, 7.6256]}
        zoom={13}
        className="rounded-xl w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {data.map((box) => (
          <Marker key={box.id} position={[box.latitude, box.longitude]}>
            <Popup>
              <strong>{box.name}</strong>
              <br />
              {box.address}
              <br />
              {box.postcode} {box.city}
              <br />
              Lockers with power: {box.num_lockers_with_power}
              <br />
              <div className="flex justify-end w-full mt-2">
                <Link
                  href={`/leezenboxes/${box.id}`}
                  className="flex items-center p-2 bg-accent dark:bg-gray-200 rounded-lg shadow-md hover:shadow-lg transition text-black"
                >
                  <Search className="mr-2" />
                  <span>More details</span>
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </>
  );
}
