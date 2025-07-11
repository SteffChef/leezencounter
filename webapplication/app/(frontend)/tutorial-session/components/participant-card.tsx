import { SquareUserRound } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";

interface ParticipantCardProps {
  name: string;
  role: string;
}

const ParticipantCard: React.FC<ParticipantCardProps> = ({ name, role }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription>{role}</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center items-center">
        <SquareUserRound height={100} width={100} />
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button className="cursor-pointer bg-emerald-400">Contact</Button>
      </CardFooter>
    </Card>
  );
};

export default ParticipantCard;
