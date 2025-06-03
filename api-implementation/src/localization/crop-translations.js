/**
 * Crop Localization Framework - Week 6 Implementation
 * Arabic and French translations for 13-crop database
 * 
 * Features:
 * - Arabic translations for GCC/MENA region
 * - French translations for North Africa
 * - BBCH stage descriptions in multiple languages
 * - Agricultural terminology localization
 * 
 * @format
 */

const cropTranslations = {
  // 1. Tomato
  tomato: {
    en: {
      name: "Tomato",
      scientificName: "Solanum lycopersicum",
      description: "Warm-season vegetable crop, widely cultivated for fresh consumption and processing",
      category: "Vegetable"
    },
    ar: {
      name: "طماطم",
      scientificName: "Solanum lycopersicum",
      description: "محصول خضار موسم دافئ، يُزرع على نطاق واسع للاستهلاك الطازج والتصنيع",
      category: "خضروات"
    },
    fr: {
      name: "Tomate",
      scientificName: "Solanum lycopersicum",
      description: "Culture légumière de saison chaude, largement cultivée pour la consommation fraîche et la transformation",
      category: "Légume"
    }
  },

  // 2. Wheat
  wheat: {
    en: {
      name: "Wheat",
      scientificName: "Triticum aestivum",
      description: "Major cereal grain crop, staple food for billions of people worldwide",
      category: "Cereal"
    },
    ar: {
      name: "قمح",
      scientificName: "Triticum aestivum",
      description: "محصول حبوب رئيسي، غذاء أساسي لمليارات الناس حول العالم",
      category: "حبوب"
    },
    fr: {
      name: "Blé",
      scientificName: "Triticum aestivum",
      description: "Culture céréalière majeure, aliment de base pour des milliards de personnes dans le monde",
      category: "Céréale"
    }
  },

  // 3. Maize
  maize: {
    en: {
      name: "Maize",
      scientificName: "Zea mays",
      description: "C4 cereal crop with high water use efficiency, important for food and feed",
      category: "Cereal"
    },
    ar: {
      name: "ذرة",
      scientificName: "Zea mays",
      description: "محصول حبوب C4 بكفاءة عالية في استخدام المياه، مهم للغذاء والعلف",
      category: "حبوب"
    },
    fr: {
      name: "Maïs",
      scientificName: "Zea mays",
      description: "Culture céréalière C4 à haute efficacité d'utilisation de l'eau, importante pour l'alimentation",
      category: "Céréale"
    }
  },

  // 4. Rice
  rice: {
    en: {
      name: "Rice",
      scientificName: "Oryza sativa",
      description: "Staple cereal crop for half the world's population, grown in flooded fields",
      category: "Cereal"
    },
    ar: {
      name: "أرز",
      scientificName: "Oryza sativa",
      description: "محصول حبوب أساسي لنصف سكان العالم، يُزرع في الحقول المغمورة",
      category: "حبوب"
    },
    fr: {
      name: "Riz",
      scientificName: "Oryza sativa",
      description: "Culture céréalière de base pour la moitié de la population mondiale, cultivée dans des champs inondés",
      category: "Céréale"
    }
  },

  // 5. Potato
  potato: {
    en: {
      name: "Potato",
      scientificName: "Solanum tuberosum",
      description: "Important tuber crop, fourth largest food crop globally",
      category: "Vegetable"
    },
    ar: {
      name: "بطاطس",
      scientificName: "Solanum tuberosum",
      description: "محصول درنات مهم، رابع أكبر محصول غذائي عالمياً",
      category: "خضروات"
    },
    fr: {
      name: "Pomme de terre",
      scientificName: "Solanum tuberosum",
      description: "Culture de tubercules importante, quatrième plus grande culture alimentaire au monde",
      category: "Légume"
    }
  },

  // 6. Onion
  onion: {
    en: {
      name: "Onion",
      scientificName: "Allium cepa",
      description: "Bulb vegetable crop, widely used as flavoring and cooking ingredient",
      category: "Vegetable"
    },
    ar: {
      name: "بصل",
      scientificName: "Allium cepa",
      description: "محصول خضار بصلي، يُستخدم على نطاق واسع كنكهة ومكون طبخ",
      category: "خضروات"
    },
    fr: {
      name: "Oignon",
      scientificName: "Allium cepa",
      description: "Culture légumière à bulbe, largement utilisée comme arôme et ingrédient de cuisine",
      category: "Légume"
    }
  },

  // 7. Cucumber
  cucumber: {
    en: {
      name: "Cucumber",
      scientificName: "Cucumis sativus",
      description: "Vine crop from the gourd family, consumed fresh or pickled",
      category: "Vegetable"
    },
    ar: {
      name: "خيار",
      scientificName: "Cucumis sativus",
      description: "محصول متسلق من عائلة القرعيات، يُستهلك طازجاً أو مخللاً",
      category: "خضروات"
    },
    fr: {
      name: "Concombre",
      scientificName: "Cucumis sativus",
      description: "Culture grimpante de la famille des cucurbitacées, consommée fraîche ou marinée",
      category: "Légume"
    }
  },

  // 8. Lettuce
  lettuce: {
    en: {
      name: "Lettuce",
      scientificName: "Lactuca sativa",
      description: "Leafy green vegetable, popular in salads and fresh consumption",
      category: "Vegetable"
    },
    ar: {
      name: "خس",
      scientificName: "Lactuca sativa",
      description: "خضار ورقية خضراء، شائعة في السلطات والاستهلاك الطازج",
      category: "خضروات"
    },
    fr: {
      name: "Laitue",
      scientificName: "Lactuca sativa",
      description: "Légume à feuilles vertes, populaire dans les salades et la consommation fraîche",
      category: "Légume"
    }
  },

  // 9. Alfalfa
  alfalfa: {
    en: {
      name: "Alfalfa",
      scientificName: "Medicago sativa",
      description: "Perennial forage legume, excellent for livestock feed and soil improvement",
      category: "Forage"
    },
    ar: {
      name: "برسيم حجازي",
      scientificName: "Medicago sativa",
      description: "بقولية علفية معمرة، ممتازة لعلف الماشية وتحسين التربة",
      category: "أعلاف"
    },
    fr: {
      name: "Luzerne",
      scientificName: "Medicago sativa",
      description: "Légumineuse fourragère pérenne, excellente pour l'alimentation du bétail et l'amélioration du sol",
      category: "Fourrage"
    }
  },

  // 10. Cotton
  cotton: {
    en: {
      name: "Cotton",
      scientificName: "Gossypium hirsutum",
      description: "Fiber crop, major source of natural textile fiber worldwide",
      category: "Field"
    },
    ar: {
      name: "قطن",
      scientificName: "Gossypium hirsutum",
      description: "محصول ألياف، مصدر رئيسي للألياف النسيجية الطبيعية عالمياً",
      category: "محاصيل حقلية"
    },
    fr: {
      name: "Coton",
      scientificName: "Gossypium hirsutum",
      description: "Culture de fibres, source majeure de fibres textiles naturelles dans le monde",
      category: "Culture de plein champ"
    }
  },

  // 11. Sunflower
  sunflower: {
    en: {
      name: "Sunflower",
      scientificName: "Helianthus annuus",
      description: "Oilseed crop, source of edible oil and protein-rich meal",
      category: "Field"
    },
    ar: {
      name: "عباد الشمس",
      scientificName: "Helianthus annuus",
      description: "محصول بذور زيتية، مصدر للزيت الصالح للأكل والوجبة الغنية بالبروتين",
      category: "محاصيل حقلية"
    },
    fr: {
      name: "Tournesol",
      scientificName: "Helianthus annuus",
      description: "Culture oléagineuse, source d'huile comestible et de tourteau riche en protéines",
      category: "Culture de plein champ"
    }
  },

  // 12. Barley
  barley: {
    en: {
      name: "Barley",
      scientificName: "Hordeum vulgare",
      description: "Hardy cereal crop, used for animal feed, malting, and human consumption",
      category: "Cereal"
    },
    ar: {
      name: "شعير",
      scientificName: "Hordeum vulgare",
      description: "محصول حبوب قاسي، يُستخدم لعلف الحيوانات والتخمير والاستهلاك البشري",
      category: "حبوب"
    },
    fr: {
      name: "Orge",
      scientificName: "Hordeum vulgare",
      description: "Culture céréalière rustique, utilisée pour l'alimentation animale, le maltage et la consommation humaine",
      category: "Céréale"
    }
  },

  // 13. Date Palm
  datePalm: {
    en: {
      name: "Date Palm",
      scientificName: "Phoenix dactylifera",
      description: "Desert tree crop, essential for GCC region, produces nutritious dates",
      category: "Tree"
    },
    ar: {
      name: "نخيل التمر",
      scientificName: "Phoenix dactylifera",
      description: "محصول شجري صحراوي، أساسي لمنطقة دول الخليج، ينتج تمور مغذية",
      category: "أشجار"
    },
    fr: {
      name: "Palmier dattier",
      scientificName: "Phoenix dactylifera",
      description: "Culture arboricole désertique, essentielle pour la région du CCG, produit des dattes nutritives",
      category: "Arbre"
    }
  }
};

