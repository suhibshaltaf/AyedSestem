export const formatJordanDateTime = (value) => {
  if (!value) return "—";

  let dateValue = value;

  // اعتبار التاريخ UTC إذا لم يحدد الباك إند المنطقة الزمنية
  if (
    typeof dateValue === "string" &&
    !/(Z|[+-]\d{2}:?\d{2})$/i.test(dateValue)
  ) {
    dateValue += "Z";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Amman",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
};