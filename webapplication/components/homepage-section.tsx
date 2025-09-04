import Image from "next/image";
import { Separator } from "./ui/separator";

interface HomePageSectionProps {
  title: string;
  description: string; // Optional description for the section
  imageSrc: string;
  altText: string; // Optional alt text for the image
  reverse: boolean; // Optional prop to reverse the section layout
  last: boolean;
}

const HomePageSection: React.FC<HomePageSectionProps> = ({
  title,
  description,
  imageSrc,
  altText,
  reverse,
  last,
}) => {
  return (
    <div className="max-w-4xl flex flex-col gap-8 justify-center">
      <div className="flex h-20 md:h-60 justify-center items-center flex-col ">
        <Separator orientation="vertical" className="b-2" />
      </div>
      <div
        className={`flex max-w-lg lg:max-w-full flex-col lg:flex-row gap-4 items-center ${
          reverse ? "lg:flex-row-reverse" : ""
        }`}
      >
        <div className="w-full lg:w-2/5 flex flex-col gap-4 ">
          <h2 className="text-4xl xl:text-5xl font-bold text-cyan-600">
            {title}
          </h2>
          <p className="">{description}</p>
        </div>
        <Image
          src={imageSrc}
          alt={altText}
          width={500}
          height={500}
          className="rounded-xl lg:w-3/5 w-full"
        />
      </div>
      {last && (
        <div className="flex h-20 md:h-60 justify-center items-center flex-col ">
          <Separator orientation="vertical" className="b-2" />
        </div>
      )}
    </div>
  );
};

export default HomePageSection;
