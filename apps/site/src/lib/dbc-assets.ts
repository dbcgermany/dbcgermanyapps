/**
 * Single source for every external image URL we pull from the parent
 * organisation's site (diambilaybusinesscenter.org). Keeping them here means
 * a future mirror-to-Supabase-Storage pass only needs to change `BASE`.
 */

const BASE = "https://diambilaybusinesscenter.org/images" as const;

export const DBC = {
  parentSite: "https://diambilaybusinesscenter.org",
  sisterSites: {
    richesses: "https://www.richessesdafriquebydbc.com",
    academie: "https://academieinvestirenafrique.fr",
  },
  logo: `${BASE}/Logo_DB.png`,
  hero: {
    home: `${BASE}/2025_03_29_13_47_IMG_3075-copy.jpg`,
    services: `${BASE}/391A7753-copy.jpg`,
  },
  photo: {
    incubation: `${BASE}/2025_02_13_16_26_IMG_1499-copy.jpg`,
    courses: `${BASE}/2025_02_13_17_46_IMG_1674-copy.jpg`,
    mentorship: `${BASE}/391A7845-copy.jpg`,
    cohort: `${BASE}/2025_03_29_11_58_IMG_2916-copy.jpg`,
    team: `${BASE}/2025_02_13_13_26_IMG_1532-copy.jpg`,
    values: `${BASE}/value-image.jpg`,
    incubationSidebar: `${BASE}/2025_02_13_13_29_IMG_1511-copy.jpg`,
    coursesSidebar: `${BASE}/2025_02_13_13_25_IMG_1689-copy.jpg`,
    mentorshipSidebar: `${BASE}/2025_02_13_12_40_IMG_1545-copy.jpg`,
    investments: `${BASE}/2025_02_13_13_29_IMG_1511-copy.jpg`,
    events: `${BASE}/2025_02_13_17_48_IMG_1655-copy.jpg`,
    eventFallback: `${BASE}/2025_02_13_17_48_IMG_1655-copy.jpg`,
  },
  serviceIcon: {
    incubation: `${BASE}/67f05e71ffe3e821f341a965_service-icon-06.svg`,
    courses: `${BASE}/67f05e71ffe3e821f341a95b_service-icon-02.svg`,
    investments: `${BASE}/67f05e71ffe3e821f341a95f_service-icon-03.svg`,
    mentorship: `${BASE}/67f05e71ffe3e821f341a959_service-icon-01.svg`,
    events: `${BASE}/67f05e71ffe3e821f341a963_service-icon-05.svg`,
    elearning: `${BASE}/67f05e71ffe3e821f341a962_service-icon-04.svg`,
  },
  gallery: [
    `${BASE}/IMG_7493.JPG`,
    `${BASE}/2025_03_29_11_58_IMG_2916-copy.jpg`,
    `${BASE}/2025_02_13_13_29_IMG_1511-copy.jpg`,
    `${BASE}/2025_02_13_13_25_IMG_1689-copy.jpg`,
    `${BASE}/2025_02_13_12_40_IMG_1545-copy.jpg`,
    `${BASE}/2025_02_13_17_48_IMG_1655-copy.jpg`,
  ],
} as const;

export type DbcServiceKey = keyof typeof DBC.serviceIcon;
