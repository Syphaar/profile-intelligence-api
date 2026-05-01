import { Parser } from "json2csv";

export const convertToCSV = (data) => {
  const fields = [
    "id",
    "name",
    "gender",
    "gender_probability",
    "age",
    "age_group",
    "country_id",
    "country_name",
    "country_probability",
    "created_at"
  ];

  const parser = new Parser({ fields });
  return parser.parse(data);
};