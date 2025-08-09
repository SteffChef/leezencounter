import HomePageSection from "@/components/homepage-section";
import TiltedCard from "@/components/tilted-card";
import { LayoutDashboard, MapIcon, Settings, Bike } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
export default function Home() {
  const buttons = [
    {
      title: "Dashboard",
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

  const homePageSections = [
    {
      title: "What we do",
      description:
        "This is the first section of the homepage, showcasing the capabilities of Leezencounter.",
      imageSrc: "/assets/hiltrup.jpeg",
      altText: "Section 1 Image",
      reverse: false,
    },
    {
      title: "How it works",
      description:
        "This section highlights the features of Leezencounter, including real-time monitoring and analytics.",
      imageSrc: "/assets/hiltrup.jpeg",
      altText: "Section 2 Image",
      reverse: true,
    },
    {
      title: "Who we are",
      description:
        "This section provides insights into the architecture of Leezencounter.",
      imageSrc: "/assets/hiltrup.jpeg",
      altText: "Section 3 Image",
      reverse: false,
    },
  ];
  return (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 w-full px-0 2xl:px-52 mb-10 xl:mb-20">
        <div className="flex flex-col justify-center">
          <Bike className="w-16 h-16 text-primary mb-4" />
          <h1 className="text-5xl xl:text-6xl font-bold mb-4">
            Welcome to <p />
            <b className="text-cyan-600">Leezencounter</b>
          </h1>
          <p className="text-secondary-foreground w-full">
            This is a demo of the Leezencounter application, showcasing the
            capabilities of TinyAIoT powered Leezenbox Monitoring.
          </p>
        </div>
        <TiltedCard
          imageSrc="/assets/hiltrup.jpeg"
          altText="Leezencounter Architecture"
          captionText="Leezencounter Architecture"
          rotateAmplitude={10}
          scaleOnHover={1.05}
          showMobileWarning={false}
          showTooltip={true}
          displayOverlayContent={true}
          overlayContent={
            <video
              autoPlay
              muted
              loop
              playsInline
              className="rounded-lg shadow-md object-cover opacity-85 h-full w-full mt-[5%] ml-[-5%]"
            >
              <source src="/assets/test.mp4" type="video/mp4" />
            </video>
          }
        />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 2xl:px-52">
        {buttons.map((button) => (
          <Link
            key={button.title}
            href={button.url}
            className="flex items-center p-4 bg-background border border-accent rounded-lg shadow-sm hover:shadow-md transition dark:shadow-gray-800 hover:bg-sidebar"
          >
            <button.icon className="mr-2" />
            <span>{button.title}</span>
          </Link>
        ))}
      </div>
      <div className="2xl:px-52 flex flex-col justify-center items-center w-full gap-8 my-4">
        {homePageSections.map((section, index) => (
          <HomePageSection
            key={index}
            title={section.title}
            description={section.description}
            imageSrc={section.imageSrc}
            altText={section.altText}
            reverse={section.reverse}
            last={index === homePageSections.length - 1}
          />
        ))}
        <div className="flex flex-col gap-2 items-center">
          <Image
            src="/assets/github.svg"
            alt="Github Logo"
            width={40}
            height={40}
            className="rounded-xl"
          />
          <Separator orientation="horizontal" className="b-2" />
          <p>Made with ❤️ in Münster</p>
        </div>
      </div>
    </>
  );
}
