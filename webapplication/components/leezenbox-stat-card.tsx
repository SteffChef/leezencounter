import { Badge } from "./ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";

interface LeezenboxStatCardProps {
  description?: string;
  title?: string;
  content?: string | number;
  details?: string;
  change?: string | number;
  changeIcon?: React.ReactNode;
  children?: React.ReactNode;
  // Define any props if needed
}

const LeezenboxStatCard: React.FC<LeezenboxStatCardProps> = ({
  description,
  title,
  children,
  details,
  change,
  changeIcon,
}) => {
  return (
    <Card className="@container/card">
      <CardHeader>
        {description && <CardDescription>{description}</CardDescription>}
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {title}
        </CardTitle>
        <CardAction>
          {change && (
            <Badge variant="outline">
              {changeIcon && changeIcon}
              {change}
            </Badge>
          )}
        </CardAction>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        {children && (
          <div className="line-clamp-1 flex gap-2 font-medium">{children}</div>
        )}
        {details && <div className="text-muted-foreground">{details}</div>}
      </CardFooter>
    </Card>
  );
};

export default LeezenboxStatCard;
