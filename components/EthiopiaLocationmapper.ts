// Define types for the Ethiopia object structure
type Region = 
  | "Addis Ababa" 
  | "Amhara" 
  | "Benishangul Gumuz" 
  | "Dire Dawa" 
  | "Gambella" 
  | "Harari" 
  | "Oromia" 
  | "Sidama" 
  | "SNNP" 
  | "Somali" 
  | "Tigray";

type SubCity = 
  | "Addis Ketema"
  | "Gullele"
  | "Kirkos"
  | "Kolfe Keranio"
  | "Nefas Silk Lafto"
  | "Yeka";
  

// New type for cities that have kebeles
type CityWithKebele = 
  | "Bahir Dar"
  | "Gondar"
  | "Adama"
  | "Mekelle"
  | "Hawassa"
  | "Dire Dawa";

interface EthiopiaData {
  region: Region[];
  city: {
    [key in Region]: string[];
  };
  subcity: {
    "Addis Ababa": SubCity[];
  };
  "woreda/kebele": {
    [key in SubCity | CityWithKebele]: string[];
  };
}

const Ethiopia: EthiopiaData = {
    region: [
        "Addis Ababa",
        "Amhara",
        "Benishangul Gumuz",
        "Dire Dawa",
        "Gambella",
        "Harari",
        "Oromia",
        "Sidama",
        "SNNP",
        "Somali",
        "Tigray"
    ],
    // zone: {
    //     "Amhara": ["North Gondar", "South Gondar", "East Gojam", "West Gojam", "North Shewa", "South Shewa", "East Hararghe", "West Hararghe", "North Wollo", "South Wollo", "East Welega", "West Welega", "North Gonder", "South Gonder", "East Gonder", "West Gonder"],
    //     "Oromia": ["Arsi", "Bale", "Bedele", "Borena", "Guji", "West Guji", "East Welega", "West Welega"],

    // },
    city: {
        "Addis Ababa": ["Addis Ababa"],
        "Amhara": ["Bahir Dar", "Debre Markos", "Dessie", "Gondar", "Injibara"],
        "Benishangul Gumuz": ["Assosa", "Giyon", "Wenji"],
        "Dire Dawa": ["Dire Dawa"],
        "Gambella": ["Gambella", "Dollo"],
        "Harari": ["Harar"],
        "Oromia": ["Adama", "Jimma", "Shashemene", "Ziway"],
        "Sidama": ["Hawassa", "Hossana", "Yabello"],
        "SNNP": ["Arba Minch", "Wolayta Sodo"],
        "Somali": ["Jijiga"],
        "Tigray": ["Axum", "Mekelle", "Shire"]
    },
    subcity: {
        "Addis Ababa": [
            "Addis Ketema",
            "Gullele",
            "Kirkos",
            "Kolfe Keranio",
            "Nefas Silk Lafto",
            "Yeka"
        ]
    },
    "woreda/kebele": {
        "Addis Ketema": ["Addis Ketema 1", "Addis Ketema 2", "Addis Ketema 3"],
        "Gullele": ["Gullele 1", "Gullele 2", "Gullele 3"],
        "Kirkos": ["Kirkos 1", "Kirkos 2", "Kirkos 3"],
        "Kolfe Keranio": ["Kolfe Keranio 1", "Kolfe Keranio 2", "Kolfe Keranio 3"],
        "Nefas Silk Lafto": ["Nefas Silk Lafto 1", "Nefas Silk Lafto 2", "Nefas Silk Lafto 3"],
        "Yeka": ["Yeka 1", "Yeka 2", "Yeka 3"],
        "Bahir Dar": ["Kebele 1", "Kebele 2", "Kebele 3", "Kebele 4", "Kebele 5", "Kebele 6", "Kebele 7"],
        "Gondar": ["Kebele 1", "Kebele 2", "Kebele 3", "Kebele 4", "Kebele 5", "Kebele 6", "Kebele 7"],
        "Adama": ["Kebele 1", "Kebele 2", "Kebele 3", "Kebele 4", "Kebele 5", "Kebele 6", "Kebele 7"],
        "Mekelle": ["Kebele 1", "Kebele 2", "Kebele 3", "Kebele 4", "Kebele 5", "Kebele 6", "Kebele 7"],
        "Hawassa": ["Kebele 1", "Kebele 2", "Kebele 3", "Kebele 4", "Kebele 5", "Kebele 6", "Kebele 7"],
        "Dire Dawa": ["Kebele 1", "Kebele 2", "Kebele 3", "Kebele 4", "Kebele 5", "Kebele 6", "Kebele 7"]
    }
};

export default Ethiopia;
export type { EthiopiaData, Region, SubCity, CityWithKebele };