// BBCH Stage translations
const bbchStageTranslations = {
  en: {
    "00": "Dry seed/dormancy",
    "09": "Emergence",
    "10": "First leaves",
    "12": "2 true leaves",
    "13": "3 leaves",
    "14": "4 true leaves",
    "16": "6 true leaves",
    "18": "8 true leaves",
    "19": "9 or more leaves",
    "21": "Beginning tillering",
    "29": "End tillering",
    "30": "Stem elongation",
    "31": "Stem elongation",
    "35": "Stem elongation",
    "41": "Tuber/bulb initiation",
    "47": "Tuber/bulb development",
    "49": "Booting/growth complete",
    "50": "Flower buds",
    "51": "Flower buds/inflorescence",
    "60": "First flowering",
    "61": "Beginning flowering",
    "65": "Full flowering",
    "69": "End flowering",
    "70": "First fruit set",
    "71": "Fruit development/grain filling",
    "81": "Beginning ripening",
    "87": "Hard dough",
    "89": "Full ripening/senescence",
    "92": "First cut/harvest",
    "97": "Harvest ripe"
  },
  ar: {
    "00": "بذرة جافة/سكون",
    "09": "إنبات",
    "10": "أول أوراق",
    "12": "ورقتان حقيقيتان",
    "13": "3 أوراق",
    "14": "4 أوراق حقيقية",
    "16": "6 أوراق حقيقية",
    "18": "8 أوراق حقيقية",
    "19": "9 أوراق أو أكثر",
    "21": "بداية التفريع",
    "29": "نهاية التفريع",
    "30": "استطالة الساق",
    "31": "استطالة الساق",
    "35": "استطالة الساق",
    "41": "بداية تكوين الدرنات/البصيلات",
    "47": "تطور الدرنات/البصيلات",
    "49": "اكتمال النمو",
    "50": "براعم زهرية",
    "51": "براعم زهرية/نورة",
    "60": "أول إزهار",
    "61": "بداية الإزهار",
    "65": "إزهار كامل",
    "69": "نهاية الإزهار",
    "70": "أول عقد ثمار",
    "71": "تطور الثمار/امتلاء الحبوب",
    "81": "بداية النضج",
    "87": "عجينة صلبة",
    "89": "نضج كامل/شيخوخة",
    "92": "أول قطف/حصاد",
    "97": "نضج للحصاد"
  },
  fr: {
    "00": "Graine sèche/dormance",
    "09": "Émergence",
    "10": "Premières feuilles",
    "12": "2 vraies feuilles",
    "13": "3 feuilles",
    "14": "4 vraies feuilles",
    "16": "6 vraies feuilles",
    "18": "8 vraies feuilles",
    "19": "9 feuilles ou plus",
    "21": "Début tallage",
    "29": "Fin tallage",
    "30": "Élongation tige",
    "31": "Élongation tige",
    "35": "Élongation tige",
    "41": "Initiation tubercules/bulbes",
    "47": "Développement tubercules/bulbes",
    "49": "Croissance complète",
    "50": "Boutons floraux",
    "51": "Boutons floraux/inflorescence",
    "60": "Première floraison",
    "61": "Début floraison",
    "65": "Pleine floraison",
    "69": "Fin floraison",
    "70": "Première nouaison",
    "71": "Développement fruits/remplissage grains",
    "81": "Début maturation",
    "87": "Pâte dure",
    "89": "Maturation complète/sénescence",
    "92": "Première coupe/récolte",
    "97": "Maturité récolte"
  }
};

