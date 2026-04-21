// Shared answer shape for the 7-page incubation wizard. Keys mirror the
// DB columns in public.incubation_applications (see
// supabase/migrations/20260428000001_incubation_wizard_fields.sql) so the
// final server action can dump AnswersState straight into the insert.

import type {
  IncubationDiscoveryChannel,
  IncubationIndustrySector,
  IncubationProfileType,
  IncubationService,
} from "@dbc/types";

export type WizardLocale = "en" | "de" | "fr";

export type AnswersState = {
  // Page 1 — identity
  founder_first_name: string;
  founder_last_name: string;
  founder_email: string;
  founder_phone: string;
  country: string;
  title: string;
  gender: string;
  founder_birthday: string;

  // Page 2 — profile
  profile_type: IncubationProfileType | "";
  profile_type_other: string;
  has_idea: "yes" | "no" | "";

  // Page 3 — idea (conditional on has_idea = yes)
  idea_problem: string;
  idea_audience: string;
  idea_development_stage: string;
  idea_ambitions: string;

  // Page 4 — sectors + prior support
  industry_sectors: IncubationIndustrySector[];
  industry_sectors_other: string;
  has_prior_accompaniment: "yes" | "no" | "";

  // Page 5 — expectations
  services_wanted: IncubationService[];
  services_wanted_other: string;
  why_join: string;
  diaspora_link: "yes" | "no" | "";

  // Page 6 — diaspora origin (conditional on diaspora_link = yes)
  diaspora_origin_country: string;

  // Page 7 — discovery
  heard_about_us: IncubationDiscoveryChannel | "";
  heard_about_us_other: string;
};

export const INITIAL_ANSWERS: AnswersState = {
  founder_first_name: "",
  founder_last_name: "",
  founder_email: "",
  founder_phone: "",
  country: "",
  title: "",
  gender: "",
  founder_birthday: "",
  profile_type: "",
  profile_type_other: "",
  has_idea: "",
  idea_problem: "",
  idea_audience: "",
  idea_development_stage: "",
  idea_ambitions: "",
  industry_sectors: [],
  industry_sectors_other: "",
  has_prior_accompaniment: "",
  services_wanted: [],
  services_wanted_other: "",
  why_join: "",
  diaspora_link: "",
  diaspora_origin_country: "",
  heard_about_us: "",
  heard_about_us_other: "",
};
