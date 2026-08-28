import React from "react";
import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

export function Test() {
  const [val, setVal] = React.useState("1405/05/20");
  const dateObj = val ? new DateObject({ date: val, format: "YYYY/MM/DD", calendar: persian, locale: persian_fa }) : null;
  return <DatePicker value={dateObj} format="DD MMMM YYYY" onChange={(d) => setVal(d.format("YYYY/MM/DD"))} calendar={persian} locale={persian_fa} />
}
