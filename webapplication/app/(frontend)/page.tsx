import HomePageSection from "@/components/homepage-section";
import TiltedCard from "@/components/tilted-card";
import { LayoutDashboard, MapIcon, Bike } from "lucide-react";
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
    // {
    //   title: "Settings",
    //   url: "/settings",
    //   icon: Settings,
    // },
  ];

  const homePageSections = [
    {
      title: "What we do",
      description:
        "This project develops a monitoring system for Leezenbox bicycle facilities using computer vision technology. The system automatically detects and counts bicycles to track occupancy levels, providing data that could help inform decisions about bike-sharing infrastructure usage patterns.",
      imageSrc: "/assets/hiltrup.jpeg",
      altText: "Leezenbox monitoring system",
      reverse: false,
    },
    {
      title: "How it works",
      description:
        "The system uses YOLO object detection models running on ESP32 microcontrollers to analyze images from Leezenbox locations. Data is processed locally and transmitted via LoRaWAN networks. This approach aims to balance detection accuracy with low power consumption and privacy considerations.",
      imageSrc: "/assets/roxel.webp",
      altText: "Object detection system components",
      reverse: true,
    },
    {
      title: "Who we are",
      description:
        "We are master's students from the University of Münster working on this project as part of our studies in TinyAIoT applications. The goal is to explore how machine learning and IoT technologies can be applied to urban mobility challenges through a practical proof of concept.",
      imageSrc: "/assets/hiltrup.jpeg",
      altText: "University project team",
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
            A demonstration of AI-powered bicycle monitoring for Leezenbox
            facilities. This system tracks occupancy patterns using computer
            vision technology to provide insights into urban bike-sharing usage.
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
      <div className="grid grid-cols-2 lg:grid-cols-3  gap-4 2xl:px-52">
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
