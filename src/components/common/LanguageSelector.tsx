import React from "react";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export type Language = "en" | "id";

export interface LanguageSelectorProps {
  currentLanguage: Language;
  onLanguageChange: (language: Language) => void;
  variant?: "icon" | "full" | "minimal";
}

const LanguageSelector = ({
  currentLanguage,
  onLanguageChange,
  variant = "full",
}: LanguageSelectorProps) => {
  const languages = {
    en: { name: "English", flag: "🇺🇸" },
    id: { name: "Indonesia", flag: "🇮🇩" },
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={variant === "icon" ? "icon" : "sm"}
          className={
            variant === "icon"
              ? "rounded-full w-8 h-8 flex items-center justify-center"
              : ""
          }
        >
          <Globe
            className={variant === "full" ? "mr-2 h-4 w-4" : "h-4 w-4"}
            aria-hidden="true"
          />
          {variant === "full" && (
            <span className="flex items-center">
              {languages[currentLanguage].flag}{" "}
              {languages[currentLanguage].name}
            </span>
          )}
          {variant === "minimal" && (
            <span className="ml-1">{languages[currentLanguage].flag}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.entries(languages).map(([code, { name, flag }]) => (
          <DropdownMenuItem
            key={code}
            className={`flex items-center gap-2 ${currentLanguage === code ? "bg-accent" : ""}`}
            onClick={() => onLanguageChange(code as Language)}
          >
            <span>{flag}</span>
            <span>{name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;
