// ISO 3166-1 alpha-2 country list.
// Used for the profile "where you've called home" picker, the directory
// flags row, and the Settler Receipt OG image. Codes are uppercase and
// match the Twemoji asset naming via `flagCodepoint(code)` below.
//
// `popular` ranks the most-likely picks for people arriving in Brussels first
// in the picker — including intra-EU movers, returning Belgians, and arrivals
// from further afield. Everything else falls back to alphabetical. Adjust as
// data suggests — these are seeded from common arrival origins.

export interface Country {
  /** ISO 3166-1 alpha-2 code, uppercase. */
  code: string
  /** English common name. */
  name: string
  /** Boost for picker ordering. Higher = appears earlier. 0 = alphabetical. */
  popular?: number
}

export const COUNTRIES: Country[] = [
  // Highest signal — actually live in Brussels right now or a top arrival origin
  { code: 'BE', name: 'Belgium',         popular: 100 },
  { code: 'FR', name: 'France',          popular: 95  },
  { code: 'NL', name: 'Netherlands',     popular: 95  },
  { code: 'DE', name: 'Germany',         popular: 95  },
  { code: 'GB', name: 'United Kingdom',  popular: 95  },
  { code: 'IT', name: 'Italy',           popular: 92  },
  { code: 'ES', name: 'Spain',           popular: 92  },
  { code: 'PT', name: 'Portugal',        popular: 92  },
  { code: 'PL', name: 'Poland',          popular: 90  },
  { code: 'RO', name: 'Romania',         popular: 88  },
  { code: 'IE', name: 'Ireland',         popular: 88  },
  { code: 'GR', name: 'Greece',          popular: 86  },
  { code: 'SE', name: 'Sweden',          popular: 86  },
  { code: 'DK', name: 'Denmark',         popular: 85  },
  { code: 'FI', name: 'Finland',         popular: 84  },
  { code: 'AT', name: 'Austria',         popular: 84  },
  { code: 'CZ', name: 'Czechia',         popular: 82  },
  { code: 'HU', name: 'Hungary',         popular: 82  },
  { code: 'BG', name: 'Bulgaria',        popular: 80  },
  { code: 'HR', name: 'Croatia',         popular: 78  },
  { code: 'SK', name: 'Slovakia',        popular: 78  },
  { code: 'SI', name: 'Slovenia',        popular: 76  },
  { code: 'LT', name: 'Lithuania',       popular: 76  },
  { code: 'LV', name: 'Latvia',          popular: 75  },
  { code: 'EE', name: 'Estonia',         popular: 75  },
  { code: 'LU', name: 'Luxembourg',      popular: 74  },
  { code: 'MT', name: 'Malta',           popular: 70  },
  { code: 'CY', name: 'Cyprus',          popular: 70  },

  // Major non-EU arrival origins
  { code: 'US', name: 'United States',   popular: 95  },
  { code: 'CA', name: 'Canada',          popular: 90  },
  { code: 'AU', name: 'Australia',       popular: 85  },
  { code: 'NZ', name: 'New Zealand',     popular: 78  },
  { code: 'JP', name: 'Japan',           popular: 82  },
  { code: 'KR', name: 'South Korea',     popular: 78  },
  { code: 'CN', name: 'China',           popular: 80  },
  { code: 'IN', name: 'India',           popular: 85  },
  { code: 'SG', name: 'Singapore',       popular: 75  },
  { code: 'BR', name: 'Brazil',          popular: 80  },
  { code: 'MX', name: 'Mexico',          popular: 75  },
  { code: 'AR', name: 'Argentina',       popular: 72  },
  { code: 'CL', name: 'Chile',           popular: 68  },
  { code: 'CO', name: 'Colombia',        popular: 70  },
  { code: 'PE', name: 'Peru',            popular: 65  },
  { code: 'ZA', name: 'South Africa',    popular: 75  },
  { code: 'NG', name: 'Nigeria',         popular: 70  },
  { code: 'EG', name: 'Egypt',           popular: 70  },
  { code: 'MA', name: 'Morocco',         popular: 80  }, // big Brussels diaspora
  { code: 'DZ', name: 'Algeria',         popular: 75  },
  { code: 'TN', name: 'Tunisia',         popular: 72  },
  { code: 'TR', name: 'Turkey',          popular: 80  }, // big Brussels diaspora
  { code: 'IL', name: 'Israel',          popular: 70  },
  { code: 'AE', name: 'United Arab Emirates', popular: 72 },
  { code: 'SA', name: 'Saudi Arabia',    popular: 65  },
  { code: 'LB', name: 'Lebanon',         popular: 70  },
  { code: 'IR', name: 'Iran',            popular: 65  },
  { code: 'PK', name: 'Pakistan',        popular: 70  },
  { code: 'BD', name: 'Bangladesh',      popular: 65  },
  { code: 'TH', name: 'Thailand',        popular: 70  },
  { code: 'VN', name: 'Vietnam',         popular: 68  },
  { code: 'PH', name: 'Philippines',     popular: 68  },
  { code: 'ID', name: 'Indonesia',       popular: 65  },
  { code: 'MY', name: 'Malaysia',        popular: 65  },
  { code: 'TW', name: 'Taiwan',          popular: 68  },
  { code: 'HK', name: 'Hong Kong',       popular: 70  },

  // Rest — alphabetical, popular: 0
  { code: 'AF', name: 'Afghanistan'      },
  { code: 'AL', name: 'Albania'          },
  { code: 'AM', name: 'Armenia'          },
  { code: 'AO', name: 'Angola'           },
  { code: 'AZ', name: 'Azerbaijan'       },
  { code: 'BA', name: 'Bosnia & Herzegovina' },
  { code: 'BB', name: 'Barbados'         },
  { code: 'BH', name: 'Bahrain'          },
  { code: 'BO', name: 'Bolivia'          },
  { code: 'BS', name: 'Bahamas'          },
  { code: 'BW', name: 'Botswana'         },
  { code: 'BY', name: 'Belarus'          },
  { code: 'BZ', name: 'Belize'           },
  { code: 'CD', name: 'DR Congo'         },
  { code: 'CG', name: 'Congo'            },
  { code: 'CH', name: 'Switzerland', popular: 80 },
  { code: 'CI', name: "Côte d'Ivoire"    },
  { code: 'CM', name: 'Cameroon'         },
  { code: 'CR', name: 'Costa Rica'       },
  { code: 'CU', name: 'Cuba'             },
  { code: 'DO', name: 'Dominican Republic' },
  { code: 'EC', name: 'Ecuador'          },
  { code: 'ET', name: 'Ethiopia'         },
  { code: 'GE', name: 'Georgia'          },
  { code: 'GH', name: 'Ghana'            },
  { code: 'GT', name: 'Guatemala'        },
  { code: 'HN', name: 'Honduras'         },
  { code: 'HT', name: 'Haiti'            },
  { code: 'IS', name: 'Iceland'          },
  { code: 'JM', name: 'Jamaica'          },
  { code: 'JO', name: 'Jordan'           },
  { code: 'KE', name: 'Kenya'            },
  { code: 'KH', name: 'Cambodia'         },
  { code: 'KW', name: 'Kuwait'           },
  { code: 'KZ', name: 'Kazakhstan'       },
  { code: 'LK', name: 'Sri Lanka'        },
  { code: 'LY', name: 'Libya'            },
  { code: 'MD', name: 'Moldova'          },
  { code: 'ME', name: 'Montenegro'       },
  { code: 'MG', name: 'Madagascar'       },
  { code: 'MK', name: 'North Macedonia'  },
  { code: 'MM', name: 'Myanmar'          },
  { code: 'MN', name: 'Mongolia'         },
  { code: 'MO', name: 'Macao'            },
  { code: 'MU', name: 'Mauritius'        },
  { code: 'MV', name: 'Maldives'         },
  { code: 'MZ', name: 'Mozambique'       },
  { code: 'NA', name: 'Namibia'          },
  { code: 'NE', name: 'Niger'            },
  { code: 'NI', name: 'Nicaragua'        },
  { code: 'NO', name: 'Norway',           popular: 78 },
  { code: 'NP', name: 'Nepal'            },
  { code: 'OM', name: 'Oman'             },
  { code: 'PA', name: 'Panama'           },
  { code: 'PY', name: 'Paraguay'         },
  { code: 'QA', name: 'Qatar'            },
  { code: 'RS', name: 'Serbia'           },
  { code: 'RU', name: 'Russia'           },
  { code: 'RW', name: 'Rwanda'           },
  { code: 'SD', name: 'Sudan'            },
  { code: 'SN', name: 'Senegal'          },
  { code: 'SO', name: 'Somalia'          },
  { code: 'SY', name: 'Syria'            },
  { code: 'TJ', name: 'Tajikistan'       },
  { code: 'TZ', name: 'Tanzania'         },
  { code: 'UA', name: 'Ukraine'          },
  { code: 'UG', name: 'Uganda'           },
  { code: 'UY', name: 'Uruguay'          },
  { code: 'UZ', name: 'Uzbekistan'       },
  { code: 'VE', name: 'Venezuela'        },
  { code: 'YE', name: 'Yemen'            },
  { code: 'ZM', name: 'Zambia'           },
  { code: 'ZW', name: 'Zimbabwe'         },
]

const BY_CODE = new Map(COUNTRIES.map(c => [c.code, c]))

export function getCountry(code: string): Country | undefined {
  return BY_CODE.get(code.toUpperCase())
}

/**
 * Convert ISO 3166-1 alpha-2 country code to Twemoji codepoint string,
 * e.g. "BE" → "1f1e7-1f1ea". Used to construct Twemoji SVG asset URLs.
 */
export function flagCodepoint(code: string): string {
  const A = 'A'.charCodeAt(0)
  const REGIONAL_BASE = 0x1F1E6
  return code
    .toUpperCase()
    .split('')
    .map(ch => (REGIONAL_BASE + ch.charCodeAt(0) - A).toString(16))
    .join('-')
}

/** URL to the Twemoji SVG for a flag — works in <img>, OG image, etc. */
export function flagSvgUrl(code: string): string {
  return `https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/${flagCodepoint(code)}.svg`
}

/** Picker order: popular descending, then alphabetical. */
export function rankedCountries(): Country[] {
  return [...COUNTRIES].sort((a, b) => {
    const pop = (b.popular ?? 0) - (a.popular ?? 0)
    if (pop !== 0) return pop
    return a.name.localeCompare(b.name)
  })
}