// Agricultural terminology translations
const agriculturalTerms = {
  en: {
    irrigation: "Irrigation",
    evapotranspiration: "Evapotranspiration",
    cropCoefficient: "Crop Coefficient (Kc)",
    growthStage: "Growth Stage",
    soilMoisture: "Soil Moisture",
    waterRequirement: "Water Requirement",
    climateZone: "Climate Zone",
    plantingDate: "Planting Date",
    harvestDate: "Harvest Date",
    yieldPotential: "Yield Potential",
    droughtTolerance: "Drought Tolerance",
    salinityTolerance: "Salinity Tolerance"
  },
  ar: {
    irrigation: "ري",
    evapotranspiration: "التبخر النتح",
    cropCoefficient: "معامل المحصول (Kc)",
    growthStage: "مرحلة النمو",
    soilMoisture: "رطوبة التربة",
    waterRequirement: "الاحتياج المائي",
    climateZone: "المنطقة المناخية",
    plantingDate: "تاريخ الزراعة",
    harvestDate: "تاريخ الحصاد",
    yieldPotential: "إمكانية الإنتاج",
    droughtTolerance: "تحمل الجفاف",
    salinityTolerance: "تحمل الملوحة"
  },
  fr: {
    irrigation: "Irrigation",
    evapotranspiration: "Évapotranspiration",
    cropCoefficient: "Coefficient cultural (Kc)",
    growthStage: "Stade de croissance",
    soilMoisture: "Humidité du sol",
    waterRequirement: "Besoin en eau",
    climateZone: "Zone climatique",
    plantingDate: "Date de plantation",
    harvestDate: "Date de récolte",
    yieldPotential: "Potentiel de rendement",
    droughtTolerance: "Tolérance à la sécheresse",
    salinityTolerance: "Tolérance à la salinité"
  }
};

module.exports = {
  cropTranslations,
  bbchStageTranslations,
  agriculturalTerms
};
