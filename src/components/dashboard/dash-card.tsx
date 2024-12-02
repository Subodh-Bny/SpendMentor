import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";

const DashCard = ({
  title,
  description,
  children,
  footer,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer: React.ReactNode;
}) => {
  return (
    <Card className="flex flex-col justify-between">
      <CardHeader>
        <CardTitle className="grid grid-cols-2 items-center">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
      <CardFooter>{footer}</CardFooter>
    </Card>
  );
};

export default DashCard;
