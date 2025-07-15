"use client";

import React from 'react';
import { classNames } from '../../lib/utils';
import { Sparkles } from "lucide-react";

interface DisplayCardProps {
  className?: string;
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  date?: string;
  iconClassName?: string;
  titleClassName?: string;
}

function DisplayCard({
  className,
  icon = <Sparkles className="w-4 h-4 text-blue-300" />,
  title = "Featured",
  description = "Discover amazing content",
  date = "Just now",
  iconClassName = "text-blue-500",
  titleClassName = "text-blue-500",
}: DisplayCardProps) {
  return (
    <div
      className={classNames(
        "relative flex h-36 w-[22rem] -skew-y-[8deg] select-none flex-col justify-between rounded-xl border-2 backdrop-blur-sm px-4 py-3 transition-all duration-700",
        "bg-white/95 dark:bg-gray-900/70 border-gray-300/50 dark:border-white/10",
        "after:absolute after:-right-1 after:top-[-5%] after:h-[110%] after:w-[20rem] after:bg-gradient-to-l after:content-['']",
        "after:from-white after:to-transparent dark:after:from-black dark:after:to-transparent",
        "hover:border-gray-400/60 dark:hover:border-gray-700/50 hover:bg-white/98 dark:hover:bg-gray-800/80",
        "shadow-lg hover:shadow-xl dark:shadow-gray-900/20",
        "[&>*]:flex [&>*]:items-center [&>*]:gap-2",
        className || ""
      )}
    >
      <div>
        <span className="relative inline-block rounded-full bg-blue-600 dark:bg-blue-600 p-1">
          {icon}
        </span>
        <p className={classNames("text-lg font-medium", titleClassName || "")}>{title}</p>
      </div>
      <p className="whitespace-nowrap text-lg text-gray-900 dark:text-white">{description}</p>
      <p className="text-gray-700 dark:text-gray-400">{date}</p>
    </div>
  );
}

interface DisplayCardsProps {
  cards?: DisplayCardProps[];
}

export default function DisplayCards({ cards }: DisplayCardsProps) {
  const defaultCards = [
    {
      className: "[grid-area:stack] hover:-translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-gray-300 dark:before:outline-gray-700 before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-white/40 dark:before:bg-black/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
    },
    {
      className: "[grid-area:stack] translate-x-16 translate-y-10 hover:-translate-y-1 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-gray-300 dark:before:outline-gray-700 before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-white/40 dark:before:bg-black/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
    },
    {
      className: "[grid-area:stack] translate-x-32 translate-y-20 hover:translate-y-10",
    },
  ];

  const displayCards = cards || defaultCards;

  return (
    <div className="grid [grid-template-areas:'stack'] place-items-center opacity-100 animate-in fade-in-0 duration-700">
      {displayCards.map((cardProps, index) => (
        <DisplayCard key={index} {...cardProps} />
      ))}
    </div>
  );
}