import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Check } from "lucide-react";
import { Button } from "./Button";

interface AnimatedHeroProps {
  title: string;
  animatedWords: string[];
  subtitle: string;
  description: string;
  primaryButtonText: string;
  secondaryButtonText: string;
  onPrimaryClick: () => void;
  onSecondaryClick: () => void;
  features: string[];
  className?: string;
}

function AnimatedHero({
  title,
  animatedWords,
  subtitle,
  description,
  primaryButtonText,
  secondaryButtonText,
  onPrimaryClick,
  onSecondaryClick,
  features,
  className = ""
}: AnimatedHeroProps) {
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(() => animatedWords, [animatedWords]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  return (
    <div className={`w-full ${className}`}>
      <div className="container mx-auto">
        <div className="flex gap-6 py-12 lg:pt-0 lg:pb-20 items-center justify-center flex-col">
          <div>
            <Button variant="secondary" size="sm" className="gap-4">
              {subtitle} <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-3 flex-col">
            <h1 className="text-5xl md:text-7xl max-w-4xl tracking-tighter text-center font-regular">
              <div className="text-gray-900 dark:text-white mb-2">
                Революция в анализе
              </div>
              <div className="relative flex w-full justify-center overflow-hidden text-center h-16 md:h-20 items-center">
                {titles.map((title, index) => (
                  <motion.span
                    key={index}
                    className="absolute font-semibold text-blue-600 dark:text-blue-400"
                    initial={{ opacity: 0, y: "100%" }}
                    transition={{ type: "spring", stiffness: 50 }}
                    animate={
                      titleNumber === index
                        ? {
                            y: 0,
                            opacity: 1,
                          }
                        : {
                            y: titleNumber > index ? "-100%" : "100%",
                            opacity: 0,
                          }
                    }
                  >
                    {title}
                  </motion.span>
                ))}
              </div>
              <div className="text-gray-900 dark:text-white mt-2">
                для девелоперов
              </div>
            </h1>

            <p className="text-lg md:text-xl leading-relaxed tracking-tight text-muted-foreground max-w-2xl text-center">
              {description}
            </p>
          </div>
          <div className="flex flex-row gap-3">
            <Button size="lg" className="gap-4" variant="outline" onClick={onSecondaryClick}>
              {secondaryButtonText} <ChevronRight className="w-4 h-4" />
            </Button>
            <Button size="lg" className="gap-4" onClick={onPrimaryClick}>
              {primaryButtonText} <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Features */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center text-sm text-muted-foreground">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export { AnimatedHero };
