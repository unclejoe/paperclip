import { useTranslation } from "@/i18n";
import { setLocale, getLocale } from "@/i18n";
import { Globe } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LOCALE_OPTIONS = [
  { value: "en" },
  { value: "zh-CN" },
  { value: "zh-TW" },
] as const;

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const current = getLocale();

  return (
    <Select
      value={current}
      onValueChange={(locale) => {
        setLocale(locale);
      }}
    >
      <SelectTrigger className="h-8 w-[110px] text-xs border-border/50">
        <Globe className="mr-1 h-3.5 w-3.5" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LOCALE_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value} className="text-xs">
            {t(`language.${option.value}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
