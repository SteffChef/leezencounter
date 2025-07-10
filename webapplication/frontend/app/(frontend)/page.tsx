import { LayoutDashboard, MapIcon, Settings, Bike } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const buttons = [
    {
      title: "Dasboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Leezenboxes",
      url: "/leezenboxes",
      icon: Bike,
    },
    {
      title: "Map",
      url: "/map",
      icon: MapIcon,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
  ];
  return (
    <>
      <div className="relative">
        <Image
          src="/assets/hiltrup.jpeg"
          alt="Hiltrup"
          width={500}
          height={300}
          className="w-full aspect-[16/3] lg:aspect-[8/1] object-cover rounded-lg shadow-md "
        />
        <h1 className="absolute bottom-4 left-4 text-white text-3xl font-bold drop-shadow-lg">
          Leezencounter
        </h1>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {buttons.map((button) => (
          <Link
            key={button.title}
            href={button.url}
            className="flex items-center p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition"
          >
            <button.icon className="mr-2" />
            <span>{button.title}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
