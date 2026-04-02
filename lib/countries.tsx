import { FlagAR } from '../components/ui/flags/FlagAR';
import { FlagUY } from '../components/ui/flags/FlagUY';
import { FlagCL } from '../components/ui/flags/FlagCL';
import { FlagMX } from '../components/ui/flags/FlagMX';
import { FlagCO } from '../components/ui/flags/FlagCO';
import { FlagES } from '../components/ui/flags/FlagES';
import { FlagUS } from '../components/ui/flags/FlagUS';
import { FlagBR } from '../components/ui/flags/FlagBR';

export const SUPPORTED_COUNTRIES = [
  { code: 'AR', name_es: 'Argentina', name_en: 'Argentina', flag: <FlagAR /> },
  { code: 'UY', name_es: 'Uruguay', name_en: 'Uruguay', flag: <FlagUY /> },
  { code: 'CL', name_es: 'Chile', name_en: 'Chile', flag: <FlagCL /> },
  { code: 'MX', name_es: 'México', name_en: 'Mexico', flag: <FlagMX /> },
  { code: 'CO', name_es: 'Colombia', name_en: 'Colombia', flag: <FlagCO /> },
  { code: 'ES', name_es: 'España', name_en: 'Spain', flag: <FlagES /> },
  { code: 'US', name_es: 'Estados Unidos', name_en: 'United States', flag: <FlagUS /> },
  { code: 'BR', name_es: 'Brasil', name_en: 'Brazil', flag: <FlagBR /> },
] as const;

export const LANGUAGES = [
  { locale: 'es' as const, label: 'Español', flag: <FlagAR size={28} /> },
  { locale: 'en' as const, label: 'English', flag: <FlagUS size={28} /> },
] as const;
