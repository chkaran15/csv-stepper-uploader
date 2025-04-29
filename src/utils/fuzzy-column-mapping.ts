/* eslint-disable no-useless-escape */

type MatchResult = {
  field: string | null;
  confidence: number;
};

const fieldPatterns: Record<string, Array<string>> = {
  FullName: [
    "name",
    "fullname",
    "full name",
    "customer",
    "client",
    "person",
    "username",
  ],
  Email: ["email", "e-mail", "mail", "emailaddress", "email address"],
  Contact: [
    "phone",
    "mobile",
    "cell",
    "contact",
    "phonenumber",
    "phone number",
    "telephone",
    "tel",
  ],
  Gender: ["gender", "sex"],
  Qualification: ["qualification", "degree", "education", "diploma", "cert"],
  SchoolOrCollegeName: [
    "school",
    "college",
    "university",
    "institution",
    "academy",
    "campus",
  ],
  LeadSource: [
    "source",
    "leadsource",
    "lead source",
    "origin",
    "channel",
    "found us",
  ],
  InterestedCourse: [
    "course",
    "program",
    "class",
    "training",
    "interested",
    "interest",
  ],
  Address: ["address", "location", "residence"],
  City: ["city", "town", "municipality"],
  Street: ["street", "road", "avenue", "lane", "st"],
  State: ["state", "province", "region"],
  ZipCode: ["zip", "zipcode", "postal", "postalcode", "post code", "pin"],
  Country: ["country", "nation"],
  Notes: [
    "note",
    "notes",
    "comment",
    "comments",
    "remark",
    "remarks",
    "additional",
  ],
};

const fuzzyMatchFields = (
  csvHeader: string,
  crmFields: Array<string>,
): MatchResult => {
  if (!csvHeader || !crmFields || crmFields.length === 0) {
    return { field: null, confidence: 0 };
  }

  const normalizedHeader = csvHeader
    .toLowerCase()
    .trim()
    .replace(/[\s_\-\.\/\\()]+/g, "");

  const scoreMatch = (header: string, field: string): number => {
    const normalizedField = field
      .toLowerCase()
      .replace(/[\s_\-\.\/\\()]+/g, "");

    // let bestScore = 0;

    // Check for direct field name matches
    if (header === normalizedField) return 1.0;
    if (header.includes(normalizedField)) return 0.9;
    if (normalizedField.includes(header)) return 0.8;

    // Check for pattern matches
    const patterns = fieldPatterns[field] || [];
    for (const pattern of patterns) {
      const normalizedPattern = pattern
        .toLowerCase()
        .replace(/[\s_\-\.\/\\()]+/g, "");

      if (header === normalizedPattern) return 0.95;
      if (header.includes(normalizedPattern)) return 0.85;
      if (normalizedPattern.includes(header)) return 0.75;
    }

    // Character-level similarity as fallback
    let commonChars = 0;
    for (const char of header) {
      if (normalizedField.includes(char)) commonChars++;
    }

    const lengthScore =
      commonChars / Math.max(header.length, normalizedField.length);
    return lengthScore * 0.7;
  };

  const scores = crmFields.map((field) => {
    const score = scoreMatch(normalizedHeader, field);
    return { field, score };
  });

  scores.sort((a, b) => b.score - a.score);
  const bestMatch = scores[0];

  return {
    field: bestMatch && bestMatch.score > 0.3 ? bestMatch.field : null,
    confidence: bestMatch?.score ?? 0,
  };
};

export default fuzzyMatchFields;
