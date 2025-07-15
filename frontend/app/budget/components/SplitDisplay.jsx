import React from "react";
import Card from "../../../components/Card";
import { PiggyBankIcon, ReceiptIcon, WalletMinimalIcon } from "lucide-react";

function SplitDisplay({ data }) {
  const cardDetails = [
    {
      key: "needs",
      title: "Needs",
      icon: <ReceiptIcon />,
      description: "Essentials like rent and groceries",
    },
    {
      key: "wants",
      title: "Wants",
      icon: <WalletMinimalIcon />,
      description: "Fun and entertainment",
    },
    {
      key: "savings",
      title: "Savings",
      icon: <PiggyBankIcon />,
      description: "What you set aside for later",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cardDetails.map(({ key, title, icon, description }) => (
        <Card
          key={key}
          title={title}
          icon={icon}
          value={data[key]}
          description={description}
        />
      ))}
    </div>
  );
}

export default SplitDisplay;
